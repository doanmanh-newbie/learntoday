"""Test luật SRS và chuỗi ngày (thuần Python, không cần database)."""
import os
import re
import sys
import unittest
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils import srs  # noqa: E402
from app.utils import streak as sk  # noqa: E402

D = timedelta


class Intervals(unittest.TestCase):
    def test_six_levels_strictly_increasing_so_no_level_is_wasted(self):
        values = [srs.SRS_INTERVALS[lv] for lv in range(1, 7)]
        self.assertEqual(sorted(srs.SRS_INTERVALS), [1, 2, 3, 4, 5, 6])
        self.assertEqual(len(set(values)), 6)                       # trước đây LV3 (24h) và LV4 (1 ngày) trùng nhau
        self.assertEqual(values, sorted(values))
        self.assertEqual(values, [D(minutes=20), D(hours=10), D(days=1), D(days=3), D(days=7), D(days=21)])

    def test_get_next_review_uses_the_level_interval(self):
        from datetime import datetime
        now = datetime(2026, 11, 5, 8, 0)
        self.assertEqual(srs.get_next_review(2, now), now + D(hours=10))
        self.assertEqual(srs.get_next_review(6, now), now + D(days=21))
        self.assertEqual(srs.get_next_review(99, now), now + D(minutes=20))     # cấp lạ -> như LV1


class DecideReview(unittest.TestCase):
    def test_no_mistakes_levels_up_and_caps_at_six(self):
        self.assertEqual(srs.decide_review(1, 0), ('hoan_thanh', 2, D(hours=10)))
        self.assertEqual(srs.decide_review(5, 0), ('hoan_thanh', 6, D(days=21)))
        self.assertEqual(srs.decide_review(6, 0), ('hoan_thanh', 6, D(days=21)))

    def test_one_to_three_mistakes_keep_the_level_instead_of_promoting(self):
        for wrong in (1, 2, 3):
            self.assertEqual(srs.decide_review(3, wrong), ('giu_level', 3, D(days=1)), wrong)
        self.assertEqual(srs.decide_review(6, 3), ('giu_level', 6, D(days=21)))

    def test_four_or_more_mistakes_without_a_choice_demote_one_level(self):
        self.assertEqual(srs.decide_review(4, 4), ('lui_1_lv', 3, D(days=1)))
        self.assertEqual(srs.decide_review(1, 9), ('lui_1_lv', 1, D(minutes=20)))        # không xuống dưới LV1

    def test_explicit_choices_are_honoured_for_any_number_of_mistakes(self):
        for wrong in (0, 2, 7):
            self.assertEqual(srs.decide_review(4, wrong, 'bo_qua'), ('bo_qua', 4, D(hours=12)), wrong)
            self.assertEqual(srs.decide_review(4, wrong, 'quay_ve_lv1'), ('quay_ve_lv1', 1, D(minutes=20)), wrong)
            self.assertEqual(srs.decide_review(4, wrong, 'lui_1_lv'), ('lui_1_lv', 3, D(days=1)), wrong)

    def test_skip_never_promotes_and_does_not_come_back_immediately(self):
        result, level, delay = srs.decide_review(2, 0, 'bo_qua')
        self.assertEqual((result, level), ('bo_qua', 2))
        self.assertGreater(delay, D(hours=1))                      # trước đây giữ next_review cũ nên từ hiện lại ngay

    def test_invalid_choice_is_rejected(self):
        for bad in ('xyz', '', 'reset', 'demote', 5):
            with self.assertRaises(ValueError):
                srs.decide_review(3, 0, bad)


