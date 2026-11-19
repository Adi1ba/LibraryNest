
from sqlmodel import Session, col, select

from app.books.models import Book
from app.loans.models import Loan


def create_loan(session: Session, loan: Loan) -> Loan:
    session.add(loan)
    session.commit()
    session.refresh(loan)
    return loan


def get_loans(session: Session) -> list[Loan]:
    statement = select(Loan).order_by(col(Loan.id).asc())
    return list(session.exec(statement).all())


def get_loans_by_user(session: Session, user_id: int) -> list[Loan]:
    statement = (
        select(Loan)
        .where(Loan.user_id == user_id)
        .order_by(col(Loan.id).asc())
    )
    return list(session.exec(statement).all())


def get_loan(session: Session, loan_id: int) -> Loan | None:
    return session.get(Loan, loan_id)


def get_book_for_update(session: Session, book_id: int) -> Book | None:
    statement = (
        select(Book)
        .where(Book.id == book_id)
        .with_for_update()
    )
    return session.exec(statement).first()


def save_loan(session: Session, loan: Loan) -> Loan:
    session.add(loan)
    session.commit()
    session.refresh(loan)
    return loan


def save_book(session: Session, book: Book) -> Book:
    session.add(book)
    session.commit()
    session.refresh(book)
    return book
