"""
Alembic async migration environment.

Reads the database URL from `app.core.config.settings` instead of alembic.ini
so we have a single source of truth.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ── App imports ──────────────────────────────────────────────────────────────
# 1. Import Base so Alembic knows the target schema
from app.core.database import Base

# 2. Import ALL models so their tables register on Base.metadata
import app.modules  # noqa: F401  (side-effect import)

# ── Alembic Config ───────────────────────────────────────────────────────────
config = context.config

# Inject the real database URL from our Settings (overrides whatever is in
# alembic.ini, making the .ini value a harmless placeholder)
from app.core.config import settings

url = str(settings.async_database_url).replace("%", "%%")
config.set_main_option("sqlalchemy.url", url)

# Standard Python-logging setup from the ini file
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is what Alembic uses for autogenerate diff
target_metadata = Base.metadata


# ── Offline mode ─────────────────────────────────────────────────────────────
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generate SQL without a DB conn)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online mode ──────────────────────────────────────────────────────────────
def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations through it."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
