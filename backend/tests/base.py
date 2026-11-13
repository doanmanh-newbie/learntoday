"""Nền tảng test dùng unittest (không cần cài thêm gì): chạy API trên SQLite trong bộ nhớ.

Chạy:  python -m unittest discover -s tests -v
"""
import hashlib
import os
import sys
import types
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:                                    # máy dev thật: dùng bcrypt thật
    import bcrypt  # noqa: F401
except Exception:                        # môi trường thiếu bcrypt: dùng bản giả CHỈ ĐỂ TEST
    shim = types.ModuleType('bcrypt')
    shim.gensalt = lambda rounds=10: b'salt'
    shim.hashpw = lambda pw, salt: b'h$' + hashlib.sha256(pw).hexdigest().encode()
    shim.checkpw = lambda pw, hashed: hashed == b'h$' + hashlib.sha256(pw).hexdigest().encode()
    sys.modules['bcrypt'] = shim


class TestConfig:
    TESTING = True
    SECRET_KEY = 'test'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {}
    JWT_SECRET = 'test-secret-test-secret-test-secret-123456'
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    JWT_REFRESH_TOKEN_EXPIRES = 604800
    CORS_ORIGINS = ['http://localhost:5173']
    EXPOSE_ERRORS = False


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        from app import create_app, db
        self.db = db
        self.app = create_app(TestConfig)
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        self.client = self.app.test_client()
        from app.utils.rate_limit import auth_limiter
        auth_limiter.reset()                      # bộ đếm giới hạn đăng nhập/đăng ký nằm trong bộ nhớ, dùng chung giữa các test

    def tearDown(self):
        self.db.session.remove()
        self.db.drop_all()
        self.ctx.pop()

    # ---- tiện ích ----
    def register(self, username='kota', email='Kota@Example.com', password='secret123'):
        r = self.client.post('/api/auth/register', json={'username': username, 'email': email, 'password': password})
        self.assertEqual(r.status_code, 201, r.get_json())
        data = r.get_json()
        self.last_response = r
        return {'Authorization': f"Bearer {data['access_token']}"}, data

    @staticmethod
    def refresh_cookie(response):
        """Giá trị cookie refresh_token trong phản hồi (refresh token KHÔNG còn nằm trong JSON)."""
        for header in response.headers.getlist('Set-Cookie'):
            if header.startswith('refresh_token='):
                return header.split(';', 1)[0].split('=', 1)[1]
        return None

    def seed_folder(self):
        """1 folder hệ thống 'Du lịch' với 3 từ."""
        from app.models import Folder, Word, FolderWord
        self.db.session.add(Folder(id='f1', name='Du lịch', type='system', word_count=3))
        for i, (w, vi) in enumerate([('itinerary', 'lịch trình'), ('passport', 'hộ chiếu'), ('luggage', 'hành lý')]):
            self.db.session.add(Word(id=f'w{i}', word=w, meaning=vi, word_type='noun',
                                     example=f'My {w} is ready.', example_meaning=vi))
            self.db.session.add(FolderWord(id=f'fw{i}', folder_id='f1', word_id=f'w{i}', order_index=i))
        self.db.session.commit()
