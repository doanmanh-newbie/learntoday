"""Test bảo mật qua API (đăng nhập/cookie/giới hạn/quên mật khẩu/bài Pass/heartbeat)."""
from datetime import datetime, timedelta
from unittest import mock

from tests.base import ApiTestCase, TestConfig

JSON = {'Content-Type': 'application/json'}
CSRF = {'X-Requested-With': 'fetch'}
EMAIL, PASSWORD = 'kota@example.com', 'secret123'


def login(client, password=PASSWORD, email=EMAIL):
    return client.post('/api/auth/login', json={'email': email, 'password': password})


class RefreshCookieFlow(ApiTestCase):
    def test_login_and_register_set_httponly_cookie_and_keep_refresh_token_out_of_json(self):
        r = self.client.post('/api/auth/register', json={'username': 'kota', 'email': EMAIL, 'password': PASSWORD})
        for resp in (r, login(self.client)):
            self.assertIn(resp.status_code, (200, 201))
            self.assertNotIn('refresh_token', resp.get_json())
            self.assertIn('access_token', resp.get_json())
            header = next(h for h in resp.headers.getlist('Set-Cookie') if h.startswith('refresh_token='))
            for part in ('HttpOnly', 'Path=/api/auth', 'SameSite=Lax'):
                self.assertIn(part, header)

    def test_body_mode_is_opt_in_for_non_browser_clients(self):
        self.app.config['REFRESH_TOKEN_IN_BODY'] = True
        self.register()
        self.assertIn('refresh_token', login(self.client).get_json())

    def test_refresh_with_cookie_needs_csrf_header_then_returns_working_access_token(self):
        self.register()
        no_header = self.client.post('/api/auth/refresh-token', json={})
        self.assertEqual(no_header.status_code, 403)
        ok = self.client.post('/api/auth/refresh-token', json={}, headers=CSRF)
        self.assertEqual(ok.status_code, 200)
        me = self.client.get('/api/auth/me', headers={'Authorization': f"Bearer {ok.get_json()['access_token']}"})
        self.assertEqual(me.status_code, 200)

    def test_the_refresh_cookie_alone_never_authenticates_api_calls(self):
        self.register()                                      # trình duyệt có cookie nhưng KHÔNG gửi Authorization
        self.assertEqual(self.client.get('/api/auth/me').status_code, 401)
        self.assertEqual(self.client.get('/api/folders').status_code, 401)

    def test_refresh_without_any_token_is_400_and_bad_cookie_is_401_and_gets_cleared(self):
        fresh = self.app.test_client()
        self.assertEqual(fresh.post('/api/auth/refresh-token', json={}, headers=CSRF).status_code, 400)
        fresh.set_cookie('refresh_token', 'not-a-jwt', path='/api/auth')
        r = fresh.post('/api/auth/refresh-token', json={}, headers=CSRF)
        self.assertEqual(r.status_code, 401)
        self.assertTrue(any('refresh_token=;' in h and 'Max-Age=0' in h for h in r.headers.getlist('Set-Cookie')))

    def test_logout_works_without_access_token_clears_cookie_and_revokes(self):
        self.register()
        stolen = self.refresh_cookie(self.last_response)
        r = self.client.post('/api/auth/logout', json={}, headers=CSRF)             # KHÔNG có Authorization (đã hết hạn)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any('Max-Age=0' in h for h in r.headers.getlist('Set-Cookie')))
        again = self.app.test_client().post('/api/auth/refresh-token', json={'refresh_token': stolen})
        self.assertEqual(again.status_code, 401)                                    # đã bị thu hồi trên server

    def test_logout_is_idempotent_and_cookie_logout_needs_csrf_header(self):
        self.register()
        self.assertEqual(self.client.post('/api/auth/logout', json={}).status_code, 403)
        self.assertEqual(self.app.test_client().post('/api/auth/logout', json={}).status_code, 200)   # không cookie: vẫn 200

    def test_logout_all_signs_out_every_device(self):
        headers, _ = self.register()
        other = self.app.test_client()
        self.assertEqual(login(other).status_code, 200)
        r = self.client.post('/api/auth/logout', json={'logout_all': True}, headers={**headers, **CSRF})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(other.post('/api/auth/refresh-token', json={}, headers=CSRF).status_code, 401)

    def test_access_token_in_json_is_short_lived_type_access_only(self):
        _, data = self.register()
        r = self.client.post('/api/auth/refresh-token', json={'refresh_token': data['access_token']})
        self.assertEqual(r.status_code, 401)                                        # access token không đổi được thành token mới


