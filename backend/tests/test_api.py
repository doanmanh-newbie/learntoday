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

        self.assertNotIn('refresh_token', r.get_json())                    # refresh token nằm trong cookie HttpOnly, không trong JSON
        rt = self.refresh_cookie(r)
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
            tokens.add(self.refresh_cookie(r))
        self.assertEqual(len(tokens), 5)

    def test_refresh_token_cannot_be_used_as_access_token(self):
        self.register()
        r = self.client.get('/api/auth/me', headers={'Authorization': f"Bearer {self.refresh_cookie(self.last_response)}"})
        self.assertEqual(r.status_code, 401)

    def test_duplicate_register(self):
        self.register()
        r = self.client.post('/api/auth/register', json={'username': 'x', 'email': 'KOTA@example.com', 'password': 'password123'})
        self.assertEqual(r.status_code, 400)
        self.assertIn('Email', r.get_json()['message'])

    def test_weak_password_rejected_on_register_and_reset(self):
        r = self.client.post('/api/auth/register', json={'username': 'x', 'email': 'x@example.com', 'password': 'short'})
        self.assertEqual(r.status_code, 400)
        self.assertIn('8', r.get_json()['message'])
        self.register()
        self.app.debug = True
        token = self.client.post('/api/auth/forgot-password', json={'email': 'kota@example.com'}).get_json()['reset_token']
        self.app.debug = False
        weak = self.client.post('/api/auth/reset-password', json={'reset_token': token, 'new_password': '1234567'})
        self.assertEqual(weak.status_code, 400)


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
        from app.models import User
        from datetime import timedelta as td
        headers, _ = self.register()

        def beat():
            # Server tự đo thời gian: lùi mốc lần cộng trước 61 giây để giả lập "đã qua 1 phút thật"
            u = User.query.first()
            if u.last_heartbeat_at:
                u.last_heartbeat_at = u.last_heartbeat_at - td(seconds=61)
                self.db.session.commit()
            return self.client.post('/api/study/heartbeat', json={'minutes': 30}, headers=headers).get_json()   # minutes bị bỏ qua

        for _ in range(14):
            self.assertFalse(beat()['goal_met'])
        r = beat()
        self.assertTrue(r['goal_met'])
        self.assertEqual(r['study_minutes_today'], 15)

        # sang ngày mới -> bộ đếm ngày reset, tổng cộng dồn giữ nguyên
        u = User.query.first()
        u.study_minutes_date = u.study_minutes_date - td(days=1)
        self.db.session.commit()
        r = beat()
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


class ProfileSettings(ApiTestCase):
    def test_update_settings_flow_into_daily_target(self):
        headers, _ = self.register()
        r = self.client.put('/api/profile', headers=headers, json={
            'daily_goal': 20, 'review_limit': 15, 'email_reminder': False, 'reminder_time': 12, 'tts_voice': 'en-GB'})
        self.assertEqual(r.status_code, 200, r.get_json())
        u = r.get_json()['user']
        self.assertEqual((u['daily_goal'], u['review_limit'], u['tts_voice'], u['reminder_time']),
                         (20, 15, 'en-GB', '12:00:00'))
        prog = self.client.get('/api/learning/progress/today', headers=headers).get_json()
        self.assertEqual(prog['daily_target'], 20)               # mục tiêu ngày ở Dashboard lấy từ cài đặt

    def test_bad_input_is_400_not_500(self):
        headers, _ = self.register()
        for body in ({'daily_goal': 'abc'}, {'daily_goal': 7}, {'review_limit': None}, {'reminder_time': 'xx:yy'},
                     {'reminder_time': '25:00'}, {'reminder_time': 3}, {'tts_voice': 'vi-VN'}, {'username': '  '},
                     {'email_reminder': 'yes'}):
            r = self.client.put('/api/profile', headers=headers, json=body)
            self.assertEqual(r.status_code, 400, (body, r.get_json()))

    def test_username_unique_case_insensitive(self):
        headers, _ = self.register()
        self.register(username='Other', email='o@example.com')
        r = self.client.put('/api/profile', headers=headers, json={'username': 'OTHER'})
        self.assertEqual(r.status_code, 400)

    def test_folder_words_pagination_and_filters(self):
        from app.models import Folder, Word, FolderWord
        headers, _ = self.register()
        self.db.session.add(Folder(id='big', name='Lớn', type='system', word_count=45))
        for i in range(45):
            self.db.session.add(Word(id=f'b{i}', word=f'term{i:02d}', meaning='nghĩa', word_type='noun' if i % 3 else 'verb'))
            self.db.session.add(FolderWord(id=f'bf{i}', folder_id='big', word_id=f'b{i}', order_index=i))
        self.db.session.commit()
        p1 = self.client.get('/api/folders/big/words?page=1&limit=20', headers=headers).get_json()
        p3 = self.client.get('/api/folders/big/words?page=3&limit=20', headers=headers).get_json()
        self.assertEqual((len(p1['words']), p1['pagination']['has_more'], p1['pagination']['total']), (20, True, 45))
        self.assertEqual((len(p3['words']), p3['pagination']['has_more']), (5, False))
        verbs = self.client.get('/api/folders/big/words?word_type=verb&limit=100', headers=headers).get_json()
        self.assertEqual(verbs['pagination']['total'], 15)
        hit = self.client.get('/api/folders/big/words?search=term07', headers=headers).get_json()
        self.assertEqual([w['word'] for w in hit['words']], ['term07'])

    def test_folder_words_status_filter(self):
        headers, _ = self.register()
        self.seed_folder()
        self.client.post('/api/words/w0/complete-learn', headers=headers)
        learned = self.client.get('/api/folders/f1/words?status=learned', headers=headers).get_json()
        new = self.client.get('/api/folders/f1/words?status=new', headers=headers).get_json()
        self.assertEqual([w['word'] for w in learned['words']], ['itinerary'])
        self.assertEqual(sorted(w['word'] for w in new['words']), ['luggage', 'passport'])


class PasswordReset(ApiTestCase):
    def test_forgot_password_never_leaks_token_or_account_existence(self):
        self.register()
        known = self.client.post('/api/auth/forgot-password', json={'email': 'kota@example.com'})
        unknown = self.client.post('/api/auth/forgot-password', json={'email': 'nobody@example.com'})
        self.assertEqual(known.status_code, 200)
        self.assertNotIn('reset_token', known.get_json())               # không còn tặng token cho người gọi
        self.assertEqual(known.get_json(), unknown.get_json())           # không dò được email nào có tài khoản

    def test_reset_token_only_in_debug_and_still_works(self):
        headers, _ = self.register()
        self.app.debug = True
        token = self.client.post('/api/auth/forgot-password', json={'email': 'kota@example.com'}).get_json()['reset_token']
        self.app.debug = False
        r = self.client.post('/api/auth/reset-password', json={'reset_token': token, 'new_password': 'newpass123'})
        self.assertEqual(r.status_code, 200)
        ok = self.client.post('/api/auth/login', json={'email': 'kota@example.com', 'password': 'newpass123'})
        self.assertEqual(ok.status_code, 200)
        old_refresh = self.client.post('/api/auth/refresh-token', json={'refresh_token': 'x'})
        self.assertEqual(old_refresh.status_code, 401)


class EmailReminders(ApiTestCase):
    SMTP_ENV = {'SMTP_HOST': 'smtp.test', 'SMTP_USER': 'u@test', 'SMTP_PASS': 'p', 'SMTP_PORT': '587'}

    def _due_user(self, hour=20):
        """User bật nhắc nhở, giờ nhận = hour, có 1 từ đến hạn."""
        from datetime import time
        from app.models import User, UserWord, Word
        headers, _ = self.register()
        self.db.session.add(Word(id='r1', word='deadline', meaning='hạn chót'))
        self.db.session.commit()
        self.client.post('/api/words/r1/complete-learn', headers=headers)
        UserWord.query.update({'next_review': datetime.utcnow() - timedelta(hours=1)})
        user = User.query.first()
        user.email_reminder, user.reminder_time = True, time(hour)
        self.db.session.commit()
        return headers, user

    def test_send_test_does_not_claim_success_without_smtp(self):
        import os
        from unittest import mock
        headers, _ = self.register()
        with mock.patch.dict(os.environ, {}, clear=False):
            for k in self.SMTP_ENV:
                os.environ.pop(k, None)
            body = self.client.post('/api/study/reminders/send-test', headers=headers).get_json()
        self.assertFalse(body['sent'])
        self.assertIn('email_preview', body)

    def test_send_test_really_sends_via_smtp(self):
        import os
        from unittest import mock
        headers, _ = self.register()
        with mock.patch.dict(os.environ, self.SMTP_ENV), mock.patch('app.services.email_service.smtplib.SMTP') as smtp:
            body = self.client.post('/api/study/reminders/send-test', headers=headers).get_json()
        self.assertTrue(body['sent'])
        server = smtp.return_value
        server.starttls.assert_called_once()
        server.login.assert_called_once_with('u@test', 'p')
        self.assertEqual(server.send_message.call_args[0][0]['To'], 'kota@example.com')

    def test_smtp_failure_is_502_not_fake_success(self):
        import os, smtplib
        from unittest import mock
        headers, _ = self.register()
        with mock.patch.dict(os.environ, self.SMTP_ENV), \
             mock.patch('app.services.email_service.smtplib.SMTP', side_effect=smtplib.SMTPAuthenticationError(535, b'bad')):
            r = self.client.post('/api/study/reminders/send-test', headers=headers)
        self.assertEqual(r.status_code, 502)
        self.assertFalse(r.get_json()['sent'])

    def test_batch_sends_only_at_chosen_hour_once_per_day(self):
        import os
        from datetime import datetime as dt
        from unittest import mock
        from app.models.learning_logs import VN_TZ
        from app.services.reminder_service import send_due_reminders
        self._due_user(hour=20)
        with mock.patch.dict(os.environ, self.SMTP_ENV), mock.patch('app.services.email_service.smtplib.SMTP') as smtp:
            wrong_hour = send_due_reminders(dt(2026, 10, 18, 8, 5, tzinfo=VN_TZ))
            right_hour = send_due_reminders(dt(2026, 10, 18, 20, 5, tzinfo=VN_TZ))
            again = send_due_reminders(dt(2026, 10, 18, 20, 40, tzinfo=VN_TZ))      # chạy lại cùng giờ
            next_day = send_due_reminders(dt(2026, 10, 19, 20, 5, tzinfo=VN_TZ))
        self.assertEqual((wrong_hour['sent'], right_hour['sent'], again['sent'], next_day['sent']), (0, 1, 0, 1))
        self.assertEqual(smtp.return_value.send_message.call_count, 2)

    def test_batch_skips_users_without_due_words_or_opted_out(self):
        import os
        from datetime import datetime as dt
        from unittest import mock
        from app.models import User, UserWord
        from app.models.learning_logs import VN_TZ
        from app.services.reminder_service import send_due_reminders
        _, user = self._due_user(hour=20)
        with mock.patch.dict(os.environ, self.SMTP_ENV), mock.patch('app.services.email_service.smtplib.SMTP') as smtp:
            UserWord.query.update({'next_review': datetime.utcnow() + timedelta(days=1)})   # chưa đến hạn
            self.db.session.commit()
            none_due = send_due_reminders(dt(2026, 10, 18, 20, 5, tzinfo=VN_TZ))
            UserWord.query.update({'next_review': datetime.utcnow() - timedelta(hours=1)})
            User.query.update({'email_reminder': False})                                    # đã tắt nhắc nhở
            self.db.session.commit()
            opted_out = send_due_reminders(dt(2026, 10, 18, 20, 5, tzinfo=VN_TZ))
        self.assertEqual((none_due['sent'], none_due['skipped_no_due'], opted_out['sent']), (0, 1, 0))
        smtp.return_value.send_message.assert_not_called()
