"""Translation API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import TranslateRequest, TranslateResponse
from app.services.translation import TranslationService
from app.services.security import SecurityError
from app.models import TranslationLog
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["translation"])


def get_client_ip(request: Request) -> str:
    """Lấy IP của client (xử lý X-Forwarded-For)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/translate", response_model=TranslateResponse)
async def translate(
    payload: TranslateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Dịch slang/ngôn ngữ GenZ sang tiếng Việt chuẩn.
    
    - **text**: Tin nhắn slang cần dịch (1-500 ký tự)
    
    Returns:
    - **translated**: Câu đã dịch
    - **model**: Model AI đã sử dụng
    - **tokens**: Số tokens đã dùng
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("User-Agent", "")
    
    service = TranslationService(db)
    
    log_entry = TranslationLog(
        input_text=payload.text,
        ip_address=ip_address,
        user_agent=user_agent,
        success=False,
    )
    
    try:
        result = await service.translate(payload.text, ip_address)
        
        # Log success
        log_entry.output_text = result["translated"]
        log_entry.model_used = result["model"]
        log_entry.tokens_used = result["tokens"]
        log_entry.success = True
        db.add(log_entry)
        db.commit()
        
        return TranslateResponse(**result)
    
    except SecurityError as e:
        log_entry.error_message = f"SecurityError: {str(e)}"
        db.add(log_entry)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
    except ValueError as e:
        log_entry.error_message = f"ValueError: {str(e)}"
        db.add(log_entry)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    
    except Exception as e:
        log_entry.error_message = f"{type(e).__name__}: {str(e)}"
        db.add(log_entry)
        db.commit()
        
        logger.error(f"Translation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Có lỗi xảy ra khi dịch. Vui lòng thử lại sau.",
        )
