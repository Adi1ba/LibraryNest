
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Loan(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    book_id: int = Field(
        foreign_key="book.id",
        index=True
    )

    user_id: int | None = Field(
        default=None,
        foreign_key="user.id",
        index=True,
    )

    student_name: str = Field(max_length=150)
    student_email: str = Field(max_length=255)

    status: str = Field(default="Pending", max_length=20)

    requested_at: datetime = Field(default_factory=utc_now)
    returned_at: datetime | None = Field(default=None)
