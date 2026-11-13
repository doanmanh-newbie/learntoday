# app/utils/streak.py - luật chuỗi ngày học (thuần Python, không đụng database)
"""
Một ngày được tính vào chuỗi (streak) khi người dùng đạt ÍT NHẤT MỘT trong ba điều kiện:
  1. Học đủ mục tiêu từ MỚI trong ngày (STT 6);
  2. Học >= 15 phút (STT 12);
  3. Ôn tập: xong ít nhất REVIEW_STREAK_MIN từ, hoặc ôn xong HẾT từ đến hạn nếu hôm nay có ít hơn thế.
Trước đây chỉ điều kiện 1 được tính, nên người chỉ ôn tập cả ngày vẫn mất chuỗi và mục 15 phút (STT 12) không hề tăng chuỗi.
"""
from datetime import timedelta

STUDY_MINUTES_GOAL = 15
REVIEW_STREAK_MIN = 5


def review_goal_met(reviews_today, due_now, minimum=REVIEW_STREAK_MIN):
    """Ôn đủ `minimum` từ, hoặc ôn xong hết từ đến hạn (còn 0 từ đến hạn) khi hôm nay có ít hơn `minimum` từ."""
    return reviews_today >= 1 and reviews_today >= min(minimum, reviews_today + due_now)


def active_today(learned_today, daily_goal, minutes_today, reviews_today, due_now):
    return (
        learned_today >= (daily_goal or 10)
        or minutes_today >= STUDY_MINUTES_GOAL
        or review_goal_met(reviews_today, due_now)
    )


def effective_streak(streak, last_goal_date, today):
    """Chuỗi ĐANG CÒN hiệu lực để hiển thị. Cột users.streak chỉ đổi khi có hoạt động nên sau khi bỏ lỡ ngày vẫn còn số cũ;
    còn hiệu lực khi lần cuối là hôm nay hoặc hôm qua (hôm nay vẫn còn thời gian để giữ chuỗi)."""
    if not streak or last_goal_date is None:
        return 0
    return streak if last_goal_date >= today - timedelta(days=1) else 0


def next_streak(streak, last_goal_date, today):
    """Chuỗi mới khi hôm nay đạt điều kiện lần đầu: nối tiếp nếu hôm qua có học, ngược lại bắt đầu lại từ 1."""
    if last_goal_date == today:
        return streak or 0
    return (streak or 0) + 1 if last_goal_date == today - timedelta(days=1) else 1
