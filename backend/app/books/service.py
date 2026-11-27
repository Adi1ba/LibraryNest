
# Business logic for Book CRUD.
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.books import repository
from app.books.models import Book
from app.books.schemas import BookCreate, BookUpdate


def create_book(session: Session, book_data: BookCreate) -> Book:
    existing_books = repository.get_books(session)

    if any(book.isbn == book_data.isbn for book in existing_books):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A book with this ISBN already exists."
        )

    return repository.create_book(session, book_data)


def get_books(
    session: Session,
    search: str | None = None
) -> list[Book]:
    return repository.get_books(session, search)


def get_book(session: Session, book_id: int) -> Book:
    book = repository.get_book(session, book_id)

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found."
        )

    return book


def update_book(
    session: Session,
    book_id: int,
    book_data: BookUpdate
) -> Book:
    book = get_book(session, book_id)

    update_data = book_data.model_dump(exclude_unset=True)

    if "isbn" in update_data:
        existing_books = repository.get_books(session)

        if any(
            item.isbn == update_data["isbn"] and item.id != book_id
            for item in existing_books
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A book with this ISBN already exists."
            )

    if "total_copies" in update_data:
        new_total = update_data["total_copies"]
        borrowed_copies = book.total_copies - book.available_copies

        if new_total < borrowed_copies:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Total copies cannot be less than "
                    "the number of borrowed copies."
                )
            )

    return repository.update_book(session, book, book_data)


def delete_book(session: Session, book_id: int) -> None:
    book = get_book(session, book_id)

    try:
        repository.delete_book(session, book)

    except IntegrityError:
        session.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This book is referenced by existing records and cannot be deleted."
        )
