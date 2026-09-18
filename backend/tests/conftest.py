import os
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.main import app
from app.core.dependencies import get_db
from app.core.security import create_access_token, hash_password
from app.models.startup import StartupProfile
from app.models.user import User, UserRole

# Isolated SQLite in-memory database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=engine_test,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


from sqlalchemy import select

@pytest.fixture
def create_test_token():
    async def _token(user_id: int = None, role: str = None, data: dict = None, email: str = None):
        if data is not None:
            user_id = int(data.get("sub", 1))
            role = data.get("role", "STARTUP")
        if user_id is None:
            user_id = 1
        if role is None:
            role = "STARTUP"

        async with TestingSessionLocal() as session:
            result = await session.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                user_role = UserRole(role) if isinstance(role, str) else role
                user_email = email or f"testuser_{user_id}_{role.lower()}@example.com"
                user = User(
                    id=user_id,
                    name=f"Test User {user_id}",
                    email=user_email,
                    password_hash=hash_password("Password123!"),
                    role=user_role,
                    organization="SolarTech Innovations" if user_role == UserRole.STARTUP else None,
                    is_active=True,
                )
                session.add(user)
                await session.commit()

                if user_role == UserRole.STARTUP:
                    profile = StartupProfile(
                        user_id=user.id,
                        company_name="SolarTech Innovations",
                        description="Test startup profile for regression coverage.",
                        industry="Waste Management",
                        location="Bengaluru",
                        team_size=5,
                        experience="Delivered AI and IoT solutions for smart city services.",
                    )
                    session.add(profile)
                    await session.commit()
            elif role and user.role != (UserRole(role) if isinstance(role, str) else role):
                user.role = UserRole(role) if isinstance(role, str) else role
                await session.commit()

        return create_access_token(user_id=user_id, role=role)
    return _token
