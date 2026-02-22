"""create resume parse results table

Revision ID: 20260220_0004
Revises: 20260220_0003
Create Date: 2026-02-22
"""

from alembic import op
import sqlalchemy as sa


revision = "20260220_0004"
down_revision = "20260220_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "resume_parse_results",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("resume_id", sa.String(length=36), nullable=False),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("experience", sa.JSON(), nullable=False),
        sa.Column("education", sa.JSON(), nullable=False),
        sa.Column("entities", sa.JSON(), nullable=False),
        sa.Column("parser_source", sa.String(length=60), nullable=False, server_default="heuristic"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resume_parse_results_resume_id", "resume_parse_results", ["resume_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_resume_parse_results_resume_id", table_name="resume_parse_results")
    op.drop_table("resume_parse_results")
