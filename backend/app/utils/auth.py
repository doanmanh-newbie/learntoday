import datetime
import hashlib
import os
import uuid

import bcrypt
import jwt


def _secret() -> str:
    """Một nguồn duy nhất cho JWT secret (trước đây rải 5 chỗ os.getenv với mặc định yếu)."""
    try:
        from flask import current_app
        return current_app.config['JWT_SECRET']
    except (RuntimeError, KeyError):
        return os.getenv('JWT_SECRET', 'dev-secret-key')


def _lifetime(key: str, default_seconds: int) -> datetime.timedelta:
    try:
        from flask import current_app
        return datetime.timedelta(seconds=int(current_app.config.get(key, default_seconds)))
    except RuntimeError:
        return datetime.timedelta(seconds=default_seconds)


def hash_password(password: str) -> str:
    """Mã hóa password bằng bcrypt trước khi lưu vào database"""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def check_password(password: str, hashed: str) -> bool:
    """So sánh password người dùng nhập với password đã mã hóa"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except ValueError:           # hash hỏng/không đúng định dạng
        return False


def _encode(payload: dict, lifetime: datetime.timedelta) -> str:
    now = datetime.datetime.utcnow()
    payload = {**payload, 'iat': now, 'exp': now + lifetime}
    return jwt.encode(payload, _secret(), algorithm='HS256')


def generate_token(user_id: str) -> str:
    return _encode({'user_id': str(user_id), 'type': 'access'}, _lifetime('JWT_ACCESS_TOKEN_EXPIRES', 3600))


def generate_refresh_token(user_id: str) -> str:
    """Refresh Token (STT 2), hết hạn sau 7 ngày.

    'jti' (mã duy nhất) là BẮT BUỘC: trước đây payload chỉ có user_id + exp, nên 2 lần đăng
    nhập trong cùng 1 giây sinh ra token GIỐNG HỆT NHAU -> vi phạm UNIQUE(refresh_tokens.token)
    -> lỗi 500 khi đăng nhập/đăng ký liên tiếp (vd: React StrictMode gọi 2 lần).
    """
    return _encode(
        {'user_id': str(user_id), 'type': 'refresh', 'jti': uuid.uuid4().hex},
        _lifetime('JWT_REFRESH_TOKEN_EXPIRES', 604800),
    )


def password_fingerprint(password_hash) -> str:
    """Dấu vân tay của mật khẩu hiện tại. Gắn vào token đặt lại mật khẩu: đổi mật khẩu xong thì dấu vân tay đổi,
    token cũ tự vô hiệu -> chỉ dùng được MỘT lần (không cần thêm bảng trong database)."""
    return hashlib.sha256((password_hash or '').encode('utf-8')).hexdigest()[:16]


def generate_reset_token(user_id: str, password_hash=None) -> str:
    """Token reset password, hết hạn sau 15 phút và chỉ dùng được một lần."""
    return _encode(
        {'user_id': str(user_id), 'purpose': 'reset_password', 'pwf': password_fingerprint(password_hash)},
        datetime.timedelta(minutes=15),
    )


def read_reset_token(token: str):
    """Trả payload (dict) nếu token đặt lại mật khẩu hợp lệ và chưa hết hạn, ngược lại None."""
    try:
        payload = jwt.decode(token, _secret(), algorithms=['HS256'])
    except jwt.InvalidTokenError:       # gồm cả ExpiredSignatureError
        return None
    if payload.get('purpose') != 'reset_password' or not payload.get('user_id'):
        return None
    return payload


def verify_reset_token(token: str):
    """Trả về user_id nếu đúng, None nếu sai/hết hạn (KHÔNG kiểm tra đã dùng chưa: xem reset_token_unused)."""
    payload = read_reset_token(token)
    return payload.get('user_id') if payload else None


def reset_token_unused(payload: dict, password_hash) -> bool:
    return bool(payload) and payload.get('pwf') == password_fingerprint(password_hash)


def decode_token(token: str):
    """Giải mã Access Token, trả về user_id nếu hợp lệ, None nếu sai/hết hạn.

    Từ chối token dùng sai mục đích (refresh/reset không được dùng làm access token).
    """
    try:
        payload = jwt.decode(token, _secret(), algorithms=['HS256'])
    except jwt.InvalidTokenError:
        return None
    if payload.get('purpose') or payload.get('type') == 'refresh':
        return None
    return payload.get('user_id')
