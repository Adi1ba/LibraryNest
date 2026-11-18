
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session

from app.loans import repository
from app.loans.models import Loan
from app.loans.schemas import LoanCreate, LoanStatusUpdate


def create_loan(session: Session, loan_data: LoanCreate) -> Loan:
    book = repository.get_book_for_update(session, loan_data.book_id)

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found."
        )

    loan = Loan(
        book_id=loan_data.book_id,
        student_name=loan_data.student_name,
        student_email=str(loan_data.student_email),
        status="Pending"
    )

    return repository.create_loan(session, loan)


def get_loans(session: Session) -> list[Loan]:
    return repository.get_loans(session)


def get_loan(session: Session, loan_id: int) -> Loan:
    loan = repository.get_loan(session, loan_id)

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan request not found."
        )

    return loan


def update_loan_status(
    session: Session,
    loan_id: int,
    status_data: LoanStatusUpdate
) -> Loan:
    loan = get_loan(session, loan_id)

    book = repository.get_book_for_update(session, loan.book_id)

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book associated with this loan was not found."
        )

    # Refresh the loan to check its latest database status.
    session.refresh(loan)

    new_status = status_data.status

    if loan.status == "Pending":

        if new_status == "Approved":
            if book.available_copies <= 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No available copies of this book."
                )

            book.available_copies -= 1

        elif new_status == "Rejected":
            pass

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending loan can only be approved or rejected."
            )

    elif loan.status == "Approved":

        if new_status == "Returned":
            if book.available_copies >= book.total_copies:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Book availability is already at its maximum."
                )

            book.available_copies += 1
            loan.returned_at = datetime.now(timezone.utc)

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An approved loan can only be marked as returned."
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This loan request has already been completed."
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
