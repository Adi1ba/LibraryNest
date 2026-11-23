
from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.models import User
from app.auth.permissions import require_roles
from app.auth.schemas import (
    AdminUserRead,
    BanUserRequest,
    BulkUserAction,
    DashboardStatsRead,
    UserDetailsRead,
    UserRoleUpdate,
)
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


@router.get(
    "/",
    response_model=list[AdminUserRead],
)
def get_all_users(
    session: SessionDep,
    current_user: AdminUser,
):
    """Get all users for admin user management."""

    return service.get_all_users(session)


@router.get(
    "/admin/dashboard-stats",
    response_model=DashboardStatsRead,
)
def get_dashboard_stats(
    session: SessionDep,
    current_user: AdminUser,
):
    """Get dashboard statistics."""

    return service.get_dashboard_stats(session)


@router.post("/bulk-action")
def bulk_user_action(
    action_data: BulkUserAction,
    session: SessionDep,
    current_user: AdminUser,
):
    """Bulk ban or unban selected users."""

    return service.bulk_user_action(
        session,
        action_data,
        current_user,
    )


@router.get(
    "/{user_id}",
    response_model=UserDetailsRead,
)
def get_user_details(
    user_id: int,
    session: SessionDep,
    current_user: AdminUser,
):
    """Get detailed information about a specific user."""

    return service.get_user_details(
        session,
        user_id,
    )


@router.patch(
    "/{user_id}/role",
    response_model=AdminUserRead,
)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    session: SessionDep,
    current_user: AdminUser,
):
    """Update a user's role."""

    return service.update_user_role(
        session,
        user_id,
        role_data,
        current_user,
    )


@router.patch(
    "/{user_id}/deactivate",
    response_model=AdminUserRead,
)
def deactivate_user(
    user_id: int,
    session: SessionDep,
    current_user: AdminUser,
):
    """Deactivate a user account."""

    return service.deactivate_user(
        session,
        user_id,
        current_user,
    )


@router.patch(
    "/{user_id}/activate",
    response_model=AdminUserRead,
)
def activate_user(
    user_id: int,
    session: SessionDep,
    current_user: AdminUser,
):
    """Activate a deactivated user account."""

    return service.activate_user(
        session,
        user_id,
        current_user,
    )


@router.post(
    "/{user_id}/ban",
    response_model=AdminUserRead,
)
def ban_user(
    user_id: int,
    ban_data: BanUserRequest,
    session: SessionDep,
    current_user: AdminUser,
):
    """Ban a user with a required reason."""

    return service.ban_user(
        session,
        user_id,
        ban_data,
        current_user,
    )


@router.patch(
    "/{user_id}/unban",
    response_model=AdminUserRead,
)
def unban_user(
    user_id: int,
    session: SessionDep,
    current_user: AdminUser,
):
    """Remove a user's ban."""

    return service.unban_user(
        session,
        user_id,
        current_user,
    )


@router.post("/{user_id}/sessions/revoke")
def revoke_user_sessions(
    user_id: int,
    session: SessionDep,
    current_user: AdminUser,
):
    """Revoke all active refresh sessions belonging to a user."""

    return service.revoke_user_sessions(
        session,
        user_id,
        current_user,
    )
