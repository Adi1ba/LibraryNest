
from fastapi import Request
from sqlmodel import Session

from app.audit.models import AuditLog
from app.auth.models import User


def get_request_details(request: Request) -> tuple[str | None, str | None]:
    """Extract client IP and browser information from a request."""

    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else None

    user_agent = request.headers.get("user-agent")

    return ip_address, user_agent


def create_audit_log(
    session: Session,
    request: Request,
    event_type: str,
    description: str,
    actor: User | None = None,
    target_user: User | None = None,
    outcome: str = "success",
    actor_email: str | None = None,
) -> AuditLog:
    """Create an audit log record without committing the transaction."""

    ip_address, user_agent = get_request_details(request)

    audit_log = AuditLog(
        actor_user_id=actor.id if actor else None,
        actor_email=actor.email if actor else actor_email,
        target_user_id=target_user.id if target_user else None,
        target_email=target_user.email if target_user else None,
        event_type=event_type,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent,
        outcome=outcome,
    )

    session.add(audit_log)

    return audit_log
