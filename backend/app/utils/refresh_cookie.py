# app/utils/refresh_cookie.py - Refresh Token trong cookie HttpOnly (JavaScript/XSS không đọc được)
"""
Luồng: đăng nhập/đăng ký -> server đặt cookie HttpOnly chứa Refresh Token (chỉ gửi tới /api/auth/*);
JS chỉ giữ Access Token (1 giờ) trong bộ nhớ. Khi Access Token hết hạn hoặc tải lại trang, JS gọi
POST /api/auth/refresh-token (trình duyệt tự đính kèm cookie) để lấy Access Token mới.

Chống CSRF cho các endpoint dùng cookie (refresh-token, logout): bắt buộc header `X-Requested-With: fetch`.
Trang web của kẻ xấu không thể tự thêm header tùy biến vào request chéo origin mà không bị CORS chặn,
nên đây là lớp bảo vệ độc lập với SameSite.
"""
from flask import current_app, request

CSRF_HEADER = 'X-Requested-With'
CSRF_VALUE = 'fetch'


def _cfg(key, default):
    return current_app.config.get(key, default)


def _cookie_args():
    return {
        'httponly': True,
        'secure': bool(_cfg('REFRESH_COOKIE_SECURE', False)),
        'samesite': _cfg('REFRESH_COOKIE_SAMESITE', 'Lax'),
        'path': _cfg('REFRESH_COOKIE_PATH', '/api/auth'),
        'domain': _cfg('REFRESH_COOKIE_DOMAIN', None) or None,
    }


def set_refresh_cookie(response, token):
    response.set_cookie(_cfg('REFRESH_COOKIE_NAME', 'refresh_token'), token,
                        max_age=int(_cfg('JWT_REFRESH_TOKEN_EXPIRES', 604800)), **_cookie_args())
    return response


def clear_refresh_cookie(response):
    response.set_cookie(_cfg('REFRESH_COOKIE_NAME', 'refresh_token'), '', max_age=0, expires=0, **_cookie_args())
    return response


def read_refresh_token(data):
    """Trả (token, lấy_từ_cookie). Ưu tiên token gửi trong body (client không phải trình duyệt), sau đó tới cookie."""
    body_token = data.get('refresh_token') if isinstance(data, dict) else None
    if isinstance(body_token, str) and body_token:
        return body_token, False
    cookie_token = request.cookies.get(_cfg('REFRESH_COOKIE_NAME', 'refresh_token'))
    return (cookie_token, True) if cookie_token else (None, False)


def csrf_header_ok(from_cookie):
    """Request dựa vào cookie phải kèm header tùy biến; token trong body (không phải cookie) không cần."""
    return (not from_cookie) or request.headers.get(CSRF_HEADER) == CSRF_VALUE
