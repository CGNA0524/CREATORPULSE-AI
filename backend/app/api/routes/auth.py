from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import hash_password, verify_password, create_access_token
from backend.app.core.deps import get_current_user, get_current_organization
from backend.app.models.models import User, Organization, OrganizationMembership, AuditLog
from backend.app.schemas.all_schemas import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register(user_in: UserCreate, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create User
    user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.flush()

    # Create Workspace Organization
    org = Organization(
        name=f"{user.name}'s Organization",
        currency="INR",
        gross_margin_pct=40.0,
        created_at=datetime.utcnow()
    )
    db.add(org)
    db.flush()

    # Membership
    membership = OrganizationMembership(
        organization_id=org.id,
        user_id=user.id,
        role="owner"
    )
    db.add(membership)

    # Audit log
    db.add(AuditLog(
        organization_id=org.id,
        user_id=user.id,
        action="USER_REGISTERED",
        entity_type="USER",
        entity_id=str(user.id),
        details_json={"email": user.email}
    ))
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False  # Set True in production with HTTPS
    )

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        is_active=user.is_active,
        created_at=user.created_at,
        organization_id=org.id,
        organization_name=org.name,
        role="owner"
    )

    return Token(access_token=access_token, token_type="bearer", user=user_resp)


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive.")

    membership = db.query(OrganizationMembership).filter(OrganizationMembership.user_id == user.id).first()
    org_id = membership.organization_id if membership else None
    org_name = membership.organization.name if membership and membership.organization else None
    role = membership.role if membership else "admin"

    access_token = create_access_token(subject=user.id)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False
    )

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        is_active=user.is_active,
        created_at=user.created_at,
        organization_id=org_id,
        organization_name=org_name,
        role=role
    )

    return Token(access_token=access_token, token_type="bearer", user=user_resp)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    current_org: Organization = Depends(get_current_organization),
    db: Session = Depends(get_db)
):
    membership = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.user_id == current_user.id, OrganizationMembership.organization_id == current_org.id)
        .first()
    )
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        organization_id=current_org.id,
        organization_name=current_org.name,
        role=membership.role if membership else "member"
    )
