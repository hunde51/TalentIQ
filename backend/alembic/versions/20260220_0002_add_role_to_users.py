"""add role to users

Revision ID: 20260220_0002
Revises: 20260220_0001
Create Date: 2026-02-20
"""

from alembic import op
import sqlalchemy as sa


revision = "20260220_0002"
down_revision = "20260220_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=20), nullable=False, server_default="job_seeker"),
    )


def downgrade() -> None:
    op.drop_column("users", "role")
