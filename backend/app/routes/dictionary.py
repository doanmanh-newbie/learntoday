# app/routes/dictionary.py - Từ điển thật + kho từ vựng trong database
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify

from app import db
from app.models import Folder, FolderWord, SearchHistory, Word
from app.services import lexicon_service as lex
from app.utils.middleware import token_required

bp = Blueprint('dictionary', __name__, url_prefix='/api/dictionary')


def _lex_error(err):
    body = {'message': err.message}
    if err.code:
        body['code'] = err.code
    return jsonify(body), err.status


def _record_history(user_id, word):
    """Lưu lịch sử tra (bỏ qua nếu vừa tra đúng từ này trong 5 phút gần nhất)."""
    # Lưu ý: SearchHistory có cột tên `query` nên `SearchHistory.query` (của Flask-SQLAlchemy) bị che mất -> dùng session
    last = (db.session.query(SearchHistory).filter(SearchHistory.user_id == user_id)
            .order_by(SearchHistory.created_at.desc()).first())
    if last and last.query == word and datetime.utcnow() - last.created_at < timedelta(minutes=5):
        return
    db.session.add(SearchHistory(user_id=user_id, query=word[:200]))
    db.session.commit()


@bp.route('/lookup', methods=['GET'])
@token_required
def lookup():
    """Tra 1 từ: nghĩa tiếng Việt + tiếng Anh cho MỌI loại từ, phiên âm, audio, từ đồng/trái nghĩa."""
    try:
        entry, source = lex.get_entry(request.args.get('q'))
    except lex.LexiconError as e:
        return _lex_error(e)

    word = lex.normalize_headword(request.args.get('q'))
    if entry is None:
        return jsonify({'message': f'Không tìm thấy từ "{word}" trong từ điển.', 'code': 'WORD_NOT_FOUND'}), 404

    lex.record_lookup(word)
    _record_history(request.user_id, word)

    # Từ này đã có trong kho từ vựng chung chưa, và người dùng đã lưu vào thư mục nào của họ?
    db_word = Word.query.filter(db.func.lower(Word.word) == entry['word'], Word.deleted_at.is_(None)).first()
    saved_folder_ids = []
    if db_word:
        saved_folder_ids = [fid for (fid,) in db.session.query(FolderWord.folder_id)
                            .join(Folder, Folder.id == FolderWord.folder_id)
                            .filter(FolderWord.word_id == db_word.id, Folder.type == 'personal',
                                    Folder.user_id == request.user_id, Folder.deleted_at.is_(None))]
    return jsonify({
        'entry': entry,
        'source': source,                   # 'database' = lấy từ kho đã lưu, 'api' = vừa tra từ điển ngoài rồi lưu lại
        'word_id': db_word.id if db_word else None,
        'saved_folder_ids': saved_folder_ids,
    }), 200


@bp.route('/suggest', methods=['GET'])
@token_required
def suggest():
    limit = min(max(request.args.get('limit', 8, type=int), 1), 15)
    return jsonify({'suggestions': lex.suggest(request.args.get('q'), limit)}), 200


@bp.route('/save', methods=['POST'])
@token_required
def save():
    """Lưu từ đã tra vào thư mục cá nhân: ghi vào kho `words` (nếu chưa có) rồi gắn vào thư mục."""
    data = request.get_json(silent=True) or {}
    word, folder_id = data.get('word'), data.get('folder_id')
    if not word or not folder_id:
        return jsonify({'message': 'Vui lòng cung cấp word và folder_id!'}), 400
    try:
        db_word, folder, already = lex.save_to_folder(request.user_id, word, folder_id, data.get('pos'))
    except lex.LexiconError as e:
        return _lex_error(e)
    return jsonify({
        'message': 'Từ này đã có trong thư mục rồi!' if already else 'Đã lưu từ vào thư mục!',
        'already_saved': already,
        'word': db_word.to_dict(),
        'folder': {'id': folder.id, 'name': folder.name},
    }), 200 if already else 201
