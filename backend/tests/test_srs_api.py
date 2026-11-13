"""Test luật ôn tập SRS + chuỗi ngày qua API (đợt 2)."""
import uuid
from datetime import date, datetime, timedelta

from tests.base import ApiTestCase

MIN = 60.0


class SrsApiCase(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.headers, data = self.register()
        self.user_id = data['user']['id']
        self.seed_folder()

    # ----- helpers -----
    def learn(self, *word_ids):
        for w in word_ids:
            self.assertEqual(self.client.post(f'/api/words/{w}/complete-learn', headers=self.headers).status_code, 200)

    def set_level(self, word_id, level, due=True):
        from app.models import UserWord
        UserWord.query.filter_by(word_id=word_id).update(
            {'level': level, 'next_review': datetime.utcnow() - timedelta(minutes=1) if due else datetime.utcnow() + timedelta(days=9)})
        self.db.session.commit()

    def review(self, word_id, wrong=0, choice=None):
        return self.client.post(f'/api/words/{word_id}/complete-review', json={'wrong_count': wrong, 'choice': choice}, headers=self.headers)

    def uw(self, word_id):
        from app.models import UserWord
        self.db.session.expire_all()
        return UserWord.query.filter_by(word_id=word_id).first()

    def minutes_until_review(self, word_id):
        return (self.uw(word_id).next_review - datetime.utcnow()).total_seconds() / MIN

    def assertAbout(self, actual_minutes, expected_minutes, tolerance=2):
        self.assertLess(abs(actual_minutes - expected_minutes), tolerance, f'{actual_minutes} != ~{expected_minutes}')

    def make_due(self, n, level=2):
        from app.models import UserWord, Word
        for i in range(n):
            self.db.session.add(Word(id=f'q{i}', word=f'queue{i}', meaning='nghĩa'))
            self.db.session.add(UserWord(id=str(uuid.uuid4()), user_id=self.user_id, word_id=f'q{i}', level=level,
                                         next_review=datetime.utcnow() - timedelta(minutes=5)))
        self.db.session.commit()

    def streak(self):
        return self.client.get('/api/auth/me', headers=self.headers).get_json()['user']['streak']


class ReviewRules(SrsApiCase):
    def test_no_mistakes_levels_up_with_the_new_interval(self):
        self.learn('w0')
        self.set_level('w0', 3)
        r = self.review('w0', 0).get_json()
        self.assertEqual((r['result'], r['user_word']['level']), ('hoan_thanh', 4))
        self.assertAbout(self.minutes_until_review('w0'), 3 * 24 * 60)

    def test_top_level_is_21_days_not_5(self):
        self.learn('w0')
        self.set_level('w0', 6)
        r = self.review('w0', 0).get_json()
        self.assertEqual(r['user_word']['level'], 6)
        self.assertAbout(self.minutes_until_review('w0'), 21 * 24 * 60)

    def test_one_to_three_mistakes_keep_the_level(self):
        self.learn('w0')
        for wrong in (1, 3):
            self.set_level('w0', 3)
            r = self.review('w0', wrong).get_json()
            self.assertEqual((r['result'], r['user_word']['level']), ('giu_level', 3), wrong)
            self.assertAbout(self.minutes_until_review('w0'), 24 * 60)
        self.assertEqual(self.uw('w0').wrong_count, 4)                       # lỗi vẫn được cộng vào thống kê

    def test_four_mistakes_without_a_choice_no_longer_fails_and_demotes(self):
        self.learn('w0')
        self.set_level('w0', 4)
        r = self.review('w0', 5, None)
        self.assertEqual(r.status_code, 200)                                 # trước đây 400 -> tiến độ bị outbox bỏ mất
        self.assertEqual((r.get_json()['result'], r.get_json()['user_word']['level']), ('lui_1_lv', 3))
        self.assertAbout(self.minutes_until_review('w0'), 24 * 60)

    def test_explicit_skip_never_promotes_and_postpones_instead_of_reappearing(self):
        self.learn('w0')
        self.set_level('w0', 2)
        r = self.review('w0', 0, 'bo_qua').get_json()
        self.assertEqual((r['result'], r['user_word']['level']), ('bo_qua', 2))      # trước đây LÊN cấp 3
        self.assertAbout(self.minutes_until_review('w0'), 12 * 60)
        due = self.client.get('/api/review/due-words', headers=self.headers).get_json()
        self.assertEqual(due['words'], [])                                   # không hiện lại ngay ở lượt ôn kế tiếp

    def test_explicit_reset_and_demote_work_even_below_four_mistakes(self):
        self.learn('w0', 'w1')
        self.set_level('w0', 5)
        self.set_level('w1', 5)
        self.assertEqual(self.review('w0', 1, 'quay_ve_lv1').get_json()['user_word']['level'], 1)
        self.assertAbout(self.minutes_until_review('w0'), 20)
        self.assertEqual(self.review('w1', 0, 'lui_1_lv').get_json()['user_word']['level'], 4)

    def test_invalid_choice_is_400_and_changes_nothing(self):
        self.learn('w0')
        self.set_level('w0', 3)
        before = self.uw('w0').next_review
        for bad in ('xyz', 'reset', 7):
            self.assertEqual(self.review('w0', 0, bad).status_code, 400, bad)
        self.assertEqual((self.uw('w0').level, self.uw('w0').next_review), (3, before))

    def test_log_records_the_real_outcome(self):
        from app.models import LearningLog
        self.learn('w0')
        self.set_level('w0', 3)
        self.review('w0', 2)
        log = LearningLog.query.filter_by(action='review').first()
        self.assertEqual((log.choice, log.level_before, log.level_after, log.wrong_count), ('giu_level', 3, 3, 2))

    def test_bad_wrong_count_is_400(self):
        self.learn('w0')
        for bad in (-1, 'x', True, None, 1.5):
            r = self.client.post('/api/words/w0/complete-review', json={'wrong_count': bad}, headers=self.headers)
            self.assertEqual(r.status_code, 400, bad)


class StreakFromAnyActivity(SrsApiCase):
    def test_five_reviews_count_even_when_many_words_are_still_due(self):
        self.make_due(8)
        results = [self.review(f'q{i}', 0).get_json()['streak'] for i in range(5)]
        self.assertEqual(results, [0, 0, 0, 0, 1])
        self.assertEqual(self.streak(), 1)

    def test_finishing_every_due_word_counts_even_if_there_are_fewer_than_five(self):
        self.make_due(2)
        self.assertEqual(self.review('q0', 0).get_json()['streak'], 0)       # còn 1 từ đến hạn
        self.assertEqual(self.review('q1', 0).get_json()['streak'], 1)

    def test_skipped_reviews_do_not_count_as_studying(self):
        self.make_due(1)
        self.assertEqual(self.review('q0', 0, 'bo_qua').get_json()['streak'], 0)

    def test_streak_grows_once_per_day_and_continues_from_yesterday(self):
        from app.models import User
        from app.models.learning_logs import VN_TZ
        self.make_due(2)
        today = datetime.now(VN_TZ).date()
        user = self.db.session.get(User, self.user_id)
        user.streak, user.last_goal_date = 4, today - timedelta(days=1)
        self.db.session.commit()
        self.review('q0', 0)
        self.assertEqual(self.review('q1', 0).get_json()['streak'], 5)
        self.assertEqual(self.streak(), 5)

    def test_shown_streak_drops_to_zero_after_a_missed_day_but_not_before(self):
        from app.models import User
        from app.models.learning_logs import VN_TZ
        today = datetime.now(VN_TZ).date()
        user = self.db.session.get(User, self.user_id)
        for last, shown in ((today, 5), (today - timedelta(days=1), 5), (today - timedelta(days=2), 0), (None, 0)):
            user.streak, user.last_goal_date = 5, last
            self.db.session.commit()
            self.assertEqual(self.streak(), shown, last)
            self.assertEqual(self.client.get('/api/history/stats', headers=self.headers).get_json()['streak'], shown, last)
            self.assertEqual(self.client.get('/api/learning/progress/today', headers=self.headers).get_json()['streak'], shown, last)

    def test_a_new_streak_starts_at_one_after_a_gap(self):
        from app.models import User
        from app.models.learning_logs import VN_TZ
        self.make_due(1)
        user = self.db.session.get(User, self.user_id)
        user.streak, user.last_goal_date = 9, datetime.now(VN_TZ).date() - timedelta(days=4)
        self.db.session.commit()
        self.assertEqual(self.review('q0', 0).get_json()['streak'], 1)

    def test_fifteen_minutes_of_study_extends_the_streak_and_gives_the_badge(self):
        from app.models import User
        last = None
        for _ in range(15):
            u = self.db.session.get(User, self.user_id)
            if u.last_heartbeat_at:
                u.last_heartbeat_at = u.last_heartbeat_at - timedelta(seconds=61)
                self.db.session.commit()
            last = self.client.post('/api/study/heartbeat', json={}, headers=self.headers).get_json()
        self.assertTrue(last['goal_met'])
        self.assertIn('study_15min', self.client.get('/api/auth/me', headers=self.headers).get_json()['user']['badges'])
        self.assertEqual(self.streak(), 1)

    def test_learning_the_daily_goal_still_counts(self):
        from app.models import User
        user = self.db.session.get(User, self.user_id)
        user.daily_goal = 2
        self.db.session.commit()
        self.learn('w0')
        self.assertEqual(self.streak(), 0)
        self.learn('w1')
        self.assertEqual(self.streak(), 1)
