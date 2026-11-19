from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.auth.models import User
from app.auth.security import decode_access_token
from app.database import get_session

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    session: Annotated[Session, Depends(get_session)],
) -> User:
    """Verify the access token and return the authenticated user."""

    unauthorized_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized_error

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub", ""))
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise unauthorized_error from None

    user = session.get(User, user_id)

    if user is None:
        raise unauthorized_error

    if payload.get("role") != user.role:
        raise unauthorized_error

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
