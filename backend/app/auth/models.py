
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    role: str = Field(default="student", max_length=20)
    is_active: bool = Field(default=True)
    is_banned: bool = Field(default=False)
    ban_reason: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)


class RefreshSession(SQLModel, table=True):
    """Store a user's hashed refresh token and session status."""

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    token_hash: str = Field(max_length=64, unique=True, index=True)
    expires_at: datetime
    revoked_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)
    last_used_at: datetime | None = Field(default=None)
