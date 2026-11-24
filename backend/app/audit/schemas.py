
from datetime import datetime

from sqlmodel import SQLModel


class AuditLogRead(SQLModel):
    id: int
    actor_user_id: int | None = None
    actor_email: str | None = None
    target_user_id: int | None = None
    target_email: str | None = None
    event_type: str
    description: str
    ip_address: str | None = None
    user_agent: str | None = None
    outcome: str
    created_at: datetime


class AuditLogListResponse(SQLModel):
    items: list[AuditLogRead]
    total: int
    page: int
    page_size: int
    total_pages: int
