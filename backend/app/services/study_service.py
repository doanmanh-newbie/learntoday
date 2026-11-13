# app/services/study_service.py
"""
Module 6.5 - Quy trình học từ vựng (CỐT LÕI).
Được gọi bởi routes/words.py (dùng chung cho learn và review).
"""
from app import db
from sqlalchemy.exc import IntegrityError
from app.models import Word, UserWord, LearningLog, User
from app.utils.srs import decide_review, get_next_review
from app.services.streak_service import update_streak_if_goal_met
from app.services.pass_test_service import check_and_create_milestones
from datetime import datetime
import unicodedata
import uuid


class ServiceError(Exception):
    """Lỗi nghiệp vụ có chủ đích (khác với bug/exception ngoài ý muốn)."""
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


VALID_STEPS = ['spelling', 'quiz1', 'quiz2', 'quiz3']


def count_learned_words(user_id):
    """Số từ đã học = số bản ghi user_words có level >= 1 (đúng định nghĩa STT 16).

    Dùng làm NGUỒN SỰ THẬT thay cho bộ đếm users.total_words_learned (+1 mỗi lần) vốn bị lệch
    khi dùng mark_known / reset level / học lại.
    """
    return UserWord.query.filter(UserWord.user_id == user_id, UserWord.level >= 1).count()


def _sync_learned_total(user_id):
    """Đồng bộ users.total_words_learned theo COUNT thật + tạo mốc Pass nếu vượt 50/100/..."""
    user = db.session.get(User, user_id)
    if not user:
        return []
    db.session.flush()                       # để COUNT thấy cả bản ghi vừa thêm
    user.total_words_learned = count_learned_words(user_id)
    return check_and_create_milestones(user_id, user.total_words_learned)


def normalize_text(text):
    """
    Chuẩn hóa text để so sánh: chuẩn hóa Unicode (NFC), bỏ khoảng trắng thừa, lowercase.
    Bắt buộc chuẩn hóa Unicode vì tiếng Việt có dấu có thể được encode khác nhau.
    """
    if not text:
        return ''
    normalized = unicodedata.normalize('NFC', text)
    return ' '.join(normalized.strip().lower().split())


# ============================================================
# Bước 2 & 3: CHẤM ĐIỂM 1 BƯỚC (dùng chung cho learn và review)
# ============================================================
def check_step_answer(word_id, step, data):
    """
    Chấm đúng/sai cho 1 bước (spelling / quiz1 / quiz2 / quiz3).
    Stateless - không lưu gì vào DB, không quan tâm learn hay review.
    """
    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        raise ServiceError('Không tìm thấy từ vựng!', 404)

    if step not in VALID_STEPS:
        raise ServiceError(f'step không hợp lệ! Phải là 1 trong: {VALID_STEPS}', 400)

    # ----- Giai đoạn 1: Nhập chính tả -----
    if step == 'spelling':
        answer = data.get('answer', '')
        is_correct = normalize_text(answer) == normalize_text(word.word)
        return {
            'step': step,
            'correct': is_correct,
            'correct_answer': word.word
        }

    # ----- Dạng 1: Trắc nghiệm / Dạng 2: Điền từ -----
    if step in ('quiz1', 'quiz2'):
        selected_word_id = data.get('selected_word_id')
        if not selected_word_id:
            raise ServiceError('Vui lòng cung cấp selected_word_id!', 400)

        is_correct = str(selected_word_id) == str(word_id)
        return {
            'step': step,
            'correct': is_correct,
            'correct_word_id': str(word.id),
            'correct_word': word.word
        }

    # ----- Dạng 3: Ghép từ với nghĩa -----
    if step == 'quiz3':
        pairs = data.get('pairs', [])
        if not pairs or not isinstance(pairs, list):
            raise ServiceError('Vui lòng cung cấp danh sách pairs!', 400)

        submitted_ids = {str(p.get('word_id')) for p in pairs}
        if str(word_id) not in submitted_ids:
            raise ServiceError('Danh sách pairs phải bao gồm từ đang học!', 400)

        word_ids = [p.get('word_id') for p in pairs]
        words_in_pairs = Word.query.filter(Word.id.in_(word_ids)).all()
        words_map = {str(w.id): w for w in words_in_pairs}

        all_correct = True
        results = []
        for pair in pairs:
            pid = str(pair.get('word_id'))
            matched_meaning = normalize_text(pair.get('matched_meaning', ''))
            target_word = words_map.get(pid)

            if not target_word:
                all_correct = False
                results.append({'word_id': pid, 'correct': False})
                continue

            pair_correct = normalize_text(target_word.meaning) == matched_meaning
            if not pair_correct:
                all_correct = False

            results.append({
                'word_id': pid,
                'correct': pair_correct,
                'correct_meaning': target_word.meaning
            })

        return {
            'step': step,
            'correct': all_correct,
            'pairs_result': results
        }


