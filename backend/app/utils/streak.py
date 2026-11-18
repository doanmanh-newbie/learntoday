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


FREEZE_EVERY = 7    # giữ chuỗi đủ 7 ngày -> được 1 "băng giữ chuỗi" (streak freeze)
MAX_FREEZES = 2     # giữ tối đa 2 cái


def _missed_days(last_goal_date, today):
    """Số ngày bỏ lỡ giữa lần cuối và hôm nay (không tính hôm nay vì hôm nay vẫn còn thời gian)."""
    return max(0, (today - last_goal_date).days - 1)


def effective_streak(streak, last_goal_date, today, freezes=0):
    """Chuỗi ĐANG CÒN hiệu lực để hiển thị. Cột users.streak chỉ đổi khi có hoạt động nên sau khi bỏ lỡ ngày vẫn còn số cũ;
    còn hiệu lực khi lần cuối là hôm nay/hôm qua, hoặc số ngày bỏ lỡ <= số băng giữ chuỗi đang có."""
    if not streak or last_goal_date is None:
        return 0
    return streak if _missed_days(last_goal_date, today) <= (freezes or 0) else 0


def advance_streak(streak, last_goal_date, today, freezes):
    """(chuỗi mới, số băng còn lại) khi hôm nay đạt điều kiện. Ngày bỏ lỡ được "vá" bằng băng nếu đủ; đủ mỗi 7 ngày được thêm 1 băng."""
    freezes = freezes or 0
    if last_goal_date == today:
        return streak or 0, freezes
    if last_goal_date is None or not streak:
        new = 1
    else:
        missed = _missed_days(last_goal_date, today)
        if missed <= freezes:
            new, freezes = streak + 1, freezes - missed
        else:
            new = 1
    if new % FREEZE_EVERY == 0:
        freezes = min(MAX_FREEZES, freezes + 1)
    return new, freezes


def next_streak(streak, last_goal_date, today):
    """Chuỗi mới khi hôm nay đạt điều kiện lần đầu: nối tiếp nếu hôm qua có học, ngược lại bắt đầu lại từ 1."""
    if last_goal_date == today:
        return streak or 0
    return (streak or 0) + 1 if last_goal_date == today - timedelta(days=1) else 1
