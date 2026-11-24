
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(SQLModel, table=True):
    """Store important user and administrative activities."""

    id: int | None = Field(default=None, primary_key=True)

    actor_user_id: int | None = Field(default=None, index=True)
    actor_email: str | None = Field(default=None, max_length=255)

    target_user_id: int | None = Field(default=None, index=True)
    target_email: str | None = Field(default=None, max_length=255)

    event_type: str = Field(max_length=50, index=True)
    description: str = Field(max_length=500)

    ip_address: str | None = Field(default=None, max_length=45)
    user_agent: str | None = Field(default=None, max_length=500)

    outcome: str = Field(default="success", max_length=20, index=True)

    created_at: datetime = Field(
        default_factory=utc_now,
        index=True,
    )