class LoginThrottle(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.register()
        self.client = self.app.test_client()                # không mang cookie của lần đăng ký

    def test_eight_wrong_passwords_then_even_the_right_one_is_blocked_with_retry_after(self):
        for _ in range(8):
            self.assertEqual(login(self.client, 'sai-mat-khau').status_code, 401)
        r = login(self.client)
        self.assertEqual(r.status_code, 429)
        self.assertEqual(r.get_json()['code'], 'RATE_LIMITED')
        self.assertGreater(int(r.headers['Retry-After']), 0)
        self.assertNotIn('access_token', r.get_json())

    def test_correct_login_resets_the_failure_counter(self):
        for _ in range(7):
            login(self.client, 'sai')
        self.assertEqual(login(self.client).status_code, 200)
        for _ in range(7):
            self.assertEqual(login(self.client, 'sai').status_code, 401)             # chưa bị khóa vì bộ đếm đã xóa

    def test_attacker_hammering_one_email_does_not_block_another_email(self):
        self.client.post('/api/auth/register', json={'username': 'b', 'email': 'b@example.com', 'password': PASSWORD})
        c = self.app.test_client()
        for _ in range(8):
            login(c, 'sai')
        self.assertEqual(login(c).status_code, 429)
        self.assertEqual(login(c, PASSWORD, 'b@example.com').status_code, 200)

    def test_email_case_does_not_bypass_the_limit(self):
        for variant in ['KOTA@example.com', 'Kota@Example.com'] * 4:
            login(self.client, 'sai', variant)
        self.assertEqual(login(self.client, PASSWORD, 'kota@EXAMPLE.com').status_code, 429)

    def test_one_ip_spraying_many_emails_is_blocked(self):
        for i in range(40):
            self.assertEqual(login(self.client, 'sai', f'nobody{i}@example.com').status_code, 401)
        self.assertEqual(login(self.client, 'sai', 'someone-new@example.com').status_code, 429)

    def test_non_string_credentials_are_400_not_500(self):
        for body in ({'email': 123, 'password': 'x'}, {'email': EMAIL, 'password': ['x']}, {'email': {'a': 1}, 'password': 'x'}):
            self.assertEqual(self.client.post('/api/auth/login', json=body).status_code, 400)

    def test_register_is_rate_limited_per_ip(self):
        c = self.app.test_client()
        codes = [c.post('/api/auth/register', json={'username': f'u{i}', 'email': f'u{i}@example.com', 'password': PASSWORD}).status_code
                 for i in range(11)]
        self.assertEqual(codes[:9], [201] * 9)           # 1 lượt đã dùng ở setUp
        self.assertEqual(codes[-1], 429)

    def test_limits_follow_the_real_client_ip_behind_a_trusted_proxy(self):
        from app import create_app

        class Proxied(TestConfig):
            TRUSTED_PROXIES = 1

        app2 = create_app(Proxied)
        with app2.app_context():
            self.db.create_all()
            c = app2.test_client()

            def attempt(password, ip):
                return c.post('/api/auth/login', json={'email': EMAIL, 'password': password}, headers={'X-Forwarded-For': ip})

            c.post('/api/auth/register', json={'username': 'kota', 'email': EMAIL, 'password': PASSWORD},
                   headers={'X-Forwarded-For': '9.9.9.9'})
            for _ in range(8):
                self.assertEqual(attempt('sai', '1.1.1.1').status_code, 401)
            blocked = attempt(PASSWORD, '1.1.1.1')
            other_ip = attempt(PASSWORD, '2.2.2.2')
            self.db.session.remove()
            self.db.drop_all()
        self.assertEqual(blocked.status_code, 429)                   # IP 1.1.1.1 bị khóa theo IP THẬT, không phải IP của proxy
        self.assertEqual(other_ip.status_code, 200)                  # IP khác của cùng tài khoản không bị ảnh hưởng


class PasswordResetFlow(ApiTestCase):
    def setUp(self):
        super().setUp()
        self.register()
        self.client = self.app.test_client()
        self.app.config['FRONTEND_URL'] = 'https://app.example.com'

    def forgot(self, email=EMAIL):
        return self.client.post('/api/auth/forgot-password', json={'email': email})

    def token_from_mail(self, sent):
        link = next(line for line in sent.call_args[0][2].splitlines() if line.startswith('https://'))
        self.assertTrue(link.startswith('https://app.example.com/reset-password#token='))     # token ở sau dấu #
        return link.split('#token=', 1)[1]

    def test_email_contains_link_with_fragment_token_and_response_is_neutral(self):
        with mock.patch('app.routes.auth.send_email') as sent:
            known, unknown = self.forgot(), self.forgot('nobody@example.com')
        self.assertEqual(known.get_json(), unknown.get_json())
        self.assertNotIn('reset_token', known.get_json())
        self.assertEqual(sent.call_count, 1)                            # email không tồn tại thì không gửi gì
        self.assertEqual(sent.call_args[0][0], EMAIL)
        self.assertIn('15 phút', sent.call_args[0][2])
        self.assertTrue(self.token_from_mail(sent))

    def test_reset_works_once_and_old_password_stops_working(self):
        with mock.patch('app.routes.auth.send_email') as sent:
            self.forgot()
        token = self.token_from_mail(sent)
        ok = self.client.post('/api/auth/reset-password', json={'reset_token': token, 'new_password': 'brand-new-123'})
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(login(self.client, PASSWORD).status_code, 401)
        self.assertEqual(login(self.client, 'brand-new-123').status_code, 200)
        again = self.client.post('/api/auth/reset-password', json={'reset_token': token, 'new_password': 'another-pass-456'})
        self.assertEqual(again.status_code, 401)                        # dùng lại link -> bị từ chối
        self.assertEqual(login(self.client, 'brand-new-123').status_code, 200)      # và mật khẩu không bị đổi lần 2

    def test_reset_signs_out_other_devices(self):
        other = self.app.test_client()
        login(other)
        with mock.patch('app.routes.auth.send_email') as sent:
            self.forgot()
        self.client.post('/api/auth/reset-password', json={'reset_token': self.token_from_mail(sent), 'new_password': 'brand-new-123'})
        self.assertEqual(other.post('/api/auth/refresh-token', json={}, headers=CSRF).status_code, 401)

    def test_bad_tokens_and_weak_password(self):
        for token in ('garbage', '', None, 123, 'a.b.c'):
            r = self.client.post('/api/auth/reset-password', json={'reset_token': token, 'new_password': 'brand-new-123'})
            self.assertIn(r.status_code, (400, 401))
        with mock.patch('app.routes.auth.send_email') as sent:
            self.forgot()
        weak = self.client.post('/api/auth/reset-password', json={'reset_token': self.token_from_mail(sent), 'new_password': '1234567'})
        self.assertEqual(weak.status_code, 400)

    def test_access_and_refresh_tokens_cannot_reset_passwords(self):
        headers, data = self.register(username='x', email='x@example.com')
        r = self.client.post('/api/auth/reset-password', json={'reset_token': data['access_token'], 'new_password': 'brand-new-123'})
        self.assertEqual(r.status_code, 401)

    def test_email_failure_or_missing_smtp_never_breaks_or_leaks(self):
        from app.services.email_service import EmailError, EmailNotConfigured
        with mock.patch('app.routes.auth.send_email', side_effect=EmailError('boom')):
            self.assertEqual(self.forgot().status_code, 200)
        with mock.patch('app.routes.auth.send_email', side_effect=EmailNotConfigured('no smtp')):
            self.assertEqual(self.forgot().status_code, 200)

    def test_rate_limits_per_email_are_silent_and_per_ip_return_429(self):
        with mock.patch('app.routes.auth.send_email') as sent:
            codes = [self.forgot().status_code for _ in range(5)]
            blocked = self.forgot()
        self.assertEqual(codes, [200] * 5)
        self.assertEqual(sent.call_count, 3)                            # chỉ 3 email/giờ cho 1 địa chỉ, 2 lượt sau im lặng bỏ qua
        self.assertEqual(blocked.status_code, 429)

    def test_forgot_validation(self):
        self.assertEqual(self.client.post('/api/auth/forgot-password', json={}).status_code, 400)
        self.assertEqual(self.client.post('/api/auth/forgot-password', json={'email': 123}).status_code, 400)


class PassTestApi(ApiTestCase):
    def setUp(self):
        super().setUp()
        from app.models import UserMilestone
        self.headers, data = self.register()
        self.db.session.add(UserMilestone(id='m50', user_id=data['user']['id'], milestone=50, reached_at=datetime.utcnow() - timedelta(days=2),
                                          test_available_at=datetime.utcnow() - timedelta(hours=1)))
        self.db.session.add(UserMilestone(id='m100', user_id=data['user']['id'], milestone=100, reached_at=datetime.utcnow(),
                                          test_available_at=datetime.utcnow() + timedelta(hours=20)))
        self.db.session.commit()

    def get(self, mid='m50'):
        return self.client.get(f'/api/pass-test/{mid}', headers=self.headers)

    def submit(self, answers, mid='m50'):
        return self.client.post(f'/api/pass-test/{mid}/submit', json={'answers': answers}, headers=self.headers)

    def right(self):
        from app.services.pass_test_logic import get_passage_for_milestone
        return {q['id']: q['correct_index'] for q in get_passage_for_milestone(50)['questions']}

    def test_test_payload_never_contains_answers(self):
        r = self.get()
        self.assertEqual(r.status_code, 200)
        text = r.get_data(as_text=True)
        self.assertNotIn('correct_index', text)
        self.assertNotIn('explanation', text)
        self.assertEqual(len(r.get_json()['test']['questions']), 5)

    def test_status_listing_does_not_leak_answers_either(self):
        text = self.client.get('/api/pass-test/status', headers=self.headers).get_data(as_text=True)
        self.assertNotIn('correct_index', text)

    def test_server_grades_and_reveals_answers_only_after_submitting(self):
        r = self.submit(self.right())
        body = r.get_json()
        self.assertEqual((r.status_code, body['score'], body['correct_count']), (200, 100, 5))
        self.assertIn('correct_index', body['results'][0])
        self.assertIn('explanation', body['results'][0])

    def test_one_attempt_only(self):
        self.assertEqual(self.submit({}).status_code, 200)
        self.assertEqual(self.submit(self.right()).status_code, 409)
        self.assertEqual(self.get().status_code, 409)
        listing = self.client.get('/api/pass-test/status', headers=self.headers).get_json()
        done = next(m for m in listing['milestones'] if m['id'] == 'm50')
        self.assertEqual(done['score'], 0)                               # điểm của lần nộp đầu không bị ghi đè

    def test_garbage_answers_score_zero(self):
        for bad in (None, [], 'x', {'q1': True, 'q2': 'abc', 'q3': -1, 'q4': 99, 'q5': None}):
            from app.models import UserMilestone
            UserMilestone.query.filter_by(id='m50').update({'tested_at': None, 'score': None})
            self.db.session.commit()
            r = self.submit(bad)
            self.assertEqual((r.status_code, r.get_json()['score']), (200, 0), repr(bad))

    def test_not_ready_test_is_locked_for_both_get_and_submit(self):
        self.assertEqual(self.get('m100').status_code, 403)
        self.assertEqual(self.submit(self.right(), 'm100').status_code, 403)

    def test_other_users_cannot_open_or_submit_my_test(self):
        other, _ = self.register(username='b', email='b@example.com')
        self.assertEqual(self.client.get('/api/pass-test/m50', headers=other).status_code, 404)
        self.assertEqual(self.client.post('/api/pass-test/m50/submit', json={'answers': {}}, headers=other).status_code, 404)


class StudyHeartbeat(ApiTestCase):
    def beat(self, headers, **body):
        return self.client.post('/api/study/heartbeat', json=body or {'minutes': 1}, headers=headers)

    def test_spamming_the_endpoint_credits_one_minute_total(self):
        headers, _ = self.register()
        results = [self.beat(headers, minutes=30).get_json() for _ in range(25)]
        self.assertEqual([r['credited_minutes'] for r in results], [1] + [0] * 24)
        self.assertEqual(results[-1]['study_minutes_today'], 1)
        self.assertFalse(results[-1]['goal_met'])
        self.assertEqual(results[-1]['new_badges'], [])

    def test_a_minute_that_really_passed_is_credited_once(self):
        from app.models import User
        headers, _ = self.register()
        self.beat(headers)
        u = User.query.first()
        u.last_heartbeat_at = datetime.utcnow() - timedelta(seconds=61)
        self.db.session.commit()
        self.assertEqual(self.beat(headers).get_json()['study_minutes_today'], 2)
        self.assertEqual(self.beat(headers).get_json()['study_minutes_today'], 2)

    def test_long_absence_credits_at_most_one_minute(self):
        from app.models import User
        headers, _ = self.register()
        self.beat(headers)
        User.query.first().last_heartbeat_at = datetime.utcnow() - timedelta(hours=5)
        self.db.session.commit()
        self.assertEqual(self.beat(headers).get_json()['credited_minutes'], 1)

    def test_garbage_minutes_is_400(self):
        headers, _ = self.register()
        self.assertEqual(self.beat(headers, minutes='abc').status_code, 400)
        self.assertEqual(self.beat(headers, minutes=None).status_code, 400)
