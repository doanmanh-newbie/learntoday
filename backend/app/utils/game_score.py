# app/utils/game_score.py - chấm điểm game flappy phía server từ nhật ký trả lời (thuần Python, không đụng database)
import re
import unicodedata

TIER_POINTS = {1: 10, 2: 13, 3: 16, 4: 20}
STREAK_STEP = 2      # mỗi câu đúng liên tiếp (sau câu đầu) cộng thêm
STREAK_CAP = 10      # trần phần thưởng chuỗi
LIVES = 3
MIN_ANSWER_GAP_MS = 2500   # câu đầu tính từ t=0
MAX_ANSWERS = 200


class RunError(ValueError):
    def __init__(self, message):
        super().__init__(message)
        self.message = message


def tier_of(difficulty):
    try:
        return min(4, max(1, int(difficulty)))
    except (TypeError, ValueError):
        return 1


def points_for(tier, streak):
    """streak: độ dài chuỗi đúng SAU câu này (>= 1)."""
    return TIER_POINTS[tier_of(tier)] + min(STREAK_CAP, STREAK_STEP * (max(1, streak) - 1))


def max_score(tiers):
    return sum(points_for(t, i + 1) for i, t in enumerate(tiers))


def _norm(s):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', str(s or '')).lower()).strip()


def score_run(answers, words):
    if not answers:
        raise RunError('Chưa có câu trả lời nào.')
    if len(answers) > MAX_ANSWERS:
        raise RunError('Quá nhiều câu trả lời.')
    score = correct = wrong = streak = 0
    prev_t, seen = 0, set()
    for a in answers:
        if wrong >= LIVES:
            raise RunError('Còn trả lời sau khi đã hết mạng.')
        wid, d, t = a.get('word_id'), a.get('dir'), a.get('t_ms')
        w = words.get(wid)
        if w is None:
            raise RunError('Từ không hợp lệ.')
        if wid in seen:
            raise RunError('Từ bị lặp.')
        if d not in ('en_vi', 'vi_en'):
            raise RunError('Hướng câu hỏi không hợp lệ.')
        if not isinstance(t, int) or isinstance(t, bool) or t <= prev_t:
            raise RunError('Thời gian trả lời không hợp lệ.')
        if t - prev_t < MIN_ANSWER_GAP_MS:
            raise RunError('Trả lời quá nhanh.')
        seen.add(wid)
        prev_t = t
        if _norm(a.get('choice')) == _norm(w.meaning if d == 'en_vi' else w.word):
            correct += 1
            streak += 1
            score += points_for(tier_of(w.difficulty), streak)
        else:
            wrong += 1
            streak = 0
    return {'score': score, 'correct': correct, 'answered': len(answers)}
