# app/config.py
"""
Cấu hình ứng dụng - đặc biệt là KẾT NỐI DATABASE (Supabase Postgres).

Các lỗi kết nối hay gặp mà file này xử lý:
  1. Mật khẩu có ký tự đặc biệt (% @ # / ? :) nhét thẳng vào DATABASE_URL
     -> SQLAlchemy giải mã URL làm mật khẩu bị đổi -> "password authentication failed".
     => Hỗ trợ khai báo rời DB_HOST/DB_USER/DB_PASSWORD... (giữ nguyên văn, không cần mã hóa),
        hoặc DATABASE_URL đã mã hóa đúng chuẩn.
  2. connect_args 'options: -c statement_cache_size=0' là tham số của asyncpg,
     KHÔNG tồn tại trên Postgres -> server từ chối kết nối. Đã bỏ.
  3. Supabase pooler cắt kết nối rảnh (idle) -> "SSL connection has been closed
     unexpectedly". => pool_pre_ping + pool_recycle.
  4. Session pooler giới hạn số client (~15). Flask debug (2 process) x pool mặc
     định (5+10) vượt giới hạn -> "max clients reached". => pool nhỏ, cấu hình được.
  5. Thiếu sslmode=require -> Supabase từ chối kết nối không mã hóa.
"""
import logging
import os
import re
from urllib.parse import quote, unquote

from dotenv import load_dotenv
from sqlalchemy.engine import URL

load_dotenv()

logger = logging.getLogger(__name__)

_INSECURE_SECRETS = {'', 'dev-secret-key', 'your-secret-key-change-me', 'your-jwt-secret-change-me'}
MIN_SECRET_LENGTH = 32          # JWT_SECRET ngắn hơn mức này bị từ chối khi chạy production


def _env_bool(name, default):
    value = os.environ.get(name)
    if value is None or value.strip() == '':
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


APP_ENV = (os.environ.get('APP_ENV') or os.environ.get('FLASK_ENV') or 'development').strip().lower()
IS_PRODUCTION = APP_ENV == 'production'

_URL_RE = re.compile(
    r'^(?P<scheme>[A-Za-z0-9+.\-]+)://'
    r'(?P<user>[^:@/]+)'
    r'(?::(?P<password>.*))?'          # greedy: cho phép '@' trong mật khẩu
    r'@(?P<host>[^@/:?#]+)'
    r'(?::(?P<port>\d+))?'
    r'(?:/(?P<database>[^?]*))?'
    r'(?:\?(?P<query>.*))?$'
)


def _is_local(host: str) -> bool:
    return host in ('localhost', '127.0.0.1', '::1')


def _build_database_url():
    """
    Trả về (URL | chuỗi sqlite | None, danh sách cảnh báo).

    Ưu tiên 1: DB_HOST + DB_USER + DB_PASSWORD (+ DB_PORT, DB_NAME): mật khẩu giữ NGUYÊN VĂN.
    Ưu tiên 2: DATABASE_URL: ký tự đặc biệt trong mật khẩu phải mã hóa
               (% -> %25, @ -> %40, # -> %23, / -> %2F, ? -> %3F, : -> %3A).
    """
    warnings = []

    host = os.environ.get('DB_HOST')
    if host:
        url = URL.create(
            drivername='postgresql+psycopg2',
            username=os.environ.get('DB_USER', 'postgres'),
            password=os.environ.get('DB_PASSWORD'),   # URL.create tự xử lý ký tự đặc biệt
            host=host,
            port=int(os.environ.get('DB_PORT', '5432')),
            database=os.environ.get('DB_NAME', 'postgres'),
        )
        return url, warnings

    raw = (os.environ.get('DATABASE_URL') or '').strip().strip('"').strip("'")
    if not raw:
        return None, warnings

    if raw.startswith('postgres://'):                 # kiểu cũ
        raw = 'postgresql://' + raw[len('postgres://'):]

    if raw.startswith('sqlite'):                      # dùng cho test cục bộ
        return raw, warnings

    m = _URL_RE.match(raw)
    if not m:
        warnings.append('DATABASE_URL không đúng định dạng postgresql://user:password@host:port/dbname')
        return raw, warnings

    password = m.group('password') or ''
    if re.search(r'%[0-9A-Fa-f]{2}', password):
        if unquote(password) != password:
            warnings.append(
                'Mật khẩu trong DATABASE_URL có chuỗi dạng %XX: nó sẽ được GIẢI MÃ thành ký tự khác. '
                'Nếu mật khẩu gốc của bạn thật sự chứa dấu %, phải viết %25. '
                'Cách chắc ăn nhất: dùng DB_HOST/DB_USER/DB_PASSWORD thay cho DATABASE_URL.'
            )
    elif '%' in password:
        # '%' đứng riêng (không phải %XX) -> chắc chắn là ký tự thô, mã hóa giúp
        password = password.replace('%', '%25')
        warnings.append("Đã tự mã hóa dấu '%' trong mật khẩu DATABASE_URL thành %25.")

    scheme = m.group('scheme')
    if scheme == 'postgresql':
        scheme = 'postgresql+psycopg2'

    query = {}
    for kv in (m.group('query') or '').split('&'):
        if '=' in kv:
            k, v = kv.split('=', 1)
            query[k] = unquote(v)

    url = URL.create(
        drivername=scheme,
        username=unquote(m.group('user')),
        password=unquote(password) if password else None,
        host=m.group('host'),
        port=int(m.group('port')) if m.group('port') else 5432,
        database=m.group('database') or 'postgres',
        query=query,
    )
    return url, warnings


