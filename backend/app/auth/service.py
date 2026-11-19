from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.auth.models import User
from app.auth.schemas import TokenResponse, UserCreate, UserRead
from app.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.config import settings


def register_user(session: Session, user_data: UserCreate) -> UserRead:
    """Register a new user account."""

    normalized_email = str(user_data.email).strip().lower()

    existing_user = session.exec(
        select(User).where(User.email == normalized_email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=normalized_email,
        password_hash=hash_password(user_data.password),
        role="user",
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
) -> TokenResponse:
    """Verify login credentials and issue an access token."""

    normalized_email = email.strip().lower()

    user = session.exec(select(User).where(User.email == normalized_email)).first()

    if not user or not verify_password(password, user.password_hash):
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

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )
