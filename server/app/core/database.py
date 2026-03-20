import logging

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from .config import settings

logger = logging.getLogger("app.core.database")

engine = create_async_engine(
    settings.database_url,
    # echo=True, 
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)

Base = declarative_base()

async def check_db_connection():
    """Checks database connection. Schema is managed by Alembic."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            logger.info("Database (PostgreSQL): Connected")
            return True
    except Exception as e:
        logger.error("Database (PostgreSQL): Connection Failed - %s", e)
        return False

async def get_db():
    """Dependency for FastAPI routes"""
    async with AsyncSessionLocal() as session:
        yield session