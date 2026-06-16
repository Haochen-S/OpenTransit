"""Email OTP login — nullable password, otp challenges table

Revision ID: 006
Revises: 005
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)

    op.create_table(
        "email_otp_challenges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="5"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_otp_challenges_email"), "email_otp_challenges", ["email"])
    op.create_index(op.f("ix_email_otp_challenges_id"), "email_otp_challenges", ["id"])

    op.create_table(
        "email_otp_send_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column(
            "sent_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_otp_send_logs_email"), "email_otp_send_logs", ["email"])
    op.create_index(op.f("ix_email_otp_send_logs_id"), "email_otp_send_logs", ["id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_email_otp_send_logs_id"), table_name="email_otp_send_logs")
    op.drop_index(op.f("ix_email_otp_send_logs_email"), table_name="email_otp_send_logs")
    op.drop_table("email_otp_send_logs")
    op.drop_index(op.f("ix_email_otp_challenges_id"), table_name="email_otp_challenges")
    op.drop_index(op.f("ix_email_otp_challenges_email"), table_name="email_otp_challenges")
    op.drop_table("email_otp_challenges")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
