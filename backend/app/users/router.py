
from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.models import User
from app.auth.permissions import require_roles
from app.auth.schemas import AdminUserRead, UserRoleUpdate
from app.database import SessionDep
from app.users import service

router = APIRouter(
    prefix="/api/users",
    tags=["User Management"],
)

AdminUser = Annotated[
    User,
    Depends(require_roles("admin")),
]


@router.get("/", response_model=list[AdminUserRead])
def get_all_users(
    session: SessionDep,
    current_user: AdminUser,
):
    """Allow admins to view all user accounts."""

    return service.get_all_users(session)


@router.patch("/{user_id}/role", response_model=AdminUserRead)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    session: SessionDep,
    current_user: AdminUser,
):
    """Allow admins to change another user's role."""

    return service.update_user_role(
        session,
        user_id,
        role_data,
        current_user,
    )


@router.patch("/{user_id}/deactivate", response_model=AdminUserRead)
def deactivate_user(
    user_id: int,
    session: SessionDep,
    current_user: AdminUser,
):
    """Allow admins to deactivate another user's account."""

    return service.deactivate_user(
        session,
        user_id,
        current_user,
    )
