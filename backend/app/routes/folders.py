# app/routes/folders.py
from flask import Blueprint, request, jsonify
from app import db
from app.models import Folder, Word, FolderWord, User, UserWord
from app.utils.middleware import token_required, admin_required, is_same_user
from app.utils.sql import like_pattern
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import uuid

bp = Blueprint('folders', __name__, url_prefix='/api/folders')


# ===== USER: XEM DANH SÁCH FOLDER =====
# Tổng số từ của folder HỆ THỐNG hầu như không đổi: nhớ 60 giây trong bộ nhớ để mỗi lượt mở Thư viện bớt một truy vấn
# GROUP BY nặng (DB ở xa). Folder cá nhân luôn tính tươi vì người dùng thêm/xóa từ liên tục.
_TOTALS_TTL = 60
_system_totals_cache = {'at': 0.0, 'key': None, 'data': {}}


def _system_totals(ids):
    import time
    key = tuple(sorted(ids))
    now = time.monotonic()
    if _system_totals_cache['key'] == key and now - _system_totals_cache['at'] < _TOTALS_TTL:
        return _system_totals_cache['data']
    data = dict(
        db.session.query(FolderWord.folder_id, db.func.count(FolderWord.id))
        .join(Word, Word.id == FolderWord.word_id)
        .filter(FolderWord.folder_id.in_(ids), Word.deleted_at.is_(None))
        .group_by(FolderWord.folder_id).all()
    ) if ids else {}
    _system_totals_cache.update(at=now, key=key, data=data)
    return data


def invalidate_system_totals():
    _system_totals_cache['key'] = None


@bp.route('', methods=['GET'])
@token_required
def get_folders():
    """Danh sách folder + tiến độ học (total/learned/progress) của user.

    Trước đây FE phải gọi thêm GET /folders/<id>/progress cho TỪNG folder (N+1 request, mỗi request
    lại nhiều truy vấn DB tới server ở xa). Giờ tính gộp bằng 2 truy vấn GROUP BY.
    """
    system_folders = Folder.query.filter_by(type='system', deleted_at=None).order_by(Folder.name).all()
    personal_folders = Folder.query.filter_by(
        type='personal', user_id=request.user_id, deleted_at=None
    ).order_by(Folder.name).all()

    ids = [f.id for f in system_folders + personal_folders]
    totals, learned = {}, {}
    if ids:
        sys_ids = [f.id for f in system_folders]
        totals = dict(_system_totals(sys_ids))
        personal_ids = [f.id for f in personal_folders]
        if personal_ids:
            totals.update(dict(
                db.session.query(FolderWord.folder_id, db.func.count(FolderWord.id))
                .join(Word, Word.id == FolderWord.word_id)
                .filter(FolderWord.folder_id.in_(personal_ids), Word.deleted_at.is_(None))
                .group_by(FolderWord.folder_id).all()
            ))
        learned = dict(
            db.session.query(FolderWord.folder_id, db.func.count(db.distinct(UserWord.word_id)))
            .join(UserWord, UserWord.word_id == FolderWord.word_id)
            .filter(FolderWord.folder_id.in_(ids), UserWord.user_id == request.user_id, UserWord.level > 0)
            .group_by(FolderWord.folder_id).all()
        )

    def with_progress(f):
        item = f.to_dict()
        total = int(totals.get(f.id, 0))
        done = int(learned.get(f.id, 0))
        item['word_count'] = total                  # số thật, không dùng bộ đếm denormalized dễ lệch
        item['total_words'] = total
        item['learned_words'] = done
        item['progress'] = round(done * 100 / total) if total else 0
        return item

    return jsonify({
        'system_folders': [with_progress(f) for f in system_folders],
        'personal_folders': [with_progress(f) for f in personal_folders]
    }), 200


# ===== USER: TẠO FOLDER CÁ NHÂN =====
@bp.route('', methods=['POST'])
@token_required
def create_folder():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()

    if not name:
        return jsonify({'message': 'Vui lòng nhập tên folder!'}), 400
    if len(name) > 100:
        return jsonify({'message': 'Tên folder tối đa 100 ký tự!'}), 400

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


