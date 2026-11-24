
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session

from app.audit.service import create_audit_log
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


def save_admin_audit_log(
    session: Session,
    request: Request,
    current_user: User,
    event_type: str,
    description: str,
    target_user: User | None = None,
) -> None:
    """Save a successful admin action in the audit log."""

    try:
        create_audit_log(
            session=session,
            request=request,
            event_type=event_type,
            description=description,
            actor=current_user,
            target_user=target_user,
            outcome="success",
        )
        session.commit()

    except SQLAlchemyError:
        session.rollback()


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
    request: Request,
    session: SessionDep,
    current_user: AdminUser,
):
    """Bulk ban or unban selected users."""

    result = service.bulk_user_action(
        session,
        action_data,
        current_user,
    )

    if result["changed_count"] > 0:
        save_admin_audit_log(
            session=session,
            request=request,
            current_user=current_user,
            event_type=f"bulk_{action_data.action}",
            description=(
                f"Admin performed bulk {action_data.action} "
                f"on {result['changed_count']} user(s)."
            ),
        )

    return result


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
    request: Request,
    session: SessionDep,
    current_user: AdminUser,
):
    """Update a user's role and record the action."""

    result = service.update_user_role(
        session,
        user_id,
        role_data,
        current_user,
    )

    target_user = session.get(User, user_id)

    save_admin_audit_log(
        session=session,
        request=request,
        current_user=current_user,
        event_type="role_change",
        description=f"Admin changed user role to {role_data.role}.",
        target_user=target_user,
    )

    return result


@router.patch(
    "/{user_id}/deactivate",
    response_model=AdminUserRead,
)
def deactivate_user(
    user_id: int,
    request: Request,
    session: SessionDep,
    current_user: AdminUser,
):
    """Deactivate a user account."""

    result = service.deactivate_user(
        session,
        user_id,
        current_user,
    )

    target_user = session.get(User, user_id)

    save_admin_audit_log(
        session=session,
        request=request,
        current_user=current_user,
        event_type="user_deactivated",
        description="Admin deactivated a user account.",
        target_user=target_user,
    )

    return result


@router.patch(
    "/{user_id}/activate",
    response_model=AdminUserRead,
)
def activate_user(
    user_id: int,
    request: Request,
    session: SessionDep,
    current_user: AdminUser,
):
    """Activate a user account."""

    result = service.activate_user(
        session,
        user_id,
        current_user,
    )

    target_user = session.get(User, user_id)

    save_admin_audit_log(
        session=session,
        request=request,
        current_user=current_user,
        event_type="user_activated",
        description="Admin activated a user account.",
        target_user=target_user,
    )

    return result


@router.post(
    "/{user_id}/ban",
    response_model=AdminUserRead,
)
def ban_user(
    user_id: int,
    ban_data: BanUserRequest,
    request: Request,
    session: SessionDep,
    current_user: AdminUser,
):
    """Ban a user with a required reason."""

    result = service.ban_user(
        session,
        user_id,
        ban_data,
        current_user,
    )

    target_user = session.get(User, user_id)

    save_admin_audit_log(
        session=session,
        request=request,
        current_user=current_user,
        event_type="user_banned",
        description="Admin banned a user.",
        target_user=target_user,
    )

    return result


@router.patch(
    "/{user_id}/unban",
    response_model=AdminUserRead,
)
def unban_user(
    user_id: int,
    request: Request,
    session: SessionDep,
    current_user: AdminUser,
):
    """Remove a user's ban."""

    result = service.unban_user(
        session,
        user_id,
        current_user,
    )

    target_user = session.get(User, user_id)

    save_admin_audit_log(
        session=session,
        request=request,
        current_user=current_user,
        event_type="user_unbanned",
        description="Admin removed a user's ban.",
        target_user=target_user,
    )

    return result


@router.post("/{user_id}/sessions/revoke")
def revoke_user_sessions(
    user_id: int,
    request: Request,
    session: SessionDep,
    current_user: AdminUser,
):
    """Revoke all active refresh sessions belonging to a user."""

    result = service.revoke_user_sessions(
        session,
        user_id,
        current_user,
    )

    target_user = session.get(User, user_id)

    save_admin_audit_log(
        session=session,
        request=request,
        current_user=current_user,
        event_type="sessions_revoked",
        description="Admin revoked a user's active sessions.",
        target_user=target_user,
    )

    return result
