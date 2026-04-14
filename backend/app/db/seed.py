"""Seed script — run with: python -m app.db.seed"""
import asyncio
from sqlalchemy import select
from app.db.session import async_session
from app.models.user import User, Role
from app.core.security import hash_password


async def seed():
    async with async_session() as db:
        # Check if roles exist
        result = await db.execute(select(Role))
        if not result.scalars().first():
            db.add_all([
                Role(id=1, name="admin", description="System administrator"),
                Role(id=2, name="coordinator", description="Study coordinator"),
                Role(id=3, name="physician", description="Physician / Investigator"),
            ])
            await db.flush()
            print("Roles created.")

        # Check if demo users exist
        result = await db.execute(select(User).where(User.email == "admin@vitalai.ai"))
        if not result.scalar_one_or_none():
            users = [
                User(
                    email="admin@vitalai.ai",
                    password_hash=hash_password("password123"),
                    full_name="Admin VitalAI",
                    role_id=1,
                ),
                User(
                    email="coordinator@vitalai.ai",
                    password_hash=hash_password("password123"),
                    full_name="María Coordinadora",
                    role_id=2,
                ),
                User(
                    email="doctor@vitalai.ai",
                    password_hash=hash_password("password123"),
                    full_name="Dr. Carlos Investigador",
                    role_id=3,
                ),
            ]
            db.add_all(users)
            await db.flush()
            print("Demo users created.")
        else:
            print("Demo users already exist.")

        await db.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
