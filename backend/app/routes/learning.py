# app/routes/learning.py
from flask import Blueprint, request, jsonify
from app import db
from app.models import Folder, Word, FolderWord, User, UserWord, LearningLog
from app.utils.middleware import token_required, is_same_user
from datetime import datetime, timedelta
import unicodedata
import uuid

bp = Blueprint('learning', __name__, url_prefix='/api/learning')


# ===== SRS INTERVALS (STT 8) - dùng chung cho learn (LV1) & review (STT 5 sau này) =====
SRS_INTERVALS = {
    1: timedelta(minutes=20),   # Mới học
    2: timedelta(hours=10),     # Biết
    3: timedelta(hours=24),     # Gần thuộc
    4: timedelta(days=1),       # Đã thuộc
    5: timedelta(days=3),       # Nhớ dai
    6: timedelta(days=5),       # Không quên
}

# Các bước hợp lệ trong Module 6.5 (STT 6.5)
VALID_STEPS = ['spelling', 'quiz1', 'quiz2', 'quiz3']


def get_next_review(level):
    """Tính next_review dựa theo Level SRS (STT 8)"""
    interval = SRS_INTERVALS.get(level, timedelta(minutes=20))
    return datetime.utcnow() + interval


def normalize_text(text):
    """
    Chuẩn hóa text để so sánh: chuẩn hóa Unicode (NFC), bỏ khoảng trắng thừa, lowercase.
    Bắt buộc phải chuẩn hóa Unicode vì tiếng Việt có dấu có thể được encode khác nhau
    (NFC vs NFD) tùy hệ điều hành/nguồn nhập liệu - 2 chuỗi nhìn giống hệt nhau nhưng
    khác byte sẽ so sánh sai nếu không normalize trước.
    """
    if not text:
        return ''
    normalized = unicodedata.normalize('NFC', text)
    return ' '.join(normalized.strip().lower().split())


# ===== STT 6: LẤY BATCH TỪ MỚI (LV0) TỪ 1 FOLDER =====
@bp.route('/folders/<folder_id>/new-words', methods=['GET'])
@token_required
def get_new_words(folder_id):
    """
    Lấy danh sách từ chưa học (chưa có bản ghi user_words) trong 1 folder.
    FE dùng chính danh sách này để tự random đáp án sai trong batch (không cần gọi API riêng).
    """
    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    # Chặn user xem/học từ folder cá nhân của người khác (trừ admin)
    if folder.type == 'personal' and not is_same_user(folder.user_id, request.user_id):
        current_user = User.query.get(request.user_id)
        if not current_user or current_user.role != 'admin':
            return jsonify({'message': 'Bạn không có quyền học folder này!'}), 403

    limit = request.args.get('limit', 5, type=int)
    limit = min(max(1, limit), 30)

    words = UserWord.get_words_for_learning(request.user_id, folder_id, limit=limit)

    if not words:
        return jsonify({
            'message': 'Bạn đã học hết từ mới trong folder này! Hãy chọn folder khác để tiếp tục học.',
            'words': [],
            'has_new_words': False
        }), 200

    return jsonify({
        'words': [w.to_dict() for w in words],
        'has_new_words': True
    }), 200


