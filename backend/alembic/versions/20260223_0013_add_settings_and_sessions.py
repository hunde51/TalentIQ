"""add settings and sessions

Revision ID: 20260223_0013
Revises: 20260223_0012
Create Date: 2026-02-23
"""

from alembic import op
import sqlalchemy as sa


revision = "20260223_0013"
down_revision = "20260223_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("token_version", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(), nullable=True))

    op.create_table(
        "user_profiles",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("phone_number", sa.String(length=30), nullable=True),
        sa.Column("location", sa.String(length=120), nullable=True),
        sa.Column("profile_picture_url", sa.String(length=1024), nullable=True),
        sa.Column("professional_title", sa.String(length=120), nullable=True),
        sa.Column("years_of_experience", sa.Integer(), nullable=True),
        sa.Column("preferred_job_type", sa.String(length=20), nullable=True),
        sa.Column("expected_salary_min", sa.Numeric(12, 2), nullable=True),
        sa.Column("expected_salary_max", sa.Numeric(12, 2), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "user_security_settings",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("two_factor_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("password_changed_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "user_ai_preferences",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("resume_tone", sa.String(length=20), nullable=False, server_default="professional"),
        sa.Column("auto_cover_letter_generation", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("ai_feedback_level", sa.String(length=20), nullable=False, server_default="basic"),
        sa.Column("preferred_skill_emphasis", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "user_notification_settings",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("email_job_matches", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("application_status_updates", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("recruiter_messages", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("weekly_job_digest", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("marketing_emails", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "user_privacy_settings",
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("resume_visibility", sa.String(length=20), nullable=False, server_default="recruiters_only"),
        sa.Column("allow_resume_download", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("default_resume_id", sa.String(length=36), nullable=True),
        sa.Column("auto_embedding_refresh", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["default_resume_id"], ["resumes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "user_sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("refresh_token_hash", sa.String(length=128), nullable=False),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("issued_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"], unique=False)
    op.create_index("ix_user_sessions_refresh_token_hash", "user_sessions", ["refresh_token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_user_sessions_refresh_token_hash", table_name="user_sessions")
    op.drop_index("ix_user_sessions_user_id", table_name="user_sessions")
    op.drop_table("user_sessions")
    op.drop_table("user_privacy_settings")
    op.drop_table("user_notification_settings")
    op.drop_table("user_ai_preferences")
    op.drop_table("user_security_settings")
    op.drop_table("user_profiles")

    op.drop_column("users", "deleted_at")
    op.drop_column("users", "token_version")
