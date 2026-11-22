
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.auth.dependencies import CurrentUser
from app.auth.models import User
from app.auth.permissions import require_roles
from app.database import SessionDep
from app.loans import service
from app.loans.schemas import LoanCreate, LoanRead, LoanStatusUpdate

router = APIRouter(
    prefix="/api/loans",
    tags=["Loans"],
)

StaffUser = Annotated[
    User,
    Depends(require_roles("librarian", "admin")),
]


@router.post(
    "/",
    response_model=LoanRead,
    status_code=status.HTTP_201_CREATED,
)
def create_loan(
    loan_data: LoanCreate,
    session: SessionDep,
    current_user: CurrentUser,
):
    return service.create_loan(
        session,
        loan_data,
        current_user,
    )


@router.get(
    "/",
    response_model=list[LoanRead],
)
def get_loans(
    session: SessionDep,
    current_user: CurrentUser,
):
    return service.get_loans(
        session,
        current_user,
    )


@router.get(
    "/{loan_id}",
    response_model=LoanRead,
)
def get_loan(
    loan_id: int,
    session: SessionDep,
    current_user: CurrentUser,
):
    return service.get_loan(
        session,
        loan_id,
        current_user,
    )


@router.patch(
    "/{loan_id}/status",
    response_model=LoanRead,
)
def update_loan_status(
    loan_id: int,
    status_data: LoanStatusUpdate,
    session: SessionDep,
    current_user: StaffUser,
):
    return service.update_loan_status(
        session,
        loan_id,
        status_data,
        current_user,
    )
