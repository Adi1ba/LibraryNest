"""add group reading workspace

Revision ID: cb21ea634044
Revises: 1d3050ac66d9
Create Date: 2026-11-22 18:24:03.956437

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlmodel.sql.sqltypes import AutoString, UTCDateTime

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "cb21ea634044"
down_revision: str | None = "1d3050ac66d9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "reading_group",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", AutoString(length=100), nullable=False),
        sa.Column("description", AutoString(length=500), nullable=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("created_at", UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_reading_group_owner_id"),
        "reading_group",
        ["owner_id"],
        unique=False,
    )

    op.create_table(
        "groupmembership",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("can_create", sa.Boolean(), nullable=False),
        sa.Column("can_edit", sa.Boolean(), nullable=False),
        sa.Column("can_assign", sa.Boolean(), nullable=False),
        sa.Column("can_delete", sa.Boolean(), nullable=False),
        sa.Column("joined_at", UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["reading_group.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "group_id",
            "user_id",
            name="uq_group_membership",
        ),
    )

    op.create_index(
        op.f("ix_groupmembership_group_id"),
        "groupmembership",
        ["group_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_groupmembership_user_id"),
        "groupmembership",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "groupreadinglistitem",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("book_id", sa.Integer(), nullable=False),
        sa.Column("added_by", sa.Integer(), nullable=False),
        sa.Column("assigned_to", sa.Integer(), nullable=True),
        sa.Column("status", AutoString(length=20), nullable=False),
        sa.Column("created_at", UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(["added_by"], ["user.id"]),
        sa.ForeignKeyConstraint(["assigned_to"], ["user.id"]),
        sa.ForeignKeyConstraint(["book_id"], ["book.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["reading_group.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "group_id",
            "book_id",
            name="uq_group_reading_list_book",
        ),
    )

    op.create_index(
        op.f("ix_groupreadinglistitem_added_by"),
        "groupreadinglistitem",
        ["added_by"],
        unique=False,
    )

    op.create_index(
        op.f("ix_groupreadinglistitem_assigned_to"),
        "groupreadinglistitem",
        ["assigned_to"],
        unique=False,
    )

    op.create_index(
        op.f("ix_groupreadinglistitem_book_id"),
        "groupreadinglistitem",
        ["book_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_groupreadinglistitem_group_id"),
        "groupreadinglistitem",
        ["group_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_groupreadinglistitem_group_id"),
        table_name="groupreadinglistitem",
    )
    op.drop_index(
        op.f("ix_groupreadinglistitem_book_id"),
        table_name="groupreadinglistitem",
    )
    op.drop_index(
        op.f("ix_groupreadinglistitem_assigned_to"),
        table_name="groupreadinglistitem",
    )
    op.drop_index(
        op.f("ix_groupreadinglistitem_added_by"),
        table_name="groupreadinglistitem",
    )
    op.drop_table("groupreadinglistitem")

    op.drop_index(
        op.f("ix_groupmembership_user_id"),
        table_name="groupmembership",
    )
    op.drop_index(
        op.f("ix_groupmembership_group_id"),
        table_name="groupmembership",
    )
    op.drop_table("groupmembership")

    op.drop_index(
        op.f("ix_reading_group_owner_id"),
        table_name="reading_group",
    )
    op.drop_table("reading_group")