class StreakRules(unittest.TestCase):
    TODAY = date(2026, 11, 5)

    def test_review_goal(self):
        met = sk.review_goal_met
        self.assertFalse(met(0, 0))                 # chưa ôn từ nào
        self.assertTrue(met(5, 40))                 # ôn đủ 5 từ dù còn nhiều từ đến hạn
        self.assertFalse(met(4, 40))
        self.assertTrue(met(2, 0))                  # chỉ có 2 từ đến hạn và đã ôn xong cả 2
        self.assertFalse(met(2, 1))                 # còn 1 từ chưa ôn
        self.assertTrue(met(1, 0))

    def test_any_of_three_conditions_counts(self):
        a = sk.active_today
        self.assertFalse(a(learned_today=3, daily_goal=10, minutes_today=5, reviews_today=0, due_now=0))
        self.assertTrue(a(learned_today=10, daily_goal=10, minutes_today=0, reviews_today=0, due_now=0))
        self.assertTrue(a(learned_today=0, daily_goal=10, minutes_today=15, reviews_today=0, due_now=0))
        self.assertTrue(a(learned_today=0, daily_goal=10, minutes_today=0, reviews_today=5, due_now=9))
        self.assertTrue(a(learned_today=10, daily_goal=None, minutes_today=0, reviews_today=0, due_now=0))   # mục tiêu mặc định 10

    def test_streak_shown_is_zero_once_a_full_day_was_missed(self):
        e, t = sk.effective_streak, self.TODAY
        self.assertEqual(e(5, t, t), 5)
        self.assertEqual(e(5, t - D(days=1), t), 5)             # hôm qua có học, hôm nay còn kịp giữ chuỗi
        self.assertEqual(e(5, t - D(days=2), t), 0)             # trước đây vẫn hiện 5
        self.assertEqual(e(5, None, t), 0)
        self.assertEqual(e(0, t, t), 0)
        self.assertEqual(e(None, t, t), 0)

    def test_next_streak(self):
        n, t = sk.next_streak, self.TODAY
        self.assertEqual(n(0, None, t), 1)
        self.assertEqual(n(4, t - D(days=1), t), 5)
        self.assertEqual(n(9, t - D(days=3), t), 1)             # bỏ lỡ -> bắt đầu lại
        self.assertEqual(n(7, t, t), 7)                         # trong ngày chỉ tăng một lần
        self.assertEqual(n(None, t - D(days=1), t), 1)


class FrontendConstantsMatchBackend(unittest.TestCase):
    """frontend/src/constants/srs.js giữ bản sao lịch ôn để hiển thị; phải luôn khớp srs.py."""
    PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'constants', 'srs.js')

    @classmethod
    def setUpClass(cls):
        if not os.path.exists(cls.PATH):
            raise unittest.SkipTest('không thấy frontend/src/constants/srs.js (chạy riêng backend)')
        cls.js = open(cls.PATH, encoding='utf-8').read()

    def block(self, name):
        body = re.search(rf'export const {name} = \{{(.*?)\n\}};', self.js, re.S).group(1)
        return dict(re.findall(r'^\s*(\d+):\s*(.+?),?\s*(?://.*)?$', body, re.M))

    @staticmethod
    def label(delta):
        seconds = int(delta.total_seconds())
        if seconds < 3600:
            return f'{seconds // 60} phút'
        if seconds < 86400:
            return f'{seconds // 3600} giờ'
        return f'{seconds // 86400} ngày'

    def test_seconds_match(self):
        seconds = {int(k): eval(v, {'__builtins__': {}}) for k, v in self.block('SRS_SECONDS').items() if re.fullmatch(r'[0-9 *]+', v)}
        for level, delta in srs.SRS_INTERVALS.items():
            self.assertEqual(seconds[level], delta.total_seconds(), f'cấp {level}')

    def test_labels_match(self):
        labels = {int(k): v.strip("'\" ") for k, v in self.block('SRS_INTERVAL_LABEL').items()}
        for level, delta in srs.SRS_INTERVALS.items():
            self.assertEqual(labels[level], self.label(delta), f'cấp {level}')

    def test_no_other_copy_of_the_schedule_in_the_frontend(self):
        review_landing = os.path.join(os.path.dirname(self.PATH), '..', 'components', 'sections', 'dashboard', 'ReviewLanding.jsx')
        text = open(review_landing, encoding='utf-8').read()
        self.assertNotIn('const SRS_SECONDS', text)             # trước đây ReviewLanding tự khai báo lịch riêng và lệch với backend
        self.assertNotIn('const SRS_INTERVAL_LABEL', text)


if __name__ == '__main__':
    unittest.main()
