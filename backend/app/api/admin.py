"""Admin API endpoints - Settings & Logs."""
from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, distinct
from datetime import datetime, timedelta, timezone
from typing import Optional, Union
import hashlib
import secrets
from app.database import get_db
from app.schemas import (
    LoginRequest,
    LoginChallengeResponse,
    TokenResponse,
    VerifyOtpRequest,
    ChangePasswordRequest,
    SettingItem,
    SettingUpdate,
    SettingsBulkUpdate,
    LogsResponse,
    TranslationLogItem,
    LogsStats,
)
from app.models import Setting, TranslationLog, AdminUser, AdminLoginChallenge
from app.services.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.config import get_settings
from app.services.telegram import TelegramConfigError, send_admin_otp
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

def _extract_client_ip(request: Request) -> str:
    """Get client IP without trusting spoofable proxy headers by default."""
    peer_ip = request.client.host if request.client else "unknown"
    trusted_proxy_ips = {
        ip.strip()
        for ip in settings.trusted_proxy_ips.split(",")
        if ip.strip()
    }

    if peer_ip in trusted_proxy_ips:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()

    return peer_ip


def require_admin_ip(request: Request) -> None:
    allowed_ips = {
        ip.strip()
        for ip in settings.admin_allowed_ips.split(",")
        if ip.strip()
    }
    client_ip = _extract_client_ip(request)

    if client_ip not in allowed_ips:
        logger.warning("Blocked admin access from IP: %s", client_ip)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Ủa bạn ơi, khu này là phòng admin nhỏ xíu nên chỉ IP được mời mới vào được nha 🐣"
            ),
        )


def _hash_otp(code: str, challenge_id: str) -> str:
    payload = f"{code}:{challenge_id}:{settings.jwt_secret}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _get_setting_value(db: Session, key: str, default: str = "") -> str:
    setting = db.query(Setting).filter(Setting.key == key).first()
    return setting.value if setting and setting.value else default


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin_ip)],
)


def get_current_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> AdminUser:
    """Dependency: Verify JWT token và trả về admin user."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    
    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )
    
    token = parts[1]
    user = get_current_user(db, token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    
    return user


@router.post("/login", response_model=Union[LoginChallengeResponse, TokenResponse])
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Admin login step 1.

    Verifies username/password, sends Telegram OTP, returns challenge id.
    """
    user = authenticate_user(
        db,
        payload.username,
        payload.password,
        update_last_login=False,
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username hoặc password không đúng",
        )

    two_fa_enabled = _get_setting_value(db, "telegram_2fa_enabled", "false").lower() == "true"
    if not two_fa_enabled:
        user.last_login = _utc_now()
        db.commit()
        access_token = create_access_token(data={"sub": user.username})
        logger.info("Admin login without 2FA: %s", user.username)
        return TokenResponse(
            access_token=access_token,
            expires_in=settings.jwt_expire_minutes * 60,
        )

    client_ip = _extract_client_ip(request)
    code = f"{secrets.randbelow(1_000_000):06d}"
    challenge_id = secrets.token_urlsafe(32)
    expires_at = _utc_now() + timedelta(minutes=settings.admin_otp_expire_minutes)

    challenge = AdminLoginChallenge(
        username=user.username,
        challenge_id=challenge_id,
        code_hash=_hash_otp(code, challenge_id),
        ip_address=client_ip,
        expires_at=expires_at,
    )
    db.add(challenge)
    db.commit()

    telegram_bot_token = _get_setting_value(db, "telegram_bot_token")
    telegram_admin_chat_id = _get_setting_value(db, "telegram_admin_chat_id")

    try:
        send_admin_otp(
            code=code,
            username=user.username,
            ip_address=client_ip,
            bot_token=telegram_bot_token,
            chat_id=telegram_admin_chat_id,
        )
    except TelegramConfigError as exc:
        challenge.consumed = True
        db.commit()
        logger.error("Telegram 2FA config missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram 2FA chưa được cấu hình trong admin settings nên chưa cho vào admin được nha",
        )
    except Exception as exc:
        challenge.consumed = True
        db.commit()
        logger.error("Telegram OTP send failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không gửi được mã Telegram, thử lại sau xíu nha",
        )

    logger.info("Admin login OTP sent: %s", user.username)

    return LoginChallengeResponse(
        challenge_id=challenge_id,
        expires_in=settings.admin_otp_expire_minutes * 60,
        message="Mã 6 số đã được gửi qua Telegram rồi nha ✨",
    )


@router.post("/login/verify", response_model=TokenResponse)
def verify_login(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    """Admin login step 2: verify Telegram OTP and return JWT token."""
    challenge = (
        db.query(AdminLoginChallenge)
        .filter(AdminLoginChallenge.challenge_id == payload.challenge_id)
        .first()
    )

    if not challenge or challenge.consumed:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mã xác thực không hợp lệ hoặc đã dùng rồi nha",
        )

    if _as_utc(challenge.expires_at) < _utc_now():
        challenge.consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mã xác thực hết hạn rồi, login lại để lấy mã mới nha",
        )

    if challenge.attempts >= 5:
        challenge.consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Nhập sai hơi nhiều rồi đó, login lại để lấy mã mới nha",
        )

    challenge.attempts += 1
    if _hash_otp(payload.code, payload.challenge_id) != challenge.code_hash:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mã 6 số chưa đúng nha",
        )

    user = db.query(AdminUser).filter(AdminUser.username == challenge.username).first()
    if not user:
        challenge.consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin user không còn tồn tại",
        )

    challenge.consumed = True
    user.last_login = _utc_now()
    db.commit()

    access_token = create_access_token(data={"sub": user.username})
    logger.info("Admin login verified: %s", user.username)

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.jwt_expire_minutes * 60,
    )


