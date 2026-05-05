"""Security service - Prompt injection protection & input/output validation."""
import re
from typing import Optional


# Patterns cố gắng override instruction
INJECTION_PATTERNS = [
    # English
    r"ignore\s+(previous|above|all|prior)\s+(instructions?|prompts?|rules?)",
    r"disregard\s+(previous|above|all|prior)",
    r"forget\s+(everything|all|previous|prior)",
    r"you\s+are\s+now\s+",
    r"new\s+(instructions?|rules?|task)\s*:",
    r"system\s*[:：]\s*",
    r"</?(system|assistant|user|instruction)>",
    r"<\|.*?\|>",
    r"\[INST\]|\[/INST\]",
    r"###\s*(Instruction|System|New)",
    r"```\s*(system|prompt|instruction)",
    r"act\s+as\s+(a|an)\s+",
    r"pretend\s+(to\s+be|you)",
    r"role\s*[:：]\s*(system|admin)",
    
    # Vietnamese
    r"bỏ\s+qua\s+(hướng dẫn|chỉ thị|lệnh|prompt)",
    r"quên\s+(hết|mọi|tất cả|đi)",
    r"bạn\s+(bây giờ|giờ|hiện tại)\s+là",
    r"đóng\s+vai",
    r"giả\s+vờ\s+(làm|là)",
    r"hệ\s+thống\s*[:：]",
    r"chỉ\s+thị\s+mới",
]

# Compile regex once for performance
INJECTION_REGEX = re.compile(
    "|".join(INJECTION_PATTERNS),
    re.IGNORECASE | re.MULTILINE | re.UNICODE,
)

# Suspicious response patterns (LLM bị compromise)
SUSPICIOUS_OUTPUT_PATTERNS = [
    r"```",
    r"<script",
    r"javascript:",
    r"eval\s*\(",
    r"exec\s*\(",
    r"system\s*\(",
    r"<iframe",
    r"on\w+\s*=",  # onclick, onerror, etc.
]

SUSPICIOUS_OUTPUT_REGEX = re.compile(
    "|".join(SUSPICIOUS_OUTPUT_PATTERNS),
    re.IGNORECASE,
)


class SecurityError(Exception):
    """Raised khi phát hiện security issue."""
    pass


def validate_input(text: str, max_length: int = 300) -> str:
    """
    Validate và sanitize user input.
    
    Args:
        text: User input
        max_length: Giới hạn độ dài
    
    Returns:
        Text đã được sanitize
    
    Raises:
        SecurityError: Nếu input không hợp lệ
    """
    if not text or not text.strip():
        raise SecurityError("Vui lòng nhập nội dung cần dịch")
    
    text = text.strip()
    
    # Kiểm tra độ dài
    if len(text) > max_length:
        raise SecurityError(
            f"Nội dung quá dài (tối đa {max_length} ký tự, hiện tại {len(text)})"
        )
    
    # Detect prompt injection
    match = INJECTION_REGEX.search(text)
    if match:
        raise SecurityError(
            "Nội dung có vẻ chứa câu lệnh điều khiển hệ thống. "
            "Vui lòng chỉ nhập slang/tin nhắn cần dịch."
        )
    
    # Loại bỏ ký tự control (giữ lại newline, tab, space)
    text = "".join(
        ch for ch in text 
        if ch.isprintable() or ch in "\n\t "
    )
    
    # Loại bỏ multiple newlines liên tiếp
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    return text


def validate_output(response: str, original_input: str) -> str:
    """
    Validate response từ LLM.
    
    Args:
        response: LLM response
        original_input: Original user input để compare
    
    Returns:
        Cleaned response
    
    Raises:
        SecurityError: Nếu response không hợp lệ
    """
    if not response:
        raise SecurityError("LLM không trả về kết quả")
    
    response = response.strip()
    
    # Strip markdown code fences nếu có
    if response.startswith("```"):
        lines = response.split("\n")
        # Remove first line (```...) and last line if it's ```
        if len(lines) > 1:
            if lines[-1].strip() == "```" or lines[-1].strip().startswith("```"):
                response = "\n".join(lines[1:-1])
            else:
                response = "\n".join(lines[1:])
        response = response.strip()
    
    # Strip outer quotes nếu LLM wrap response trong quotes
    if len(response) >= 2:
        if (response[0] == '"' and response[-1] == '"') or \
           (response[0] == "'" and response[-1] == "'"):
            response = response[1:-1].strip()
    
    # Strip "OUTPUT:" prefix nếu có
    response = re.sub(r"^(OUTPUT|Output|output)\s*[:：]\s*", "", response)
    
    # Output không được quá dài (chống verbose attack)
    max_output_length = max(len(original_input) * 8, 500)
    if len(response) > max_output_length:
        # Truncate thay vì reject
        response = response[:max_output_length].rsplit(" ", 1)[0] + "..."
    
    # Kiểm tra suspicious patterns
    if SUSPICIOUS_OUTPUT_REGEX.search(response):
        raise SecurityError("Response chứa nội dung không an toàn")
    
    if not response.strip():
        raise SecurityError("Response rỗng sau khi xử lý")
    
    return response.strip()


def is_safe_input(text: str, max_length: int = 300) -> tuple[bool, Optional[str]]:
    """
    Check xem input có an toàn không (không raise exception).
    
    Returns:
        (is_safe, error_message)
    """
    try:
        validate_input(text, max_length)
        return True, None
    except SecurityError as e:
        return False, str(e)
