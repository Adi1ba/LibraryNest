
from datetime import datetime
from typing import Annotated, Literal

from pydantic import EmailStr, StringConstraints
from sqlmodel import Field, SQLModel


StudentName = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=150)
]


class LoanCreate(SQLModel):
    book_id: int = Field(gt=0)
    student_name: StudentName
    student_email: EmailStr


class LoanStatusUpdate(SQLModel):
    status: Literal["Approved", "Rejected", "Returned"]


class LoanRead(SQLModel):
    id: int
    book_id: int
    student_name: str
    student_email: str
    status: str
    requested_at: datetime
    returned_at: datetime | None
