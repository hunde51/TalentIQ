from collections import defaultdict

import jwt
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, get_db
from app.core.dependencies import get_current_user
from app.core.security import decode_token
from app.models.user_model import User
from app.schemas.chat_schema import ChatMessageCreate, ChatMessageResponse, ChatRoomListResponse
from app.services.chat_service import create_message, ensure_chat_access, list_chat_rooms, list_messages


router = APIRouter(prefix="/chat", tags=["chat"])


class ConnectionManager:
    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, room: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._rooms[room].add(websocket)

    def disconnect(self, room: str, websocket: WebSocket) -> None:
        connections = self._rooms.get(room)
        if not connections:
            return
        connections.discard(websocket)
        if not connections:
            self._rooms.pop(room, None)

    async def broadcast(self, room: str, payload: dict) -> None:
        for ws in list(self._rooms.get(room, set())):
            await ws.send_json(payload)


manager = ConnectionManager()


async def _get_user_from_token(db: AsyncSession, token: str) -> User:
    try:
        claims = decode_token(token)
    except jwt.PyJWTError:
        raise ValueError("Invalid token")

    if claims.get("type") != "access":
        raise ValueError("Invalid token type")

    user_id = claims.get("sub")
    if not user_id:
        raise ValueError("Invalid token subject")

    user = await db.scalar(select(User).where(User.id == user_id))
    if not user or not user.is_active:
        raise ValueError("User not found or inactive")
    token_version = claims.get("token_version")
    if token_version is not None and int(token_version) != int(user.token_version):
        raise ValueError("Session expired")
    return user


@router.get("/rooms", response_model=ChatRoomListResponse)
async def get_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatRoomListResponse:
    items = await list_chat_rooms(db=db, current_user=current_user)
    return ChatRoomListResponse(items=items)


@router.get("/{application_id}/messages", response_model=list[ChatMessageResponse])
async def get_chat_messages(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ChatMessageResponse]:
    await ensure_chat_access(db=db, current_user=current_user, application_id=application_id)
    rows = await list_messages(db=db, application_id=application_id)
    sender_ids = {item.sender_id for item in rows}
    users = (
        await db.scalars(select(User).where(User.id.in_(sender_ids)))
    ).all() if sender_ids else []
    by_id = {user.id: user for user in users}
    return [
        ChatMessageResponse(
            id=item.id,
            application_id=item.application_id,
            sender_id=item.sender_id,
            sender_name=by_id.get(item.sender_id).name if by_id.get(item.sender_id) else None,
            sender_username=by_id.get(item.sender_id).username if by_id.get(item.sender_id) else None,
            content=item.content,
            created_at=item.created_at,
        )
        for item in rows
    ]


@router.post("/{application_id}/messages", response_model=ChatMessageResponse)
async def post_chat_message(
    application_id: str,
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    await ensure_chat_access(db=db, current_user=current_user, application_id=application_id)
    message = await create_message(db=db, application_id=application_id, sender_id=current_user.id, content=payload.content)
    response = ChatMessageResponse(
        id=message.id,
        application_id=message.application_id,
        sender_id=message.sender_id,
        sender_name=current_user.name,
        sender_username=current_user.username,
        content=message.content,
        created_at=message.created_at,
    )
    await manager.broadcast(
        application_id,
        {
            "event": "message",
            "message": response.model_dump(mode="json"),
        },
    )
    return response


@router.websocket("/ws/{application_id}")
async def chat_ws(websocket: WebSocket, application_id: str, token: str = Query(...)):
    async with AsyncSessionLocal() as db:
        try:
            current_user = await _get_user_from_token(db, token)
            await ensure_chat_access(db=db, current_user=current_user, application_id=application_id)
        except Exception as exc:
            await websocket.close(code=4403, reason=str(exc))
            return

    await manager.connect(application_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            content = str(data.get("content", "")).strip()
            if not content:
                continue

            async with AsyncSessionLocal() as db:
                message = await create_message(
                    db=db,
                    application_id=application_id,
                    sender_id=current_user.id,
                    content=content,
                )
                await db.commit()
                sender = await db.scalar(select(User).where(User.id == message.sender_id))
                payload = ChatMessageResponse(
                    id=message.id,
                    application_id=message.application_id,
                    sender_id=message.sender_id,
                    sender_name=sender.name if sender else None,
                    sender_username=sender.username if sender else None,
                    content=message.content,
                    created_at=message.created_at,
                ).model_dump(mode="json")

            await manager.broadcast(application_id, {"event": "message", "message": payload})
    except WebSocketDisconnect:
        manager.disconnect(application_id, websocket)
