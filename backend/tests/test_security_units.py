"""Test các phần bảo mật thuần Python (không cần database): cấu hình production, giới hạn tần suất,
token đặt lại mật khẩu dùng một lần, cookie refresh token, chấm bài Pass ở server."""
import hashlib
import os
import sys
import types
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import bcrypt  # noqa: F401
except Exception:                        # môi trường thiếu bcrypt: bản giả CHỈ ĐỂ TEST (giống tests/base.py)
    shim = types.ModuleType('bcrypt')
    shim.gensalt = lambda rounds=10: b'salt'
    shim.hashpw = lambda pw, salt: b'h$' + hashlib.sha256(pw).hexdigest().encode()
    shim.checkpw = lambda pw, hashed: hashed == b'h$' + hashlib.sha256(pw).hexdigest().encode()
    sys.modules['bcrypt'] = shim

from flask import Flask, jsonify, request  # noqa: E402

from app import config as cfg  # noqa: E402
from app.services import pass_test_logic as ptl  # noqa: E402
from app.utils import auth as auth_utils  # noqa: E402
from app.utils import refresh_cookie as rc  # noqa: E402
from app.utils.rate_limit import SlidingWindowLimiter  # noqa: E402

STRONG = 'x' * 40


def make_config(**over):
    base = dict(SQLALCHEMY_DATABASE_URI='sqlite://', JWT_SECRET=STRONG, SECRET_KEY=STRONG, EXPOSE_ERRORS=False,
                IS_PRODUCTION=True, REFRESH_COOKIE_SECURE=True, REFRESH_COOKIE_SAMESITE='Lax')
    base.update(over)
    return type('Cfg', (), base)


class ProductionConfig(unittest.TestCase):
    def test_strong_production_config_passes(self):
        cfg.validate_config(make_config())

    def test_production_refuses_weak_or_default_secrets(self):
        for bad in ('dev-secret-key', '', 'short', 'x' * 31):
            with self.assertRaises(RuntimeError) as cm:
                cfg.validate_config(make_config(JWT_SECRET=bad))
            self.assertIn('JWT_SECRET', str(cm.exception))

    def test_production_refuses_other_unsafe_settings(self):
        for over, word in [(dict(SECRET_KEY='dev-secret-key'), 'SECRET_KEY'), (dict(EXPOSE_ERRORS=True), 'EXPOSE_ERRORS'),
                           (dict(REFRESH_COOKIE_SECURE=False), 'REFRESH_COOKIE_SECURE')]:
            with self.assertRaises(RuntimeError) as cm:
                cfg.validate_config(make_config(**over))
            self.assertIn(word, str(cm.exception))

    def test_all_problems_reported_at_once(self):
        with self.assertRaises(RuntimeError) as cm:
            cfg.validate_config(make_config(JWT_SECRET='x', EXPOSE_ERRORS=True))
        self.assertIn('JWT_SECRET', str(cm.exception))
        self.assertIn('EXPOSE_ERRORS', str(cm.exception))

    def test_development_only_warns(self):
        with self.assertLogs('app.config', level='WARNING') as logs:
            cfg.validate_config(make_config(JWT_SECRET='dev-secret-key', IS_PRODUCTION=False, REFRESH_COOKIE_SECURE=False))
        self.assertIn('JWT_SECRET', '\n'.join(logs.output))

    def test_samesite_none_requires_secure_even_in_development(self):
        with self.assertRaises(RuntimeError):
            cfg.validate_config(make_config(IS_PRODUCTION=False, REFRESH_COOKIE_SECURE=False, REFRESH_COOKIE_SAMESITE='None'))
        with self.assertRaises(RuntimeError):
            cfg.validate_config(make_config(REFRESH_COOKIE_SAMESITE='Weird'))

    def test_missing_database_is_still_reported(self):
        with self.assertRaises(RuntimeError):
            cfg.validate_config(make_config(SQLALCHEMY_DATABASE_URI=None))


class LoginStyleLimiter(unittest.TestCase):
    def test_only_recorded_failures_count_and_success_clears(self):
        lim = SlidingWindowLimiter()
        for _ in range(3):
            self.assertEqual(lim.blocked('k', 3, 900), (False, 0))     # hỏi nhiều lần KHÔNG tự tính lượt
        for _ in range(3):
            lim.record('k')
        blocked, wait = lim.blocked('k', 3, 900)
        self.assertTrue(blocked)
        self.assertTrue(1 <= wait <= 901)
        lim.forget('k')
        self.assertEqual(lim.blocked('k', 3, 900), (False, 0))

    def test_keys_are_independent(self):
        lim = SlidingWindowLimiter()
        for _ in range(3):
            lim.record('a@x')
        self.assertTrue(lim.blocked('a@x', 3, 900)[0])
        self.assertFalse(lim.blocked('b@x', 3, 900)[0])

    def test_window_expires(self):
        from unittest import mock
        lim = SlidingWindowLimiter()
        with mock.patch('app.utils.rate_limit.time.monotonic', return_value=1000.0):
            for _ in range(3):
                lim.record('k', 60)
            self.assertTrue(lim.blocked('k', 3, 60)[0])
        with mock.patch('app.utils.rate_limit.time.monotonic', return_value=1061.0):
            self.assertFalse(lim.blocked('k', 3, 60)[0])

    def test_check_still_counts_each_allowed_call(self):
        lim = SlidingWindowLimiter()
        self.assertEqual([lim.check('k', 2, 60)[0] for _ in range(3)], [True, True, False])

    def test_stale_keys_are_pruned_so_memory_cannot_grow_forever(self):
        from unittest import mock
        lim = SlidingWindowLimiter()
        lim.PRUNE_ABOVE = 10
        with mock.patch('app.utils.rate_limit.time.monotonic', return_value=0.0):
            for i in range(20):
                lim.record(f'user{i}', 60)
        with mock.patch('app.utils.rate_limit.time.monotonic', return_value=500.0):
            lim.record('fresh', 60)
        self.assertLessEqual(len(lim._hits), 2)


