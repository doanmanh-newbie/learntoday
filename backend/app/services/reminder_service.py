# app/services/reminder_service.py - STT 13: email nhắc ôn tập
import logging
from datetime import datetime, time

from app import db
from app.models import User, UserWord
from app.models.learning_logs import VN_TZ
from app.services.email_service import EmailError, EmailNotConfigured, send_email, smtp_configured

logger = logging.getLogger(__name__)

DEFAULT_REMINDER_HOUR = 20


def due_count(user_id: str) -> int:
    return UserWord.query.filter(
        UserWord.user_id == user_id, UserWord.level > 0, UserWord.next_review <= datetime.utcnow()
    ).count()


def reminder_message(user, count: int):
    return (
        f'Learn Today - Bạn có {count} từ cần ôn tập',
        f'Xin chào {user.username},\n\nBạn có {count} từ đến lịch ôn tập hôm nay. '
        f'Ôn tập đúng hạn giúp bạn nhớ lâu hơn!\n\nChúc bạn học tốt,\nLearn Today',
    )


def send_due_reminders(now_vn: datetime = None) -> dict:
    """Gửi nhắc nhở cho user đã bật email, đúng GIỜ đã chọn, có từ đến hạn, và CHƯA gửi hôm nay.

    Dự án chưa có tiến trình chạy nền, nên hàm này được gọi bởi scripts/send_reminders.py
    (chạy mỗi giờ bằng cron / GitHub Actions). Cột users.last_reminder_date chặn gửi trùng
    dù script chạy nhiều lần trong cùng giờ.
    """
    if not smtp_configured():
        raise EmailNotConfigured('Chưa cấu hình SMTP')

    now_vn = now_vn or datetime.now(VN_TZ)
    today = now_vn.date()
    stats = {'checked': 0, 'sent': 0, 'skipped_no_due': 0, 'failed': 0}

    users = User.query.filter(User.email_reminder.is_(True)).all()
    for user in users:
        hour = (user.reminder_time or time(DEFAULT_REMINDER_HOUR)).hour
        if hour != now_vn.hour or user.last_reminder_date == today:
            continue
        stats['checked'] += 1
        count = due_count(user.id)
        if count == 0:
            stats['skipped_no_due'] += 1
            continue
        subject, body = reminder_message(user, count)
        try:
            send_email(user.email, subject, body)
        except EmailError:
            db.session.rollback()
            stats['failed'] += 1
            continue
        user.last_reminder_date = today
        db.session.commit()
        stats['sent'] += 1
    return stats
