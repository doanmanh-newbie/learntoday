from datetime import date, timedelta

from app.utils.streak import effective_streak, advance_streak, FREEZE_EVERY, MAX_FREEZES

T = date(2026, 11, 13)


def test_effective_streak_kept_by_freeze():
    # lần cuối là 3 ngày trước -> bỏ lỡ 2 ngày (hôm kia, hôm qua)
    assert effective_streak(10, T - timedelta(days=3), T, freezes=2) == 10
    assert effective_streak(10, T - timedelta(days=3), T, freezes=1) == 0
    assert effective_streak(10, T - timedelta(days=1), T) == 10


def test_advance_uses_freeze_for_missed_day():
    assert advance_streak(5, T - timedelta(days=2), T, 1) == (6, 0)


def test_advance_resets_when_not_enough_freezes():
    assert advance_streak(5, T - timedelta(days=3), T, 1) == (1, 1)


def test_advance_same_day_and_next_day():
    assert advance_streak(5, T, T, 1) == (5, 1)
    assert advance_streak(5, T - timedelta(days=1), T, 0) == (6, 0)


def test_earn_freeze_every_7_days_capped():
    assert FREEZE_EVERY == 7 and MAX_FREEZES == 2
    assert advance_streak(6, T - timedelta(days=1), T, 0) == (7, 1)
    assert advance_streak(13, T - timedelta(days=1), T, 2) == (14, 2)
    assert advance_streak(None, None, T, 0) == (1, 0)
