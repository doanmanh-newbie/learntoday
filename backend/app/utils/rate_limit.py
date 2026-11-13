# app/utils/rate_limit.py - giới hạn tần suất theo người dùng (cửa sổ trượt, trong bộ nhớ)
import threading
import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    """Giới hạn đơn giản, KHÔNG chia sẻ giữa các process (chạy nhiều worker gunicorn thì mỗi worker đếm riêng;
    cần giới hạn chính xác tuyệt đối thì chuyển sang Redis). Đủ để chặn lạm dụng gọi AI tốn tiền."""

    PRUNE_ABOVE = 5000          # quá số khóa này thì dọn các khóa đã hết hạn (kẻ xấu thử hàng triệu email khác nhau)

    def __init__(self):
        self._hits = defaultdict(deque)
        self._windows = {}
        self._lock = threading.Lock()

    def _prune(self, now):
        for key in [k for k, hits in self._hits.items()
                    if not hits or now - hits[-1] >= self._windows.get(k, 3600)]:
            self._hits.pop(key, None)
            self._windows.pop(key, None)

    def check(self, key, limit, window_seconds=3600):
        """Trả (được_phép, số_giây_phải_chờ). Mỗi lần được phép sẽ tính 1 lượt."""
        now = time.monotonic()
        with self._lock:
            if len(self._hits) > self.PRUNE_ABOVE:
                self._prune(now)
            hits = self._hits[key]
            self._windows[key] = window_seconds
            while hits and now - hits[0] >= window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                return False, int(window_seconds - (now - hits[0])) + 1
            hits.append(now)
            return True, 0

    # Dùng cho đăng nhập: CHỈ lần sai mới bị tính, nên người dùng đúng mật khẩu không bao giờ bị khóa oan.
    def blocked(self, key, limit, window_seconds):
        """Đã đủ `limit` lần ghi nhận trong cửa sổ chưa? Trả (bị_chặn, số_giây_phải_chờ). KHÔNG tính thêm lượt."""
        now = time.monotonic()
        with self._lock:
            hits = self._hits.get(key)
            if not hits:
                return False, 0
            while hits and now - hits[0] >= window_seconds:
                hits.popleft()
            if len(hits) >= limit:
                return True, int(window_seconds - (now - hits[0])) + 1
            return False, 0

    def record(self, key, window_seconds=900):
        """Ghi nhận một lần (vd: đăng nhập sai)."""
        now = time.monotonic()
        with self._lock:
            if len(self._hits) > self.PRUNE_ABOVE:
                self._prune(now)
            self._hits[key].append(now)
            self._windows[key] = window_seconds

    def forget(self, key):
        with self._lock:
            self._hits.pop(key, None)
            self._windows.pop(key, None)

    def reset(self):
        with self._lock:
            self._hits.clear()
            self._windows.clear()


ai_limiter = SlidingWindowLimiter()
auth_limiter = SlidingWindowLimiter()       # đăng nhập / đăng ký / quên mật khẩu (chống dò mật khẩu, spam email)
