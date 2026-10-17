# app/utils/errors.py
"""
Xử lý lỗi tập trung -> LUÔN trả JSON (frontend gọi res.json() nên trước đây gặp
trang lỗi HTML của Flask là vỡ), và KHÔNG để lộ chi tiết kết nối DB (host, user...)
ra client.
"""
import logging

from flask import current_app, jsonify
from sqlalchemy.exc import DBAPIError, IntegrityError, OperationalError, SQLAlchemyError, TimeoutError as PoolTimeoutError
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


def _detail(exc):
    """Chỉ trả chi tiết lỗi khi đang debug / EXPOSE_ERRORS=1."""
    if current_app.debug or current_app.config.get('EXPOSE_ERRORS'):
        return str(getattr(exc, 'orig', None) or exc)
    return None


def _json_error(message, status, code, exc=None):
    body = {'message': message, 'code': code}
    detail = _detail(exc) if exc is not None else None
    if detail:
        body['detail'] = detail
    return jsonify(body), status


def _rollback():
    from app import db
    try:
        db.session.rollback()
    except Exception:  # noqa: BLE001 - đừng để lỗi rollback che lỗi gốc
        logger.exception('rollback thất bại')


def register_error_handlers(app):
    @app.errorhandler(PoolTimeoutError)
    def handle_pool_timeout(exc):
        _rollback()
        logger.error('Hết kết nối trong pool (QueuePool timeout): %s', exc)
        return _json_error('Hệ thống đang bận, vui lòng thử lại sau ít giây.', 503, 'DB_POOL_BUSY', exc)

    @app.errorhandler(OperationalError)
    def handle_operational(exc):
        # Mất kết nối / sai mật khẩu / project Supabase bị pause / pooler đầy...
        _rollback()
        logger.error('Lỗi kết nối database: %s', getattr(exc, 'orig', exc))
        return _json_error(
            'Không kết nối được cơ sở dữ liệu, vui lòng thử lại sau ít phút.', 503, 'DB_UNAVAILABLE', exc
        )

    @app.errorhandler(IntegrityError)
    def handle_integrity(exc):
        _rollback()
        logger.warning('Vi phạm ràng buộc dữ liệu: %s', getattr(exc, 'orig', exc))
        return _json_error('Dữ liệu bị trùng hoặc không hợp lệ.', 409, 'DB_CONFLICT', exc)

    @app.errorhandler(DBAPIError)
    def handle_dbapi(exc):
        _rollback()
        logger.error('Lỗi DBAPI: %s', getattr(exc, 'orig', exc))
        status, code = (503, 'DB_UNAVAILABLE') if exc.connection_invalidated else (500, 'DB_ERROR')
        return _json_error('Lỗi cơ sở dữ liệu.', status, code, exc)

    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy(exc):
        _rollback()
        logger.exception('Lỗi SQLAlchemy')
        return _json_error('Lỗi cơ sở dữ liệu.', 500, 'DB_ERROR', exc)

    @app.errorhandler(HTTPException)
    def handle_http(exc):
        return _json_error(exc.description or exc.name, exc.code or 500, exc.name.upper().replace(' ', '_'))

    @app.errorhandler(Exception)
    def handle_unexpected(exc):
        _rollback()
        logger.exception('Lỗi không mong đợi')
        return _json_error('Lỗi máy chủ, vui lòng thử lại.', 500, 'INTERNAL_ERROR', exc)
