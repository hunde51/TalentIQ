"""add profile fields to users

Revision ID: 20260223_0012
Revises: 20260222_0011
Create Date: 2026-02-23
"""

from alembic import op
import sqlalchemy as sa


revision = "20260223_0012"
down_revision = "20260222_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("name", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("sex", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("age", sa.Integer(), nullable=True))

    op.execute("UPDATE users SET username = 'user_' || substr(replace(id, '-', ''), 1, 12) WHERE username IS NULL")
    op.execute("UPDATE users SET name = split_part(email, '@', 1) WHERE name IS NULL")
    op.execute("UPDATE users SET sex = 'unspecified' WHERE sex IS NULL")
    op.execute("UPDATE users SET age = 18 WHERE age IS NULL")

    op.alter_column("users", "username", nullable=False)
    op.alter_column("users", "name", nullable=False)
    op.alter_column("users", "sex", nullable=False)
    op.alter_column("users", "age", nullable=False)

    op.create_index("ix_users_username", "users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "age")
    op.drop_column("users", "sex")
    op.drop_column("users", "name")
    op.drop_column("users", "username")
