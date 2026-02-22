import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageComponents";
import { api, tokenStorage, type ChatMessage, type ChatRoomItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ChatPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await api.listChatRooms();
        setRooms(data.items);
        if (data.items.length > 0) setSelectedRoom(data.items[0].application_id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load chat rooms");
      }
    };

    void loadRooms();
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const loadMessages = async () => {
      try {
        const data = await api.listChatMessages(selectedRoom);
        setMessages(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load chat messages");
      }
    };

    void loadMessages();

    wsRef.current?.close();

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    let wsUrl: string;
    if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
      const wsBase = baseUrl.replace("http://", "ws://").replace("https://", "wss://").replace(/\/$/, "");
      wsUrl = `${wsBase}/chat/ws/${selectedRoom}?token=${encodeURIComponent(token)}`;
    } else {
      const basePath = baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
      const scheme = window.location.protocol === "https:" ? "wss" : "ws";
      wsUrl = `${scheme}://${window.location.host}${basePath}/chat/ws/${selectedRoom}?token=${encodeURIComponent(token)}`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { event?: string; message?: ChatMessage };
        if (payload.event === "message" && payload.message) {
          setMessages((prev) => [...prev, payload.message!]);
        }
      } catch {
        // ignore malformed frame
      }
    };

    ws.onerror = () => {
      toast.error("Chat websocket connection error");
    };

    return () => {
      ws.close();
    };
  }, [selectedRoom]);

  const selectedRoomInfo = useMemo(
    () => rooms.find((r) => r.application_id === selectedRoom),
    [rooms, selectedRoom],
  );

  const sendMessage = () => {
    const content = draft.trim();
    if (!content || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content }));
    setDraft("");
  };

  return (
    <div>
      <PageHeader title="Real-time Chat" subtitle="Chat between recruiter and job seeker by application room." />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">Rooms</h3>
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.application_id}
                onClick={() => setSelectedRoom(room.application_id)}
                className={`w-full text-left rounded-lg border p-3 text-sm ${
                  selectedRoom === room.application_id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <p className="font-medium">{room.job_title}</p>
                <p className="text-xs text-muted-foreground">App: {room.application_id.slice(0, 8)}...</p>
              </button>
            ))}
            {rooms.length === 0 && <p className="text-sm text-muted-foreground">No chat rooms yet.</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col h-[70vh]">
          <div className="border-b border-border pb-3 mb-3">
            <p className="font-semibold">{selectedRoomInfo?.job_title || "Select a room"}</p>
            {selectedRoomInfo && (
              <p className="text-xs text-muted-foreground">application_id: {selectedRoomInfo.application_id}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {messages.map((message) => {
              const mine = user?.id === message.sender_id;
              return (
                <div key={message.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p>{message.content}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-border flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              disabled={!selectedRoom}
            />
            <Button onClick={sendMessage} disabled={!selectedRoom || !draft.trim()}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
