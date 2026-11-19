from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    email: str = Field(
        max_length=255,
        unique=True,
        index=True,
    )

    password_hash: str = Field(max_length=255)

    role: str = Field(default="user", max_length=20)

    created_at: datetime = Field(default_factory=utc_now)
