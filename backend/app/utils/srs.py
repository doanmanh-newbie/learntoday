# app/utils/srs.py
"""
Hằng số và công thức liên quan đến SRS (Spaced Repetition System) - STT 8.
Dùng chung cho cả nhánh "learn" (STT 6) và "review" (STT 5).
"""
from datetime import datetime, timedelta

# 6 cấp độ SRS theo STT 8
SRS_INTERVALS = {
    1: timedelta(minutes=20),   # Mới học
    2: timedelta(hours=10),     # Biết
    3: timedelta(hours=24),     # Gần thuộc
    4: timedelta(days=1),       # Đã thuộc
    5: timedelta(days=3),       # Nhớ dai
    6: timedelta(days=5),       # Không quên
}


def get_next_review(level):
    """Tính thời điểm ôn tập tiếp theo dựa theo Level SRS."""
    interval = SRS_INTERVALS.get(level, timedelta(minutes=20))
    return datetime.utcnow() + interval