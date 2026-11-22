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
    created_at: datetime


class UserRoleUpdate(SQLModel):
    role: Literal["student", "librarian", "admin"]


class ProfileUpdate(SQLModel):
    first_name: Annotated[str, StringConstraints(min_length=1, max_length=100)] | None = None
    last_name: Annotated[str, StringConstraints(min_length=1, max_length=100)] | None = None
    email: EmailStr | None = None


class PasswordChange(SQLModel):
    current_password: CurrentPassword
    new_password: Password


class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead