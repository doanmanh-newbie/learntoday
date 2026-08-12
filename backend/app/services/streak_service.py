"""Cập nhật streak khi hoàn thành mục tiêu học trong ngày (STT 6, 12)."""
from datetime import datetime, timedelta

from app import db
from app.models import User
from app.models.learning_logs import LearningLog, VN_TZ


def update_streak_if_goal_met(user_id: str):
    """
    Gọi sau khi user học xong 1 từ mới.
    Nếu đạt daily_goal hôm nay (giờ VN) thì cập nhật streak.
    """
    user = User.query.get(user_id)
    if not user:
        return None

    learned_today = LearningLog.count_learned_today(user_id)
    daily_target = user.daily_goal or 10
    if learned_today < daily_target:
        return user.streak

    today_vn = datetime.now(VN_TZ).date()

    if user.last_goal_date == today_vn:
        return user.streak

    yesterday = today_vn - timedelta(days=1)
    if user.last_goal_date == yesterday:
        user.streak = (user.streak or 0) + 1
    else:
        user.streak = 1

    user.last_goal_date = today_vn
    db.session.commit()
    return user.streak
