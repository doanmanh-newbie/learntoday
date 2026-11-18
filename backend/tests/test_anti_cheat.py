"""Chống gian lận tiến độ/bảng xếp hạng: kiểm tra "đến hạn ôn", vé phiên học, trần điểm theo ngày."""
import unittest
from datetime import datetime, timedelta

import pytz

from tests.base import ApiTestCase

NOW = datetime(2026, 11, 16, 3, 0, 0)       # 10:00 giờ VN
VN = pytz.timezone('Asia/Ho_Chi_Minh')


class DueCheck(ApiTestCase):
    """Luôn bật (không phụ thuộc vé): chỉ nhận ôn khi từ đã đến hạn."""

    def setUp(self):
        super().setUp()
        self.seed_folder()
        self.headers, _ = self.register()

    def learn(self, wid):
        return self.client.post(f'/api/words/{wid}/complete-learn', json={'wrong_count': 0}, headers=self.headers)

    def review(self, wid, **body):
        return self.client.post(f'/api/words/{wid}/complete-review', json={'wrong_count': 0, **body}, headers=self.headers)

    def make_due(self, wid, delta=timedelta(minutes=-5)):
        from app.models import UserWord
        uw = UserWord.query.filter_by(word_id=wid).first()
        uw.next_review = datetime.utcnow() + delta
        self.db.session.commit()

    def test_review_not_yet_due_is_refused(self):
        self.assertEqual(self.learn('w0').status_code, 200)           # học xong: hẹn 20 phút nữa
        r = self.review('w0')
        self.assertEqual(r.status_code, 409)
        self.assertIn('chưa đến hạn', r.get_json()['message'])

    def test_spamming_one_word_cannot_farm_levels(self):
        self.learn('w0')
        self.make_due('w0')
        self.assertEqual(self.review('w0').status_code, 200)
        for _ in range(5):
            self.assertEqual(self.review('w0').status_code, 409)       # đã bị hẹn xa -> không cộng thêm
        from app.models import LearningLog, UserWord
        self.assertEqual(LearningLog.query.filter_by(action='review').count(), 1)
        self.assertEqual(UserWord.query.filter_by(word_id='w0').first().level, 2)

    def test_skip_also_needs_due(self):
        self.learn('w0')
        self.assertEqual(self.review('w0', choice='bo_qua').status_code, 409)

    def test_small_clock_skew_is_tolerated(self):
        self.learn('w0')
        self.make_due('w0', timedelta(seconds=30))                    # còn 30 giây: trong dung sai 60 giây
        self.assertEqual(self.review('w0').status_code, 200)


