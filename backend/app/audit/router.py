
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlmodel import col, func, select

from app.audit.models import AuditLog
from app.audit.schemas import AuditLogListResponse, AuditLogRead
from app.auth.models import User
from app.auth.permissions import require_roles
from app.database import SessionDep

router = APIRouter(
    prefix="/api/audit",
    tags=["Audit Logs"],
)


AdminUser = Annotated[
    User,
    Depends(require_roles("admin")),
]


@router.get("/", response_model=AuditLogListResponse)
def get_audit_logs(
    session: SessionDep,
    current_user: AdminUser,
    q: str | None = Query(default=None, max_length=100),
    event_type: str | None = Query(default=None, max_length=50),
    user_id: int | None = Query(default=None, ge=1),
    outcome: str | None = Query(
        default=None,
        pattern="^(success|failure)$",
    ),
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """Return searchable and filterable audit logs for admins."""

    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be later than end date.",
        )

    filters = []

    # Search across user emails, event type, description and IP.
    if q and q.strip():
        search = f"%{q.strip()}%"

        filters.append(
            or_(
                col(AuditLog.actor_email).ilike(search),
                col(AuditLog.target_email).ilike(search),
                col(AuditLog.event_type).ilike(search),
                col(AuditLog.description).ilike(search),
                col(AuditLog.ip_address).ilike(search),
            )
        )

    if event_type:
        filters.append(
            AuditLog.event_type == event_type
        )

    if user_id is not None:
        filters.append(
            or_(
                col(AuditLog.actor_user_id) == user_id,
                col(AuditLog.target_user_id) == user_id,
            )
        )

    if outcome:
        filters.append(
            AuditLog.outcome == outcome
        )

    if start_date:
        filters.append(
            AuditLog.created_at >= start_date
        )

    if end_date:
        filters.append(
            AuditLog.created_at <= end_date
        )

    count_statement = (
        select(func.count())
        .select_from(AuditLog)
    )

    logs_statement = (
        select(AuditLog)
        .order_by(col(AuditLog.created_at).desc())
    )

    if filters:
        count_statement = count_statement.where(*filters)
        logs_statement = logs_statement.where(*filters)

    total = session.exec(count_statement).one()

    logs = session.exec(
        logs_statement
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    total_pages = (total + page_size - 1) // page_size

    return AuditLogListResponse(
        items=[
            AuditLogRead.model_validate(log)
            for log in logs
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
