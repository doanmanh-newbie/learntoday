from datetime import datetime, timedelta

from tests.base import ApiTestCase


class HealthAndErrors(ApiTestCase):
    def test_health_ok(self):
        r = self.client.get('/api/health')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()['connected'])

    def test_db_error_is_json_503_and_does_not_leak_credentials(self):
        from sqlalchemy.exc import OperationalError

        @self.app.route('/boom')
        def boom():
            raise OperationalError('SELECT 1', {}, Exception(
                'FATAL: password authentication failed for user "postgres.abc" host aws-1-ap-south-1.pooler.supabase.com'))

        r = self.client.get('/boom')
        body = r.get_json()
        self.assertEqual(r.status_code, 503)
        self.assertEqual(body['code'], 'DB_UNAVAILABLE')
        self.assertNotIn('postgres.abc', str(body))
        self.assertNotIn('supabase', str(body))

    def test_unknown_route_returns_json(self):
        r = self.client.get('/api/khong-ton-tai')
        self.assertEqual(r.status_code, 404)
        self.assertIn('message', r.get_json())


class AuthFlow(ApiTestCase):
    def test_register_login_refresh_logout(self):
        headers, data = self.register()
        self.assertEqual(data['user']['email'], 'kota@example.com')       # email chuẩn hóa chữ thường

        # đăng nhập khác hoa/thường vẫn được
        r = self.client.post('/api/auth/login', json={'email': 'KOTA@example.com', 'password': 'secret123'})
        self.assertEqual(r.status_code, 200)

        rt = r.get_json()['refresh_token']
        r2 = self.client.post('/api/auth/refresh-token', json={'refresh_token': rt})
        self.assertEqual(r2.status_code, 200)
        self.assertIn('access_token', r2.get_json())

        r3 = self.client.post('/api/auth/logout', json={'refresh_token': rt}, headers=headers)
        self.assertEqual(r3.status_code, 200)
        r4 = self.client.post('/api/auth/refresh-token', json={'refresh_token': rt})
        self.assertEqual(r4.status_code, 401)                              # đã thu hồi

    def test_wrong_password_is_401_json(self):
        self.register()
        r = self.client.post('/api/auth/login', json={'email': 'kota@example.com', 'password': 'sai'})
        self.assertEqual(r.status_code, 401)
        self.assertIn('message', r.get_json())

    def test_rapid_logins_do_not_collide_on_unique_refresh_token(self):
        """Trước đây token chỉ có user_id+exp -> 2 lần login trong 1 giây trùng token -> 500."""
        self.register()
        tokens = set()
        for _ in range(5):
            r = self.client.post('/api/auth/login', json={'email': 'kota@example.com', 'password': 'secret123'})
            self.assertEqual(r.status_code, 200, r.get_json())
            tokens.add(r.get_json()['refresh_token'])
        self.assertEqual(len(tokens), 5)

    def test_refresh_token_cannot_be_used_as_access_token(self):
        _, data = self.register()
        r = self.client.get('/api/auth/me', headers={'Authorization': f"Bearer {data['refresh_token']}"})
        self.assertEqual(r.status_code, 401)

    def test_duplicate_register(self):
        self.register()
        r = self.client.post('/api/auth/register', json={'username': 'x', 'email': 'KOTA@example.com', 'password': 'p'})
        self.assertEqual(r.status_code, 400)


