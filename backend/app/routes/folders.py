# app/routes/folders.py
from flask import Blueprint, request, jsonify
from app import db
from app.models import Folder, Word, FolderWord, User
from app.utils.middleware import token_required, admin_required
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


# ===== USER: SỬA FOLDER CÁ NHÂN CỦA CHÍNH MÌNH =====
@bp.route('/<folder_id>', methods=['PUT'])
@token_required
def update_folder(folder_id):
    """
    Cập nhật tên folder cá nhân.
    - User thường: chỉ sửa folder của mình
    - Admin: sửa được mọi folder
    """
    # ========================================
    # DEBUG: In thông tin để kiểm tra
    # ========================================
    print("\n" + "="*50)
    print(f"📌 DEBUG - folder_id: {folder_id}")
    print(f"📌 DEBUG - request.user_id: {request.user_id}")
    
    # ========================================
    # 1. Lấy thông tin user hiện tại
    # ========================================
    current_user = User.query.get(request.user_id)
    if not current_user:
        return jsonify({
            'message': 'Không tìm thấy user!',
            'code': 'USER_NOT_FOUND'
        }), 404
    
    is_admin = current_user.role == 'admin'
    print(f"📌 DEBUG - is_admin: {is_admin}")
    
    # ========================================
    # 2. Tìm folder (KHÔNG lọc user_id để admin có thể tìm thấy)
    # ========================================
    folder = Folder.query.filter_by(
        id=folder_id,
        type='personal',
        deleted_at=None
    ).first()
    
    # ========================================
    # DEBUG: Kiểm tra kết quả tìm kiếm
    # ========================================
    print(f"📌 DEBUG - folder found: {folder is not None}")
    
    if folder:
        print(f"📌 DEBUG - folder.id: {folder.id}")
        print(f"📌 DEBUG - folder.user_id: {folder.user_id}")
        print(f"📌 DEBUG - folder.type: {folder.type}")
        print(f"📌 DEBUG - folder.deleted_at: {folder.deleted_at}")
        print(f"📌 DEBUG - is_owner: {folder.user_id == request.user_id}")
    else:
        print("📌 DEBUG - No folder found with this id!")
        return jsonify({
            'message': 'Không tìm thấy folder!',
            'code': 'FOLDER_NOT_FOUND'
        }), 404
    
    # ========================================
    # 3. Kiểm tra quyền
    # ========================================
    is_owner = folder.user_id == request.user_id
    
    if not is_owner and not is_admin:
        return jsonify({
            'message': 'Bạn không có quyền sửa folder này!',
            'code': 'FORBIDDEN'
        }), 403
    
    print("="*50 + "\n")
    
    # ========================================
    # 4. Lấy dữ liệu từ request
    # ========================================
    data = request.get_json()
    
    if not data:
        return jsonify({
            'message': 'Vui lòng gửi dữ liệu JSON!',
            'code': 'MISSING_JSON'
        }), 400
    
    new_name = data.get('name')
    
    if not new_name or not new_name.strip():
        return jsonify({
            'message': 'Vui lòng nhập tên mới!',
            'code': 'MISSING_NAME'
        }), 400
    
    # ========================================
    # 5. Cập nhật tên folder
    # ========================================
    old_name = folder.name
    folder.name = new_name.strip()
    db.session.commit()
    
    # ========================================
    # 6. Trả về kết quả
    # ========================================
    print(f"✅ Folder updated: '{old_name}' → '{folder.name}' (by {'admin' if is_admin else 'owner'})")
    
    return jsonify({
        'message': 'Cập nhật thành công!',
        'folder': folder.to_dict()
    }), 200


# ===== USER: XÓA FOLDER CÁ NHÂN CỦA CHÍNH MÌNH =====
@bp.route('/<folder_id>', methods=['DELETE'])
@token_required
def delete_folder(folder_id):
    """
    Xóa folder cá nhân.
    - User thường: chỉ xóa folder của mình
    - Admin: xóa được mọi folder
    """
    # 1. Lấy user hiện tại
    current_user = User.query.get(request.user_id)
    if not current_user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404
    
    is_admin = current_user.role == 'admin'
    
    # 2. Tìm folder (KHÔNG lọc user_id)
    folder = Folder.query.filter_by(
        id=folder_id,
        type='personal',
        deleted_at=None
    ).first()
    
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404
    
    # 3. Kiểm tra quyền
    is_owner = folder.user_id == request.user_id
    
    if not is_owner and not is_admin:
        return jsonify({'message': 'Bạn không có quyền xóa folder này!'}), 403
    
    # 4. Xóa mềm
    folder.deleted_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Xóa folder thành công!'}), 200


# ===== USER: XEM DANH SÁCH TỪ TRONG 1 FOLDER (có phân trang) =====
@bp.route('/<folder_id>/words', methods=['GET'])
@token_required
def get_folder_words(folder_id):
    """STT 3 - Phần B: Lấy danh sách từ trong folder"""
    # Lấy folder
    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    # ===== PHÂN QUYỀN: KIỂM TRA CHÍNH XÁC =====
    user_id = request.user_id
    print(f"🔍 DEBUG - folder.user_id: {folder.user_id}")
    print(f"🔍 DEBUG - request.user_id: {user_id}")
    print(f"🔍 DEBUG - folder.type: {folder.type}")

    # Nếu là folder cá nhân, phải là chủ sở hữu
    if folder.type == 'personal':
        if str(folder.user_id) != str(user_id):
            return jsonify({'message': 'Bạn không có quyền xem folder này!'}), 403
    # Nếu là folder hệ thống, ai cũng xem được (hoặc chỉ admin)
    # Bạn có thể thêm logic admin nếu cần

    # ===== TIẾP TỤC LẤY DANH SÁCH TỪ =====
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


# ===== USER/ADMIN: THÊM 1 TỪ VÀO FOLDER =====
@bp.route('/<folder_id>/words', methods=['POST'])
@token_required
def add_word_to_folder(folder_id):
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