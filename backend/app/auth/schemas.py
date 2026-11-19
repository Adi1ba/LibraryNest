
from datetime import datetime
from typing import Annotated, Literal

from pydantic import EmailStr, StringConstraints
from sqlmodel import SQLModel

Password = Annotated[
    str,
    StringConstraints(min_length=8, max_length=128),
]


class UserCreate(SQLModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: Password


class UserLogin(SQLModel):
    email: EmailStr
    password: Password


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


class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead
