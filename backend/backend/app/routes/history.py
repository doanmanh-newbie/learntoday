# app/routes/history.py - STT 7 Lịch sử học tập
from flask import Blueprint, request, jsonify
from app import db
from app.models import User, UserWord, Word, LearningLog
from app.utils.middleware import token_required
from app.services.study_time import get_today_minutes

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
    rows = (
        db.session.query(UserWord, Word)
        .join(Word, Word.id == UserWord.word_id)
        .filter(UserWord.user_id == request.user_id, UserWord.level >= 1, Word.deleted_at.is_(None))
        .order_by(UserWord.updated_at.desc())
        .offset((page - 1) * limit).limit(limit)
        .all()
    )

    words_list = []
    for uw, word in rows:
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

    # 1 truy vấn tổng hợp thay cho 3 truy vấn COUNT riêng lẻ
    mastered, learning, reviews, correct = db.session.query(
        db.func.coalesce(db.func.sum(db.case((UserWord.level >= 6, 1), else_=0)), 0),
        db.func.coalesce(db.func.sum(db.case(((UserWord.level >= 1) & (UserWord.level < 6), 1), else_=0)), 0),
        db.func.coalesce(db.func.sum(UserWord.review_count), 0),
        db.func.coalesce(db.func.sum(UserWord.correct_count), 0),
    ).filter(UserWord.user_id == request.user_id).one()
    mastered, learning = int(mastered), int(learning)
    total_learned = mastered + learning             # = số từ có level >= 1 (đúng định nghĩa STT 16)
    accuracy = round(int(correct) * 100 / int(reviews)) if reviews else 0

    return jsonify({
        'total_words_learned': total_learned,
        'total_learned': total_learned,             # alias cho FE
        'mastered_words': mastered,
        'learning_words': learning,
        'accuracy': accuracy,                       # % lượt ôn không sai lần nào
        'streak': user.streak or 0,
        'total_study_minutes': user.total_study_minutes or 0,
        'study_minutes_today': get_today_minutes(user),
        'badges': user._parse_badges(),
    }), 200


@bp.route('/logs', methods=['GET'])
@token_required
def get_logs():
    """Lịch sử log học/ôn gần đây."""
    limit = min(max(1, request.args.get('limit', 50, type=int)), 200)

    rows = (
        db.session.query(LearningLog, Word.word, Word.meaning)
        .outerjoin(Word, Word.id == LearningLog.word_id)
        .filter(LearningLog.user_id == request.user_id)
        .order_by(LearningLog.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for log, word_text, meaning in rows:
        entry = log.to_dict()
        entry['word'] = word_text
        entry['meaning'] = meaning
        result.append(entry)

    return jsonify({'logs': result}), 200