@router.put("/password", response_model=dict)
def change_password(
    payload: ChangePasswordRequest,
    current_user: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Change current admin user's password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại chưa đúng nha",
        )

    if verify_password(payload.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới phải khác mật khẩu hiện tại nha",
        )

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    logger.info("Admin password changed: %s", current_user.username)

    return {"success": True, "message": "Đổi mật khẩu xong rồi nha ✨"}


@router.get("/settings", response_model=list[SettingItem])
def get_settings_list(
    current_user: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Lấy tất cả settings.
    
    Secret settings (is_secret=true) sẽ có value bị mask.
    """
    settings_list = db.query(Setting).all()
    
    result = []
    for setting in settings_list:
        item = SettingItem.model_validate(setting)
        # Mask secret values
        if setting.is_secret and setting.value:
            item.value = "***" + setting.value[-4:] if len(setting.value) > 4 else "***"
        result.append(item)
    
    return result


@router.put("/settings/{key}", response_model=SettingItem)
def update_setting(
    key: str,
    payload: SettingUpdate,
    current_user: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Cập nhật 1 setting.
    """
    setting = db.query(Setting).filter(Setting.key == key).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{key}' không tồn tại",
        )
    
    setting.value = payload.value
    db.commit()
    db.refresh(setting)
    
    logger.info(f"Setting updated: {key} by {current_user.username}")
    
    return SettingItem.model_validate(setting)


@router.put("/settings", response_model=dict)
def update_settings_bulk(
    payload: SettingsBulkUpdate,
    current_user: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Cập nhật nhiều settings cùng lúc.
    
    Body: { "settings": { "key1": "value1", "key2": "value2" } }
    """
    updated = []
    errors = []
    
    for key, value in payload.settings.items():
        setting = db.query(Setting).filter(Setting.key == key).first()
        
        if not setting:
            errors.append(f"Setting '{key}' không tồn tại")
            continue
        
        setting.value = value
        updated.append(key)
    
    db.commit()
    
    logger.info(f"Bulk settings update: {updated} by {current_user.username}")
    
    return {
        "success": True,
        "updated": updated,
        "errors": errors,
    }


@router.get("/logs", response_model=LogsResponse)
def get_logs(
    page: int = 1,
    limit: int = 50,
    success: Optional[bool] = None,
    search: Optional[str] = None,
    model: Optional[str] = None,
    current_user: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Lấy translation logs.
    
    - **page**: Trang (bắt đầu từ 1)
    - **limit**: Số logs mỗi trang (max 100)
    - **success**: Filter theo success status (true/false/null)
    - **search**: Tìm trong input/output text
    - **model**: Filter theo model_used
    """
    if limit > 100:
        limit = 100
    
    query = db.query(TranslationLog)
    
    if success is not None:
        query = query.filter(TranslationLog.success == success)
    
    if model:
        query = query.filter(TranslationLog.model_used == model)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (TranslationLog.input_text.ilike(search_pattern))
            | (TranslationLog.output_text.ilike(search_pattern))
        )
    
    total = query.count()
    
    logs = (
        query.order_by(desc(TranslationLog.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    
    return LogsResponse(
        logs=[TranslationLogItem.model_validate(log) for log in logs],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/logs/stats", response_model=LogsStats)
def get_logs_stats(
    current_user: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Thống kê tổng quan translation logs."""
    total = db.query(TranslationLog).count()
    successful = db.query(TranslationLog).filter(TranslationLog.success == True).count()
    failed = total - successful
    
    total_tokens = (
        db.query(func.coalesce(func.sum(TranslationLog.tokens_used), 0))
        .filter(TranslationLog.success == True)
        .scalar()
    ) or 0
    
    unique_ips = (
        db.query(func.count(distinct(TranslationLog.ip_address)))
        .scalar()
    ) or 0
    
    # Models breakdown
    models_query = (
        db.query(TranslationLog.model_used, func.count(TranslationLog.id))
        .filter(TranslationLog.model_used.isnot(None))
        .group_by(TranslationLog.model_used)
        .all()
    )
    models_breakdown = {model: count for model, count in models_query}
    
    # Time-based stats
    now = datetime.utcnow()
    last_24h = (
        db.query(TranslationLog)
        .filter(TranslationLog.created_at >= now - timedelta(hours=24))
        .count()
    )
    last_7d = (
        db.query(TranslationLog)
        .filter(TranslationLog.created_at >= now - timedelta(days=7))
        .count()
    )
    
    return LogsStats(
        total_translations=total,
        successful=successful,
        failed=failed,
        total_tokens=int(total_tokens),
        unique_ips=int(unique_ips),
        models_breakdown=models_breakdown,
        last_24h=last_24h,
        last_7d=last_7d,
    )
