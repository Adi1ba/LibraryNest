
from datetime import datetime
from typing import Literal

from sqlmodel import Field, SQLModel


class LoanCreate(SQLModel):
    book_id: int = Field(gt=0)


class LoanStatusUpdate(SQLModel):
    status: Literal["Approved", "Rejected", "Returned"]


class LoanRead(SQLModel):
    id: int
    book_id: int
    user_id: int | None
    student_name: str
    student_email: str
    status: str
    requested_at: datetime
    returned_at: datetime | None