class FoldersAndLearning(ApiTestCase):
    def test_folder_list_includes_progress_without_n_plus_1(self):
        headers, _ = self.register()
        self.seed_folder()
        r = self.client.get('/api/folders', headers=headers)
        f = r.get_json()['system_folders'][0]
        self.assertEqual((f['total_words'], f['learned_words'], f['progress']), (3, 0, 0))

        self.client.post('/api/words/w0/complete-learn', headers=headers)
        f = self.client.get('/api/folders', headers=headers).get_json()['system_folders'][0]
        self.assertEqual((f['learned_words'], f['progress']), (1, 33))

    def test_folder_words_have_level(self):
        headers, _ = self.register()
        self.seed_folder()
        self.client.post('/api/words/w1/complete-learn', headers=headers)
        words = self.client.get('/api/folders/f1/words', headers=headers).get_json()['words']
        levels = {w['word']: w['level'] for w in words}
        self.assertEqual(levels, {'itinerary': 0, 'passport': 1, 'luggage': 0})

    def test_complete_learn_twice_is_409_not_500(self):
        headers, _ = self.register()
        self.seed_folder()
        self.assertEqual(self.client.post('/api/words/w0/complete-learn', headers=headers).status_code, 200)
        self.assertEqual(self.client.post('/api/words/w0/complete-learn', headers=headers).status_code, 409)

    def test_mark_known_does_not_reset_learned_word(self):
        from app.models import UserWord
        headers, data = self.register()
        self.seed_folder()
        self.client.post('/api/words/w0/complete-learn', headers=headers)
        uw = UserWord.query.filter_by(word_id='w0').first()
        uw.level = 5
        self.db.session.commit()
        r = self.client.post('/api/words/w0/mark-known', headers=headers)
        self.assertEqual(r.status_code, 409)
        self.assertEqual(UserWord.query.filter_by(word_id='w0').first().level, 5)

    def test_snooze_rejects_non_integer(self):
        headers, _ = self.register()
        self.seed_folder()
        self.client.post('/api/words/w0/complete-learn', headers=headers)
        r = self.client.post('/api/words/w0/snooze', json={'days': 'abc'}, headers=headers)
        self.assertEqual(r.status_code, 400)

    def test_review_flow_and_response_keys(self):
        from app.models import UserWord
        headers, _ = self.register()
        self.seed_folder()
        for w in ('w0', 'w1'):
            self.client.post(f'/api/words/{w}/complete-learn', headers=headers)
        self.assertEqual(self.client.get('/api/review/due-count', headers=headers).get_json()['count'], 0)

        UserWord.query.update({'next_review': datetime.utcnow() - timedelta(minutes=1)})
        self.db.session.commit()
        c = self.client.get('/api/review/due-count', headers=headers).get_json()
        self.assertEqual((c['count'], c['due_count']), (2, 2))
        due = self.client.get('/api/review/due-words', headers=headers).get_json()
        self.assertEqual(len(due['words']), 2)

        r = self.client.post('/api/words/w0/complete-review', json={'wrong_count': 0}, headers=headers)
        self.assertEqual(r.get_json()['user_word']['level'], 2)

        stats = self.client.get('/api/history/stats', headers=headers).get_json()
        for key in ('total_words_learned', 'total_learned', 'accuracy', 'streak', 'study_minutes_today'):
            self.assertIn(key, stats)
        self.assertEqual(stats['total_words_learned'], 2)
        self.assertEqual(stats['accuracy'], 100)

        prog = self.client.get('/api/learning/progress/today', headers=headers).get_json()
        self.assertEqual((prog['learned_today'], prog['learned']), (2, 2))

        logs = self.client.get('/api/history/logs', headers=headers).get_json()['logs']
        self.assertTrue(all('word' in l for l in logs))

    def test_pass_test_milestone_created_at_50_words(self):
        from app.models import Word, UserMilestone
        headers, _ = self.register()
        for i in range(50):
            self.db.session.add(Word(id=f'p{i}', word=f'word{i}', meaning='nghĩa'))
        self.db.session.commit()
        last = None
        for i in range(50):
            last = self.client.post(f'/api/words/p{i}/complete-learn', headers=headers)
            self.assertEqual(last.status_code, 200)
        self.assertEqual(last.get_json()['new_milestones'], [50])
        self.assertEqual(UserMilestone.query.count(), 1)

    def test_add_word_to_personal_folder_atomic_and_duplicate(self):
        headers, _ = self.register()
        self.seed_folder()
        fid = self.client.post('/api/folders', json={'name': ' Của tôi '}, headers=headers).get_json()['folder']['id']
        self.assertEqual(self.client.post(f'/api/folders/{fid}/words', json={'word_id': 'w0'}, headers=headers).status_code, 201)
        self.assertEqual(self.client.post(f'/api/folders/{fid}/words', json={'word_id': 'w0'}, headers=headers).status_code, 409)
        listing = self.client.get('/api/folders', headers=headers).get_json()['personal_folders'][0]
        self.assertEqual((listing['name'], listing['word_count']), ('Của tôi', 1))
        self.client.delete(f'/api/folders/{fid}/words/w0', headers=headers)
        listing = self.client.get('/api/folders', headers=headers).get_json()['personal_folders'][0]
        self.assertEqual(listing['word_count'], 0)

    def test_search_escapes_like_wildcards(self):
        from app.models import Word
        headers, _ = self.register()
        self.db.session.add_all([Word(id='a', word='100%', meaning='một trăm phần trăm'),
                                 Word(id='b', word='apple', meaning='táo')])
        self.db.session.commit()
        res = self.client.get('/api/search?q=%25', headers=headers).get_json()['results']
        self.assertEqual([w['word'] for w in res], ['100%'])        # '%' không còn khớp mọi thứ


