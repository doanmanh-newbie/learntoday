"""Cập nhật chuỗi ngày học (streak) - STT 6, 12. Luật nằm ở app/utils/streak.py."""
from datetime import datetime

from app import db
from app.models import User
from app.models.learning_logs import LearningLog, VN_TZ
from app.services.reminder_service import due_count
from app.services.study_time import get_today_minutes
from app.utils.streak import STUDY_MINUTES_GOAL, active_today, effective_streak, next_streak, advance_streak  # noqa: F401


def today_vn():
    return datetime.now(VN_TZ).date()


def update_streak_if_goal_met(user_id: str):
    """
    Gọi sau khi người dùng học xong 1 từ mới, hoàn thành 1 lượt ôn tập, hoặc được cộng phút học.
    Nếu hôm nay (giờ VN) đã đạt một trong các điều kiện của utils/streak.py thì cập nhật chuỗi (mỗi ngày tối đa 1 lần).
    Trả về chuỗi đang còn hiệu lực.
    """
    user = db.session.get(User, user_id)
    if not user:
        return None

    today = today_vn()
    if user.last_goal_date == today:
        return user.streak

    reviews_today = LearningLog.count_reviewed_today(user_id)
    if not active_today(
        learned_today=LearningLog.count_learned_today(user_id),
        daily_goal=user.daily_goal,
        minutes_today=get_today_minutes(user),
        reviews_today=reviews_today,
        due_now=due_count(user_id) if reviews_today else 0,       # chỉ cần đếm từ đến hạn khi đã ôn ít nhất 1 từ
    ):
        return effective_streak(user.streak, user.last_goal_date, today, user.streak_freezes or 0)

    # Ngày bỏ lỡ được vá bằng "băng giữ chuỗi" nếu có; giữ đủ 7 ngày được thêm 1 băng (tối đa 2)
    user.streak, user.streak_freezes = advance_streak(user.streak, user.last_goal_date, today, user.streak_freezes or 0)
    user.last_goal_date = today
    db.session.commit()
    return user.streak
