
from datetime import datetime
from typing import Annotated, Literal

from pydantic import StringConstraints
from sqlmodel import SQLModel

GroupName = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=100,
    ),
]

GroupDescription = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        max_length=500,
    ),
]


class GroupCreate(SQLModel):
    name: GroupName
    description: GroupDescription | None = None


class GroupUpdate(SQLModel):
    name: GroupName | None = None
    description: GroupDescription | None = None


class GroupRead(SQLModel):
    id: int
    name: str
    description: str | None
    owner_id: int
    created_at: datetime


class GroupMemberAdd(SQLModel):
    user_id: int


class GroupPermissionUpdate(SQLModel):
    can_create: bool
    can_edit: bool
    can_assign: bool
    can_delete: bool


class GroupMemberRead(SQLModel):
    id: int
    group_id: int
    user_id: int
    can_create: bool
    can_edit: bool
    can_assign: bool
    can_delete: bool
    joined_at: datetime


class ReadingListItemCreate(SQLModel):
    book_id: int
    assigned_to: int | None = None


class ReadingListItemUpdate(SQLModel):
    assigned_to: int | None = None
    status: Literal["planned", "reading", "completed"] | None = None


class ReadingListItemRead(SQLModel):
    id: int
    group_id: int
    book_id: int
    added_by: int
    assigned_to: int | None
    status: str
    created_at: datetime
