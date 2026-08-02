from flask import Blueprint, request, jsonify
from app import db
from app.models import Folder, Word, FolderWord
from app.utils.middleware import token_required
from datetime import datetime
import uuid
from app.utils.middleware import token_required, admin_required

bp = Blueprint('folders', __name__, url_prefix='/api/folders')


@bp.route('', methods=['GET'])
@token_required
def get_folders():
    system_folders = Folder.query.filter_by(type='system', deleted_at=None).all()
    personal_folders = Folder.query.filter_by(
        type='personal', user_id=request.user_id, deleted_at=None
    ).all()

    return jsonify({
        'system_folders': [f.to_dict() for f in system_folders],
        'personal_folders': [f.to_dict() for f in personal_folders]
    }), 200


@bp.route('', methods=['POST'])
@token_required
def create_folder():
    data = request.get_json()
    name = data.get('name')

    if not name:
        return jsonify({'message': 'Vui lòng nhập tên folder!'}), 400

    new_folder = Folder(
        id=str(uuid.uuid4()),
        name=name,
        type='personal',
        user_id=request.user_id
    )
    db.session.add(new_folder)
    db.session.commit()

    return jsonify({'message': 'Tạo folder thành công!', 'folder': new_folder.to_dict()}), 201


@bp.route('/<folder_id>', methods=['PUT'])
@token_required
def update_folder(folder_id):
    from app.models import User
    user = User.query.get(request.user_id)

    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    is_owner = folder.type == 'personal' and folder.user_id == request.user_id
    is_admin = user.role == 'admin'

    if not is_owner and not is_admin:
        return jsonify({'message': 'Bạn không có quyền sửa folder này!'}), 403

    data = request.get_json()
    new_name = data.get('name')
    if not new_name:
        return jsonify({'message': 'Vui lòng nhập tên mới!'}), 400

    folder.name = new_name
    db.session.commit()

    return jsonify({'message': 'Cập nhật thành công!', 'folder': folder.to_dict()}), 200


@bp.route('/<folder_id>', methods=['DELETE'])
@token_required
def delete_folder(folder_id):
    from app.models import User
    user = User.query.get(request.user_id)

    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    is_owner = folder.type == 'personal' and folder.user_id == request.user_id
    is_admin = user.role == 'admin'

    if not is_owner and not is_admin:
        return jsonify({'message': 'Bạn không có quyền xóa folder này!'}), 403

    folder.deleted_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Xóa folder thành công!'}), 200


@bp.route('/<folder_id>/words', methods=['GET'])
@token_required
def get_folder_words(folder_id):
    """Lấy danh sách từ trong folder, có phân trang (STT 3 - Phần B)"""
    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404
    if folder.type == 'personal' and folder.user_id != request.user_id:
        return jsonify({'message': 'Bạn không có quyền xem folder này!'}), 403

    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    page = max(1, page)
    limit = min(max(1, limit), 100) 

    query = db.session.query(Word, FolderWord).join(
        FolderWord, Word.id == FolderWord.word_id
    ).filter(
        FolderWord.folder_id == folder_id,
        Word.deleted_at == None
    ).order_by(FolderWord.order_index)

    total = query.count()
    results = query.offset((page - 1) * limit).limit(limit).all()

    words_list = []
    for word, folder_word in results:
        word_dict = word.to_dict()
        word_dict['order_index'] = folder_word.order_index
        word_dict['note'] = folder_word.note
        words_list.append(word_dict)

    return jsonify({
        'folder': folder.to_dict(),
        'words': words_list,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'has_more': (page * limit) < total
        }
    }), 200
    
@bp.route('/<folder_id>/words', methods=['POST'])
@token_required
def add_word_to_folder(folder_id):
    from app.models import User
    user = User.query.get(request.user_id)

    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    is_owner = folder.type == 'personal' and folder.user_id == request.user_id
    is_admin = user.role == 'admin'

    if folder.type == 'personal' and not is_owner:
        return jsonify({'message': 'Bạn không có quyền thêm từ vào folder này!'}), 403

    if folder.type == 'system' and not is_admin:
        return jsonify({'message': 'Chỉ admin mới được sửa folder hệ thống!'}), 403

    data = request.get_json()
    word_id = data.get('word_id')

    if not word_id:
        return jsonify({'message': 'Vui lòng cung cấp word_id!'}), 400

    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        return jsonify({'message': 'Không tìm thấy từ vựng này!'}), 404

    existing = FolderWord.query.filter_by(folder_id=folder_id, word_id=word_id).first()
    if existing:
        return jsonify({'message': 'Từ này đã có trong folder rồi!'}), 409

    new_link = FolderWord(
        id=str(uuid.uuid4()),
        folder_id=folder_id,
        word_id=word_id,
        order_index=folder.word_count
    )
    db.session.add(new_link)
    folder.word_count = (folder.word_count or 0) + 1
    db.session.commit()

    return jsonify({'message': 'Thêm từ vào folder thành công!'}), 201