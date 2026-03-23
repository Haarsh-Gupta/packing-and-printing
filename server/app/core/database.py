import logging

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

logger = logging.getLogger("app.core.database")

engine = create_async_engine(
    settings.async_database_url,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,
    # echo=True, 
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
)

Base = declarative_base()

from app.core.colors import color_print, GREEN, RED

async def check_db_connection():
    """Checks database connection. Schema is managed by Alembic."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            color_print("Database (PostgreSQL): Connected", GREEN)
            return True
    except Exception as e:
        color_print(f"Database (PostgreSQL): Connection Failed - {e}", RED)
        return False

async def get_db():
    """Dependency for FastAPI routes"""
    async with AsyncSessionLocal() as session:
        yield session