class Tickets(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.app.config['STUDY_TICKET_REQUIRED'] = True
        self.seed_folder()
        self.headers, _ = self.register()

    def new_words(self):
        r = self.client.get('/api/learning/folders/f1/new-words?limit=3&ticket=1', headers=self.headers)
        self.assertEqual(r.status_code, 200)
        return r.get_json()

    def age(self, ticket_id, seconds):
        from app.models import StudyTicket
        t = self.db.session.get(StudyTicket, ticket_id)
        t.issued_at = datetime.utcnow() - timedelta(seconds=seconds)
        self.db.session.commit()

    def complete(self, wid, ticket, headers=None):
        body = {'wrong_count': 0}
        if ticket is not None:
            body['ticket'] = ticket
        return self.client.post(f'/api/words/{wid}/complete-learn', json=body, headers=headers or self.headers)

    def test_no_ticket_when_not_asked(self):
        r = self.client.get('/api/learning/folders/f1/new-words?limit=3', headers=self.headers)
        self.assertNotIn('ticket', r.get_json())

    def test_missing_ticket_is_400(self):
        self.assertEqual(self.complete('w0', None).status_code, 400)

    def test_unknown_ticket_is_403(self):
        self.assertEqual(self.complete('w0', 'nope').status_code, 403)

    def test_arbitrary_word_not_in_ticket_is_403(self):
        t = self.new_words()['ticket']
        self.age(t, 600)
        from app.models import Word
        self.db.session.add(Word(id='x9', word='zebra', meaning='ngựa vằn', word_type='noun'))
        self.db.session.commit()
        self.assertEqual(self.complete('x9', t).status_code, 403)

    def test_someone_elses_ticket_is_403(self):
        t = self.new_words()['ticket']
        self.age(t, 600)
        other, _ = self.register(username='lan', email='lan@example.com')
        self.assertEqual(self.complete('w0', t, headers=other).status_code, 403)

    def test_review_ticket_cannot_complete_learning(self):
        from app.models import StudyTicket
        t = self.new_words()['ticket']
        self.db.session.get(StudyTicket, t).kind = 'review'
        self.db.session.commit()
        self.age(t, 600)
        self.assertEqual(self.complete('w0', t).status_code, 403)

    def test_too_fast_is_429_then_ok_once_time_passes(self):
        t = self.new_words()['ticket']
        r = self.complete('w0', t)                                    # vừa giao xong đã hoàn thành
        self.assertEqual(r.status_code, 429)
        self.assertIn('quá nhanh', r.get_json()['message'])
        self.age(t, 6)
        self.assertEqual(self.complete('w0', t).status_code, 200)

    def test_each_further_word_needs_more_time(self):
        t = self.new_words()['ticket']
        self.age(t, 6)
        self.assertEqual(self.complete('w0', t).status_code, 200)     # 1 từ: cần >= 5 giây
        self.assertEqual(self.complete('w1', t).status_code, 429)     # từ thứ 2: cần >= 10 giây
        self.age(t, 11)
        self.assertEqual(self.complete('w1', t).status_code, 200)

    def test_offline_replay_much_later_is_fine(self):
        t = self.new_words()['ticket']
        self.age(t, 3 * 3600)                                         # gửi bù sau 3 giờ mất mạng
        for wid in ('w0', 'w1', 'w2'):
            self.assertEqual(self.complete(wid, t).status_code, 200)

    def test_duplicate_send_is_409_not_a_ticket_error(self):
        t = self.new_words()['ticket']
        self.age(t, 600)
        self.assertEqual(self.complete('w0', t).status_code, 200)
        self.assertEqual(self.complete('w0', t).status_code, 409)     # outbox coi 409 là "đã ghi nhận"

    def test_expired_ticket_is_403(self):
        t = self.new_words()['ticket']
        self.age(t, 25 * 3600)
        r = self.complete('w0', t)
        self.assertEqual(r.status_code, 403)
        self.assertIn('24 giờ', r.get_json()['message'])

    def test_review_flow_with_ticket_and_skip_needs_no_wait(self):
        from app.models import UserWord
        t = self.new_words()['ticket']
        self.age(t, 600)
        for wid in ('w0', 'w1'):
            self.assertEqual(self.complete(wid, t).status_code, 200)
        for uw in UserWord.query.all():
            uw.next_review = datetime.utcnow() - timedelta(minutes=5)
        self.db.session.commit()
        due = self.client.get('/api/review/due-words?ticket=1', headers=self.headers).get_json()
        self.assertEqual({w['id'] for w in due['words']}, {'w0', 'w1'})
        rt = due['ticket']
        skip = self.client.post('/api/words/w0/complete-review', json={'wrong_count': 0, 'choice': 'bo_qua', 'ticket': rt}, headers=self.headers)
        self.assertEqual(skip.status_code, 200)                       # "bỏ qua" không tính điểm nên không phải chờ
        fast = self.client.post('/api/words/w1/complete-review', json={'wrong_count': 0, 'ticket': rt}, headers=self.headers)
        self.assertEqual(fast.status_code, 429)
        self.age(rt, 6)
        ok = self.client.post('/api/words/w1/complete-review', json={'wrong_count': 0, 'ticket': rt}, headers=self.headers)
        self.assertEqual(ok.status_code, 200)

    def test_old_tickets_are_pruned(self):
        from app.models import StudyTicket
        from app.services.ticket_service import MAX_LIVE_TICKETS
        for _ in range(MAX_LIVE_TICKETS + 10):
            self.new_words()
        self.assertEqual(StudyTicket.query.count(), MAX_LIVE_TICKETS)


class LeaderboardCaps(unittest.TestCase):
    def rows(self, n_learn=0, n_review_distinct=0, repeat_review=0, user='u'):
        out = []
        for i in range(n_learn):
            out.append((user, 'learn', 'hoan_thanh', f'l{i}', NOW))
        for i in range(n_review_distinct):
            out.append((user, 'review', 'hoan_thanh', f'r{i}', NOW))
        for _ in range(repeat_review):
            out.append((user, 'review', 'hoan_thanh', 'same', NOW))
        return out

    def test_daily_learn_cap(self):
        from app.utils.leaderboard import capped_counts, LEARN_CAP_PER_DAY
        self.assertEqual(capped_counts(self.rows(n_learn=3000), VN)['u'][0], LEARN_CAP_PER_DAY)

    def test_daily_review_cap(self):
        from app.utils.leaderboard import capped_counts, REVIEW_CAP_PER_DAY
        self.assertEqual(capped_counts(self.rows(n_review_distinct=900), VN)['u'][1], REVIEW_CAP_PER_DAY)

    def test_same_word_counts_at_most_three_reviews_per_day(self):
        from app.utils.leaderboard import capped_counts
        self.assertEqual(capped_counts(self.rows(repeat_review=50), VN)['u'][1], 3)

    def test_cap_is_per_day_not_per_week(self):
        from app.utils.leaderboard import capped_counts, LEARN_CAP_PER_DAY
        rows = self.rows(n_learn=150)
        rows += [('u', 'learn', 'hoan_thanh', f'n{i}', NOW + timedelta(days=1)) for i in range(150)]
        self.assertEqual(capped_counts(rows, VN)['u'][0], 2 * LEARN_CAP_PER_DAY)

    def test_vietnam_midnight_boundary(self):
        from app.utils.leaderboard import capped_counts
        before = datetime(2026, 11, 16, 16, 59)      # 23:59 VN ngày 16
        after = datetime(2026, 11, 16, 17, 1)        # 00:01 VN ngày 17 (cùng ngày UTC nhưng KHÁC ngày VN)
        rows = [('u', 'learn', 'hoan_thanh', f'a{i}', before) for i in range(100)] + [('u', 'learn', 'hoan_thanh', f'b{i}', after) for i in range(100)]
        self.assertEqual(capped_counts(rows, VN)['u'][0], 200)

    def test_skips_and_other_choices_do_not_count(self):
        from app.utils.leaderboard import capped_counts
        rows = [('u', 'review', 'bo_qua', 'a', NOW), ('u', 'learn', 'da_biet', 'b', NOW), ('u', 'skip', 'bo_qua', 'c', NOW)]
        self.assertEqual(capped_counts(rows, VN).get('u', (0, 0)), (0, 0))

    def test_users_are_independent(self):
        from app.utils.leaderboard import capped_counts
        c = capped_counts(self.rows(n_learn=5, user='a') + self.rows(n_learn=7, user='b'), VN)
        self.assertEqual((c['a'][0], c['b'][0]), (5, 7))


if __name__ == '__main__':
    unittest.main()
