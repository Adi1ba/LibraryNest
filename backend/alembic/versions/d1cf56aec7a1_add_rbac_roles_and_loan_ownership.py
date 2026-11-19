
"""add RBAC roles and loan ownership."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d1cf56aec7a1"
down_revision: str | Sequence[str] | None = "21056a4e6553"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "loan",
        sa.Column("user_id", sa.Integer(), nullable=True),
    )

    op.create_index(
        "ix_loan_user_id",
        "loan",
        ["user_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_loan_user_id_user",
        "loan",
        "user",
        ["user_id"],
        ["id"],
    )

    # Convert existing generic user roles to Student.
    op.execute(
        'UPDATE "user" SET role = \'student\' WHERE role = \'user\''
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        "fk_loan_user_id_user",
        "loan",
        type_="foreignkey",
    )

    op.drop_index("ix_loan_user_id", table_name="loan")
    op.drop_column("loan", "user_id")

    op.execute(
        'UPDATE "user" SET role = \'user\' WHERE role = \'student\''
    )
