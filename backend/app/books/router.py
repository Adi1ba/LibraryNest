# API endpoints for Book CRUD.
from fastapi import APIRouter, status

from app.books import service
from app.books.schemas import BookCreate, BookRead, BookUpdate
from app.books.dependencies import SessionDep


router = APIRouter(prefix="/api/books", tags=["Books"])


@router.post(
    "/",
    response_model=BookRead,
    status_code=status.HTTP_201_CREATED
)
def create_book(book_data: BookCreate, session: SessionDep):
    return service.create_book(session, book_data)


@router.get("/", response_model=list[BookRead])
def get_books(session: SessionDep):
    return service.get_books(session)


@router.get("/{book_id}", response_model=BookRead)
def get_book(book_id: int, session: SessionDep):
    return service.get_book(session, book_id)


@router.put("/{book_id}", response_model=BookRead)
def update_book(
    book_id: int,
    book_data: BookUpdate,
    session: SessionDep
):
    return service.update_book(session, book_id, book_data)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int, session: SessionDep):
    service.delete_book(session, book_id)