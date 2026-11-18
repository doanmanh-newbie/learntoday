# app/routes/friends.py - bạn bè + bảng xếp hạng tuần (điểm = từ mới x10 + lượt ôn x5, tính từ thứ Hai 00:00 giờ VN)
import uuid
from datetime import datetime

from flask import Blueprint, request, jsonify
from app import db
from app.models import User, LearningLog
from app.models.friendships import Friendship
from app.models.learning_logs import VN_TZ
from app.utils.middleware import token_required
from app.utils.leaderboard import week_start_utc, points, rank, capped_counts

bp = Blueprint('friends', __name__, url_prefix='/api/friends')
MAX_FRIENDS = 50


def _friend_ids(user_id):
    return [fid for (fid,) in db.session.query(Friendship.friend_id).filter(Friendship.user_id == user_id).all()]


@bp.route('', methods=['GET'])
@token_required
def list_friends():
    ids = _friend_ids(request.user_id)
    users = User.query.filter(User.id.in_(ids)).all() if ids else []
    return jsonify({'friends': [{'id': u.id, 'username': u.username} for u in users]}), 200


@bp.route('', methods=['POST'])
@token_required
def add_friend():
    name = ((request.get_json(silent=True) or {}).get('username') or '').strip()
    if not name:
        return jsonify({'message': 'Nhập tên người dùng của bạn bè.'}), 400
    other = User.query.filter(db.func.lower(User.username) == name.lower()).first()
    if other is None:
        return jsonify({'message': f'Không tìm thấy người dùng "{name}".'}), 404
    if other.id == request.user_id:
        return jsonify({'message': 'Không thể tự kết bạn với chính mình.'}), 400
    ids = _friend_ids(request.user_id)
    if other.id in ids:
        return jsonify({'message': f'{other.username} đã có trong danh sách bạn bè.'}), 409
    if len(ids) >= MAX_FRIENDS:
        return jsonify({'message': f'Tối đa {MAX_FRIENDS} bạn.'}), 400
    # Kết bạn 2 chiều để cả hai cùng thấy nhau trên bảng xếp hạng
    for a, b in ((request.user_id, other.id), (other.id, request.user_id)):
        if not Friendship.query.filter_by(user_id=a, friend_id=b).first():
            db.session.add(Friendship(id=str(uuid.uuid4()), user_id=a, friend_id=b))
    db.session.commit()
    return jsonify({'friend': {'id': other.id, 'username': other.username}}), 201


@bp.route('/<friend_id>', methods=['DELETE'])
@token_required
def remove_friend(friend_id):
    Friendship.query.filter(
        db.or_(db.and_(Friendship.user_id == request.user_id, Friendship.friend_id == friend_id),
               db.and_(Friendship.user_id == friend_id, Friendship.friend_id == request.user_id))
    ).delete(synchronize_session=False)
    db.session.commit()
    return jsonify({'message': 'Đã xóa bạn.'}), 200


@bp.route('/leaderboard', methods=['GET'])
@token_required
def leaderboard():
    ids = [request.user_id] + _friend_ids(request.user_id)
    since = week_start_utc(datetime.now(VN_TZ))
    # Lấy từng dòng log của tuần rồi tính ở Python để áp trần theo ngày (utils/leaderboard.py::capped_counts).
    log_rows = (db.session.query(LearningLog.user_id, LearningLog.action, LearningLog.choice, LearningLog.word_id, LearningLog.created_at)
                .filter(LearningLog.user_id.in_(ids), LearningLog.created_at >= since,
                        LearningLog.action.in_(('learn', 'review')))
                .order_by(LearningLog.created_at).all())
    counts = capped_counts(log_rows, VN_TZ)
    rows = []
    for u in User.query.filter(User.id.in_(ids)).all():
        l, r = counts.get(u.id, (0, 0))
        rows.append({'id': u.id, 'username': u.username, 'learned': l, 'reviewed': r,
                     'points': points(l, r), 'streak': u.effective_streak(), 'is_me': u.id == request.user_id})
    return jsonify({'week_start': since.isoformat() + 'Z', 'rows': rank(rows)}), 200