# ===== STT 6.5: CHẤM ĐIỂM 1 BƯỚC (spelling / quiz1 / quiz2 / quiz3) =====
@bp.route('/words/<word_id>/check-answer', methods=['POST'])
@token_required
def check_answer(word_id):
    """
    Chấm đúng/sai cho 1 bước trong Module 6.5. KHÔNG lưu gì vào DB ở bước này
    (stateless) - biến_đếm_sai được FE tự quản lý trong phiên học.

    Body theo từng step:
    - spelling: { "step": "spelling", "answer": "apple" }
    - quiz1 (trắc nghiệm chọn nghĩa đúng): { "step": "quiz1", "selected_word_id": "..." }
    - quiz2 (điền từ vào chỗ trống, chọn từ gợi ý): { "step": "quiz2", "selected_word_id": "..." }
    - quiz3 (ghép từ với nghĩa, có thể ghép nhiều cặp cùng lúc):
        { "step": "quiz3", "pairs": [ {"word_id": "...", "matched_meaning": "..."}, ... ] }
    """
    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        return jsonify({'message': 'Không tìm thấy từ vựng!'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

    step = data.get('step')
    if step not in VALID_STEPS:
        return jsonify({'message': f'step không hợp lệ! Phải là 1 trong: {VALID_STEPS}'}), 400

    # ----- Bước 2: Giai đoạn 1 - Nhập chính tả -----
    if step == 'spelling':
        answer = data.get('answer', '')
        is_correct = normalize_text(answer) == normalize_text(word.word)

        return jsonify({
            'step': step,
            'correct': is_correct,
            'correct_answer': word.word
        }), 200

    # ----- Bước 3, Dạng 1: Trắc nghiệm chọn đáp án đúng (theo nghĩa) -----
    # ----- Bước 3, Dạng 2: Điền từ vào chỗ trống (chọn từ gợi ý) -----
    if step in ('quiz1', 'quiz2'):
        selected_word_id = data.get('selected_word_id')
        if not selected_word_id:
            return jsonify({'message': 'Vui lòng cung cấp selected_word_id!'}), 400

        is_correct = str(selected_word_id) == str(word_id)

        return jsonify({
            'step': step,
            'correct': is_correct,
            'correct_word_id': str(word.id),
            'correct_word': word.word
        }), 200

    # ----- Bước 3, Dạng 3: Ghép từ với nghĩa -----
    if step == 'quiz3':
        pairs = data.get('pairs', [])
        if not pairs or not isinstance(pairs, list):
            return jsonify({'message': 'Vui lòng cung cấp danh sách pairs!'}), 400

        submitted_ids = {str(p.get('word_id')) for p in pairs}
        if str(word_id) not in submitted_ids:
            return jsonify({'message': 'Danh sách pairs phải bao gồm từ đang học!'}), 400

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

        return jsonify({
            'step': step,
            'correct': all_correct,
            'pairs_result': results
        }), 200


# ===== STT 6.5 (nhánh "learn"): HOÀN THÀNH 1 TỪ =====
@bp.route('/words/<word_id>/complete-learn', methods=['POST'])
@token_required
def complete_learn(word_id):
    """
    Module 6.5 - Trường hợp 1: Học mới (loại = "learn")
    Chỉ có 1 kết quả: "hoàn_thành". KHÔNG hộp thoại, KHÔNG lùi LV, KHÔNG bỏ qua.
    Gọi khi FE xác nhận user đã đi qua đủ 4 bước (bất kể sai bao nhiêu lần).
    -> Gán LV1, next_review = now + 20p, ghi log.
    """
    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        return jsonify({'message': 'Không tìm thấy từ vựng!'}), 404

    existing = UserWord.get_by_user_and_word(request.user_id, word_id)
    if existing and existing.level > 0:
        return jsonify({'message': 'Từ này đã được học rồi!'}), 409

    if existing:
        user_word = existing
        level_before = user_word.level
    else:
        user_word = UserWord(
            id=str(uuid.uuid4()),
            user_id=request.user_id,
            word_id=word_id
        )
        db.session.add(user_word)
        level_before = 0

    user_word.level = 1
    user_word.next_review = get_next_review(1)
    user_word.last_reviewed = datetime.utcnow()

    log = LearningLog(
        id=str(uuid.uuid4()),
        user_id=request.user_id,
        word_id=word_id,
        action='learn',
        choice='hoan_thanh',
        level_before=level_before,
        level_after=1
    )
    db.session.add(log)

    user = User.query.get(request.user_id)
    if user:
        user.total_words_learned = (user.total_words_learned or 0) + 1

    db.session.commit()

    return jsonify({
        'message': 'Hoàn thành học từ mới!',
        'result': 'hoan_thanh',
        'user_word': user_word.to_dict()
    }), 200


# ===== STT 6: TIẾN ĐỘ MỤC TIÊU HỌC TRONG NGÀY =====
@bp.route('/progress/today', methods=['GET'])
@token_required
def get_today_progress():
    """
    Tiến độ học từ mới hôm nay so với daily_goal (STT 14) của user.
    Dùng để hiển thị "Hôm nay bạn đã học: X/X từ" và banner hoàn thành mục tiêu.
    """
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    learned_today = LearningLog.count_learned_today(request.user_id)
    daily_target = user.daily_goal or 10

    return jsonify({
        'learned_today': learned_today,
        'daily_target': daily_target,
        'is_completed': learned_today >= daily_target,
        'streak': user.streak
    }), 200