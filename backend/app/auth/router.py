from fastapi import APIRouter, status

from app.auth.dependencies import CurrentUser
from app.auth.schemas import TokenResponse, UserCreate, UserLogin, UserRead
from app.auth.service import authenticate_user, register_user
from app.database import SessionDep

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserCreate,
    session: SessionDep,
):
    """Register a new user account."""
    return register_user(session, user_data)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    user_data: UserLogin,
    session: SessionDep,
):
    """Authenticate a user and return an access token."""
    return authenticate_user(
        session,
        str(user_data.email),
        user_data.password,
    )


@router.get(
    "/me",
    response_model=UserRead,
)
def get_my_profile(
    current_user: CurrentUser,
):
    """Return the currently authenticated user's information."""
    return current_user
