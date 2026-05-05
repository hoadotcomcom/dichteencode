"""JWT Authentication Service."""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models import AdminUser
from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        return None


def authenticate_user(
    db: Session,
    username: str,
    password: str,
    update_last_login: bool = True,
) -> Optional[AdminUser]:
    """Authenticate admin user."""
    user = db.query(AdminUser).filter(AdminUser.username == username).first()
    
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    if update_last_login:
        user.last_login = datetime.utcnow()
        db.commit()
    
    return user


def get_current_user(db: Session, token: str) -> Optional[AdminUser]:
    """Get current user from JWT token."""
    payload = decode_access_token(token)
    
    if not payload:
        return None
    
    username: str = payload.get("sub")
    if not username:
        return None
    
    user = db.query(AdminUser).filter(AdminUser.username == username).first()
    return user
