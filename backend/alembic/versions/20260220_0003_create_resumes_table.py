"""create resumes table

Revision ID: 20260220_0003
Revises: 20260220_0002
Create Date: 2026-02-20
"""

from alembic import op
import sqlalchemy as sa


revision = "20260220_0003"
down_revision = "20260220_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "resumes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_filename", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=1024), nullable=False),
        sa.Column("storage_backend", sa.String(length=20), nullable=False, server_default="local"),
        sa.Column("content_type", sa.String(length=120), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("processing_status", sa.String(length=30), nullable=False, server_default="uploaded"),
        sa.Column("processing_task_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_resumes_user_id", table_name="resumes")
    op.drop_table("resumes")
