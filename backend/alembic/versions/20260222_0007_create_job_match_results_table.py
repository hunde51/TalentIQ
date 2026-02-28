"""create job match results table

Revision ID: 20260222_0007
Revises: 20260222_0006
Create Date: 2026-02-22
"""

from alembic import op
import sqlalchemy as sa


revision = "20260222_0007"
down_revision = "20260222_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "job_match_results",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("resume_id", sa.String(length=36), nullable=False),
        sa.Column("job_id", sa.String(length=36), nullable=False),
        sa.Column("similarity_score", sa.Float(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("resume_id", "job_id", name="uq_job_match_resume_job"),
    )
    op.create_index("ix_job_match_results_job_id", "job_match_results", ["job_id"], unique=False)
    op.create_index("ix_job_match_results_resume_id", "job_match_results", ["resume_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_job_match_results_resume_id", table_name="job_match_results")
    op.drop_index("ix_job_match_results_job_id", table_name="job_match_results")
    op.drop_table("job_match_results")
