"""
Chẩn đoán kết nối database từng bước và đưa ra gợi ý sửa lỗi bằng tiếng Việt.

Chạy (trong thư mục backend/, đã kích hoạt venv):
    python scripts/diagnose_db.py

Không in mật khẩu. Thoát với mã 0 nếu mọi bước đạt, 1 nếu có lỗi.
"""
import os
import re
import socket
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import Config, DB_WARNINGS, _URL_RE  # noqa: E402

OK, BAD, WARN = '[ OK ]', '[LỖI]', '[ !! ]'
problems = []


def say(tag, msg):
    print(f'{tag} {msg}')


def hint_for(err: str) -> str:
    e = err.lower()
    table = [
        ('password authentication failed', 'Sai mật khẩu/tên đăng nhập. Vào Supabase > Project Settings > Database > "Reset database password", '
         'rồi đặt vào backend/.env bằng DB_PASSWORD (giữ nguyên ký tự đặc biệt, không cần mã hóa).'),
        ('tenant or user not found', 'Pooler không nhận ra project. Tên user phải dạng postgres.<project-ref> và host phải đúng vùng '
         '(aws-0/aws-1-<region>.pooler.supabase.com). Lấy lại chuỗi ở nút "Connect" trên dashboard.'),
        ('could not translate host name', 'Không phân giải được tên miền: kiểm tra mạng/DNS và chính tả DB_HOST.'),
        ('network is unreachable', 'Máy bạn không có IPv6 mà host direct (db.<ref>.supabase.co) chỉ có IPv6. Đổi sang host POOLER '
         '(aws-*-*.pooler.supabase.com) ở nút Connect > Session pooler.'),
        ('timeout expired', 'Hết thời gian chờ: project có thể đang PAUSED (vào dashboard bấm Restore), hoặc mạng/tường lửa chặn cổng 5432/6543.'),
        ('connection timed out', 'Hết thời gian chờ: project có thể đang PAUSED (vào dashboard bấm Restore), hoặc mạng/tường lửa chặn cổng.'),
        ('max clients reached', 'Pooler đầy kết nối. Giảm DB_POOL_SIZE/DB_MAX_OVERFLOW, tắt debug reloader (use_reloader=False), '
         'hoặc dùng Transaction pooler cổng 6543.'),
        ('maxclientsinsessionmode', 'Pooler (Session mode) đầy kết nối. Giảm DB_POOL_SIZE hoặc dùng Transaction pooler cổng 6543.'),
        ('ssl', 'Lỗi SSL: đặt DB_SSLMODE=require (mặc định) và dùng bản psycopg2-binary mới.'),
        ('server closed the connection unexpectedly', 'Server đóng kết nối: project có thể vừa bị pause/đang khởi động lại. Chờ 1-2 phút rồi thử lại.'),
        ('does not exist', 'Sai tên database: Supabase dùng "postgres" (DB_NAME=postgres).'),
    ]
    for key, msg in table:
        if key in e:
            return msg
    return 'Xem thông báo lỗi gốc ở trên; nếu vẫn bí, gửi nó (đã ẩn mật khẩu) để được hỗ trợ.'


def connect(url, password=None, timeout=10):
    import psycopg2
    return psycopg2.connect(
        host=url.host, port=url.port or 5432, dbname=url.database, user=url.username,
        password=url.password if password is None else password,
        connect_timeout=timeout, sslmode=Config.SQLALCHEMY_ENGINE_OPTIONS.get('connect_args', {}).get('sslmode', 'require'),
    )


