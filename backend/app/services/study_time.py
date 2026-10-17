# app/services/study_time.py - STT 12: phút học THEO NGÀY (giờ Việt Nam)
from datetime import datetime

from app.models.learning_logs import VN_TZ


def today_vn():
    return datetime.now(VN_TZ).date()


def get_today_minutes(user) -> int:
    """Phút đã học hôm nay; coi như 0 nếu bản ghi thuộc ngày cũ."""
    if user.study_minutes_date != today_vn():
        return 0
    return user.study_minutes_today or 0


def add_study_minutes(user, minutes: int) -> int:
    """Cộng phút học; sang ngày mới thì tự reset bộ đếm ngày. Trả về tổng phút hôm nay."""
    today = today_vn()
    if user.study_minutes_date != today:
        user.study_minutes_date = today
        user.study_minutes_today = 0
    user.study_minutes_today = (user.study_minutes_today or 0) + minutes
    user.total_study_minutes = (user.total_study_minutes or 0) + minutes
    return user.study_minutes_today
