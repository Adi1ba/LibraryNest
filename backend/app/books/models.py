from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Book(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title: str = Field(max_length=200)
    author: str = Field(max_length=150)
    isbn: str = Field(max_length=20, unique=True, index=True)

    total_copies: int = Field(ge=0)
    available_copies: int = Field(default=0, ge=0)

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)