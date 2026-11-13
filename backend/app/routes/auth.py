import logging
import threading
import uuid

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import User
from app.services.email_service import EmailError, EmailNotConfigured, send_email
from app.utils.middleware import token_required, admin_required
from app.utils.auth import (
    hash_password, generate_token, generate_refresh_token, decode_token,
    check_password, generate_reset_token, read_reset_token, reset_token_unused,
)
from app.utils.rate_limit import auth_limiter
from app.utils.refresh_cookie import (
    set_refresh_cookie, clear_refresh_cookie, read_refresh_token, csrf_header_ok,
)
from app.utils.token_service import (
    store_refresh_token, refresh_access_token, validate_refresh_token,
    revoke_refresh_token, revoke_all_user_tokens, purge_stale_tokens,
)

bp = Blueprint('auth', __name__, url_prefix='/api/auth')
logger = logging.getLogger(__name__)

MIN_PASSWORD_LENGTH = 8     # khớp với kiểm tra ở form đăng ký (frontend)

# Giới hạn tần suất (cửa sổ trượt, đếm trong bộ nhớ của từng process - xem rate_limit.py).
# Đăng nhập: CHỈ lần sai bị tính. Khóa theo (IP + email) để kẻ dò mật khẩu không khóa được tài khoản của người khác.
LOGIN_FAILS_PER_EMAIL = 8
LOGIN_FAILS_PER_IP = 40
LOGIN_WINDOW = 15 * 60
REGISTER_PER_IP = 10
FORGOT_PER_IP = 5
FORGOT_PER_EMAIL = 3
RESET_PER_IP = 10
HOUR = 3600

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


def _too_many(wait):
    resp = jsonify({'message': f'Bạn thao tác quá nhiều lần, vui lòng thử lại sau khoảng {max(1, -(-wait // 60))} phút.',
                    'code': 'RATE_LIMITED', 'retry_after': wait})
    resp.status_code = 429
    resp.headers['Retry-After'] = str(wait)
    return resp


def _ip():
    return request.remote_addr or 'unknown'


def _session_response(user, access_token, refresh_token, message, status):
    """Trả Access Token trong JSON; Refresh Token nằm trong cookie HttpOnly (không còn trong JSON, trừ khi bật
    REFRESH_TOKEN_IN_BODY cho client không phải trình duyệt)."""
    body = {'message': message, 'access_token': access_token, 'user': user.to_dict()}
    if current_app.config.get('REFRESH_TOKEN_IN_BODY'):
        body['refresh_token'] = refresh_token
    resp = jsonify(body)
    resp.status_code = status
    return set_refresh_cookie(resp, refresh_token)


@bp.route('/register', methods=['POST'])
def register():
    allowed, wait = auth_limiter.check(f'register:{_ip()}', REGISTER_PER_IP, HOUR)
    if not allowed:
        return _too_many(wait)
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

    username = _clean(data.get('username'))
    email = _clean(data.get('email'))
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'message': 'Vui lòng điền đầy đủ thông tin!'}), 400

    email = email.lower()                      # email không phân biệt hoa/thường
    if not isinstance(password, str) or len(password) < MIN_PASSWORD_LENGTH:
        return jsonify({'message': f'Mật khẩu cần tối thiểu {MIN_PASSWORD_LENGTH} ký tự!'}), 400

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
    return _session_response(new_user, access_token, refresh_token, 'Đăng ký thành công!', 201)


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

    email = _clean(data.get('email'))
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Vui lòng nhập email và password!'}), 400

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({'message': 'Email hoặc mật khẩu không hợp lệ!'}), 400

    email_key = f'login:{_ip()}:{email.lower()[:254]}'
    ip_key = f'login-ip:{_ip()}'
    for key, limit in ((email_key, LOGIN_FAILS_PER_EMAIL), (ip_key, LOGIN_FAILS_PER_IP)):
        blocked, wait = auth_limiter.blocked(key, limit, LOGIN_WINDOW)
        if blocked:
            return _too_many(wait)

    user = User.query.filter(db.func.lower(User.email) == email.lower()).first()
    if not user or not check_password(password, user.password_hash):
        auth_limiter.record(email_key, LOGIN_WINDOW)
        auth_limiter.record(ip_key, LOGIN_WINDOW)
        return jsonify({'message': 'Email hoặc mật khẩu không đúng!'}), 401

    auth_limiter.forget(email_key)                  # đăng nhập đúng -> xóa bộ đếm sai của (IP + email) này
    access_token, refresh_token = _issue_tokens(user)
    return _session_response(user, access_token, refresh_token, 'Đăng nhập thành công!', 200)


@bp.route('/refresh-token', methods=['POST'])
def refresh_token_route():
    """STT 2 - Bước 4: Làm mới Access Token bằng Refresh Token (lấy từ cookie HttpOnly; body chỉ dành cho client không phải trình duyệt)."""
    data = request.get_json(silent=True) or {}
    refresh_token, from_cookie = read_refresh_token(data)
    if not refresh_token:
        return jsonify({'message': 'Vui lòng cung cấp refresh_token!'}), 400
    if not csrf_header_ok(from_cookie):
        return jsonify({'message': 'Thiếu header X-Requested-With.'}), 403

    new_access = refresh_access_token(refresh_token)
    if not new_access:
        resp = jsonify({'message': 'Refresh Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.'})
        resp.status_code = 401
        return clear_refresh_cookie(resp) if from_cookie else resp      # cookie hỏng/hết hạn thì xóa luôn

    return jsonify({'message': 'Làm mới token thành công!', 'access_token': new_access}), 200


