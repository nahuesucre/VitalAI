from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Create all tables. Call on startup."""
    from app.db.base import Base
    # Import all models so they register with Base
    from app.models import user, study, patient, alert  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
