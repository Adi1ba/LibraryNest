
from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Group(SQLModel, table=True):
    __tablename__ = "reading_group"

    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=500)

    owner_id: int = Field(
        foreign_key="user.id",
        index=True,
    )

    created_at: datetime = Field(default_factory=utc_now)


class GroupMembership(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "group_id",
            "user_id",
            name="uq_group_membership",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)

    group_id: int = Field(
        foreign_key="reading_group.id",
        index=True,
    )

    user_id: int = Field(
        foreign_key="user.id",
        index=True,
    )

    can_create: bool = Field(default=False)
    can_edit: bool = Field(default=False)
    can_assign: bool = Field(default=False)
    can_delete: bool = Field(default=False)

    joined_at: datetime = Field(default_factory=utc_now)


class GroupReadingListItem(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "group_id",
            "book_id",
            name="uq_group_reading_list_book",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)

    group_id: int = Field(
        foreign_key="reading_group.id",
        index=True,
    )

    book_id: int = Field(
        foreign_key="book.id",
        index=True,
    )

    added_by: int = Field(
        foreign_key="user.id",
        index=True,
    )

    assigned_to: int | None = Field(
        default=None,
        foreign_key="user.id",
        index=True,
    )

    status: str = Field(default="planned", max_length=20)

    created_at: datetime = Field(default_factory=utc_now)
