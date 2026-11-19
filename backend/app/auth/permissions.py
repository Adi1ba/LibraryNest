
from fastapi import HTTPException, status

from app.auth.dependencies import CurrentUser
from app.auth.models import User


def require_roles(*allowed_roles: str):
    """Allow access only to users with one of the specified roles."""

    def role_checker(current_user: CurrentUser) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )

        return current_user

    return role_checker
