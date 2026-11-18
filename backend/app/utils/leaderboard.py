# app/utils/leaderboard.py - luật bảng xếp hạng bạn bè theo tuần (thuần Python, không đụng database)
from datetime import datetime, timedelta, timezone

LEARN_POINTS = 10    # mỗi từ mới học xong
REVIEW_POINTS = 5    # mỗi lượt ôn (không tính "bỏ qua")


# Trần điểm theo NGÀY (giờ VN) để một vòng lặp gọi API không "cày" được bảng xếp hạng. Mục tiêu học tối đa là 30 từ/ngày
# nên người học nghiêm túc không bao giờ chạm trần. Cùng một từ chỉ được tính tối đa MAX_REVIEWS_PER_WORD_PER_DAY lượt ôn/ngày
# (hợp lệ: cấp 1 hẹn 20 phút nên 1 từ có thể ôn 2-3 lần trong ngày).
LEARN_CAP_PER_DAY = 100
REVIEW_CAP_PER_DAY = 300
MAX_REVIEWS_PER_WORD_PER_DAY = 3


def capped_counts(rows, tz):
    """rows: (user_id, action, choice, word_id, created_at_utc_naive). Trả {user_id: (số_từ_mới, số_lượt_ôn)} đã áp trần theo ngày."""
    learned = {}      # (user, ngày) -> số từ mới khác nhau
    reviewed = {}     # (user, ngày) -> tổng lượt ôn đã tính
    per_word = {}     # (user, ngày, từ) -> số lượt ôn đã tính
    learn_seen = set()
    for user_id, action, choice, word_id, created_at in rows:
        day = created_at.replace(tzinfo=timezone.utc).astimezone(tz).date()
        if action == 'learn' and choice == 'hoan_thanh':
            if (user_id, word_id) in learn_seen:
                continue
            learn_seen.add((user_id, word_id))
            learned[(user_id, day)] = learned.get((user_id, day), 0) + 1
        elif action == 'review' and choice != 'bo_qua':
            key = (user_id, day, word_id)
            if per_word.get(key, 0) >= MAX_REVIEWS_PER_WORD_PER_DAY:
                continue
            per_word[key] = per_word.get(key, 0) + 1
            reviewed[(user_id, day)] = reviewed.get((user_id, day), 0) + 1
    out = {}
    for (uid, _), n in learned.items():
        l, r = out.get(uid, (0, 0)); out[uid] = (l + min(n, LEARN_CAP_PER_DAY), r)
    for (uid, _), n in reviewed.items():
        l, r = out.get(uid, (0, 0)); out[uid] = (l, r + min(n, REVIEW_CAP_PER_DAY))
    return out


def week_start_utc(now_vn):
    """Thứ Hai 00:00 giờ VN của tuần chứa `now_vn` (datetime có tzinfo), đổi ra UTC dạng naive như cột created_at."""
    monday = (now_vn - timedelta(days=now_vn.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    return monday.astimezone(timezone.utc).replace(tzinfo=None)


def points(learned, reviewed):
    return (learned or 0) * LEARN_POINTS + (reviewed or 0) * REVIEW_POINTS


def rank(rows):
    """Sắp theo điểm giảm dần (cùng điểm thì theo tên), cùng điểm thì cùng hạng."""
    out = sorted(rows, key=lambda r: (-r['points'], str(r['username']).lower()))
    prev, current = None, 0
    for i, r in enumerate(out, 1):
        if r['points'] != prev:
            current, prev = i, r['points']
        r['rank'] = current
    return out
