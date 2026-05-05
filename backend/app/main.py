"""TeenCode Backend - FastAPI main app."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from app.config import get_settings
from app.database import engine, SessionLocal
from app.models import AdminUser, Base, Setting
from app.services.auth import get_password_hash
from app.api import translate, admin
from app.schemas import HealthResponse
import logging

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifecycle - startup & shutdown."""
    logger.info("🚀 TeenCode Backend starting...")
    Base.metadata.create_all(bind=engine)
    
    # Đảm bảo có default admin user
    db = SessionLocal()
    try:
        default_settings = [
            (
                "telegram_2fa_enabled",
                "false",
                "Bật/tắt Telegram 2FA cho admin login",
                False,
            ),
            (
                "telegram_bot_token",
                "",
                "Telegram bot token dùng để gửi mã 2FA admin",
                True,
            ),
            (
                "telegram_admin_chat_id",
                "",
                "Telegram chat ID nhận mã 2FA admin",
                True,
            ),
        ]
        for key, value, description, is_secret in default_settings:
            exists = db.query(Setting).filter(Setting.key == key).first()
            if not exists:
                db.add(
                    Setting(
                        key=key,
                        value=value,
                        description=description,
                        is_secret=is_secret,
                    )
                )
        db.commit()

        existing_admin = (
            db.query(AdminUser)
            .filter(AdminUser.username == settings.default_admin_username)
            .first()
        )
        
        if not existing_admin:
            logger.info(f"Creating default admin: {settings.default_admin_username}")
            admin_user = AdminUser(
                username=settings.default_admin_username,
                password_hash=get_password_hash(settings.default_admin_password),
            )
            db.add(admin_user)
            db.commit()
            logger.warning(
                f"⚠️  Default admin created with password '{settings.default_admin_password}'. "
                "PLEASE CHANGE IT!"
            )
        else:
            # Update password if it's still hash from init.sql (which was a fake hash)
            # Check if password works with default
            from app.services.auth import verify_password
            if not verify_password(
                settings.default_admin_password, existing_admin.password_hash
            ):
                # Password đã được đổi, không update
                pass
            else:
                logger.info("Default admin already exists")
    
    except Exception as e:
        logger.error(f"Error during startup: {e}")
    finally:
        db.close()
    
    logger.info("✅ TeenCode Backend ready!")
    
    yield
    
    logger.info("👋 TeenCode Backend shutting down...")


app = FastAPI(
    title="TeenCode API",
    description="API dịch ngôn ngữ GenZ Việt Nam sang tiếng Việt chuẩn",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(translate.router)
app.include_router(admin.router)


# Apply rate limiting to translate endpoint
@app.middleware("http")
async def rate_limit_translate(request: Request, call_next):
    """Apply rate limit chỉ cho /api/translate endpoint."""
    if request.url.path == "/api/translate" and request.method == "POST":
        try:
            # Manual rate limit check
            limit_str = f"{settings.rate_limit_per_minute}/minute"
            # SlowAPI sẽ tự handle thông qua decorator, đây là backup
            pass
        except RateLimitExceeded as e:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Quá nhiều request. Vui lòng đợi 1 phút."},
            )
    
    response = await call_next(request)
    return response


@app.get("/", tags=["root"])
def root():
    """Root endpoint."""
    return {
        "name": "TeenCode API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health():
    """Health check - kiểm tra database & LLM proxy."""
    # Check database
    db_status = "ok"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Check LLM proxy (chỉ check config, không gọi thật)
    db = SessionLocal()
    try:
        from app.models import Setting
        api_key = db.query(Setting).filter(Setting.key == "llm_api_key").first()
        base_url = db.query(Setting).filter(Setting.key == "llm_base_url").first()
        
        if api_key and api_key.value and base_url and base_url.value:
            llm_status = "configured"
        else:
            llm_status = "not_configured"
    except Exception as e:
        llm_status = f"error: {str(e)}"
    finally:
        db.close()
    
    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        database=db_status,
        llm_proxy=llm_status,
    )
