"""add resume and cover letter to applications

Revision ID: 20260225_0014
Revises: 20260223_0013
Create Date: 2026-02-25
"""

from alembic import op
import sqlalchemy as sa


revision = "20260225_0014"
down_revision = "20260223_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("applications", sa.Column("resume_id", sa.String(length=36), nullable=True))
    op.add_column("applications", sa.Column("cover_letter_id", sa.String(length=36), nullable=True))
    op.create_index("ix_applications_resume_id", "applications", ["resume_id"], unique=False)
    op.create_index("ix_applications_cover_letter_id", "applications", ["cover_letter_id"], unique=False)
    op.create_foreign_key(
        "fk_applications_resume_id_resumes",
        "applications",
        "resumes",
        ["resume_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_applications_cover_letter_id_cover_letters",
        "applications",
        "cover_letters",
        ["cover_letter_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_applications_cover_letter_id_cover_letters", "applications", type_="foreignkey")
    op.drop_constraint("fk_applications_resume_id_resumes", "applications", type_="foreignkey")
    op.drop_index("ix_applications_cover_letter_id", table_name="applications")
    op.drop_index("ix_applications_resume_id", table_name="applications")
    op.drop_column("applications", "cover_letter_id")
    op.drop_column("applications", "resume_id")
