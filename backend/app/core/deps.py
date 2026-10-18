from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal, get_db
from backend.app.core.security import decode_access_token
from backend.app.models.models import User, Organization, OrganizationMembership

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = None
    if auth_header:
        token = auth_header.credentials
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        # Check if there is an existing user or fallback user for development/demo
        # To ensure tests and local exploration are smooth
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or have expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist or is inactive.",
        )
    return user


def get_current_organization(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Organization:
    membership = (
        db.query(OrganizationMembership)
        .filter(OrganizationMembership.user_id == user.id)
        .first()
    )
    if membership:
        org = db.query(Organization).filter(Organization.id == membership.organization_id).first()
        if org:
            return org

    # If user has no organization yet, auto-provision personal workspace
    org = Organization(name=f"{user.name}'s Workspace", currency="INR", gross_margin_pct=40.0)
    db.add(org)
    db.commit()
    db.refresh(org)

    new_membership = OrganizationMembership(
        organization_id=org.id,
        user_id=user.id,
        role="owner"
    )
    db.add(new_membership)
    db.commit()
    return org
