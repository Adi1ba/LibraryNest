
from datetime import datetime
from typing import Annotated, Literal

from pydantic import EmailStr, StringConstraints
from sqlmodel import SQLModel

Password = Annotated[
    str,
    StringConstraints(min_length=8, max_length=128),
]

CurrentPassword = Annotated[
    str,
    StringConstraints(min_length=1, max_length=128),
]


class UserCreate(SQLModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: Password


class UserLogin(SQLModel):
    email: EmailStr
    password: str


class UserRead(SQLModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    created_at: datetime


class AdminUserRead(SQLModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    is_active: bool
    is_banned: bool
    ban_reason: str | None = None
    created_at: datetime


class UserRoleUpdate(SQLModel):
    role: Literal["student", "librarian", "admin"]


class BanUserRequest(SQLModel):
    reason: Annotated[
        str,
        StringConstraints(min_length=1, max_length=1000),
    ]


class BulkUserAction(SQLModel):
    user_ids: list[int]
    action: Literal["ban", "unban"]
    reason: str | None = None


class DashboardStatsRead(SQLModel):
    total_users: int
    active_users: int
    banned_users: int
    total_books: int
    total_groups: int
    new_users_last_7_days: int


class UserDetailLoanRead(SQLModel):
    id: int
    book_id: int
    book_title: str
    book_author: str
    book_isbn: str
    status: str
    requested_at: datetime
    returned_at: datetime | None = None


class UserDetailGroupRead(SQLModel):
    id: int
    name: str
    description: str | None = None
    owner_id: int
    created_at: datetime
    membership_role: str


class UserDetailSessionRead(SQLModel):
    id: int
    created_at: datetime
    expires_at: datetime
    last_used_at: datetime | None = None


class UserDetailsRead(SQLModel):
    id: int
    first_name: str
    last_name: str
    email: str
    role: str
    is_active: bool
    is_banned: bool
    ban_reason: str | None = None
    created_at: datetime
    loans: list[UserDetailLoanRead]
    groups: list[UserDetailGroupRead]
    active_sessions: list[UserDetailSessionRead]


class ProfileUpdate(SQLModel):
    first_name: Annotated[
        str, StringConstraints(min_length=1, max_length=100)
    ] | None = None
    last_name: Annotated[
        str, StringConstraints(min_length=1, max_length=100)
    ] | None = None
    email: EmailStr | None = None


class PasswordChange(SQLModel):
    current_password: CurrentPassword
    new_password: Password


class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead
