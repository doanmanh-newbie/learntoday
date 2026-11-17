import uuid
from datetime import datetime, timedelta

from tests.base import ApiTestCase

URL = '/api/game/flappy/runs'
MEANING = {'w0': 'lịch trình', 'w1': 'hộ chiếu', 'w2': 'hành lý'}
WORD = {'w0': 'itinerary', 'w1': 'passport', 'w2': 'luggage'}


def ans(wid, t, choice=None, d='en_vi'):
    right = MEANING[wid] if d == 'en_vi' else WORD[wid]
    return {'word_id': wid, 'dir': d, 'choice': right if choice is None else choice, 't_ms': t}


class GameApiTest(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.seed_folder()
        self.h, _ = self.register()
        from app.models import User, UserWord
        self.uid = User.query.filter_by(username='kota').first().id
        self.db.session.add(UserWord(user_id=self.uid, word_id='w0', level=1))
        self.db.session.commit()

    def post(self, body, h=None):
        return self.client.post(URL, json=body, headers=h or self.h)

    def test_submit_scores_on_server_ignoring_client_score(self):
        r = self.post({'answers': [ans('w0', 3000)], 'score': 9999, 'folder_id': None})
        self.assertEqual(r.status_code, 201, r.get_json())
        j = r.get_json()
        self.assertEqual((j['score'], j['correct'], j['answered']), (10, 1, 1))
        self.assertEqual(j['rank_week'], 1)
        self.assertEqual(j['rank_all'], 1)
        self.assertIn('max_score', j)

    def test_submit_with_folder_allows_unlearned_words(self):
        r = self.post({'answers': [ans('w1', 3000), ans('w2', 6000)], 'folder_id': 'f1'})
        self.assertEqual(r.status_code, 201, r.get_json())
        self.assertEqual(self.post({'answers': [ans('w1', 3000)]}).status_code, 400)

    def test_rejects_other_users_personal_folder(self):
        from app.models import Folder, FolderWord, User
        self.register('other', 'o@example.com')
        oid = User.query.filter_by(username='other').first().id
        self.db.session.add(Folder(id='pf', name='riêng', type='personal', user_id=oid))
        self.db.session.add(FolderWord(id='fwp', folder_id='pf', word_id='w1', order_index=0))
        self.db.session.commit()
        self.assertEqual(self.post({'answers': [ans('w1', 3000)], 'folder_id': 'pf'}).status_code, 403)

    def test_rejects_duplicate_word_and_fast_answers_and_after_third_wrong(self):
        bad = [
            [ans('w0', 3000), ans('w0', 6000)],
            [ans('w0', 3000), ans('w1', 4000)],
            [ans('w0', 3000, 'x'), ans('w1', 6000, 'x'), ans('w2', 9000, 'x'), ans('w0', 12000)],
        ]
        for a in bad:
            self.assertEqual(self.post({'answers': a, 'folder_id': 'f1'}).status_code, 400, a)

    def test_rejects_malformed_payloads(self):
        ok = {'word_id': 'w0', 'dir': 'en_vi', 'choice': 'a', 't_ms': 3000}
        for body in [[1], {'answers': []}, {'answers': 'x'}, {'answers': [1]},
                     {'answers': [{**ok, 'word_id': 1}]},
                     {'answers': [{**ok, 'choice': None}]},
                     {'answers': [{**ok, 't_ms': True}]},
                     {'answers': [{**ok, 't_ms': 3.5}]},
                     {'answers': [ans('w0', 3000)], 'folder_id': 5}]:
            self.assertEqual(self.post(body).status_code, 400, body)

    def test_rejects_too_many_answers_and_huge_t_ms(self):
        ok = {'word_id': 'w0', 'dir': 'en_vi', 'choice': 'a', 't_ms': 3000}
        self.assertEqual(self.post({'answers': [ok] * 201}).status_code, 400)
        self.assertEqual(self.post({'answers': [{**ok, 't_ms': 86_400_001}]}).status_code, 400)

    def test_empty_meaning_word_not_allowed(self):
        from app.models import Word
        Word.query.get('w0').meaning = ''
        self.db.session.commit()
        self.assertEqual(self.post({'answers': [ans('w0', 3000, '')]}).status_code, 400)

    def test_daily_run_limit(self):
        from app.routes.game import MAX_RUNS_PER_DAY
        self.assertEqual(MAX_RUNS_PER_DAY, 30)
        for _ in range(MAX_RUNS_PER_DAY):
            self.assertEqual(self.post({'answers': [ans('w0', 3000)]}).status_code, 201)
        self.assertEqual(self.post({'answers': [ans('w0', 3000)]}).status_code, 429)

    def _run(self, user_id, score, created=None):
        from app.models.game_runs import GameRun
        self.db.session.add(GameRun(id=str(uuid.uuid4()), user_id=user_id, game='flappy', score=score,
                                    answered=1, correct=1, duration_ms=1000,
                                    created_at=created or datetime.utcnow()))

    def test_leaderboard_week_and_all_best_run_only(self):
        from app.models import User
        self.register('other', 'o@example.com')
        self._run(self.uid, 10)
        self._run(self.uid, 12)
        self._run(User.query.filter_by(username='other').first().id, 50, created=datetime.utcnow() - timedelta(days=30))
        self.db.session.commit()
        wk = self.client.get('/api/game/flappy/leaderboard', headers=self.h).get_json()
        self.assertEqual(wk['period'], 'week')
        self.assertEqual([(r['username'], r['score']) for r in wk['rows']], [('kota', 12)])
        self.assertTrue(wk['rows'][0]['is_me'])
        al = self.client.get('/api/game/flappy/leaderboard?period=all', headers=self.h).get_json()
        self.assertEqual([(r['username'], r['score'], r['rank']) for r in al['rows']], [('other', 50, 1), ('kota', 12, 2)])
        self.assertEqual(al['me'], {'rank': 2, 'score': 12})
        self.assertEqual(self.client.get('/api/game/flappy/leaderboard?period=x', headers=self.h).status_code, 400)

    def test_leaderboard_me_when_outside_top(self):
        from app.models import User
        self._run(self.uid, 5)
        for i in range(55):
            u = User(id=f'u{i}', username=f'p{i:02d}', email=f'p{i}@x.com', password_hash='x')
            self.db.session.add(u)
            self.db.session.flush()
            self._run(u.id, 100 + i)
        self.db.session.commit()
        j = self.client.get('/api/game/flappy/leaderboard', headers=self.h).get_json()
        self.assertEqual(len(j['rows']), 50)
        self.assertFalse(any(r['is_me'] for r in j['rows']))
        self.assertEqual(j['me'], {'rank': 56, 'score': 5})

    def test_leaderboard_requires_auth(self):
        self.assertEqual(self.client.get('/api/game/flappy/leaderboard').status_code, 401)
