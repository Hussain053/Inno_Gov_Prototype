from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import (
    require_admin,
    require_evaluator,
    require_government,
    require_startup,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import (
    EvaluatorRegister,
    GovernmentRegister,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.verification import (
    EvaluatorVerificationService,
    GovernmentVerificationService,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new startup user.
    - Public registration creates STARTUP users ONLY.
    - Check for duplicate normalized email (returns 409 Conflict).
    - Hash password securely using direct bcrypt.
    - Never store or return plaintext passwords.
    """
    normalized_email = user_in.email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    hashed_pwd = hash_password(user_in.password)

    new_user = User(
        name=user_in.name,
        email=normalized_email,
        password_hash=hashed_pwd,
        role=UserRole.STARTUP,
        organization=user_in.organization,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post(
    "/register/government",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_government(
    gov_in: GovernmentRegister,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a government user through verification service.
    - Validates Government Service ID via GovernmentVerificationService.
    - Creates GOVERNMENT role upon successful verification.
    """
    is_verified = GovernmentVerificationService.verify_government_id(
        government_service_id=gov_in.government_service_id,
        email=gov_in.email,
    )
    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Government Service ID verification failed",
        )

    normalized_email = gov_in.email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    hashed_pwd = hash_password(gov_in.password)
    org_name = f"{gov_in.organization} ({gov_in.department})" if gov_in.department else gov_in.organization

    new_user = User(
        name=gov_in.name,
        email=normalized_email,
        password_hash=hashed_pwd,
        role=UserRole.GOVERNMENT,
        organization=org_name,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post(
    "/register/evaluator",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_evaluator(
    eval_in: EvaluatorRegister,
    db: AsyncSession = Depends(get_db),
):
    """
    Register an evaluator user through verification service.
    - Validates Evaluator Verification ID via EvaluatorVerificationService.
    - Creates EVALUATOR role upon successful verification.
    """
    is_verified = EvaluatorVerificationService.verify_evaluator_id(
        evaluator_service_id=eval_in.evaluator_service_id,
        email=eval_in.email,
    )
    if not is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Evaluator Verification ID is invalid or failed verification",
        )

    normalized_email = eval_in.email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    hashed_pwd = hash_password(eval_in.password)

    new_user = User(
        name=eval_in.name,
        email=normalized_email,
        password_hash=hashed_pwd,
        role=UserRole.EVALUATOR,
        organization=eval_in.organization,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=Token,
)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user with normalized email and password.
    - Find user by normalized email.
    - Verify password using security.verify_password().
    - Generate JWT token containing user ID ('sub') and role.
    - Return access_token and token_type='bearer'.
    """
    normalized_email = credentials.email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)

    access_token = create_access_token(
        user_id=user.id,
        role=role_str,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user profile.
    Uses dependencies.get_current_user to validate JWT token.
    """
    return current_user


# RBAC test verification endpoints
@router.get(
    "/admin-only",
    response_model=UserResponse,
)
async def admin_only_test(
    current_user: User = Depends(require_admin),
):
    return current_user


@router.get(
    "/government-only",
    response_model=UserResponse,
)
async def government_only_test(
    current_user: User = Depends(require_government),
):
    return current_user


@router.get(
    "/evaluator-only",
    response_model=UserResponse,
)
async def evaluator_only_test(
    current_user: User = Depends(require_evaluator),
):
    return current_user


@router.get(
    "/startup-only",
    response_model=UserResponse,
)
async def startup_only_test(
    current_user: User = Depends(require_startup),
):
    return current_user
