
# Database operations for books.
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.books.models import Book
from app.books.schemas import BookCreate, BookUpdate


def create_book(session: Session, book_data: BookCreate) -> Book:
    book = Book(
        **book_data.model_dump(),
        available_copies=book_data.total_copies
    )

    session.add(book)
    session.commit()
    session.refresh(book)

    return book


def get_books(session: Session) -> list[Book]:
    statement = select(Book).order_by(Book.id)
    return list(session.exec(statement).all())


def get_book(session: Session, book_id: int) -> Book | None:
    return session.get(Book, book_id)


def update_book(
    session: Session,
    book: Book,
    book_data: BookUpdate
) -> Book:
    update_data = book_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(book, key, value)

    # Keep available copies equal to total copies in the current MVP.
    if "total_copies" in update_data:
        book.available_copies = update_data["total_copies"]

    book.updated_at = datetime.now(timezone.utc)

    session.add(book)
    session.commit()
    session.refresh(book)

    return book


def delete_book(session: Session, book: Book) -> None:
    session.delete(book)
    session.commit()
