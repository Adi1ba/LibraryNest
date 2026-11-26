
from datetime import datetime, timedelta, timezone
from typing import cast

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select, update

from app.auth.models import RefreshSession, User, utc_now
from app.auth.schemas import (
    MySessionRead,
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
    return utc_now() + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )


def _is_expired(expires_at: datetime) -> bool:
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return expires_at <= utc_now()


def _create_refresh_session(
    session: Session,
    user: User,
) -> str:
    refresh_token = create_refresh_token()

    refresh_session = RefreshSession(
        user_id=cast(int, user.id),
        token_hash=hash_refresh_token(refresh_token),
        expires_at=_refresh_expiration(),
    )

    session.add(refresh_session)
    session.commit()

    return refresh_token


def _revoke_session_atomically(
    session: Session,
    session_id: int,
    mark_as_used: bool = False,
) -> bool:
    now = utc_now()

    values = {"revoked_at": now}

    if mark_as_used:
        values["last_used_at"] = now

    statement = (
        update(RefreshSession)
        .where(
            col(RefreshSession.id) == session_id,
            col(RefreshSession.revoked_at).is_(None),
        )
        .values(**values)
    )

    result = session.exec(statement)
    row_count = result.rowcount

    session.commit()

    return row_count == 1


def register_user(
    session: Session,
    user_create: UserCreate,
) -> UserRead:
    existing_user = session.exec(
        select(User).where(User.email == user_create.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )

    user = User(
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        email=user_create.email,
        password_hash=hash_password(user_create.password),
        role="student",
    )

    session.add(user)

    try:
        session.commit()
        session.refresh(user)
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )

    return UserRead.model_validate(user)


def authenticate_user(
    session: Session,
    email: str,
    password: str,
) -> tuple[User, TokenResponse, str]:
    user = session.exec(
        select(User).where(User.email == email)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    now = utc_now()

    # Check whether the account is currently locked.
    if user.locked_until is not None:
        locked_until = user.locked_until

        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)

        if locked_until > now:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Try again later.",
            )

        # Lock period has expired.
        user.failed_login_attempts = 0
        user.locked_until = None
        session.add(user)
        session.commit()

    # Verify password.
    if not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1

        if user.failed_login_attempts >= 5:
            user.locked_until = now + timedelta(minutes=15)

        session.add(user)
        session.commit()

        if user.locked_until is not None:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Too many failed login attempts. "
                    "Your account is locked for 15 minutes."
                ),
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Correct password: reset failed login attempts.
    user.failed_login_attempts = 0
    user.locked_until = None
    session.add(user)
    session.commit()
    session.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive.",
        )

    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned.",
        )

    access_token = create_access_token(
        user_id=cast(int, user.id),
        role=user.role,
    )

    refresh_token = _create_refresh_session(session, user)

    token_response = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )

    return user, token_response, refresh_token


def refresh_user_session(
    session: Session,
    refresh_token: str,
) -> tuple[TokenResponse, str]:
    token_hash = hash_refresh_token(refresh_token)

    refresh_session = session.exec(
        select(RefreshSession).where(
            RefreshSession.token_hash == token_hash
        )
    ).first()

    if not refresh_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    if refresh_session.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh session has been revoked.",
        )

    if _is_expired(refresh_session.expires_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired.",
        )

    user = session.get(User, refresh_session.user_id)

    if not user or not user.is_active or user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is unavailable.",
        )

    revoked = _revoke_session_atomically(
        session,
        cast(int, refresh_session.id),
        mark_as_used=True,
    )

    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh session is no longer valid.",
        )

    access_token = create_access_token(
        user_id=cast(int, user.id),
        role=user.role,
    )

    new_refresh_token = _create_refresh_session(session, user)

    token_response = TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )

    return token_response, new_refresh_token


def revoke_refresh_session(
    session: Session,
    refresh_token: str | None,
) -> None:
    if not refresh_token:
        return

    token_hash = hash_refresh_token(refresh_token)

    refresh_session = session.exec(
        select(RefreshSession).where(
            RefreshSession.token_hash == token_hash
        )
    ).first()

    if not refresh_session:
        return

    if refresh_session.revoked_at is not None:
        return

    _revoke_session_atomically(
        session,
        cast(int, refresh_session.id),
    )


def update_my_profile(
    session: Session,
    current_user: User,
    profile_update: ProfileUpdate,
) -> UserRead:
    update_data = profile_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return UserRead.model_validate(current_user)


def change_user_password(
    session: Session,
    current_user: User,
    password_change: PasswordChange,
) -> None:
    if not verify_password(
        password_change.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    current_user.password_hash = hash_password(
        password_change.new_password
    )

    session.add(current_user)

    active_sessions = session.exec(
        select(RefreshSession).where(
            col(RefreshSession.user_id) == current_user.id,
            col(RefreshSession.revoked_at).is_(None),
        )
    ).all()

    now = utc_now()

    for refresh_session in active_sessions:
        refresh_session.revoked_at = now

    session.commit()


def get_my_sessions(
    session: Session,
    current_user: User,
    current_token_hash: str | None = None,
) -> list[MySessionRead]:
    now = utc_now()

    refresh_sessions = session.exec(
        select(RefreshSession)
        .where(
            col(RefreshSession.user_id) == current_user.id,
            col(RefreshSession.revoked_at).is_(None),
            col(RefreshSession.expires_at) > now,
        )
        .order_by(col(RefreshSession.created_at).desc())
    ).all()

    return [
        MySessionRead(
            id=cast(int, refresh_session.id),
            created_at=refresh_session.created_at,
            expires_at=refresh_session.expires_at,
            last_used_at=refresh_session.last_used_at,
            is_current=(
                current_token_hash is not None
                and refresh_session.token_hash == current_token_hash
            ),
        )
        for refresh_session in refresh_sessions
    ]


def revoke_my_session(
    session: Session,
    current_user: User,
    session_id: int,
) -> None:
    refresh_session = session.exec(
        select(RefreshSession).where(
            col(RefreshSession.id) == session_id,
            col(RefreshSession.user_id) == current_user.id,
            col(RefreshSession.revoked_at).is_(None),
        )
    ).first()

    if not refresh_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active session not found.",
        )

    revoked = _revoke_session_atomically(
        session,
        session_id,
    )

    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session is already revoked or unavailable.",
        )
