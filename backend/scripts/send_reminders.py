"""
Gửi email nhắc ôn tập (STT 13). Chạy MỖI GIỜ bằng cron / Task Scheduler / GitHub Actions:

    python scripts/send_reminders.py

Chỉ gửi cho người dùng đã bật nhắc nhở, đúng giờ họ chọn (giờ Việt Nam), đang có từ đến hạn và
chưa được nhắc hôm nay (nên chạy lại trong cùng giờ cũng không gửi trùng).
Cần SMTP_HOST / SMTP_USER / SMTP_PASS (+ SMTP_PORT, SMTP_FROM) trong .env.
Ví dụ cron (Linux):   0 * * * *  cd /đường/dẫn/backend && venv/bin/python scripts/send_reminders.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from app.services.email_service import EmailNotConfigured  # noqa: E402
from app.services.reminder_service import send_due_reminders  # noqa: E402


def main() -> int:
    app = create_app()
    with app.app_context():
        try:
            stats = send_due_reminders()
        except EmailNotConfigured:
            print('Chưa cấu hình SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS trong .env) - không gửi được email.')
            return 2
    print(f"Đã kiểm tra {stats['checked']} người dùng | gửi {stats['sent']} | không có từ đến hạn {stats['skipped_no_due']} | lỗi {stats['failed']}")
    return 1 if stats['failed'] else 0


if __name__ == '__main__':
    sys.exit(main())
