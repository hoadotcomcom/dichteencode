"""Telegram notification service for admin 2FA."""
import httpx


class TelegramConfigError(RuntimeError):
    """Raised when Telegram 2FA config is missing."""


def ensure_telegram_configured(bot_token: str, chat_id: str) -> None:
    if not bot_token or not chat_id:
        raise TelegramConfigError(
            "Telegram 2FA chưa được cấu hình. Cần telegram_bot_token và telegram_admin_chat_id trong admin settings."
        )


def send_admin_otp(
    code: str,
    username: str,
    ip_address: str,
    bot_token: str,
    chat_id: str,
) -> None:
    """Send a 6-digit login code to the configured admin chat."""
    ensure_telegram_configured(bot_token, chat_id)

    text = (
        "🔐 teencode admin login\n\n"
        f"Mã xác thực của bạn: {code}\n"
        f"User: {username}\n"
        f"IP: {ip_address}\n\n"
        "Mã có hiệu lực trong 5 phút. Nếu không phải bạn, đổi mật khẩu ngay nha."
    )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    response = httpx.post(
        url,
        json={
            "chat_id": chat_id,
            "text": text,
            "disable_web_page_preview": True,
        },
        timeout=10,
    )
    response.raise_for_status()
