# app/__init__.py
import logging
import time

from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

from .config import Config, validate_config

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

db = SQLAlchemy()
migrate = Migrate()


def create_app(config_object=Config):
    """
    config_object: truyền 1 lớp/dict cấu hình khác khi test (vd: SQLite trong bộ nhớ).
    """
    app = Flask(__name__)
    app.config.from_object(config_object)

    if config_object is Config:
        validate_config(Config)        # dừng sớm, báo rõ nếu thiếu cấu hình DB

    proxies = int(app.config.get('TRUSTED_PROXIES', 0) or 0)
    if proxies > 0:                                 # tin X-Forwarded-For của đúng N proxy -> request.remote_addr là IP thật
        from werkzeug.middleware.proxy_fix import ProxyFix
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=proxies, x_proto=proxies, x_host=proxies)

    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    db.init_app(app)
    migrate.init_app(app, db)

    # Import tất cả models (để Alembic/SQLAlchemy nhìn thấy metadata)
    from .models import User, Folder, Word, FolderWord, UserWord, RefreshToken, LearningLog, SearchHistory, UserMilestone, DictionaryEntry, LexiconEntry  # noqa: F401

    from .routes import (
        auth_bp, folders_bp, learning_bp, review_bp, words_bp,
        profile_bp, history_bp, search_bp, translate_bp, study_bp,
        pass_test_bp, ai_practice_bp, dictionary_bp,
    )
    for bp in (auth_bp, folders_bp, learning_bp, review_bp, words_bp, profile_bp,
               history_bp, search_bp, translate_bp, study_bp, pass_test_bp, ai_practice_bp, dictionary_bp):
        app.register_blueprint(bp)

    from .utils.errors import register_error_handlers
    register_error_handlers(app)

    @app.route('/')
    def root():
        return jsonify({"status": "ok", "message": "Backend đang chạy"})

    @app.route('/api/health')
    @app.route('/test-db')          # giữ đường dẫn cũ cho tương thích
    def health():
        """Kiểm tra kết nối DB thật sự (SELECT 1) + đo độ trễ."""
        started = time.perf_counter()
        try:
            db.session.execute(text('SELECT 1'))
            latency = round((time.perf_counter() - started) * 1000)
            return jsonify({"status": "ok", "connected": True, "latency_ms": latency})
        except Exception as e:  # noqa: BLE001
            db.session.rollback()
            app.logger.error('Health check DB lỗi: %s', e)
            body = {"status": "error", "connected": False,
                    "message": "Không kết nối được database. Chạy: python scripts/diagnose_db.py"}
            if app.debug or app.config.get('EXPOSE_ERRORS'):
                body["detail"] = str(getattr(e, 'orig', None) or e)
            return jsonify(body), 503

    return app
