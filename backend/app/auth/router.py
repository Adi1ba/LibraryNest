
from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from app.audit.service import create_audit_log
from app.auth.dependencies import CurrentUser
from app.auth.models import RefreshSession, User
from app.auth.schemas import (
    PasswordChange,
    ProfileUpdate,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.auth.security import hash_refresh_token
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


def save_audit_log(
    session: Session,
    request: Request,
    event_type: str,
    description: str,
    actor: User | None = None,
    outcome: str = "success",
    actor_email: str | None = None,
) -> None:
    """Save an audit event without interrupting the main auth operation."""

    try:
        create_audit_log(
            session=session,
            request=request,
            event_type=event_type,
            description=description,
            actor=actor,
            outcome=outcome,
            actor_email=actor_email,
        )
        session.commit()

    except SQLAlchemyError:
        session.rollback()


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
    request: Request,
    response: Response,
    user_data: UserLogin,
    session: SessionDep,
):
    normalized_email = str(user_data.email).strip().lower()

    try:
        token_response, refresh_token, _expires_at = authenticate_user(
            session,
            normalized_email,
            user_data.password,
        )

    except HTTPException:
        user = session.exec(
            select(User).where(User.email == normalized_email)
        ).first()

        save_audit_log(
            session=session,
            request=request,
            event_type="login_failed",
            description="Failed login attempt.",
            actor=user,
            outcome="failure",
            actor_email=normalized_email,
        )

        raise

    user = session.get(User, token_response.user.id)

    save_audit_log(
        session=session,
        request=request,
        event_type="login_success",
        description="User logged in successfully.",
        actor=user,
        outcome="success",
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
    request: Request,
    response: Response,
    session: SessionDep,
    refresh_token: Annotated[
        str | None,
        Cookie(alias=REFRESH_COOKIE_NAME),
    ] = None,
):
    user = None

    if refresh_token:
        token_hash = hash_refresh_token(refresh_token)

        refresh_session = session.exec(
            select(RefreshSession).where(
                RefreshSession.token_hash == token_hash
            )
        ).first()

        if refresh_session:
            user = session.get(User, refresh_session.user_id)

    revoke_refresh_session(session, refresh_token)

    save_audit_log(
        session=session,
        request=request,
        event_type="logout",
        description="User logged out.",
        actor=user,
        outcome="success",
    )

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
    request: Request,
    password_data: PasswordChange,
    current_user: CurrentUser,
    session: SessionDep,
):
    change_user_password(
        session,
        current_user,
        password_data,
    )

    save_audit_log(
        session=session,
        request=request,
        event_type="password_change",
        description="User changed their password.",
        actor=current_user,
        outcome="success",
    )

    return {
        "message": (
            "Password changed successfully. "
            "Please log in again on your devices."
        )
    }
