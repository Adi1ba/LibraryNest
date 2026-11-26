
"""add brute force login protection

Revision ID: 49219a40ebf8
Revises: cb21ea634044
Create Date: 2026-11-27 00:30:16.100959

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "49219a40ebf8"
down_revision: str | Sequence[str] | None = "cb21ea634044"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "user",
        sa.Column(
            "failed_login_attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "user",
        sa.Column(
            "locked_until",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.alter_column(
        "user",
        "failed_login_attempts",
        server_default=None,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("user", "locked_until")
    op.drop_column("user", "failed_login_attempts")
