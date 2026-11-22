
from datetime import datetime, timedelta, timezone
from typing import Any, cast

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.engine import CursorResult
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.auth.models import RefreshSession, User, utc_now
from app.auth.schemas import (
    PasswordChange,
    ProfileUpdate,
    TokenResponse,
    UserCreate,
    UserRead,
)
from app.auth.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.config import settings


def _refresh_expiration() -> datetime:
    """Return the refresh token expiration time."""
    return utc_now() + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )


def _is_expired(expiration: datetime) -> bool:
    """Check whether a refresh token has expired."""
    if expiration.tzinfo is None:
        expiration = expiration.replace(tzinfo=timezone.utc)

    return expiration <= utc_now()


def _create_refresh_session(
    session: Session,
    user_id: int,
) -> tuple[str, datetime]:
    """Create a refresh token and store its hash."""
    refresh_token = create_refresh_token()
    expires_at = _refresh_expiration()

    refresh_session = RefreshSession(
        user_id=user_id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=expires_at,
    )

    session.add(refresh_session)

    return refresh_token, expires_at


def _revoke_session_atomically(
    session: Session,
    session_id: int,
    now: datetime,
    mark_as_used: bool = False,
) -> bool:
    """Atomically revoke a refresh session."""

    if mark_as_used:
        statement = text(
            """
            UPDATE refreshsession
            SET revoked_at = :now,
                last_used_at = :now
            WHERE id = :session_id
              AND revoked_at IS NULL
            """
        )
    else:
        statement = text(
            """
            UPDATE refreshsession
            SET revoked_at = :now
            WHERE id = :session_id
              AND revoked_at IS NULL
            """
        )

    result = cast(
        CursorResult[Any],
        session.connection().execute(
            statement,
            {
                "now": now,
                "session_id": session_id,
            },
        ),
    )

    return result.rowcount == 1


def register_user(
    session: Session,
    user_data: UserCreate,
) -> UserRead:
    """Register a new user."""

    normalized_email = str(user_data.email).strip().lower()

    existing_user = session.exec(
        select(User).where(
            User.email == normalized_email
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    first_name = user_data.first_name.strip()
    last_name = user_data.last_name.strip()

    if not first_name or not last_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="First name and last name are required.",
        )

    user = User(
        first_name=first_name,
        last_name=last_name,
        email=normalized_email,
        password_hash=hash_password(user_data.password),
        role="student",
        is_active=True,
    )

    try:
        session.add(user)
        session.commit()
        session.refresh(user)

    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    return UserRead.model_validate(user)


def authenticate_user(
    session: Session,
    email: str,
    password: str,
) -> tuple[TokenResponse, str, datetime]:
    """Authenticate user and create access and refresh tokens."""

    normalized_email = email.strip().lower()

    user = session.exec(
        select(User).where(
            User.email == normalized_email
        )
    ).first()

    if (
        user is None
        or not verify_password(password, user.password_hash)
        or not user.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User ID could not be retrieved.",
        )

    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
    )

    refresh_token, expires_at = _create_refresh_session(
        session,
        user.id,
    )

    try:
        session.commit()

    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create an authentication session.",
        ) from None

    response = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )

    return response, refresh_token, expires_at


def refresh_user_session(
    session: Session,
    refresh_token: str,
) -> tuple[TokenResponse, str, datetime]:
    """Validate and rotate a refresh token."""

    unauthorized_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
    )

    token_hash = hash_refresh_token(refresh_token)

    stored_session = session.exec(
        select(RefreshSession).where(
            RefreshSession.token_hash == token_hash
        )
    ).first()

    if stored_session is None or stored_session.id is None:
        raise unauthorized_error

    if stored_session.revoked_at is not None:
        raise unauthorized_error

    if _is_expired(stored_session.expires_at):
        _revoke_session_atomically(
            session,
            stored_session.id,
            utc_now(),
        )
        session.commit()
        raise unauthorized_error

    user = session.get(User, stored_session.user_id)

    if user is None or not user.is_active or user.id is None:
        _revoke_session_atomically(
            session,
            stored_session.id,
            utc_now(),
        )
        session.commit()
        raise unauthorized_error

    now = utc_now()

    try:
        revoked = _revoke_session_atomically(
            session,
            stored_session.id,
            now,
            mark_as_used=True,
        )

        if not revoked:
            session.rollback()
            raise unauthorized_error

        access_token = create_access_token(
            user_id=user.id,
            role=user.role,
        )

        new_refresh_token, expires_at = _create_refresh_session(
            session,
            user.id,
        )

        session.commit()

    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh authentication session.",
        ) from None

    response = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )

    return response, new_refresh_token, expires_at


def revoke_refresh_session(
    session: Session,
    refresh_token: str | None,
) -> None:
    """Revoke the refresh session associated with a token."""

    if not refresh_token:
        return

    token_hash = hash_refresh_token(refresh_token)

    stored_session = session.exec(
        select(RefreshSession).where(
            RefreshSession.token_hash == token_hash
        )
    ).first()

    if stored_session is None or stored_session.id is None:
        return

    _revoke_session_atomically(
        session,
        stored_session.id,
        utc_now(),
    )

    session.commit()


def update_my_profile(
    session: Session,
    current_user: User,
    profile_data: ProfileUpdate,
) -> UserRead:
    """Update the authenticated user's profile."""

    updates = profile_data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least one field to update.",
        )

    if "first_name" in updates:
        updates["first_name"] = updates["first_name"].strip()

        if not updates["first_name"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="First name cannot be empty.",
            )

    if "last_name" in updates:
        updates["last_name"] = updates["last_name"].strip()

        if not updates["last_name"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Last name cannot be empty.",
            )

    if "email" in updates:
        updates["email"] = str(
            updates["email"]
        ).strip().lower()

        existing_user = session.exec(
            select(User).where(
                User.email == updates["email"]
            )
        ).first()

        if (
            existing_user is not None
            and existing_user.id != current_user.id
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

    for field, value in updates.items():
        setattr(current_user, field, value)

    try:
        session.add(current_user)
        session.commit()
        session.refresh(current_user)

    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        ) from None

    return UserRead.model_validate(current_user)


def change_user_password(
    session: Session,
    current_user: User,
    password_data: PasswordChange,
) -> None:
    """Change password and revoke all active refresh sessions."""

    if not verify_password(
        password_data.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your current password is incorrect.",
        )

    if verify_password(
        password_data.new_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your new password must be different from your current password.",
        )

    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User ID could not be retrieved.",
        )

    now = utc_now()

    try:
        # Update the user's password securely.
        current_user.password_hash = hash_password(
            password_data.new_password
        )

        session.add(current_user)

        # Find all refresh sessions belonging to this user.
        refresh_sessions = session.exec(
            select(RefreshSession).where(
                RefreshSession.user_id == current_user.id
            )
        ).all()

        # Revoke every session that is still active.
        for refresh_session in refresh_sessions:
            if refresh_session.revoked_at is None:
                refresh_session.revoked_at = now
                session.add(refresh_session)

        # Save password and revocations in one transaction.
        session.commit()

    except Exception:
        session.rollback()
        raise