class StudyTime(ApiTestCase):
    def test_daily_minutes_goal_not_lifetime(self):
        headers, _ = self.register()
        r = self.client.post('/api/study/heartbeat', json={'minutes': 10}, headers=headers).get_json()
        self.assertFalse(r['goal_met'])
        r = self.client.post('/api/study/heartbeat', json={'minutes': 5}, headers=headers).get_json()
        self.assertTrue(r['goal_met'])
        self.assertEqual(r['study_minutes_today'], 15)

        # sang ngày mới -> bộ đếm ngày reset, tổng cộng dồn giữ nguyên
        from app.models import User
        from datetime import timedelta as td
        u = User.query.first()
        u.study_minutes_date = u.study_minutes_date - td(days=1)
        self.db.session.commit()
        r = self.client.post('/api/study/heartbeat', json={'minutes': 1}, headers=headers).get_json()
        self.assertEqual((r['study_minutes_today'], r['total_study_minutes'], r['goal_met']), (1, 16, False))

    def test_heartbeat_bad_input(self):
        headers, _ = self.register()
        r = self.client.post('/api/study/heartbeat', json={'minutes': 'abc'}, headers=headers)
        self.assertEqual(r.status_code, 400)


class Seeding(ApiTestCase):
    def test_seed_is_idempotent_vietnamese_and_counts_are_real(self):
        import seed
        from app.models import Word, Folder, FolderWord
        first = seed.seed_words_and_folders()
        self.assertEqual(first['folders_created'], 6)
        self.assertEqual(first['no_vi'], [])                        # mọi từ đều có bản dịch
        n_words, n_links = Word.query.count(), FolderWord.query.count()
        self.assertEqual(n_words, 70)                               # 'hypothesis' dùng chung 2 folder
        self.assertEqual(n_links, 71)

        second = seed.seed_words_and_folders()                      # chạy lần 2: không nhân đôi, không đổi gì
        self.assertEqual((second['folders_created'], second['words_created'], second['words_updated'], second['links_created']),
                         (0, 0, 0, 0))
        self.assertEqual((Word.query.count(), FolderWord.query.count()), (n_words, n_links))

        for f in Folder.query.all():
            self.assertEqual(f.word_count, FolderWord.query.filter_by(folder_id=f.id).count())
        cloud = Word.query.filter_by(word='cloud').one()
        self.assertEqual(cloud.meaning, 'đám mây; điện toán đám mây')   # không còn "đá tảng, ngọn đồi"
        self.assertTrue(cloud.meaning_en)                                # giữ định nghĩa gốc
        self.assertIn('cloud', cloud.example.lower())

    def test_seed_repairs_previously_seeded_english_rows(self):
        import seed
        from app.models import Word
        self.db.session.add(Word(id='old', word='physics', meaning='A medicine or drug, especially a cathartic'))
        self.db.session.commit()
        seed.seed_words_and_folders()
        self.assertEqual(Word.query.filter_by(word='physics').one().meaning, 'vật lý học')
        self.assertEqual(Word.query.filter_by(word='physics').count(), 1)
