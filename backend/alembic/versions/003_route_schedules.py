"""Add route_schedules shared cache table

Revision ID: 003
Revises: 002
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "route_schedules",
        sa.Column("route_key", sa.String(length=128), nullable=False),
        sa.Column("origin_id", sa.String(length=64), nullable=False),
        sa.Column("origin_name", sa.String(length=255), nullable=False),
        sa.Column("destination_id", sa.String(length=64), nullable=False),
        sa.Column("destination_name", sa.String(length=255), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("route_key"),
    )


def downgrade() -> None:
    op.drop_table("route_schedules")
