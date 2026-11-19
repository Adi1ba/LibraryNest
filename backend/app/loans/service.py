
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session

from app.auth.models import User
from app.books.models import Book
from app.loans import repository
from app.loans.models import Loan
from app.loans.schemas import LoanCreate, LoanStatusUpdate


def create_loan(
    session: Session,
    loan_data: LoanCreate,
    current_user: User,
) -> Loan:
    book = repository.get_book_for_update(session, loan_data.book_id)

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found.",
        )

    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user account.",
        )

    loan = Loan(
        book_id=loan_data.book_id,
        user_id=current_user.id,
        student_name=f"{current_user.first_name} {current_user.last_name}",
        student_email=current_user.email,
        status="Pending",
    )

    return repository.create_loan(session, loan)


def get_loans(session: Session, current_user: User) -> list[Loan]:
    if current_user.role == "student":
        if current_user.id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user account.",
            )

        return repository.get_loans_by_user(
            session,
            current_user.id,
        )

    return repository.get_loans(session)


def get_loan(
    session: Session,
    loan_id: int,
    current_user: User,
) -> Loan:
    loan = repository.get_loan(session, loan_id)

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan request not found.",
        )

    if (
        current_user.role == "student"
        and loan.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan request not found.",
        )

    return loan


def update_loan_status(
    session: Session,
    loan_id: int,
    status_data: LoanStatusUpdate,
) -> Loan:
    loan = repository.get_loan(session, loan_id)

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan request not found.",
        )

    book: Book | None = repository.get_book_for_update(
        session,
        loan.book_id,
    )

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book associated with this loan was not found.",
        )

    session.refresh(loan)

    new_status = status_data.status

    if loan.status == "Pending":

        if new_status == "Approved":
            if book.available_copies <= 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No available copies of this book.",
                )

            book.available_copies -= 1

        elif new_status == "Rejected":
            pass

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending loan can only be approved or rejected.",
            )

    elif loan.status == "Approved":

        if new_status == "Returned":
            if book.available_copies >= book.total_copies:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Book availability is already at its maximum.",
                )

            book.available_copies += 1
            loan.returned_at = datetime.now(timezone.utc)

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An approved loan can only be marked as returned.",
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This loan request has already been completed.",
        )

    loan.status = new_status

    try:
        session.add(book)
        session.add(loan)
        session.commit()
        session.refresh(loan)

    except Exception:
        session.rollback()
        raise

    return loan