# ============================================================
# Bước 4, Trường hợp 1: HỌC MỚI (loại = "learn")
# ============================================================
def complete_learn(user_id, word_id):
    """
    Chỉ có 1 kết quả: "hoàn_thành". KHÔNG hộp thoại, KHÔNG lùi LV, KHÔNG bỏ qua.
    -> Gán LV1, next_review = now + 20p, ghi log.
    """
    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        raise ServiceError('Không tìm thấy từ vựng!', 404)

    existing = UserWord.get_by_user_and_word(user_id, word_id)
    if existing and existing.level > 0:
        raise ServiceError('Từ này đã được học rồi!', 409)

    if existing:
        user_word = existing
        level_before = user_word.level
    else:
        user_word = UserWord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            word_id=word_id
        )
        db.session.add(user_word)
        level_before = 0

    user_word.level = 1
    user_word.next_review = get_next_review(1)
    user_word.last_reviewed = datetime.utcnow()

    log = LearningLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        word_id=word_id,
        action='learn',
        choice='hoan_thanh',
        level_before=level_before,
        level_after=1,
        wrong_count=0  # Learn mode không đếm sai
    )
    db.session.add(log)

    try:
        new_milestones = _sync_learned_total(user_id)
        db.session.commit()
    except IntegrityError:
        # Bấm "hoàn thành" 2 lần / mở 2 tab: cả 2 request cùng qua bước kiểm tra,
        # UNIQUE(user_id, word_id) chỉ cho 1 request thắng -> báo 409 thay vì lỗi 500.
        db.session.rollback()
        raise ServiceError('Từ này đã được học rồi!', 409)

    new_streak = update_streak_if_goal_met(user_id)

    return {
        'result': 'hoan_thanh',
        'user_word': user_word.to_dict(),
        'streak': new_streak,
        'new_milestones': new_milestones,
    }


# ============================================================
# Bước 4, Trường hợp 2: ÔN TẬP (loại = "review")
# ============================================================
def complete_review(user_id, word_id, wrong_count, choice):
    """
    Luật chuyển cấp nằm ở app/utils/srs.py::decide_review (đọc docstring ở đó):
      0 lần sai -> hoan_thanh (+1 cấp) | 1-3 lần sai -> giu_level | >= 4 lần sai -> lui_1_lv (mặc định)
      choice hợp lệ (quay_ve_lv1 | lui_1_lv | bo_qua) luôn được tôn trọng.
      bo_qua -> giữ cấp, hoãn SKIP_DELAY (không xuất hiện lại ngay).
    """
    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        raise ServiceError('Không tìm thấy từ vựng!', 404)

    user_word = UserWord.get_by_user_and_word(user_id, word_id)
    if not user_word or user_word.level < 1:
        raise ServiceError('Từ này chưa được học, không thể ôn tập!', 409)

    if wrong_count is None or isinstance(wrong_count, bool) or not isinstance(wrong_count, int) or wrong_count < 0:
        raise ServiceError('wrong_count phải là số nguyên >= 0!', 400)

    level_before = user_word.level
    try:
        result, level_after, interval = decide_review(level_before, wrong_count, choice)
    except ValueError:
        raise ServiceError('choice không hợp lệ! Phải là 1 trong: quay_ve_lv1 | lui_1_lv | bo_qua', 400)

    now = datetime.utcnow()
    user_word.level = level_after
    user_word.next_review = now + interval
    user_word.last_reviewed = now
    user_word.review_count = (user_word.review_count or 0) + 1

    if wrong_count == 0:
        user_word.correct_count = (user_word.correct_count or 0) + 1
    else:
        user_word.wrong_count = (user_word.wrong_count or 0) + wrong_count

    log = LearningLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        word_id=word_id,
        action='review',
        choice=result,
        level_before=level_before,
        level_after=level_after,
        wrong_count=wrong_count
    )
    db.session.add(log)
    db.session.commit()

    streak = update_streak_if_goal_met(user_id)      # ôn tập cũng được tính cho chuỗi ngày (xem streak_service.py)

    return {
        'result': result,
        'user_word': user_word.to_dict(),
        'streak': streak,
    }


