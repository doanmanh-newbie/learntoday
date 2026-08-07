# app/__init__.py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from .config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    # ✅ Khởi tạo Migrate
    migrate = Migrate(app, db)

    # ✅ Import tất cả models
    from .models import User, Folder, Word, FolderWord, UserWord, RefreshToken, LearningLog

    # ✅ Import tất cả Blueprint
    from .routes import auth_bp, folders_bp, learning_bp, review_bp, words_bp

    # ✅ Đăng ký tất cả Blueprint
    app.register_blueprint(auth_bp)
    app.register_blueprint(folders_bp)
    app.register_blueprint(learning_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(words_bp)

    @app.route('/')
    def health_check():
        return jsonify({"status": "ok", "message": "Backend đang chạy"})

    @app.route('/test-db')
    def test_db():
        try:
            user = User.query.first()
            return jsonify({
                "status": "ok",
                "connected": True,
                "sample_user": user.username if user else None,
                "note": "Bảng users đang trống, nhưng kết nối OK" if not user else None
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "connected": False,
                "message": str(e)
            }), 500

    return app