# Request and response schemas for Book CRUD.
from datetime import datetime
from typing import Annotated

from pydantic import StringConstraints, field_validator
from sqlmodel import Field, SQLModel


Title = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]

Author = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=150)
]

ISBN = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=20)
]


class BookBase(SQLModel):
    title: Title
    author: Author
    isbn: ISBN
    total_copies: int = Field(ge=0)


class BookCreate(BookBase):
    pass


class BookUpdate(SQLModel):
    title: Title | None = None
    author: Author | None = None
    isbn: ISBN | None = None
    total_copies: int | None = Field(default=None, ge=0)

    @field_validator("title", "author", "isbn", "total_copies")
    @classmethod
    def not_null(cls, value):
        if value is None:
            raise ValueError("cannot be null")
        return value


class BookRead(BookBase):
    id: int
    available_copies: int
    created_at: datetime
    updated_at: datetime