def _engine_options(url) -> dict:
    """Tùy chọn pool phù hợp Supabase (pooler + free tier)."""
    if isinstance(url, str) or url.get_backend_name() == 'sqlite':
        return {}

    opts = {
        'pool_pre_ping': True,                                          # kiểm tra kết nối sống trước khi dùng
        'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', 240)),    # < idle-timeout của pooler
        'pool_size': int(os.environ.get('DB_POOL_SIZE', 3)),
        'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', 2)),
        'pool_timeout': int(os.environ.get('DB_POOL_TIMEOUT', 15)),
        'connect_args': {
            'connect_timeout': int(os.environ.get('DB_CONNECT_TIMEOUT', 10)),
            'keepalives': 1,
            'keepalives_idle': 30,
            'keepalives_interval': 10,
            'keepalives_count': 5,
            'application_name': 'learntoday-backend',
        },
    }
    if not _is_local(url.host or '') and 'sslmode' not in (url.query or {}):
        opts['connect_args']['sslmode'] = os.environ.get('DB_SSLMODE', 'require')
    return opts


_DB_URL, DB_WARNINGS = _build_database_url()


class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')

    # Database
    SQLALCHEMY_DATABASE_URI = _DB_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = _engine_options(_DB_URL) if _DB_URL is not None else {}

    # JWT
    JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-key')
    JWT_ALGORITHM = 'HS256'
    JWT_ACCESS_TOKEN_EXPIRES = 3600        # 1 giờ
    JWT_REFRESH_TOKEN_EXPIRES = 604800     # 7 ngày

    # Môi trường: đặt APP_ENV=production khi chạy thật -> app TỪ CHỐI khởi động nếu cấu hình bảo mật yếu
    APP_ENV = APP_ENV
    IS_PRODUCTION = IS_PRODUCTION

    # Refresh Token nằm trong cookie HttpOnly (JavaScript, kể cả mã độc XSS, không đọc được).
    # Cookie chỉ được gửi tới /api/auth/*. Secure bật mặc định khi production (cần HTTPS).
    # SameSite=Lax: đúng khi frontend và API CÙNG "site" (vd app.example.com + api.example.com, hoặc API qua
    # proxy cùng tên miền). Khác site hoàn toàn thì phải SameSite=None + Secure (và trình duyệt có thể chặn cookie bên thứ ba).
    REFRESH_COOKIE_NAME = 'refresh_token'
    REFRESH_COOKIE_PATH = '/api/auth'
    REFRESH_COOKIE_SECURE = _env_bool('REFRESH_COOKIE_SECURE', IS_PRODUCTION)
    REFRESH_COOKIE_SAMESITE = (os.environ.get('REFRESH_COOKIE_SAMESITE') or 'Lax').strip().capitalize()
    REFRESH_COOKIE_DOMAIN = (os.environ.get('REFRESH_COOKIE_DOMAIN') or '').strip() or None
    # Chỉ bật cho client không phải trình duyệt (script/app di động) cần đọc refresh token từ JSON. Mặc định TẮT.
    REFRESH_TOKEN_IN_BODY = _env_bool('REFRESH_TOKEN_IN_BODY', False)

    # Số proxy tin cậy đứng trước app (Render/Nginx/Cloudflare = 1). 0 = không tin header X-Forwarded-*.
    # Cần đúng để giới hạn đăng nhập theo ĐÚNG địa chỉ IP người dùng thay vì IP của proxy.
    TRUSTED_PROXIES = int(os.environ.get('TRUSTED_PROXIES', 0) or 0)

    # Địa chỉ web (frontend) để ghép link trong email đặt lại mật khẩu
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173').strip().rstrip('/')

    # CORS: danh sách origin cách nhau bởi dấu phẩy
    CORS_ORIGINS = [
        o.strip() for o in os.environ.get(
            'CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'
        ).split(',') if o.strip()
    ]

    # Cho phép trả chi tiết lỗi nội bộ về client (CHỈ nên bật khi phát triển)
    EXPOSE_ERRORS = os.environ.get('EXPOSE_ERRORS', '0') == '1'


