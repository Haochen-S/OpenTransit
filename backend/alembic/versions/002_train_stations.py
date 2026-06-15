"""Add train_stations table

Revision ID: 002
Revises: 001
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "train_stations",
        sa.Column("stop_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("stop_id"),
    )
    op.create_index(op.f("ix_train_stations_name"), "train_stations", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_train_stations_name"), table_name="train_stations")
    op.drop_table("train_stations")
