import bcrypt
import jwt
import datetime
import os

def hash_password(password: str) -> str:
    """Mã hóa password bằng bcrypt trước khi lưu vào database"""
    salt = bcrypt.gensalt(rounds=10)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    """So sánh password người dùng nhập với password đã mã hóa"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id: str) -> str:
    payload = {
        'user_id': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET', 'dev-secret-key'), algorithm='HS256')
def generate_refresh_token(user_id: str) -> str:
    """Tạo Refresh Token JWT, hết hạn sau 7 ngày (STT 2)"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET', 'dev-secret-key'), algorithm='HS256')
def generate_reset_token(user_id: str) -> str:
    """Tạo token reset password, hết hạn sau 15 phút"""
    payload = {
        'user_id': str(user_id),
        'purpose': 'reset_password',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET', 'dev-secret-key'), algorithm='HS256')

def verify_reset_token(token: str):
    """Kiểm tra token reset hợp lệ, trả về user_id nếu đúng, None nếu sai/hết hạn"""
    try:
        payload = jwt.decode(token, os.getenv('JWT_SECRET', 'dev-secret-key'), algorithms=['HS256'])
        if payload.get('purpose') != 'reset_password':
            return None
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None