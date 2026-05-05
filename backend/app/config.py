import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+psycopg://teencode:teencode_secret@localhost:5434/teencode_db"
    
    # LLM Proxy
    llm_base_url: str = "http://localhost:9000"
    llm_api_key: str = ""
    llm_model: str = "claude-sonnet-4.6"
    
    # Security
    jwt_secret: str = "your-super-secret-jwt-key-change-this"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours
    
    # API
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    # Rate Limiting
    rate_limit_per_minute: int = 20
    max_input_length: int = 300
    
    # Admin
    default_admin_username: str = "admin"
    default_admin_password: str = "admin123"
    admin_allowed_ips: str = "139.60.163.130,127.0.0.1"
    trusted_proxy_ips: str = ""
    admin_otp_expire_minutes: int = 5
    
    class Config:
        env_file = str(ROOT_ENV)
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
