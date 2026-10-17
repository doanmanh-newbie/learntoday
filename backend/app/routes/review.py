# app/routes/review.py
from datetime import datetime

from flask import Blueprint, request, jsonify

from app import db
from app.models import User, UserWord, Word
from app.utils.middleware import token_required

bp = Blueprint('review', __name__, url_prefix='/api/review')


def _due_filter():
    return (
        UserWord.user_id == request.user_id,
        UserWord.level > 0,
        UserWord.next_review <= datetime.utcnow(),
    )


# ===== STT 5: ĐẾM SỐ TỪ ĐẾN HẠN ÔN TẬP =====
@bp.route('/due-count', methods=['GET'])
@token_required
def get_due_count():
    """Banner 'Bạn có X từ đến lịch ôn tập'. Trả cả 'count' và 'due_count' (tên FE từng dùng)."""
    count = UserWord.query.filter(*_due_filter()).count()
    return jsonify({'count': count, 'due_count': count}), 200


# ===== STT 5: LẤY DANH SÁCH TỪ ĐẾN HẠN ÔN TẬP =====
@bp.route('/due-words', methods=['GET'])
@token_required
def get_due_words():
    """
    Từ đến hạn ôn (next_review <= now), ưu tiên đến hạn sớm nhất; số lượng theo review_limit (STT 14).
    1 truy vấn JOIN duy nhất (trước đây 1 + N truy vấn: mỗi từ 1 lần gọi DB -> rất chậm khi DB ở xa).
    """
    user = db.session.get(User, request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    limit = request.args.get('limit', type=int) or user.review_limit or 10
    limit = min(max(1, limit), 30)

    rows = (
        db.session.query(Word, UserWord)
        .join(UserWord, UserWord.word_id == Word.id)
        .filter(*_due_filter(), Word.deleted_at.is_(None))
        .order_by(UserWord.next_review.asc())
        .limit(limit)
        .all()
    )

    if not rows:
        return jsonify({
            'message': 'Chúc mừng! Hôm nay bạn không có từ nào cần ôn tập.',
            'words': [],
            'has_due_words': False
        }), 200

    result = []
    for word, uw in rows:
        item = word.to_dict()
        item['level'] = uw.level
        item['next_review'] = uw.next_review.isoformat() if uw.next_review else None
        result.append(item)

    return jsonify({'words': result, 'has_due_words': True}), 200
