# app/middleware/auth.py
from functools import wraps
from flask import request, jsonify
from app.utils.auth import decode_token
import logging
from app.models import User

# Cấu hình logging
logger = logging.getLogger(__name__)

def token_required(f):
    """
    Decorator: bắt buộc route phải có Access Token hợp lệ trong header.
    Sử dụng: @token_required
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        # 1. Kiểm tra token có được gửi lên không
        if not auth_header:
            return jsonify({
                'message': 'Token không được cung cấp! Vui lòng đăng nhập.',
                'code': 'MISSING_TOKEN'
            }), 401
        
        # 2. Kiểm tra định dạng token (phải là Bearer)
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'message': 'Token không đúng định dạng! Sử dụng: Bearer <token>',
                'code': 'INVALID_FORMAT'
            }), 401
        
        # 3. Tách token từ header
        token = auth_header.split(' ')[1]
        if not token:
            return jsonify({
                'message': 'Token trống!',
                'code': 'EMPTY_TOKEN'
            }), 401
        
        # 4. Giải mã và xác thực token
        user_id = decode_token(token)
        
        if not user_id:
            return jsonify({
                'message': 'Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.',
                'code': 'INVALID_TOKEN'
            }), 401
        
        # 5. Gắn user_id và token vào request để các route dùng
        request.user_id = user_id
        request.token = token
        
        # Ghi log (tùy chọn)
        logger.info(f"✅ Token verified for user_id: {user_id}")
        
        return f(*args, **kwargs)
    
    return decorated


def optional_token(f):
    """
    Decorator: cho phép request có hoặc không có token.
    Nếu có token hợp lệ, gắn user_id vào request.
    Nếu không có token hoặc token không hợp lệ, request.user_id = None
    Sử dụng: @optional_token
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        user_id = None
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user_id = decode_token(token)
        
        # Gắn user_id vào request (có thể là None)
        request.user_id = user_id
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator: bắt buộc phải là admin, dùng SAU token_required"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = User.query.get(request.user_id)

        if not user or user.role != 'admin':
            return jsonify({'message': 'Chỉ admin mới có quyền thực hiện thao tác này!'}), 403

        return f(*args, **kwargs)

    return decorated