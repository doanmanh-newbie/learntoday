import logging
import uuid

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import User
from app.utils.middleware import token_required, admin_required
from app.utils.auth import (
    hash_password, generate_token, generate_refresh_token,
    check_password, generate_reset_token, verify_reset_token
)
from app.utils.token_service import (
    store_refresh_token, refresh_access_token,
    revoke_refresh_token, revoke_all_user_tokens, purge_stale_tokens,
)

bp = Blueprint('auth', __name__, url_prefix='/api/auth')
logger = logging.getLogger(__name__)

# Lỗi DB (mất kết nối, pool đầy...) được errors.py bắt và trả JSON 503 - KHÔNG còn
# `except Exception as e: return str(e)` làm lộ host/user của database ra client.


def _issue_tokens(user):
    """Tạo cặp token và lưu Refresh Token vào DB (dọn token cũ của user luôn)."""
    access_token = generate_token(user.id)
    refresh_token = generate_refresh_token(user.id)
    purge_stale_tokens(user.id)
    store_refresh_token(user.id, refresh_token)
    db.session.commit()
    return access_token, refresh_token


def _clean(value):
    return value.strip() if isinstance(value, str) else value


@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

    username = _clean(data.get('username'))
    email = _clean(data.get('email'))
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Vui lòng điền đầy đủ thông tin!'}), 400

    email = email.lower()                      # email không phân biệt hoa/thường

    if User.query.filter(db.func.lower(User.username) == username.lower()).first():
        return jsonify({'message': 'Tên người dùng đã tồn tại!'}), 400
    if User.query.filter(db.func.lower(User.email) == email).first():
        return jsonify({'message': 'Email đã được đăng ký!'}), 400

    new_user = User(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        password_hash=hash_password(password),
    )
    db.session.add(new_user)
    try:
        db.session.commit()
    except IntegrityError:
        # 2 request đăng ký cùng lúc: cả hai qua bước kiểm tra nhưng DB chỉ cho 1 bản ghi
        db.session.rollback()
        return jsonify({'message': 'Tên người dùng hoặc email đã được đăng ký!'}), 400

    access_token, refresh_token = _issue_tokens(new_user)
    return jsonify({
        'message': 'Đăng ký thành công!',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': new_user.to_dict()
    }), 201


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

    email = _clean(data.get('email'))
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Vui lòng nhập email và password!'}), 400

    user = User.query.filter(db.func.lower(User.email) == email.lower()).first()
    if not user or not check_password(password, user.password_hash):
        return jsonify({'message': 'Email hoặc mật khẩu không đúng!'}), 401

    access_token, refresh_token = _issue_tokens(user)
    return jsonify({
        'message': 'Đăng nhập thành công!',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@bp.route('/refresh-token', methods=['POST'])
def refresh_token_route():
    """STT 2 - Bước 4: Làm mới Access Token bằng Refresh Token."""
    data = request.get_json(silent=True) or {}
    refresh_token = data.get('refresh_token')
    if not refresh_token:
        return jsonify({'message': 'Vui lòng cung cấp refresh_token!'}), 400

    new_access = refresh_access_token(refresh_token)
    if not new_access:
        return jsonify({'message': 'Refresh Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.'}), 401

    return jsonify({'message': 'Làm mới token thành công!', 'access_token': new_access}), 200


@bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """STT 2 - Bước 5: Thu hồi Refresh Token."""
    data = request.get_json(silent=True) or {}
    refresh_token = data.get('refresh_token')
    logout_all = data.get('logout_all', False)

    if logout_all:
        revoke_all_user_tokens(request.user_id)
    elif refresh_token:
        revoke_refresh_token(refresh_token)
    else:
        return jsonify({'message': 'Vui lòng cung cấp refresh_token hoặc logout_all=true!'}), 400

    db.session.commit()
    return jsonify({'message': 'Đăng xuất thành công!'}), 200


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = _clean(data.get('email'))
    if not email:
        return jsonify({'message': 'Vui lòng nhập email!'}), 400

    user = User.query.filter(db.func.lower(User.email) == email.lower()).first()
    if not user:
        return jsonify({'message': 'Nếu email tồn tại, hướng dẫn reset đã được gửi'}), 200

    reset_token = generate_reset_token(user.id)
    return jsonify({
        'message': 'Token reset đã được tạo (tạm thời hiển thị trực tiếp, sau sẽ gửi qua email)',
        'reset_token': reset_token
    }), 200


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    reset_token = data.get('reset_token')
    new_password = data.get('new_password')
    if not reset_token or not new_password:
        return jsonify({'message': 'Vui lòng nhập token và mật khẩu mới!'}), 400

    user_id = verify_reset_token(reset_token)
    if not user_id:
        return jsonify({'message': 'Token không hợp lệ hoặc đã hết hạn!'}), 401

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'message': 'Người dùng không tồn tại!'}), 404

    user.password_hash = hash_password(new_password)
    revoke_all_user_tokens(user.id)          # đổi mật khẩu -> đăng xuất mọi thiết bị
    db.session.commit()
    return jsonify({'message': 'Đặt lại mật khẩu thành công!'}), 200


@bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    user = db.session.get(User, request.user_id)
    if not user:
        return jsonify({'message': 'Người dùng không tồn tại!'}), 404
    return jsonify({'user': user.to_dict()}), 200


@bp.route('/users/<user_id>/role', methods=['PUT'])
@token_required
@admin_required
def update_user_role(user_id):
    data = request.get_json(silent=True) or {}
    new_role = data.get('role')
    if new_role not in ['user', 'admin']:
        return jsonify({'message': "role phải là 'user' hoặc 'admin'!"}), 400

    target_user = db.session.get(User, user_id)
    if not target_user:
        return jsonify({'message': 'Không tìm thấy người dùng!'}), 404

    target_user.role = new_role
    db.session.commit()
    return jsonify({'message': f'Đã cập nhật quyền thành {new_role}!', 'user': target_user.to_dict()}), 200
