"""Đồng hồ 15 phút của bài kiểm tra Pass (thuần Python, không cần database)."""
import os
import sys
import unittest
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils import pass_timer as pt  # noqa: E402

T0 = datetime(2026, 11, 9, 8, 0, 0)
S = lambda n: timedelta(seconds=n)  # noqa: E731
EMPTY = {'time_spent': 0, 'session_started_at': None, 'last_activity_at': None, 'started_at': None}
QUESTIONS = [{'id': 'q1', 'options': list('abcd')}, {'id': 'q2', 'options': list('abcd')}]


class Clock(unittest.TestCase):
    def test_first_open_starts_a_session(self):
        st = pt.start_or_resume(EMPTY, T0)
        self.assertEqual((st['time_spent'], st['session_started_at'], st['started_at']), (0, T0, T0))
        self.assertEqual(pt.remaining_seconds(pt.elapsed_seconds(st, T0)), 900)

    def test_open_session_keeps_counting(self):
        st = pt.start_or_resume(EMPTY, T0)
        self.assertEqual(pt.elapsed_seconds(st, T0 + S(100)), 100)
        self.assertEqual(pt.remaining_seconds(100), 800)

    def test_leaving_stops_the_clock(self):
        st = pt.leave(pt.start_or_resume(EMPTY, T0), T0 + S(300))
        self.assertIsNone(st['session_started_at'])
        self.assertEqual(pt.elapsed_seconds(st, T0 + S(300)), 300)
        self.assertEqual(pt.elapsed_seconds(st, T0 + S(99999)), 300)           # vắng mặt bao lâu cũng không tốn thêm giờ

    def test_time_adds_up_across_sessions_and_keeps_the_first_start(self):
        st = pt.leave(pt.start_or_resume(EMPTY, T0), T0 + S(300))
        st = pt.start_or_resume(st, T0 + S(5000))
        self.assertEqual(st['started_at'], T0)
        st = pt.leave(st, T0 + S(5000 + 200))
        self.assertEqual(st['time_spent'], 500)
        self.assertEqual(pt.remaining_seconds(pt.elapsed_seconds(st, T0 + S(90000))), 400)

    def test_an_abandoned_session_only_counts_until_the_last_activity(self):
        st = pt.start_or_resume(EMPTY, T0)
        st = pt.touch(st, T0 + S(120))                                          # lần lưu tiến độ cuối, rồi đóng tab
        again = pt.start_or_resume(st, T0 + S(3 * 86400))                       # 3 ngày sau mới quay lại
        self.assertEqual(again['time_spent'], 120)                              # KHÔNG phải 3 ngày
        self.assertEqual(again['session_started_at'], T0 + S(3 * 86400))

    def test_an_abandoned_session_without_any_save_counts_nothing(self):
        st = pt.start_or_resume(EMPTY, T0)
        self.assertEqual(pt.start_or_resume(st, T0 + S(7200))['time_spent'], 0)

    def test_deadline_and_grace(self):
        self.assertEqual(pt.remaining_seconds(900), 0)
        self.assertEqual(pt.remaining_seconds(5000), 0)
        self.assertFalse(pt.is_overtime(900))
        self.assertFalse(pt.is_overtime(930))                                   # 30 giây du di cho độ trễ mạng
        self.assertTrue(pt.is_overtime(931))

    def test_time_spent_is_capped_so_it_cannot_overflow(self):
        st = pt.leave(pt.start_or_resume(EMPTY, T0), T0 + S(10 ** 7))
        self.assertEqual(st['time_spent'], 930)

    def test_displayed_elapsed_is_stable_and_capped(self):
        st = pt.touch(pt.start_or_resume(EMPTY, T0), T0 + S(200))
        self.assertEqual(pt.displayed_elapsed(st), 200)
        self.assertEqual(pt.displayed_elapsed(pt.leave(st, T0 + S(10 ** 6))), 900)
        self.assertEqual(pt.displayed_elapsed(EMPTY), 0)


class Answers(unittest.TestCase):
    def test_clean_answers_keeps_only_valid_integers_for_known_questions(self):
        raw = {'q1': 2, 'q2': True, 'q3': 1, 'x': 0}
        self.assertEqual(pt.clean_answers(raw, QUESTIONS), {'q1': 2})
        for bad in ({'q1': -1}, {'q1': 4}, {'q1': '1'}, {'q1': 1.0}, {'q1': None}, {'q1': [1]}):
            self.assertEqual(pt.clean_answers(bad, QUESTIONS), {}, bad)
        for bad in (None, [], 'x', 7):
            self.assertEqual(pt.clean_answers(bad, QUESTIONS), {})

    def test_grading_answers_on_time_merge_with_body_winning(self):
        self.assertEqual(pt.answers_for_grading({'q1': 0, 'q2': 1}, {'q2': 3}, overtime=False), {'q1': 0, 'q2': 3})

    def test_grading_answers_when_late_use_only_what_was_saved_in_time(self):
        saved = {'q1': 0}
        self.assertEqual(pt.answers_for_grading(saved, {'q1': 3, 'q2': 1}, overtime=True), {'q1': 0})
        self.assertIsNot(pt.answers_for_grading(saved, {}, overtime=True), saved)


if __name__ == '__main__':
    unittest.main()
