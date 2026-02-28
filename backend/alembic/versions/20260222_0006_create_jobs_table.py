"""create jobs table

Revision ID: 20260222_0006
Revises: 20260222_0005
Create Date: 2026-02-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260222_0006"
down_revision = "20260222_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("recruiter_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("skills", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["recruiter_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("recruiter_id", "title", "location", name="uq_jobs_recruiter_title_location"),
    )
    op.create_index("ix_jobs_recruiter_id", "jobs", ["recruiter_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_jobs_recruiter_id", table_name="jobs")
    op.drop_table("jobs")
