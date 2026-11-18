from datetime import datetime

from zoneinfo import ZoneInfo

from app.utils.leaderboard import week_start_utc, points, rank

VN = ZoneInfo("Asia/Ho_Chi_Minh")


def test_week_start_is_monday_midnight_vn_in_utc():
    now = datetime(2026, 11, 13, 10, 0, tzinfo=VN)          # thứ Sáu
    assert week_start_utc(now) == datetime(2026, 11, 8, 17, 0)  # thứ Hai 00:00 VN = CN 17:00 UTC


def test_points():
    assert points(3, 4) == 50
    assert points(0, 0) == 0


def test_rank_orders_by_points_then_name_with_ties():
    rows = [{'username': 'b', 'points': 50}, {'username': 'a', 'points': 50}, {'username': 'c', 'points': 90}]
    out = rank(rows)
    assert [r['username'] for r in out] == ['c', 'a', 'b']
    assert [r['rank'] for r in out] == [1, 2, 2]