class ResetToken(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['JWT_SECRET'] = STRONG
        self.ctx = self.app.app_context()
        self.ctx.push()
        self.addCleanup(self.ctx.pop)

    def test_token_valid_until_password_changes(self):
        old_hash = auth_utils.hash_password('old-password-1')
        token = auth_utils.generate_reset_token('u1', old_hash)
        payload = auth_utils.read_reset_token(token)
        self.assertEqual(payload['user_id'], 'u1')
        self.assertTrue(auth_utils.reset_token_unused(payload, old_hash))
        new_hash = auth_utils.hash_password('brand-new-pass-2')
        self.assertFalse(auth_utils.reset_token_unused(payload, new_hash))      # đã đổi mật khẩu -> token cũ vô hiệu

    def test_other_tokens_are_not_reset_tokens(self):
        access = auth_utils.generate_token('u1')
        refresh = auth_utils.generate_refresh_token('u1')
        self.assertIsNone(auth_utils.read_reset_token(access))
        self.assertIsNone(auth_utils.read_reset_token(refresh))
        self.assertIsNone(auth_utils.read_reset_token('garbage'))
        self.assertIsNone(auth_utils.decode_token(auth_utils.generate_reset_token('u1', 'h')))   # và ngược lại

    def test_token_without_fingerprint_is_rejected(self):
        legacy = auth_utils._encode({'user_id': 'u1', 'purpose': 'reset_password'}, __import__('datetime').timedelta(minutes=5))
        payload = auth_utils.read_reset_token(legacy)
        self.assertFalse(auth_utils.reset_token_unused(payload, 'any-hash'))


class RefreshCookie(unittest.TestCase):
    def make_app(self, **config):
        app = Flask(__name__)
        app.config.update(JWT_REFRESH_TOKEN_EXPIRES=604800, **config)

        @app.route('/set')
        def set_():
            return rc.set_refresh_cookie(jsonify(ok=True), 'TOKEN123')

        @app.route('/clear')
        def clear():
            return rc.clear_refresh_cookie(jsonify(ok=True))

        @app.route('/read', methods=['POST'])
        def read():
            token, from_cookie = rc.read_refresh_token(request.get_json(silent=True) or {})
            return jsonify(token=token, from_cookie=from_cookie, csrf_ok=rc.csrf_header_ok(from_cookie))
        return app

    def cookie_header(self, response):
        return response.headers.getlist('Set-Cookie')[0]

    def test_cookie_is_httponly_scoped_and_expires_in_7_days(self):
        header = self.cookie_header(self.make_app().test_client().get('/set'))
        self.assertTrue(header.startswith('refresh_token=TOKEN123'))
        for part in ('HttpOnly', 'Path=/api/auth', 'SameSite=Lax', 'Max-Age=604800'):
            self.assertIn(part, header)
        self.assertNotIn('Secure', header)

    def test_production_style_attributes(self):
        app = self.make_app(REFRESH_COOKIE_SECURE=True, REFRESH_COOKIE_SAMESITE='None', REFRESH_COOKIE_DOMAIN='example.com')
        header = self.cookie_header(app.test_client().get('/set'))
        for part in ('Secure', 'SameSite=None', 'Domain=example.com', 'HttpOnly'):
            self.assertIn(part, header)

    def test_clear_cookie_uses_same_scope_so_the_browser_actually_removes_it(self):
        header = self.cookie_header(self.make_app().test_client().get('/clear'))
        self.assertIn('Max-Age=0', header)
        self.assertIn('Path=/api/auth', header)
        self.assertIn('HttpOnly', header)

    def test_body_token_wins_and_needs_no_csrf_header(self):
        c = self.make_app().test_client()
        c.set_cookie('refresh_token', 'COOKIE', path='/')
        body = c.post('/read', json={'refresh_token': 'BODY'}).get_json()
        self.assertEqual(body, {'token': 'BODY', 'from_cookie': False, 'csrf_ok': True})

    def test_cookie_token_requires_custom_header(self):
        c = self.make_app().test_client()
        c.set_cookie('refresh_token', 'COOKIE', path='/')
        self.assertEqual(c.post('/read', json={}).get_json(), {'token': 'COOKIE', 'from_cookie': True, 'csrf_ok': False})
        ok = c.post('/read', json={}, headers={'X-Requested-With': 'fetch'}).get_json()
        self.assertTrue(ok['csrf_ok'])
        wrong = c.post('/read', json={}, headers={'X-Requested-With': 'other'}).get_json()
        self.assertFalse(wrong['csrf_ok'])

    def test_no_token_anywhere(self):
        self.assertEqual(self.make_app().test_client().post('/read', json={}).get_json(),
                         {'token': None, 'from_cookie': False, 'csrf_ok': True})


class PassTestGrading(unittest.TestCase):
    def setUp(self):
        self.test = ptl.get_passage_for_milestone(100)
        self.right = {q['id']: q['correct_index'] for q in self.test['questions']}

    def test_client_copy_has_no_answers_or_explanations_anywhere(self):
        public = ptl.public_test(self.test)
        self.assertEqual(len(public['questions']), 5)
        for q in public['questions']:
            self.assertEqual(sorted(q), ['id', 'options', 'question'])
        text = repr(public)
        self.assertNotIn('correct_index', text)
        self.assertNotIn('explanation', text)
        self.assertNotIn('evidence', text)
        self.assertIn('correct_index', self.test['questions'][0])        # bản gốc không bị sửa
        self.assertEqual(public['time_limit_minutes'], 15)

    def test_perfect_and_wrong_scores(self):
        correct, results = ptl.grade_test(self.test, self.right)
        self.assertEqual(correct, 5)
        self.assertTrue(all(r['correct'] for r in results))
        wrong = {k: (v + 1) % 4 for k, v in self.right.items()}
        self.assertEqual(ptl.grade_test(self.test, wrong)[0], 0)

    def test_results_after_submit_include_answer_and_explanation(self):
        _, results = ptl.grade_test(self.test, {})
        self.assertEqual(sorted(results[0]), ['correct', 'correct_index', 'explanation', 'question_id'])
        self.assertFalse(any(r['correct'] for r in results))

    def test_garbage_answers_count_as_wrong_and_never_crash(self):
        q1 = self.test['questions'][0]
        for bad in (True, 1.0, '0', None, [0], {'a': 1}, -1, 99):
            answers = {q1['id']: bad}
            self.assertEqual(ptl.grade_test(self.test, answers)[0], 0, repr(bad))
        for bad_container in (None, [], 'x', 5):
            self.assertEqual(ptl.grade_test(self.test, bad_container)[0], 0)

    def test_true_is_not_accepted_as_index_one(self):
        q = next(q for q in self.test['questions'] if q['correct_index'] == 1)        # câu có đáp án đúng là lựa chọn thứ 2
        self.assertEqual(ptl.grade_test(self.test, {q['id']: True})[0], 0)             # True == 1 trong Python nhưng không phải số nguyên hợp lệ
        self.assertEqual(ptl.grade_test(self.test, {q['id']: 1})[0], 1)


if __name__ == '__main__':
    unittest.main()
