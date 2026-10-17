"""Kiểm tra chuỗi migration Alembic: chạy từ DB trống tới head và so với models (phát hiện lệch schema).

Đây chính là kiểm tra cần chạy sau khi dựng lại Supabase: nếu `flask db upgrade` lỗi hoặc schema lệch
models thì API sẽ lỗi 500 khi truy vấn cột không tồn tại.
"""
import os
import tempfile
import unittest

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from flask_migrate import upgrade, downgrade

from tests.base import TestConfig


class MigrationChain(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        self.tmp.close()

        class Cfg(TestConfig):
            SQLALCHEMY_DATABASE_URI = f'sqlite:///{self.tmp.name}'

        from app import create_app
        self.app = create_app(Cfg)
        self.migrations_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'migrations')

    def tearDown(self):
        os.unlink(self.tmp.name)

    def test_single_head(self):
        from alembic.config import Config as AlembicConfig
        cfg = AlembicConfig(os.path.join(self.migrations_dir, 'alembic.ini'))
        cfg.set_main_option('script_location', self.migrations_dir)
        heads = ScriptDirectory.from_config(cfg).get_heads()
        self.assertEqual(len(heads), 1, f'Có nhiều head migration (nhánh rẽ): {heads}')

    def test_upgrade_matches_models_and_downgrades(self):
        from app import db
        with self.app.app_context():
            upgrade(directory=self.migrations_dir)
            with db.engine.connect() as conn:
                diff = compare_metadata(MigrationContext.configure(conn), db.metadata)
            # Bỏ qua khác biệt kiểu dữ liệu và ON DELETE của khóa ngoại (SQLite không ép FK, migration chỉ
            # đổi FK trên Postgres) - chỉ quan tâm bảng/cột/index/unique bị thiếu hoặc thừa.
            real = [d for d in diff if (d[0] if isinstance(d, tuple) else d[0][0]) not in ('modify_type', 'modify_nullable', 'modify_default', 'add_fk', 'remove_fk')]
            self.assertEqual(real, [], f'Migration lệch models: {real}')
            downgrade(directory=self.migrations_dir, revision='d65263a1aef2')
            downgrade(directory=self.migrations_dir, revision='base')
