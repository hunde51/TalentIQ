"""create cover letters table

Revision ID: 20260222_0008
Revises: 20260222_0007
Create Date: 2026-02-22
"""

from alembic import op
import sqlalchemy as sa


revision = "20260222_0008"
down_revision = "20260222_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cover_letters",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("resume_id", sa.String(length=36), nullable=False),
        sa.Column("job_description", sa.Text(), nullable=False),
        sa.Column("generated_text", sa.Text(), nullable=False),
        sa.Column("generator_source", sa.String(length=60), nullable=False, server_default="heuristic"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cover_letters_resume_id", "cover_letters", ["resume_id"], unique=False)
    op.create_index("ix_cover_letters_user_id", "cover_letters", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_cover_letters_user_id", table_name="cover_letters")
    op.drop_index("ix_cover_letters_resume_id", table_name="cover_letters")
    op.drop_table("cover_letters")
