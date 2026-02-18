from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text 
from .config import settings

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
    """Checks database connection and creates tables if they don't exist."""
    try:
        async with engine.begin() as conn:
            # 1. Test the connection
            await conn.execute(text("SELECT 1"))
            
            # 2. Create tables (Useful if not using Alembic migrations yet)
            await conn.run_sync(Base.metadata.create_all)
            
            print("✅ Database (PostgreSQL): Connected")
            return True
    except Exception as e:
        print(f"❌ Database (PostgreSQL): Connection Failed - {e}")
        return False

async def get_db():
    """Dependency for FastAPI routes"""
    async with AsyncSessionLocal() as session:
        yield session