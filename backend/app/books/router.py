
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.auth.dependencies import CurrentUser
from app.auth.models import User
from app.auth.permissions import require_roles
from app.books import service
from app.books.schemas import BookCreate, BookRead, BookUpdate
from app.database import SessionDep

router = APIRouter(prefix="/api/books", tags=["Books"])

StaffUser = Annotated[
    User,
    Depends(require_roles("librarian", "admin")),
]


@router.post(
    "/",
    response_model=BookRead,
    status_code=status.HTTP_201_CREATED,
)
def create_book(
    book_data: BookCreate,
    session: SessionDep,
    current_user: StaffUser,
):
    return service.create_book(session, book_data)


@router.get("/", response_model=list[BookRead])
def get_books(
    session: SessionDep,
    current_user: CurrentUser,
    search: str | None = Query(default=None),
):
    return service.get_books(session, search)


@router.get("/{book_id}", response_model=BookRead)
def get_book(
    book_id: int,
    session: SessionDep,
    current_user: CurrentUser,
):
    return service.get_book(session, book_id)


@router.put("/{book_id}", response_model=BookRead)
def update_book(
    book_id: int,
    book_data: BookUpdate,
    session: SessionDep,
    current_user: StaffUser,
):
    return service.update_book(session, book_id, book_data)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    session: SessionDep,
    current_user: StaffUser,
):
    service.delete_book(session, book_id)
