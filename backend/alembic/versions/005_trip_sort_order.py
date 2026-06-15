"""Add sort_order to saved_trips for user-defined trip ordering

Revision ID: 005
Revises: 004
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "saved_trips",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.execute(
        """
        WITH ordered AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1 AS rn
            FROM saved_trips
        )
        UPDATE saved_trips AS t
        SET sort_order = ordered.rn
        FROM ordered
        WHERE t.id = ordered.id
        """
    )


def downgrade() -> None:
    op.drop_column("saved_trips", "sort_order")
