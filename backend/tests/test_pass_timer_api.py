"""Bài kiểm tra Pass: đồng hồ 15 phút do server đo + lưu tiến độ khi thoát (STT 16)."""
from datetime import datetime, timedelta

from tests.base import ApiTestCase

MIN = timedelta(minutes=1)


class PassTimerApi(ApiTestCase):
    def setUp(self):
        super().setUp()
        from app.models import UserMilestone
        self.headers, data = self.register()
        self.user_id = data['user']['id']
        self.db.session.add(UserMilestone(id='m50', user_id=self.user_id, milestone=50, reached_at=datetime.utcnow() - timedelta(days=2),
                                          test_available_at=datetime.utcnow() - timedelta(hours=1)))
        self.db.session.add(UserMilestone(id='m100', user_id=self.user_id, milestone=100, reached_at=datetime.utcnow(),
                                          test_available_at=datetime.utcnow() + timedelta(hours=20)))
        self.db.session.commit()

    # ----- helpers -----
    def open(self, mid='m50'):
        return self.client.get(f'/api/pass-test/{mid}', headers=self.headers)

    def save(self, answers, mid='m50'):
        return self.client.put(f'/api/pass-test/{mid}/progress', json={'answers': answers}, headers=self.headers)

    def leave(self, answers=None, mid='m50'):
        body = {} if answers is None else {'answers': answers}
        return self.client.post(f'/api/pass-test/{mid}/leave', json=body, headers=self.headers)

    def submit(self, answers, mid='m50'):
        return self.client.post(f'/api/pass-test/{mid}/submit', json={'answers': answers}, headers=self.headers)

    def record(self, mid='m50'):
        from app.models import UserMilestone
        self.db.session.expire_all()
        return self.db.session.get(UserMilestone, mid)

    def age_session(self, minutes, mid='m50', keep_activity=True):
        """Giả lập đã trôi `minutes` phút kể từ khi mở phiên hiện tại."""
        r = self.record(mid)
        r.session_started_at = datetime.utcnow() - minutes * MIN
        if keep_activity:
            r.last_activity_at = datetime.utcnow()
        self.db.session.commit()

    def right(self):
        from app.services.pass_test_logic import get_passage_for_milestone
        return {q['id']: q['correct_index'] for q in get_passage_for_milestone(50)['questions']}

    def assertAbout(self, actual, expected, tolerance=5):
        self.assertLessEqual(abs(actual - expected), tolerance, f'{actual} != ~{expected}')

    # ----- tests -----
    def test_opening_starts_a_15_minute_clock_and_never_reveals_answers(self):
        r = self.open()
        body = r.get_json()
        self.assertEqual(r.status_code, 200)
        self.assertEqual((body['progress']['time_limit_seconds'], body['progress']['answers'], body['progress']['resumed']), (900, {}, False))
        self.assertAbout(body['progress']['remaining_seconds'], 900)
        self.assertFalse(body['progress']['time_up'])
        self.assertNotIn('correct_index', r.get_data(as_text=True))
        self.assertNotIn('evidence', r.get_data(as_text=True))
        self.assertIsNotNone(self.record().started_at)
        self.assertEqual(body['test']['title'], 'Why We Need Sleep')

    def test_answers_are_saved_and_come_back_when_reopened(self):
        self.open()
        r = self.save({'q1': 0, 'q3': 3})
        self.assertEqual((r.status_code, r.get_json()['saved']), (200, 2))
        self.leave({'q1': 0, 'q3': 3, 'q4': 2})
        again = self.open().get_json()['progress']
        self.assertEqual((again['answers'], again['resumed']), ({'q1': 0, 'q3': 3, 'q4': 2}, True))

    def test_the_clock_is_paused_while_away_so_time_left_is_kept(self):
        self.open()
        self.age_session(5)                                  # đã làm 5 phút rồi thoát
        left = self.leave({'q1': 0}).get_json()
        self.assertAbout(left['remaining_seconds'], 600, 8)
        self.assertIsNone(self.record().session_started_at)
        r = self.record()
        r.last_activity_at = datetime.utcnow() - timedelta(days=3)       # vắng 3 ngày
        self.db.session.commit()
        back = self.open().get_json()['progress']
        self.assertAbout(back['remaining_seconds'], 600, 8)               # vẫn còn ~10 phút, không bị trừ thời gian vắng mặt

    def test_closing_the_tab_without_leaving_only_costs_time_until_the_last_save(self):
        self.open()
        r = self.record()
        r.session_started_at = datetime.utcnow() - timedelta(hours=2)      # mở từ 2 giờ trước...
        r.last_activity_at = r.session_started_at + timedelta(minutes=3)   # ...lần lưu cuối sau 3 phút rồi đóng tab
        self.db.session.commit()
        back = self.open().get_json()['progress']
        self.assertAbout(back['remaining_seconds'], 720, 8)                # 15 - 3 phút
        self.assertTrue(back['resumed'])

    def test_time_runs_out_and_late_submissions_only_count_saved_answers(self):
        right = self.right()
        self.open()
        self.save({'q1': right['q1']})                                     # chỉ lưu kịp 1 câu đúng
        self.age_session(20)                                               # 20 phút trôi qua mà không thoát
        late_save = self.save(right)
        self.assertEqual((late_save.status_code, late_save.get_json()['code']), (409, 'TIME_UP'))
        r = self.submit(right)                                             # nộp muộn cả 5 câu đúng
        body = r.get_json()
        self.assertEqual((r.status_code, body['late'], body['correct_count'], body['score']), (200, True, 1, 20))
        self.assertIn('hết giờ', body['message'])

    def test_a_few_seconds_over_is_forgiven_for_network_delay(self):
        self.open()
        r = self.record()
        r.session_started_at = datetime.utcnow() - timedelta(seconds=900 + 10)
        self.db.session.commit()
        body = self.submit(self.right()).get_json()
        self.assertEqual((body['late'], body['score']), (False, 100))

    def test_on_time_submission_merges_with_saved_answers_and_body_wins(self):
        right = self.right()
        self.open()
        self.save({'q1': (right['q1'] + 1) % 4, 'q2': right['q2']})        # q1 lưu sai, q2 lưu đúng
        body = self.submit({'q1': right['q1']}).get_json()                 # nộp sửa lại q1; q2 lấy từ bản đã lưu
        self.assertEqual((body['late'], body['correct_count']), (False, 2))

    def test_submit_without_ever_opening_still_works_as_before(self):
        body = self.submit(self.right()).get_json()
        self.assertEqual((body['score'], body['late']), (100, False))

    def test_garbage_answers_are_cleaned_when_saving(self):
        self.open()
        self.save({'q1': True, 'q2': 'x', 'q3': 99, 'q4': -1, 'q5': 2, 'zz': 1})
        self.assertEqual(self.record().answers(), {'q5': 2})
        self.assertEqual(self.save('nonsense').status_code, 200)
        self.assertEqual(self.record().answers(), {})

    def test_saving_requires_an_open_session(self):
        r = self.save({'q1': 0})
        self.assertEqual((r.status_code, r.get_json()['code']), (409, 'NO_SESSION'))
        self.open()
        self.leave()
        self.assertEqual(self.save({'q1': 0}).get_json()['code'], 'NO_SESSION')      # đã thoát: phải mở lại

    def test_leave_is_idempotent_and_never_fails(self):
        self.assertEqual(self.leave().status_code, 200)                    # chưa mở bài cũng không lỗi
        self.open()
        self.assertEqual(self.leave().status_code, 200)
        self.assertEqual(self.leave().status_code, 200)

    def test_nothing_can_be_saved_after_submitting_or_for_locked_or_foreign_tests(self):
        self.open('m50')
        self.submit({})
        for call in (lambda: self.save({'q1': 0}), lambda: self.leave(), lambda: self.open()):
            self.assertEqual(call().status_code, 409)
        self.assertEqual(self.save({'q1': 0}, 'm100').status_code, 403)
        other, _ = self.register(username='b', email='b@example.com')
        for call in (lambda: self.client.get('/api/pass-test/m50', headers=other),
                     lambda: self.client.put('/api/pass-test/m50/progress', json={}, headers=other),
                     lambda: self.client.post('/api/pass-test/m50/leave', json={}, headers=other)):
            self.assertEqual(call().status_code, 404)

    def test_status_lists_unfinished_tests_with_time_left(self):
        status = lambda: self.client.get('/api/pass-test/status', headers=self.headers).get_json()  # noqa: E731
        before = next(m for m in status()['pending_tests'] if m['id'] == 'm50')
        self.assertEqual((before['in_progress'], before['remaining_seconds']), (False, None))
        self.open()
        self.age_session(4)
        self.leave({'q1': 0})
        after = next(m for m in status()['pending_tests'] if m['id'] == 'm50')
        self.assertTrue(after['in_progress'])
        self.assertAbout(after['remaining_seconds'], 660, 8)
        self.submit({})
        done = next(m for m in status()['milestones'] if m['id'] == 'm50')
        self.assertFalse(done['in_progress'])

    def test_an_opened_test_can_be_resumed_many_times_without_extra_time(self):
        self.open()
        self.age_session(2)
        self.leave()
        for _ in range(5):
            self.open()
            self.leave()
        self.assertAbout(self.open().get_json()['progress']['remaining_seconds'], 780, 8)
