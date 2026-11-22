
from logging.config import fileConfig

from sqlmodel import SQLModel

from alembic import context
from app.auth.models import User  # noqa: F401
from app.books.models import Book  # noqa: F401
from app.database import engine
from app.groups import models as group_models  # noqa: F401
from app.loans.models import Loan  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Register all SQLModel tables for Alembic autogeneration.
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Run migrations without creating a database connection."""

    context.configure(
        url=str(engine.url),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations using the application's database engine."""

    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