def validate_config(config=Config):
    """Dừng sớm với thông báo rõ ràng thay vì lỗi khó hiểu ở truy vấn đầu tiên."""
    if config.SQLALCHEMY_DATABASE_URI is None:
        raise RuntimeError(
            'Chưa cấu hình database. Trong backend/.env hãy đặt DB_HOST/DB_USER/DB_PASSWORD/DB_NAME '
            '(khuyên dùng) hoặc DATABASE_URL. Xem .env.example.'
        )
    for w in DB_WARNINGS:
        logger.warning('[DB config] %s', w)
    weak_jwt = config.JWT_SECRET in _INSECURE_SECRETS or len(config.JWT_SECRET) < MIN_SECRET_LENGTH
    problems = []
    if getattr(config, 'IS_PRODUCTION', False):
        if weak_jwt:
            problems.append(f'JWT_SECRET là giá trị mặc định hoặc ngắn hơn {MIN_SECRET_LENGTH} ký tự. '
                            'Tạo chuỗi ngẫu nhiên:  python -c "import secrets; print(secrets.token_urlsafe(48))"')
        if getattr(config, 'SECRET_KEY', '') in _INSECURE_SECRETS:
            problems.append('SECRET_KEY đang là giá trị mặc định - hãy đặt một chuỗi ngẫu nhiên.')
        if getattr(config, 'EXPOSE_ERRORS', False):
            problems.append('EXPOSE_ERRORS=1 làm lộ chi tiết lỗi nội bộ - phải tắt khi production.')
        if not getattr(config, 'REFRESH_COOKIE_SECURE', False):
            problems.append('REFRESH_COOKIE_SECURE phải bật khi production (cần chạy HTTPS).')
    if getattr(config, 'REFRESH_COOKIE_SAMESITE', 'Lax') not in ('Lax', 'Strict', 'None'):
        problems.append('REFRESH_COOKIE_SAMESITE phải là Lax, Strict hoặc None.')
    if getattr(config, 'REFRESH_COOKIE_SAMESITE', 'Lax') == 'None' and not getattr(config, 'REFRESH_COOKIE_SECURE', False):
        problems.append('REFRESH_COOKIE_SAMESITE=None bắt buộc đi kèm REFRESH_COOKIE_SECURE=1.')
    if problems:
        raise RuntimeError('Cấu hình không an toàn, dừng khởi động:\n - ' + '\n - '.join(problems))
    if weak_jwt:
        logger.warning('[bảo mật] JWT_SECRET là giá trị mặc định/quá ngắn - hãy đặt chuỗi ngẫu nhiên >= %d ký tự '
                       '(khi đặt APP_ENV=production app sẽ từ chối khởi động).', MIN_SECRET_LENGTH)
