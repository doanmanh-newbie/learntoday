# app/routes/search.py - STT 9 Tìm kiếm từ vựng
import uuid

from flask import Blueprint, request, jsonify
from app import db
from app.models import Word, SearchHistory, FolderWord
from app.utils.middleware import token_required

bp = Blueprint('search', __name__, url_prefix='/api/search')


@bp.route('', methods=['GET'])
@token_required
def search_words():
    query_text = request.args.get('q', '').strip()
    limit = min(max(1, request.args.get('limit', 20, type=int)), 50)

    if not query_text:
        return jsonify({'message': 'Vui lòng nhập từ khóa tìm kiếm!'}), 400

    words = Word.query.filter(
        Word.deleted_at == None,
        db.or_(
            Word.word.ilike(f'%{query_text}%'),
            Word.meaning.ilike(f'%{query_text}%')
        )
    ).limit(limit).all()

    # Lưu lịch sử tìm kiếm
    history = SearchHistory(
        id=str(uuid.uuid4()),
        user_id=request.user_id,
        query=query_text,
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        'query': query_text,
        'results': [w.to_dict() for w in words],
        'count': len(words),
    }), 200


@bp.route('/history', methods=['GET'])
@token_required
def get_search_history():
    limit = min(max(1, request.args.get('limit', 20, type=int)), 50)

    history = SearchHistory.query.filter_by(user_id=request.user_id).order_by(
        SearchHistory.created_at.desc()
    ).limit(limit).all()

    return jsonify({'history': [h.to_dict() for h in history]}), 200


@bp.route('/popular', methods=['GET'])
@token_required
def get_popular_words():
    """STT 10 - Top từ được lưu nhiều nhất."""
    limit = min(max(1, request.args.get('limit', 10, type=int)), 50)

    popular = db.session.query(
        Word,
        db.func.count(FolderWord.id).label('save_count')
    ).join(
        FolderWord, FolderWord.word_id == Word.id
    ).filter(
        Word.deleted_at == None
    ).group_by(Word.id).order_by(
        db.desc('save_count')
    ).limit(limit).all()

    results = []
    for word, save_count in popular:
        item = word.to_dict()
        item['save_count'] = save_count
        results.append(item)

    return jsonify({'words': results}), 200
