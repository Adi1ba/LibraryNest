from datetime import datetime
from typing import Annotated

from pydantic import EmailStr, StringConstraints
from sqlmodel import SQLModel

Password = Annotated[
    str,
    StringConstraints(min_length=8, max_length=128),
]


class UserCreate(SQLModel):
    email: EmailStr
    password: Password


class UserLogin(SQLModel):
    email: EmailStr
    password: Password


class UserRead(SQLModel):
    id: int
    email: str
    role: str
    created_at: datetime


class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead
