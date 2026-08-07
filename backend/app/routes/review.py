# app/routes/review.py
from flask import Blueprint, request, jsonify
from app.models import User, UserWord, Word
from app.utils.middleware import token_required
from app.services.study_service import ServiceError
from datetime import datetime

bp = Blueprint('review', __name__, url_prefix='/api/review')  # ✅ ĐÃ SỬA


# ===== STT 5: ĐẾM SỐ TỪ ĐẾN HẠN ÔN TẬP =====
@bp.route('/due-count', methods=['GET'])
@token_required
def get_due_count():
    """Trả về { "count": X } - dùng cho banner 'Bạn có X từ đến lịch ôn tập'."""
    count = UserWord.query.filter(
        UserWord.user_id == request.user_id,
        UserWord.level > 0,
        UserWord.next_review <= datetime.utcnow()
    ).count()

    return jsonify({'count': count}), 200


# ===== STT 5: LẤY DANH SÁCH TỪ ĐẾN HẠN ÔN TẬP =====
@bp.route('/due-words', methods=['GET'])
@token_required
def get_due_words():
    """
    Lấy danh sách từ đến hạn ôn (next_review <= now), ưu tiên từ đến hạn sớm nhất.
    Số lượng lấy theo review_limit (STT 14) của user, mặc định 10.
    """
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    limit = request.args.get('limit', type=int)
    if not limit:
        limit = user.review_limit or 10
    limit = min(max(1, limit), 30)

    due_words_raw = UserWord.get_due_reviews(request.user_id, limit=limit)

    if not due_words_raw:
        return jsonify({
            'message': 'Chúc mừng! Hôm nay bạn không có từ nào cần ôn tập.',
            'words': [],
            'has_due_words': False
        }), 200

    result = []
    for uw in due_words_raw:
        word = Word.query.filter_by(id=uw.word_id, deleted_at=None).first()
        if not word:
            continue
        word_dict = word.to_dict()
        word_dict['level'] = uw.level
        word_dict['next_review'] = uw.next_review.isoformat() if uw.next_review else None
        result.append(word_dict)

    return jsonify({
        'words': result,
        'has_due_words': True
    }), 200