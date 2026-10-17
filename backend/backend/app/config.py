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
    if config.JWT_SECRET in _INSECURE_SECRETS or len(config.JWT_SECRET) < 16:
        logger.warning('[bảo mật] JWT_SECRET là giá trị mặc định/quá ngắn - hãy đặt chuỗi ngẫu nhiên >= 32 ký tự.')
