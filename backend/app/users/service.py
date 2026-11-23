
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, col, func, select

from app.auth.models import RefreshSession, User, utc_now
from app.auth.schemas import (
    AdminUserRead,
    BanUserRequest,
    BulkUserAction,
    DashboardStatsRead,
    UserDetailGroupRead,
    UserDetailLoanRead,
    UserDetailSessionRead,
    UserDetailsRead,
    UserRoleUpdate,
)
from app.books.models import Book
from app.groups.models import Group, GroupMembership
from app.loans.models import Loan


def _get_target_user(session: Session, user_id: int) -> User:
    """Find a user or return a 404 error."""

    user = session.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


def _prevent_admin_target(
    user: User,
    current_user: User,
    action: str,
) -> None:
    """Prevent admins from applying restricted actions to themselves or other admins."""

    if current_user.id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You cannot {action} your own account.",
        )

    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You cannot {action} another admin.",
        )


def _revoke_user_sessions(
    session: Session,
    user_id: int,
) -> int:
    """Revoke all currently active refresh sessions belonging to a user."""

    now = utc_now()

    sessions = session.exec(
        select(RefreshSession).where(
            RefreshSession.user_id == user_id,
            col(RefreshSession.revoked_at).is_(None),
        )
    ).all()

    revoked_count = 0

    for refresh_session in sessions:
        refresh_session.revoked_at = now
        session.add(refresh_session)
        revoked_count += 1

    return revoked_count


def get_all_users(session: Session) -> list[AdminUserRead]:
    """Return all users for the admin user-management page."""

    statement = select(User).order_by(col(User.id))
    users = session.exec(statement).all()

    return [
        AdminUserRead.model_validate(user)
        for user in users
    ]


def get_dashboard_stats(session: Session) -> DashboardStatsRead:
    """Return database statistics for the admin dashboard."""

    total_users = session.exec(
        select(func.count()).select_from(User)
    ).one()

    active_users = session.exec(
        select(func.count())
        .select_from(User)
        .where(
            col(User.is_active).is_(True),
            col(User.is_banned).is_(False),
        )
    ).one()

    banned_users = session.exec(
        select(func.count())
        .select_from(User)
        .where(col(User.is_banned).is_(True))
    ).one()

    total_books = session.exec(
        select(func.count()).select_from(Book)
    ).one()

    total_groups = session.exec(
        select(func.count()).select_from(Group)
    ).one()

    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    new_users_last_7_days = session.exec(
        select(func.count())
        .select_from(User)
        .where(User.created_at >= seven_days_ago)
    ).one()

    return DashboardStatsRead(
        total_users=total_users,
        active_users=active_users,
        banned_users=banned_users,
        total_books=total_books,
        total_groups=total_groups,
        new_users_last_7_days=new_users_last_7_days,
    )


def get_user_details(
    session: Session,
    user_id: int,
) -> UserDetailsRead:
    """Return detailed information about a user for admins."""

    user = _get_target_user(session, user_id)

    if user.id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid user record.",
        )

    loan_statement = (
        select(Loan, Book)
        .join(Book)
        .where(Loan.user_id == user_id)
        .order_by(col(Loan.requested_at).desc())
    )

    loan_rows = session.exec(loan_statement).all()

    loans = []

    for loan, book in loan_rows:
        if loan.id is None or loan.book_id is None:
            continue

        loans.append(
            UserDetailLoanRead(
                id=loan.id,
                book_id=loan.book_id,
                book_title=book.title,
                book_author=book.author,
                book_isbn=book.isbn,
                status=loan.status,
                requested_at=loan.requested_at,
                returned_at=loan.returned_at,
            )
        )

    owned_groups = session.exec(
        select(Group)
        .where(Group.owner_id == user_id)
        .order_by(col(Group.created_at).desc())
    ).all()

    group_details: dict[int, UserDetailGroupRead] = {}

    for group in owned_groups:
        if group.id is None or group.owner_id is None:
            continue

        group_details[group.id] = UserDetailGroupRead(
            id=group.id,
            name=group.name,
            description=group.description,
            owner_id=group.owner_id,
            created_at=group.created_at,
            membership_role="Owner",
        )

    membership_statement = (
        select(Group, GroupMembership)
        .join(GroupMembership)
        .where(GroupMembership.user_id == user_id)
    )

    membership_rows = session.exec(membership_statement).all()

    for group, membership in membership_rows:
        if group.id is None or group.owner_id is None:
            continue

        if group.id not in group_details:
            group_details[group.id] = UserDetailGroupRead(
                id=group.id,
                name=group.name,
                description=group.description,
                owner_id=group.owner_id,
                created_at=group.created_at,
                membership_role="Member",
            )

    groups = sorted(
        group_details.values(),
        key=lambda group: group.created_at,
        reverse=True,
    )

    current_time = datetime.now(timezone.utc)

    session_statement = (
        select(RefreshSession)
        .where(
            RefreshSession.user_id == user_id,
            col(RefreshSession.revoked_at).is_(None),
            RefreshSession.expires_at > current_time,
        )
        .order_by(col(RefreshSession.created_at).desc())
    )

    session_rows = session.exec(session_statement).all()

    active_sessions = []

    for item in session_rows:
        if item.id is None:
            continue

        active_sessions.append(
            UserDetailSessionRead(
                id=item.id,
                created_at=item.created_at,
                expires_at=item.expires_at,
                last_used_at=item.last_used_at,
            )
        )

    return UserDetailsRead(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        is_banned=user.is_banned,
        ban_reason=user.ban_reason,
        created_at=user.created_at,
        loans=loans,
        groups=groups,
        active_sessions=active_sessions,
    )


