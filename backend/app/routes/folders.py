# app/routes/folders.py
from flask import Blueprint, request, jsonify
from app import db
from app.models import Folder, Word, FolderWord, User, UserWord
from app.utils.middleware import token_required, admin_required, is_same_user
from datetime import datetime
import uuid

bp = Blueprint('folders', __name__, url_prefix='/api/folders')


# ===== USER: XEM DANH SÁCH FOLDER =====
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


# ===== USER: TẠO FOLDER CÁ NHÂN =====
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


# ===== USER: SỬA FOLDER CÁ NHÂN (owner hoặc admin) =====
@bp.route('/<folder_id>', methods=['PUT'])
@token_required
def update_folder(folder_id):
    current_user = User.query.get(request.user_id)
    if not current_user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    is_admin = current_user.role == 'admin'

    folder = Folder.query.filter_by(id=folder_id, type='personal', deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    is_owner = is_same_user(folder.user_id, request.user_id)

    if not is_owner and not is_admin:
        return jsonify({'message': 'Bạn không có quyền sửa folder này!'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

    new_name = data.get('name')
    if not new_name or not new_name.strip():
        return jsonify({'message': 'Vui lòng nhập tên mới!'}), 400

    folder.name = new_name.strip()
    db.session.commit()

    return jsonify({'message': 'Cập nhật thành công!', 'folder': folder.to_dict()}), 200


# ===== USER: XÓA FOLDER CÁ NHÂN (owner hoặc admin) =====
@bp.route('/<folder_id>', methods=['DELETE'])
@token_required
def delete_folder(folder_id):
    current_user = User.query.get(request.user_id)
    if not current_user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    is_admin = current_user.role == 'admin'

    folder = Folder.query.filter_by(id=folder_id, type='personal', deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    is_owner = is_same_user(folder.user_id, request.user_id)

    if not is_owner and not is_admin:
        return jsonify({'message': 'Bạn không có quyền xóa folder này!'}), 403

    folder.deleted_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Xóa folder thành công!'}), 200


# ===== USER: XEM DANH SÁCH TỪ TRONG FOLDER (phân trang + tìm kiếm + lọc) =====
@bp.route('/<folder_id>/words', methods=['GET'])
@token_required
def get_folder_words(folder_id):
    """STT 3 - Phần B"""
    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    if folder.type == 'personal' and not is_same_user(folder.user_id, request.user_id):
        current_user = User.query.get(request.user_id)
        if not current_user or current_user.role != 'admin':
            return jsonify({'message': 'Bạn không có quyền xem folder này!'}), 403

    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    page = max(1, page)
    limit = min(max(1, limit), 100)

    search = request.args.get('search', '').strip()
    word_type = request.args.get('word_type', '').strip()
    level = request.args.get('level', type=int)
    has_level_filter = level is not None

    if has_level_filter:
        query = db.session.query(Word, FolderWord, UserWord).join(
            FolderWord, Word.id == FolderWord.word_id
        ).outerjoin(
            UserWord, db.and_(UserWord.word_id == Word.id, UserWord.user_id == request.user_id)
        ).filter(
            FolderWord.folder_id == folder_id,
            Word.deleted_at == None
        )
        if level == 0:
            query = query.filter(UserWord.level == None)
        else:
            query = query.filter(UserWord.level == level)
    else:
        query = db.session.query(Word, FolderWord).join(
            FolderWord, Word.id == FolderWord.word_id
        ).filter(
            FolderWord.folder_id == folder_id,
            Word.deleted_at == None
        )

    if search:
        query = query.filter(
            Word.word.ilike(f'%{search}%') | Word.meaning.ilike(f'%{search}%')
        )

    if word_type:
        query = query.filter(Word.word_type == word_type)

    query = query.order_by(FolderWord.order_index)

    total = query.count()
    results = query.offset((page - 1) * limit).limit(limit).all()

    words_list = []
    for row in results:
        if has_level_filter:
            word, folder_word, user_word = row
            word_level = user_word.level if user_word else 0
        else:
            word, folder_word = row
            word_level = None

        word_dict = word.to_dict()
        word_dict['order_index'] = folder_word.order_index
        word_dict['note'] = folder_word.note
        if word_level is not None:
            word_dict['level'] = word_level
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


# ===== USER/ADMIN: THÊM 1 TỪ VÀO FOLDER =====
@bp.route('/<folder_id>/words', methods=['POST'])
@token_required
def add_word_to_folder(folder_id):
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    is_owner = folder.type == 'personal' and is_same_user(folder.user_id, request.user_id)
    is_admin = user.role == 'admin'

    if folder.type == 'personal' and not is_owner and not is_admin:
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


# ===== USER/ADMIN: GỠ 1 TỪ KHỎI FOLDER =====
@bp.route('/<folder_id>/words/<word_id>', methods=['DELETE'])
@token_required
def remove_word_from_folder(folder_id, word_id):
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    is_owner = folder.type == 'personal' and is_same_user(folder.user_id, request.user_id)
    is_admin = user.role == 'admin'

    if folder.type == 'personal' and not is_owner and not is_admin:
        return jsonify({'message': 'Bạn không có quyền gỡ từ khỏi folder này!'}), 403

    if folder.type == 'system' and not is_admin:
        return jsonify({'message': 'Chỉ admin mới được sửa folder hệ thống!'}), 403

    link = FolderWord.query.filter_by(folder_id=folder_id, word_id=word_id).first()
    if not link:
        return jsonify({'message': 'Từ này không có trong folder!'}), 404

    db.session.delete(link)
    folder.word_count = max((folder.word_count or 1) - 1, 0)
    db.session.commit()

    return jsonify({'message': 'Gỡ từ khỏi folder thành công!'}), 200


# ===== ADMIN: TẠO FOLDER HỆ THỐNG =====
@bp.route('/system', methods=['POST'])
@token_required
@admin_required
def create_system_folder():
    data = request.get_json()
    name = data.get('name')
    icon = data.get('icon')
    description = data.get('description')

    if not name:
        return jsonify({'message': 'Vui lòng nhập tên folder!'}), 400

    existing = Folder.query.filter_by(name=name, type='system', deleted_at=None).first()
    if existing:
        return jsonify({'message': 'Folder hệ thống đã tồn tại!'}), 400

    new_folder = Folder(
        id=str(uuid.uuid4()),
        name=name,
        type='system',
        user_id=None,
        icon=icon,
        description=description
    )
    db.session.add(new_folder)
    db.session.commit()

    return jsonify({
        'message': 'Tạo folder hệ thống thành công!',
        'folder': new_folder.to_dict()
    }), 201


# ===== ADMIN: SỬA FOLDER HỆ THỐNG =====
@bp.route('/system/<folder_id>', methods=['PUT'])
@token_required
@admin_required
def update_system_folder(folder_id):
    folder = Folder.query.filter_by(id=folder_id, type='system', deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder hệ thống!'}), 404

    data = request.get_json()

    if 'name' in data and data['name']:
        folder.name = data['name']
    if 'icon' in data:
        folder.icon = data['icon']
    if 'description' in data:
        folder.description = data['description']

    db.session.commit()

    return jsonify({
        'message': 'Cập nhật folder hệ thống thành công!',
        'folder': folder.to_dict()
    }), 200


# ===== ADMIN: XÓA FOLDER HỆ THỐNG =====
@bp.route('/system/<folder_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_system_folder(folder_id):
    folder = Folder.query.filter_by(id=folder_id, type='system', deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder hệ thống!'}), 404

    folder.deleted_at = datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Xóa folder hệ thống thành công!'}), 200