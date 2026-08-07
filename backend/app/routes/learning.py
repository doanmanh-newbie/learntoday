# app/routes/learning.py
from flask import Blueprint, request, jsonify
from app.models import Folder, User, UserWord, LearningLog
from app.utils.middleware import token_required, is_same_user
from app.services.study_service import ServiceError

bp = Blueprint('learning', __name__, url_prefix='/api/learning')


# ===== STT 6: LẤY BATCH TỪ MỚI (LV0) TỪ 1 FOLDER =====
@bp.route('/folders/<folder_id>/new-words', methods=['GET'])
@token_required
def get_new_words(folder_id):
    """
    Lấy danh sách từ chưa học (chưa có bản ghi user_words) trong 1 folder.
    FE dùng chính danh sách này để tự random đáp án sai trong batch.
    """
    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        return jsonify({'message': 'Không tìm thấy folder!'}), 404

    # Chặn user xem/học từ folder cá nhân của người khác (trừ admin)
    if folder.type == 'personal' and not is_same_user(folder.user_id, request.user_id):
        current_user = User.query.get(request.user_id)
        if not current_user or current_user.role != 'admin':
            return jsonify({'message': 'Bạn không có quyền học folder này!'}), 403

    limit = request.args.get('limit', 5, type=int)
    limit = min(max(1, limit), 30)

    words = UserWord.get_words_for_learning(request.user_id, folder_id, limit=limit)

    if not words:
        return jsonify({
            'message': 'Bạn đã học hết từ mới trong folder này! Hãy chọn folder khác để tiếp tục học.',
            'words': [],
            'has_new_words': False
        }), 200

    return jsonify({
        'words': [w.to_dict() for w in words],
        'has_new_words': True
    }), 200


# ===== STT 6: TIẾN ĐỘ MỤC TIÊU HỌC TRONG NGÀY =====
@bp.route('/progress/today', methods=['GET'])
@token_required
def get_today_progress():
    """Tiến độ học từ mới hôm nay so với daily_goal (STT 14) của user."""
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    learned_today = LearningLog.count_learned_today(request.user_id)
    daily_target = user.daily_goal or 10

    return jsonify({
        'learned_today': learned_today,
        'daily_target': daily_target,
        'is_completed': learned_today >= daily_target,
        'streak': user.streak
    }), 200