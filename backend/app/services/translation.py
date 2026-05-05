"""LLM Translation Service - Tích hợp với proxy qua OpenAI SDK."""
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from app.models import Setting
from app.services.security import validate_input, validate_output, SecurityError
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class TranslationService:
    """Service dịch slang GenZ sang tiếng Việt chuẩn."""
    
    def __init__(self, db: Session):
        self.db = db
        self.client: Optional[AsyncOpenAI] = None
        self._init_client()
    
    def _get_setting(self, key: str, default: str = "") -> str:
        """Lấy setting từ database."""
        setting = self.db.query(Setting).filter(Setting.key == key).first()
        return setting.value if setting else default
    
    def _init_client(self):
        """Khởi tạo OpenAI client với proxy settings."""
        base_url = self._get_setting("llm_base_url", "http://localhost:9000").rstrip("/")
        api_key = self._get_setting("llm_api_key", "")
        
        if not api_key:
            logger.warning("LLM API key chưa được cấu hình")
            return
        
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=f"{base_url}/v1",
            timeout=60.0,
        )
        logger.info(f"LLM client initialized with base_url: {base_url}")
    
    def refresh_client(self):
        """Refresh client khi settings thay đổi."""
        self._init_client()
    
    async def translate(self, text: str, ip_address: str = None) -> dict:
        """
        Dịch slang GenZ sang tiếng Việt chuẩn.
        
        Args:
            text: Slang cần dịch
            ip_address: IP của user (cho logging)
        
        Returns:
            {
                "translated": str,
                "model": str,
                "tokens": int
            }
        
        Raises:
            SecurityError: Nếu input không an toàn
            ValueError: Nếu LLM chưa được cấu hình
            Exception: Lỗi khác từ LLM
        """
        # 1. Validate input
        max_length = int(self._get_setting("max_input_length", "300"))
        clean_input = validate_input(text, max_length)
        
        # 2. Check client
        if not self.client:
            raise ValueError(
                "LLM chưa được cấu hình. Vui lòng liên hệ admin để cấu hình "
                "llm_base_url và llm_api_key trong settings."
            )
        
        # 3. Build prompt
        prompt_template = self._get_setting("translation_prompt")
        if not prompt_template:
            raise ValueError("Translation prompt chưa được cấu hình")
        
        full_prompt = prompt_template.replace("{user_input}", clean_input)
        
        # 4. Get model settings
        model = self._get_setting("llm_model", "claude-sonnet-4.6")
        max_tokens = int(self._get_setting("max_tokens", "300"))
        temperature = float(self._get_setting("temperature", "0.3"))
        
        logger.info(f"Translating with model={model}, input_len={len(clean_input)}")
        
        # 5. Call LLM
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": full_prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            
            raw_output = response.choices[0].message.content
            if not raw_output:
                raise ValueError("LLM trả về response rỗng")
            
            # 6. Validate output
            clean_output = validate_output(raw_output, clean_input)
            
            tokens_used = response.usage.total_tokens if response.usage else 0
            
            logger.info(
                f"Translation success: input_len={len(clean_input)}, "
                f"output_len={len(clean_output)}, tokens={tokens_used}"
            )
            
            return {
                "translated": clean_output,
                "model": model,
                "tokens": tokens_used,
            }
        
        except SecurityError:
            # Re-raise security errors
            raise
        
        except Exception as e:
            logger.error(f"LLM error: {type(e).__name__}: {e}")
            raise Exception(f"Lỗi khi gọi LLM: {str(e)}")