# ============================================================
# STT 6: ĐÁNH DẤU "ĐÃ BIẾT"
# ============================================================
def mark_known(user_id, word_id):
    """User đã biết từ → LV1, next_review xa 30 ngày, KHÔNG tính daily goal"""
    from datetime import timedelta
    
    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        raise ServiceError('Không tìm thấy từ vựng!', 404)

    existing = UserWord.get_by_user_and_word(user_id, word_id)
    if existing and existing.level > 0:
        # Trước đây gọi lại sẽ ĐẶT LẠI từ đang ở LV5 về LV1 -> mất toàn bộ tiến độ SRS
        raise ServiceError('Từ này đã được học rồi, không thể đánh dấu "đã biết"!', 409)

    if existing:
        user_word = existing
        level_before = user_word.level
    else:
        user_word = UserWord(id=str(uuid.uuid4()), user_id=user_id, word_id=word_id)
        db.session.add(user_word)
        level_before = 0

    user_word.level = 1
    user_word.next_review = datetime.utcnow() + timedelta(days=30)
    user_word.last_reviewed = datetime.utcnow()

    log = LearningLog(
        id=str(uuid.uuid4()), user_id=user_id, word_id=word_id,
        action='learn', choice='da_biet',
        level_before=level_before, level_after=1, wrong_count=0
    )
    db.session.add(log)
    try:
        new_milestones = _sync_learned_total(user_id)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ServiceError('Từ này đã được đánh dấu rồi!', 409)

    return {'result': 'da_biet', 'user_word': user_word.to_dict(), 'new_milestones': new_milestones}


# ============================================================
# STT 6: BỎ QUA TỪ
# ============================================================
def skip_word(user_id, word_id):
    """User bỏ qua từ → không học, KHÔNG tính daily goal"""
    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        raise ServiceError('Không tìm thấy từ vựng!', 404)

    log = LearningLog(
        id=str(uuid.uuid4()), user_id=user_id, word_id=word_id,
        action='skip', choice='bo_qua',
        level_before=0, level_after=0, wrong_count=0
    )
    db.session.add(log)
    db.session.commit()

    return {'result': 'bo_qua', 'word_id': word_id}


# ============================================================
# STT 6: NHẮC NHỞ SAU X NGÀY
# ============================================================
def snooze_word(user_id, word_id, days=7):
    """User muốn nhắc sau X ngày → set next_review = now + X days"""
    from datetime import timedelta
    
    if isinstance(days, bool) or not isinstance(days, int) or days < 1 or days > 365:
        raise ServiceError('Số ngày phải là số nguyên từ 1 đến 365!', 400)

    user_word = UserWord.get_by_user_and_word(user_id, word_id)
    if not user_word:
        raise ServiceError('Từ này chưa được học!', 409)

    user_word.next_review = datetime.utcnow() + timedelta(days=days)
    db.session.commit()

    return {'result': 'snooze', 'next_review': user_word.next_review.isoformat(), 'days': days}