from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Response, status

from app.auth.dependencies import CurrentUser
from app.auth.schemas import (
    PasswordChange,
    ProfileUpdate,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.auth.service import (
    authenticate_user,
    change_user_password,
    refresh_user_session,
    register_user,
    revoke_refresh_session,
    update_my_profile,
)
from app.config import settings
from app.database import SessionDep

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

REFRESH_COOKIE_NAME = "librarynest_refresh_token"
REFRESH_COOKIE_PATH = "/api/auth"

SECURE_COOKIE = (
    (settings.VERCEL or "").strip().lower() in {"1", "true", "yes"}
)


def set_refresh_cookie(
    response: Response,
    refresh_token: str,
) -> None:
    """Set the refresh token in a secure HttpOnly cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=SECURE_COOKIE,
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response) -> None:
    """Remove the refresh token cookie from the browser."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=SECURE_COOKIE,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
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
    return register_user(session, user_data)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    response: Response,
    user_data: UserLogin,
    session: SessionDep,
):
    token_response, refresh_token, _expires_at = authenticate_user(
        session,
        str(user_data.email),
        user_data.password,
    )

    set_refresh_cookie(response, refresh_token)

    return token_response


@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    response: Response,
    session: SessionDep,
    refresh_token: Annotated[
        str | None,
        Cookie(alias=REFRESH_COOKIE_NAME),
    ] = None,
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing.",
        )

    token_response, new_refresh_token, _expires_at = refresh_user_session(
        session,
        refresh_token,
    )

    set_refresh_cookie(response, new_refresh_token)

    return token_response


@router.post("/logout")
def logout(
    response: Response,
    session: SessionDep,
    refresh_token: Annotated[
        str | None,
        Cookie(alias=REFRESH_COOKIE_NAME),
    ] = None,
):
    revoke_refresh_session(session, refresh_token)
    clear_refresh_cookie(response)

    return {"message": "Logged out successfully."}


@router.get(
    "/me",
    response_model=UserRead,
)
def get_my_profile(
    current_user: CurrentUser,
):
    return current_user


@router.patch(
    "/me",
    response_model=UserRead,
)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    return update_my_profile(
        session,
        current_user,
        profile_data,
    )


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: CurrentUser,
    session: SessionDep,
):
    change_user_password(
        session,
        current_user,
        password_data,
    )

    return {
        "message": (
            "Password changed successfully. "
            "Please log in again on your devices."
        )
    }