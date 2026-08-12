# app/routes/history.py - STT 7 Lịch sử học tập
from flask import Blueprint, request, jsonify
from app import db
from app.models import User, UserWord, Word, LearningLog
from app.utils.middleware import token_required

bp = Blueprint('history', __name__, url_prefix='/api/history')


@bp.route('/words', methods=['GET'])
@token_required
def get_learned_words():
    """Danh sách từ đã học (level >= 1)."""
    page = max(1, request.args.get('page', 1, type=int))
    limit = min(max(1, request.args.get('limit', 20, type=int)), 100)

    query = UserWord.query.filter(
        UserWord.user_id == request.user_id,
        UserWord.level >= 1
    ).order_by(UserWord.updated_at.desc())

    total = query.count()
    user_words = query.offset((page - 1) * limit).limit(limit).all()

    words_list = []
    for uw in user_words:
        word = Word.query.filter_by(id=uw.word_id, deleted_at=None).first()
        if not word:
            continue
        item = word.to_dict()
        item['level'] = uw.level
        item['last_reviewed'] = uw.last_reviewed.isoformat() if uw.last_reviewed else None
        item['is_mastered'] = uw.is_mastered()
        words_list.append(item)

    return jsonify({
        'words': words_list,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'has_more': (page * limit) < total,
        }
    }), 200


@bp.route('/stats', methods=['GET'])
@token_required
def get_stats():
    """Thống kê học tập."""
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    mastered = UserWord.query.filter(
        UserWord.user_id == request.user_id,
        UserWord.level >= 6
    ).count()

    learning = UserWord.query.filter(
        UserWord.user_id == request.user_id,
        UserWord.level >= 1,
        UserWord.level < 6
    ).count()

    return jsonify({
        'total_words_learned': user.total_words_learned or 0,
        'mastered_words': mastered,
        'learning_words': learning,
        'streak': user.streak or 0,
        'total_study_minutes': user.total_study_minutes or 0,
        'badges': user._parse_badges(),
    }), 200


@bp.route('/logs', methods=['GET'])
@token_required
def get_logs():
    """Lịch sử log học/ôn gần đây."""
    limit = min(max(1, request.args.get('limit', 50, type=int)), 200)

    logs = LearningLog.query.filter_by(user_id=request.user_id).order_by(
        LearningLog.created_at.desc()
    ).limit(limit).all()

    result = []
    for log in logs:
        word = Word.query.filter_by(id=log.word_id).first()
        entry = log.to_dict()
        entry['word'] = word.word if word else None
        entry['meaning'] = word.meaning if word else None
        result.append(entry)

    return jsonify({'logs': result}), 200