def update_user_role(
    session: Session,
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: User,
) -> AdminUserRead:
    """Update a user's role. Admins cannot change their own role or another admin's role."""

    user = _get_target_user(session, user_id)

    _prevent_admin_target(
        user,
        current_user,
        "change the role of",
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
    """Deactivate a user without banning them."""

    user = _get_target_user(session, user_id)

    _prevent_admin_target(
        user,
        current_user,
        "deactivate",
    )

    user.is_active = False

    try:
        _revoke_user_sessions(session, user_id)
        session.add(user)
        session.commit()
        session.refresh(user)
    except Exception:
        session.rollback()
        raise

    return AdminUserRead.model_validate(user)


def activate_user(
    session: Session,
    user_id: int,
    current_user: User,
) -> AdminUserRead:
    """Reactivate a deactivated user without changing ban status."""

    user = _get_target_user(session, user_id)

    _prevent_admin_target(
        user,
        current_user,
        "activate",
    )

    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user is banned. Unban the user first.",
        )

    user.is_active = True

    session.add(user)
    session.commit()
    session.refresh(user)

    return AdminUserRead.model_validate(user)


def ban_user(
    session: Session,
    user_id: int,
    ban_data: BanUserRequest,
    current_user: User,
) -> AdminUserRead:
    """Ban a user, save the reason, and revoke their refresh sessions."""

    user = _get_target_user(session, user_id)

    _prevent_admin_target(
        user,
        current_user,
        "ban",
    )

    reason = ban_data.reason.strip()

    if not reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A reason is required to ban a user.",
        )

    user.is_banned = True
    user.ban_reason = reason

    try:
        _revoke_user_sessions(session, user_id)
        session.add(user)
        session.commit()
        session.refresh(user)
    except Exception:
        session.rollback()
        raise

    return AdminUserRead.model_validate(user)


def unban_user(
    session: Session,
    user_id: int,
    current_user: User,
) -> AdminUserRead:
    """Remove a user's ban without changing their activation status."""

    user = _get_target_user(session, user_id)

    _prevent_admin_target(
        user,
        current_user,
        "unban",
    )

    user.is_banned = False
    user.ban_reason = None

    session.add(user)
    session.commit()
    session.refresh(user)

    return AdminUserRead.model_validate(user)


def bulk_user_action(
    session: Session,
    action_data: BulkUserAction,
    current_user: User,
) -> dict:
    """Perform ban or unban on multiple users in one transaction."""

    user_ids = list(dict.fromkeys(action_data.user_ids))

    if not user_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select at least one user.",
        )

    reason = None

    if action_data.action == "ban":
        reason = (action_data.reason or "").strip()

        if not reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A reason is required to ban users.",
            )

    users = session.exec(
        select(User).where(col(User.id).in_(user_ids))
    ).all()

    found_ids = {
        user.id
        for user in users
        if user.id is not None
    }

    if len(found_ids) != len(user_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more selected users were not found.",
        )

    # Validate every user before making any changes.
    for user in users:
        if user.id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid user record.",
            )

        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot perform this action on your own account.",
            )

        if user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bulk actions cannot be performed on admin accounts.",
            )

    changed_count = 0
    revoked_count = 0

    try:
        for user in users:
            if user.id is None:
                continue

            if (
                action_data.action == "ban"
                and (not user.is_banned or user.ban_reason != reason)
            ):
                user.is_banned = True
                user.ban_reason = reason

                revoked_count += _revoke_user_sessions(
                    session,
                    user.id,
                )

                changed_count += 1

            elif action_data.action == "unban" and user.is_banned:
                user.is_banned = False
                user.ban_reason = None
                changed_count += 1

            session.add(user)

        session.commit()

    except Exception:
        session.rollback()
        raise

    return {
        "message": f"Bulk {action_data.action} completed.",
        "action": action_data.action,
        "requested_count": len(user_ids),
        "changed_count": changed_count,
        "revoked_sessions": revoked_count,
    }


def revoke_user_sessions(
    session: Session,
    user_id: int,
    current_user: User,
) -> dict:
    """Allow an admin to revoke all refresh sessions for a user."""

    user = _get_target_user(session, user_id)

    _prevent_admin_target(
        user,
        current_user,
        "revoke sessions for",
    )

    try:
        revoked_count = _revoke_user_sessions(
            session,
            user_id,
        )
        session.commit()
    except Exception:
        session.rollback()
        raise

    return {
        "message": "User sessions revoked successfully.",
        "user_id": user_id,
        "revoked_count": revoked_count,
    }