@bp.route('/logout', methods=['POST'])
def logout():
    """STT 2 - Bước 5: Thu hồi Refresh Token và xóa cookie.

    KHÔNG yêu cầu Access Token còn hạn: người dùng quay lại sau khi Access Token đã hết hạn vẫn phải đăng xuất được
    (cookie HttpOnly chỉ server mới xóa được). Luôn trả 200 - đăng xuất là thao tác lặp lại được."""
    data = request.get_json(silent=True) or {}
    refresh_token, from_cookie = read_refresh_token(data)
    if not csrf_header_ok(from_cookie):
        return jsonify({'message': 'Thiếu header X-Requested-With.'}), 403

    if data.get('logout_all') is True:
        bearer = (request.headers.get('Authorization') or '').removeprefix('Bearer ').strip()
        user_id = decode_token(bearer) if bearer else None
        if not user_id and refresh_token:
            user_id = validate_refresh_token(refresh_token)
        if user_id:
            revoke_all_user_tokens(user_id)
    elif refresh_token:
        revoke_refresh_token(refresh_token)

    db.session.commit()
    resp = jsonify({'message': 'Đăng xuất thành công!'})
    resp.status_code = 200
    return clear_refresh_cookie(resp)


def _deliver_reset_email(to, link):
    """Gửi email đặt lại mật khẩu. Không ghi link/token vào log."""
    body = (
        'Xin chào,\n\n'
        'Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản Learn Today.\n'
        f'Bấm vào liên kết sau để đặt mật khẩu mới (có hiệu lực 15 phút, chỉ dùng được một lần):\n\n{link}\n\n'
        'Nếu không phải bạn yêu cầu, hãy bỏ qua email này - mật khẩu của bạn vẫn như cũ.\n'
    )
    try:
        send_email(to, 'Đặt lại mật khẩu Learn Today', body)
    except EmailNotConfigured:
        logger.warning('Có yêu cầu đặt lại mật khẩu nhưng chưa cấu hình SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS) nên không gửi được email.')
    except EmailError:
        logger.error('Gửi email đặt lại mật khẩu thất bại.')


@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Yêu cầu đặt lại mật khẩu.

    * Luôn trả CÙNG một thông báo dù email có tồn tại hay không (không cho dò tài khoản).
    * Email chứa link `<FRONTEND_URL>/reset-password#token=...`: token nằm sau dấu # nên không bị gửi tới server/log/referrer.
    * Gửi email ở luồng nền: thời gian phản hồi không tiết lộ email có tồn tại hay không.
    * Token hết hạn sau 15 phút và chỉ dùng được MỘT lần.
    * Token chỉ hiện trong JSON khi chạy debug/EXPOSE_ERRORS (để thử cục bộ khi chưa có SMTP).
    """
    allowed, wait = auth_limiter.check(f'forgot-ip:{_ip()}', FORGOT_PER_IP, HOUR)
    if not allowed:
        return _too_many(wait)

    data = request.get_json(silent=True) or {}
    email = _clean(data.get('email'))
    if not email or not isinstance(email, str):
        return jsonify({'message': 'Vui lòng nhập email!'}), 400

    body = {'message': 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi.'}
    user = User.query.filter(db.func.lower(User.email) == email.lower()).first()
    email_ok, _ = auth_limiter.check(f'forgot-email:{email.lower()[:254]}', FORGOT_PER_EMAIL, HOUR)
    if user and email_ok:                           # quá giới hạn theo email: im lặng bỏ qua (không lộ gì cho người gọi)
        reset_token = generate_reset_token(user.id, user.password_hash)
        if current_app.debug or current_app.config.get('EXPOSE_ERRORS'):
            body['reset_token'] = reset_token
        link = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/reset-password#token={reset_token}"
        if current_app.testing:
            _deliver_reset_email(user.email, link)
        else:
            threading.Thread(target=_deliver_reset_email, args=(user.email, link), daemon=True).start()
    return jsonify(body), 200


@bp.route('/reset-password', methods=['POST'])
def reset_password():
    allowed, wait = auth_limiter.check(f'reset-ip:{_ip()}', RESET_PER_IP, HOUR)
    if not allowed:
        return _too_many(wait)

    data = request.get_json(silent=True) or {}
    reset_token = data.get('reset_token')
    new_password = data.get('new_password')
    if not reset_token or not new_password:
        return jsonify({'message': 'Vui lòng nhập token và mật khẩu mới!'}), 400
    if not isinstance(new_password, str) or len(new_password) < MIN_PASSWORD_LENGTH:
        return jsonify({'message': f'Mật khẩu cần tối thiểu {MIN_PASSWORD_LENGTH} ký tự!'}), 400

    payload = read_reset_token(reset_token) if isinstance(reset_token, str) else None
    user = db.session.get(User, payload['user_id']) if payload else None
    # Cùng một thông báo cho token sai / hết hạn / đã dùng / người dùng không còn tồn tại
    if not user or not reset_token_unused(payload, user.password_hash):
        return jsonify({'message': 'Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng!'}), 401

    user.password_hash = hash_password(new_password)    # đổi mật khẩu -> token vừa dùng tự vô hiệu (dấu vân tay đổi)
    revoke_all_user_tokens(user.id)                     # và đăng xuất mọi thiết bị
    db.session.commit()
    resp = jsonify({'message': 'Đặt lại mật khẩu thành công!'})
    resp.status_code = 200
    return clear_refresh_cookie(resp)


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
