# app/services/study_service.py
"""
Module 6.5 - Quy trình học từ vựng (CỐT LÕI).
Được gọi bởi routes/words.py (dùng chung cho learn và review).
"""
from app import db
from app.models import Word, UserWord, LearningLog, User
from app.utils.srs import get_next_review
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

    user = User.query.get(user_id)
    if user:
        user.total_words_learned = (user.total_words_learned or 0) + 1

    db.session.commit()

    return {
        'result': 'hoan_thanh',
        'user_word': user_word.to_dict()
    }


# ============================================================
# Bước 4, Trường hợp 2: ÔN TẬP (loại = "review")
# ============================================================
def complete_review(user_id, word_id, wrong_count, choice):
    """
    Trường hợp A: biến_đếm_sai < 4 -> "hoàn_thành", tăng 1 Level SRS.
    Trường hợp B: biến_đếm_sai >= 4 -> bắt buộc có choice:
        - quay_ve_lv1 -> Reset LV1
        - lui_1_lv    -> Giảm 1 cấp độ (không dưới LV1)
        - bo_qua      -> Giữ nguyên Level, KHÔNG đổi next_review
    """
    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        raise ServiceError('Không tìm thấy từ vựng!', 404)

    user_word = UserWord.get_by_user_and_word(user_id, word_id)
    if not user_word or user_word.level < 1:
        raise ServiceError('Từ này chưa được học, không thể ôn tập!', 409)

    if wrong_count is None or not isinstance(wrong_count, int) or wrong_count < 0:
        raise ServiceError('wrong_count phải là số nguyên >= 0!', 400)

    level_before = user_word.level

    # ----- Trường hợp A: biến_đếm_sai < 4 -----
    if wrong_count < 4:
        result = 'hoan_thanh'
        level_after = min(level_before + 1, 6)
        user_word.next_review = get_next_review(level_after)

    # ----- Trường hợp B: biến_đếm_sai >= 4 -----
    else:
        if choice not in ('quay_ve_lv1', 'lui_1_lv', 'bo_qua'):
            raise ServiceError(
                'wrong_count >= 4 bắt buộc phải có choice hợp lệ: quay_ve_lv1 | lui_1_lv | bo_qua',
                400
            )

        result = choice

        if choice == 'quay_ve_lv1':
            level_after = 1
            user_word.next_review = get_next_review(1)

        elif choice == 'lui_1_lv':
            level_after = max(level_before - 1, 1)
            user_word.next_review = get_next_review(level_after)

        else:  # bo_qua
            level_after = level_before
            # Giữ nguyên next_review -> từ vẫn "đến hạn", sẽ xuất hiện lại ở due-words tiếp theo

    user_word.level = level_after
    user_word.last_reviewed = datetime.utcnow()
    user_word.review_count = (user_word.review_count or 0) + 1
    
    if wrong_count == 0:
        user_word.correct_count = (user_word.correct_count or 0) + 1
    else:
        user_word.wrong_count = (user_word.wrong_count or 0) + wrong_count

    # ✅ GHI LOG CÓ WRONG_COUNT
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

    return {
        'result': result,
        'user_word': user_word.to_dict()
    }