def main():
    print('=== CHẨN ĐOÁN KẾT NỐI DATABASE ===\n')
    url = Config.SQLALCHEMY_DATABASE_URI
    if url is None or isinstance(url, str):
        say(BAD, 'Chưa có cấu hình Postgres. Điền DB_HOST/DB_USER/DB_PASSWORD/DB_NAME trong backend/.env (xem .env.example).')
        return 1

    nguon = 'DB_HOST/DB_USER/DB_PASSWORD' if os.environ.get('DB_HOST') else 'DATABASE_URL'
    say(OK, f'Cấu hình đọc từ {nguon}')
    print(f'       host={url.host}  port={url.port}  db={url.database}  user={url.username}  '
          f'password={"<%d ký tự>" % len(url.password) if url.password else "<TRỐNG>"}')
    for w in DB_WARNINGS:
        say(WARN, w)

    if url.host and url.host.startswith('db.') and url.host.endswith('.supabase.co'):
        say(WARN, 'Đang dùng kết nối DIRECT (chỉ IPv6 ở gói Free). Nếu mạng không có IPv6 sẽ lỗi - nên dùng Session pooler.')
    if url.port == 6543:
        say(OK, 'Cổng 6543 = Transaction pooler (phù hợp backend nhiều request).')
    elif url.port == 5432 and url.host and 'pooler' in url.host:
        say(WARN, 'Cổng 5432 trên pooler = Session mode: giới hạn ~15 client. Pool đã đặt nhỏ '
                  f'(size={Config.SQLALCHEMY_ENGINE_OPTIONS.get("pool_size")}), đừng chạy nhiều process.')

    # 1. DNS
    try:
        infos = socket.getaddrinfo(url.host, url.port or 5432, type=socket.SOCK_STREAM)
        fams = sorted({'IPv6' if i[0] == socket.AF_INET6 else 'IPv4' for i in infos})
        say(OK, f'DNS phân giải được: {", ".join(fams)}')
        if fams == ['IPv6']:
            say(WARN, 'Host chỉ có IPv6. Nếu bước kết nối bên dưới lỗi "Network is unreachable" -> dùng host pooler.')
    except OSError as e:
        say(BAD, f'DNS lỗi: {e}\n       -> {hint_for(str(e))}')
        return 1

    # 2. TCP
    tcp_ok = False
    for fam, _, _, _, addr in infos:
        try:
            with socket.socket(fam, socket.SOCK_STREAM) as s:
                s.settimeout(8)
                s.connect(addr)
            say(OK, f'Mở được TCP tới {addr[0]}:{addr[1]}')
            tcp_ok = True
            break
        except OSError as e:
            say(WARN, f'TCP tới {addr[0]} thất bại: {e}')
    if not tcp_ok:
        say(BAD, 'Không mở được kết nối mạng tới server. ' + hint_for('timeout expired'))
        return 1

    # 3. Đăng nhập Postgres (thử cả cách hiểu mật khẩu "thô" nếu DATABASE_URL có %XX)
    conn = None
    attempts = [('mật khẩu như cấu hình', None)]
    raw = os.environ.get('DATABASE_URL', '')
    m = _URL_RE.match(raw) if raw and not os.environ.get('DB_HOST') else None
    if m and m.group('password') and m.group('password') != url.password:
        attempts.append(('mật khẩu THÔ trong DATABASE_URL (không giải mã %XX)', m.group('password')))
    last_err = ''
    for label, pw in attempts:
        try:
            conn = connect(url, pw)
            say(OK, f'Đăng nhập Postgres thành công bằng {label}')
            if pw is not None:
                say(WARN, 'Mật khẩu THÔ mới đúng -> DATABASE_URL của bạn đang bị giải mã sai. Hãy chuyển sang '
                          'DB_HOST/DB_USER/DB_PASSWORD (hoặc viết % thành %25).')
            break
        except Exception as e:  # noqa: BLE001
            last_err = str(e).strip().splitlines()[0]
            say(BAD, f'Đăng nhập bằng {label} thất bại: {last_err}')
    if conn is None:
        print('       -> ' + hint_for(last_err))
        return 1

    cur = conn.cursor()
    cur.execute('select version(), current_user, current_database(), (select ssl from pg_stat_ssl where pid = pg_backend_pid())')
    ver, user, dbn, ssl = cur.fetchone()
    say(OK, f'{ver.split(",")[0]} | user={user} | db={dbn} | SSL={"bật" if ssl else "TẮT"}')

    # 4. Độ trễ
    times = []
    for _ in range(5):
        t = time.perf_counter()
        cur.execute('select 1')
        cur.fetchone()
        times.append((time.perf_counter() - t) * 1000)
    avg = sum(times) / len(times)
    tag = OK if avg < 120 else WARN
    say(tag, f'Độ trễ mỗi truy vấn trung bình {avg:.0f} ms' + (
        '  -> hơi xa: mỗi API gọi nhiều truy vấn sẽ chậm. Cân nhắc đặt project ở vùng Singapore (ap-southeast-1).' if avg >= 120 else ''))

    # 5. Schema + dữ liệu
    cur.execute("select table_name from information_schema.tables where table_schema='public'")
    tables = {r[0] for r in cur.fetchall()}
    expected = {'users', 'words', 'folders', 'folder_words', 'user_words', 'learning_logs',
                'refresh_tokens', 'search_history', 'user_milestones', 'alembic_version'}
    missing = sorted(expected - tables)
    if missing:
        say(BAD, f'Thiếu bảng: {", ".join(missing)}\n       -> chạy:  flask db upgrade   rồi   python seed_from_crawl.py')
        problems.append('schema')
    else:
        say(OK, 'Đủ 10 bảng cần thiết')
        cur.execute('select version_num from alembic_version')
        cur_rev = {r[0] for r in cur.fetchall()}
        try:
            from alembic.config import Config as AC
            from alembic.script import ScriptDirectory
            base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            ac = AC(os.path.join(base, 'migrations', 'alembic.ini'))
            ac.set_main_option('script_location', os.path.join(base, 'migrations'))
            head = set(ScriptDirectory.from_config(ac).get_heads())
            if cur_rev == head:
                say(OK, f'Migration đã ở bản mới nhất ({", ".join(head)})')
            else:
                say(BAD, f'Migration chưa mới nhất: DB={cur_rev} / code={head}  -> chạy: flask db upgrade')
                problems.append('migration')
        except Exception as e:  # noqa: BLE001
            say(WARN, f'Không so được phiên bản migration: {e}')

        for t in ('users', 'folders', 'words', 'folder_words'):
            cur.execute(f'select count(*) from {t}')
            n = cur.fetchone()[0]
            say(OK if n else WARN, f'{t}: {n} dòng' + ('' if n else '  (trống -> python seed_from_crawl.py)'))
        cur.execute("select count(*) from words where meaning is not null and meaning !~ '[ăâđêôơưáàảãạéèẻẽẹíìỉĩịóòỏõọúùủũụýỳỷỹỵ]'")
        no_vi = cur.fetchone()[0]
        if no_vi:
            say(WARN, f'{no_vi} từ có nghĩa KHÔNG chứa tiếng Việt (có thể chưa dịch) -> python seed_from_crawl.py áp bản dịch.')

    conn.close()
    print('\n' + ('Kết nối OK nhưng còn việc cần làm ở trên.' if problems else 'Mọi bước đều ổn.'))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
