"""Quản lý Refresh Token trong database (STT 2)."""
import datetime
import jwt
import uuid

from app import db
from app.models import RefreshToken
from app.utils.auth import generate_token, _secret


def decode_refresh_token(token: str):
    """Giải mã Refresh Token JWT, trả về user_id nếu hợp lệ (phải đúng loại 'refresh')."""
    try:
        payload = jwt.decode(token, _secret(), algorithms=['HS256'])
    except jwt.InvalidTokenError:
        return None
    if payload.get('type') != 'refresh':
        return None
    return payload.get('user_id')


def store_refresh_token(user_id: str, refresh_token: str, days: int = 7):
    """Lưu Refresh Token mới vào DB."""
    record = RefreshToken(
        id=str(uuid.uuid4()),
        user_id=str(user_id),
        token=refresh_token,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=days),
        is_revoked=False,
    )
    db.session.add(record)
    return record


def revoke_refresh_token(token: str):
    """Thu hồi một Refresh Token cụ thể."""
    record = RefreshToken.query.filter_by(token=token, is_revoked=False).first()
    if record:
        record.is_revoked = True
        return True
    return False


def purge_stale_tokens(user_id: str):
    """Xóa Refresh Token đã hết hạn/đã thu hồi của user - tránh bảng refresh_tokens phình mãi."""
    RefreshToken.query.filter(
        RefreshToken.user_id == str(user_id),
        db.or_(RefreshToken.is_revoked.is_(True), RefreshToken.expires_at < datetime.datetime.utcnow()),
    ).delete(synchronize_session=False)


def revoke_all_user_tokens(user_id: str):
    """Thu hồi tất cả Refresh Token của user (dùng khi logout all)."""
    tokens = RefreshToken.query.filter_by(user_id=str(user_id), is_revoked=False).all()
    for record in tokens:
        record.is_revoked = True


def validate_refresh_token(token: str):
    """
    Kiểm tra Refresh Token: JWT hợp lệ + còn trong DB + chưa thu hồi + chưa hết hạn.
    Trả về user_id hoặc None.
    """
    user_id = decode_refresh_token(token)
    if not user_id:
        return None

    record = RefreshToken.query.filter_by(token=token).first()
    if not record or record.is_revoked:
        return None
    if record.expires_at < datetime.datetime.utcnow():
        return None
    if str(record.user_id) != str(user_id):
        return None

    return str(user_id)


def refresh_access_token(refresh_token: str):
    """Cấp Access Token mới nếu Refresh Token hợp lệ."""
    user_id = validate_refresh_token(refresh_token)
    if not user_id:
        return None
    return generate_token(user_id)
