"""create resume feedbacks table

Revision ID: 20260222_0005
Revises: 20260220_0004
Create Date: 2026-02-22
"""

from alembic import op
import sqlalchemy as sa


revision = "20260222_0005"
down_revision = "20260220_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "resume_feedbacks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("resume_id", sa.String(length=36), nullable=False),
        sa.Column("skills_feedback", sa.Text(), nullable=False),
        sa.Column("phrasing_feedback", sa.Text(), nullable=False),
        sa.Column("formatting_feedback", sa.Text(), nullable=False),
        sa.Column("overall_feedback", sa.Text(), nullable=False),
        sa.Column("generator_source", sa.String(length=60), nullable=False, server_default="heuristic"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_resume_feedbacks_resume_id", "resume_feedbacks", ["resume_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_resume_feedbacks_resume_id", table_name="resume_feedbacks")
    op.drop_table("resume_feedbacks")