# ===== USER: TIẾN ĐỘ HỌC THEO FOLDER =====
@bp.route('/<folder_id>/progress', methods=['GET'])
@token_required
def get_folder_progress(folder_id):
    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    if folder.type == 'personal' and not is_same_user(folder.user_id, request.user_id):
        current_user = User.query.get(request.user_id)
        if not current_user or current_user.role != 'admin':
            return jsonify({'message': 'Bạn không có quyền xem folder này!'}), 403

    total = FolderWord.query.filter_by(folder_id=folder_id).count()
    learned = db.session.query(db.func.count(db.distinct(UserWord.word_id))).join(
        FolderWord, UserWord.word_id == FolderWord.word_id
    ).filter(
        FolderWord.folder_id == folder_id,
        UserWord.user_id == request.user_id,
        UserWord.level > 0,
    ).scalar() or 0

    return jsonify({
        'folder_id': folder_id,
        'total_words': total,
        'learned_words': learned,
        'progress': round(learned * 100 / total) if total else 0,
    }), 200


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

    # Luôn LEFT JOIN user_words để mỗi từ có 'level' (0 = chưa học) - FE hiển thị/lọc theo cấp độ
    query = db.session.query(Word, FolderWord, UserWord).join(
        FolderWord, Word.id == FolderWord.word_id
    ).outerjoin(
        UserWord, db.and_(UserWord.word_id == Word.id, UserWord.user_id == request.user_id)
    ).filter(
        FolderWord.folder_id == folder_id,
        Word.deleted_at.is_(None)
    )
    if has_level_filter:
        # level=0 gồm cả từ chưa có bản ghi user_words lẫn bản ghi level 0
        query = query.filter(db.or_(UserWord.level.is_(None), UserWord.level == 0) if level == 0 else UserWord.level == level)

    # status=new|learned: "chưa học" (level 0) / "đã học" (level >= 1) - dùng cho bộ lọc ở màn danh sách từ
    status = request.args.get('status')
    if status == 'new':
        query = query.filter(db.or_(UserWord.level.is_(None), UserWord.level == 0))
    elif status == 'learned':
        query = query.filter(UserWord.level >= 1)

    if search:
        pattern = like_pattern(search)
        query = query.filter(
            Word.word.ilike(pattern, escape='\\') | Word.meaning.ilike(pattern, escape='\\')
        )

    if word_type:
        query = query.filter(Word.word_type == word_type)

    query = query.order_by(FolderWord.order_index)

    total = query.count()
    results = query.offset((page - 1) * limit).limit(limit).all()

    words_list = []
    for word, folder_word, user_word in results:
        word_dict = word.to_dict()
        word_dict['order_index'] = folder_word.order_index
        word_dict['note'] = folder_word.note
        word_dict['level'] = user_word.level if user_word else 0
        word_dict['next_review'] = user_word.next_review.isoformat() if user_word and user_word.next_review else None
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

    data = request.get_json(silent=True) or {}
    word_id = data.get('word_id')

    if not word_id:
        return jsonify({'message': 'Vui lòng cung cấp word_id!'}), 400

    word = Word.query.filter_by(id=word_id, deleted_at=None).first()
    if not word:
        return jsonify({'message': 'Không tìm thấy từ vựng này!'}), 404

    existing = FolderWord.query.filter_by(folder_id=folder_id, word_id=word_id).first()
    if existing:
        return jsonify({'message': 'Từ này đã có trong folder rồi!'}), 409

    next_index = db.session.query(db.func.coalesce(db.func.max(FolderWord.order_index) + 1, 0)).filter(
        FolderWord.folder_id == folder_id
    ).scalar()
    db.session.add(FolderWord(
        id=str(uuid.uuid4()), folder_id=folder_id, word_id=word_id, order_index=next_index
    ))
    # Tăng bộ đếm bằng biểu thức SQL (nguyên tử) - không đọc-rồi-ghi trong Python nữa
    Folder.query.filter_by(id=folder_id).update({'word_count': db.func.coalesce(Folder.word_count, 0) + 1})
    try:
        db.session.commit()
    except IntegrityError:               # UNIQUE(folder_id, word_id): 2 request cùng lúc
        db.session.rollback()
        return jsonify({'message': 'Từ này đã có trong folder rồi!'}), 409

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
    Folder.query.filter_by(id=folder_id).update({'word_count': db.case((Folder.word_count > 0, Folder.word_count - 1), else_=0)})
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