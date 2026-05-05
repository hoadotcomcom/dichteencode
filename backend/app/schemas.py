from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ============ Translation ============
class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class TranslateResponse(BaseModel):
    translated: str
    model: str
    tokens: int


# ============ Auth ============
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginChallengeResponse(BaseModel):
    challenge_id: str
    expires_in: int
    message: str


class VerifyOtpRequest(BaseModel):
    challenge_id: str = Field(..., min_length=16, max_length=128)
    code: str = Field(..., pattern=r"^\d{6}$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


# ============ Settings ============
class SettingItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    is_secret: bool = False
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SettingUpdate(BaseModel):
    value: str


class SettingsBulkUpdate(BaseModel):
    settings: dict[str, str]  # key -> value


# ============ Logs ============
class TranslationLogItem(BaseModel):
    id: int
    input_text: str
    output_text: Optional[str]
    model_used: Optional[str]
    tokens_used: Optional[int]
    success: bool
    error_message: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class LogsResponse(BaseModel):
    logs: List[TranslationLogItem]
    total: int
    page: int
    limit: int


class LogsStats(BaseModel):
    total_translations: int
    successful: int
    failed: int
    total_tokens: int
    unique_ips: int
    models_breakdown: dict[str, int]  # model_name -> count
    last_24h: int
    last_7d: int


# ============ Health ============
class HealthResponse(BaseModel):
    status: str
    database: str
    llm_proxy: str
