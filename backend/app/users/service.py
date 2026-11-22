
from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from app.auth.models import User
from app.auth.schemas import AdminUserRead, UserRoleUpdate


def get_all_users(session: Session) -> list[AdminUserRead]:
    """Return all users for the admin user-management page."""

    statement = select(User).order_by(col(User.id))
    users = session.exec(statement).all()

    return [
        AdminUserRead.model_validate(user)
        for user in users
    ]


def update_user_role(
    session: Session,
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: User,
) -> AdminUserRead:
    """Update a user's role. Admins cannot change their own role
    or another admin's role.
    """

    # Prevent an admin from changing their own role.
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role.",
        )

    user = session.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Prevent an admin from changing another admin's role.
    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot change another admin's role.",
        )

    user.role = role_data.role

    session.add(user)
    session.commit()
    session.refresh(user)

    return AdminUserRead.model_validate(user)


def deactivate_user(
    session: Session,
    user_id: int,
    current_user: User,
) -> AdminUserRead:
    """Deactivate a user. Admins cannot deactivate themselves
    or another admin.
    """

    # Prevent an admin from deactivating their own account.
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account.",
        )

    user = session.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Prevent an admin from deactivating another admin.
    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot deactivate another admin.",
        )

    user.is_active = False

    session.add(user)
    session.commit()
    session.refresh(user)

    return AdminUserRead.model_validate(user)
