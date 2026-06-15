"""Drop route_schedules — schedule cache is in-memory only

Revision ID: 004
Revises: 003
"""

from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("route_schedules")


def downgrade() -> None:
    import sqlalchemy as sa
    from sqlalchemy.dialects import postgresql

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
