from fastapi import APIRouter, status

from app.database import SessionDep
from app.loans import service
from app.loans.schemas import LoanCreate, LoanRead, LoanStatusUpdate


router = APIRouter(prefix="/api/loans", tags=["Loans"])


@router.post(
    "/",
    response_model=LoanRead,
    status_code=status.HTTP_201_CREATED
)
def create_loan(loan_data: LoanCreate, session: SessionDep):
    return service.create_loan(session, loan_data)


@router.get("/", response_model=list[LoanRead])
def get_loans(session: SessionDep):
    return service.get_loans(session)


@router.get("/{loan_id}", response_model=LoanRead)
def get_loan(loan_id: int, session: SessionDep):
    return service.get_loan(session, loan_id)


@router.patch("/{loan_id}/status", response_model=LoanRead)
def update_loan_status(
    loan_id: int,
    status_data: LoanStatusUpdate,
    session: SessionDep
):
    return service.update_loan_status(session, loan_id, status_data)
