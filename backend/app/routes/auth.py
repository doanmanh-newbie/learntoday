from flask import Blueprint, request, jsonify
from app import db
from app.models import User
import uuid
from app.models import RefreshToken
import datetime
from app.utils.middleware import token_required
from app.utils.auth import (
    hash_password, generate_token, generate_refresh_token,
    check_password, generate_reset_token, verify_reset_token
)
from app.utils.middleware import token_required, admin_required

# ✅ PHẢI CÓ DÒNG NÀY - Tạo Blueprint
bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Kiểm tra dữ liệu đầu vào
        if not data:
            return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'message': 'Vui lòng điền đầy đủ thông tin!'}), 400
        
        # Kiểm tra username đã tồn tại
        existing_username = User.query.filter_by(username=username).first()
        if existing_username:
            return jsonify({'message': 'Tên người dùng đã tồn tại!'}), 400
        
        # Kiểm tra email đã tồn tại
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            return jsonify({'message': 'Email đã được đăng ký!'}), 400
        
        # Tạo user mới
        new_user = User(
            id=str(uuid.uuid4()),
            username=username,
            email=email,
            password_hash=hash_password(password)
        )
        
        db.session.add(new_user)
        db.session.commit()

        # Tạo cả Access Token và Refresh Token (đúng luồng STT 2, giống /login)
        access_token = generate_token(new_user.id)
        refresh_token = generate_refresh_token(new_user.id)

        new_refresh_token = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=new_user.id,
            token=refresh_token,
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7)
        )
        db.session.add(new_refresh_token)
        db.session.commit()

        return jsonify({
            'message': 'Đăng ký thành công!',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Lỗi server: {str(e)}'}), 500 
    
@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Vui lòng nhập email và password!'}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not check_password(password, user.password_hash):
            return jsonify({'message': 'Email hoặc mật khẩu không đúng!'}), 401

        access_token = generate_token(user.id)
        refresh_token = generate_refresh_token(user.id)

        new_refresh_token = RefreshToken(
            id=str(uuid.uuid4()),
            user_id=user.id,
            token=refresh_token,
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=7)
        )
        db.session.add(new_refresh_token)
        db.session.commit()

        return jsonify({
            'message': 'Đăng nhập thành công!',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Lỗi server: {str(e)}'}), 500

@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Vui lòng nhập email!'}), 400

        user = User.query.filter_by(email=email).first()

        # Không tiết lộ email có tồn tại hay không (bảo mật)
        if not user:
            return jsonify({'message': 'Nếu email tồn tại, hướng dẫn reset đã được gửi'}), 200

        reset_token = generate_reset_token(user.id)

        # TẠM THỜI: trả token trực tiếp để test (sau này thay bằng gửi email - STT 13)
        return jsonify({
            'message': 'Token reset đã được tạo (tạm thời hiển thị trực tiếp, sau sẽ gửi qua email)',
            'reset_token': reset_token
        }), 200

    except Exception as e:
        return jsonify({'message': f'Lỗi server: {str(e)}'}), 500


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        reset_token = data.get('reset_token')
        new_password = data.get('new_password')

        if not reset_token or not new_password:
            return jsonify({'message': 'Vui lòng nhập token và mật khẩu mới!'}), 400

        user_id = verify_reset_token(reset_token)
        if not user_id:
            return jsonify({'message': 'Token không hợp lệ hoặc đã hết hạn!'}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'Người dùng không tồn tại!'}), 404

        user.password_hash = hash_password(new_password)
        db.session.commit()

        return jsonify({'message': 'Đặt lại mật khẩu thành công!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Lỗi server: {str(e)}'}), 500
    
@bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Người dùng không tồn tại!'}), 404
    return jsonify({'user': user.to_dict()}), 200

@bp.route('/users/<user_id>/role', methods=['PUT'])
@token_required
@admin_required
def update_user_role(user_id):
    """Cấp hoặc thu hồi quyền admin - chỉ admin mới gọi được"""
    data = request.get_json()
    new_role = data.get('role')

    if new_role not in ['user', 'admin']:
        return jsonify({'message': "role phải là 'user' hoặc 'admin'!"}), 400

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'message': 'Không tìm thấy người dùng!'}), 404

    target_user.role = new_role
    db.session.commit()

    return jsonify({
        'message': f'Đã cập nhật quyền thành {new_role}!',
        'user': target_user.to_dict()
    }), 200
    