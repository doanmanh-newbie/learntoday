# app/routes/profile.py - STT 14 Trang cá nhân / Cài đặt
from datetime import time as dt_time

from flask import Blueprint, request, jsonify
from app import db
from app.models import User
from app.utils.middleware import token_required

bp = Blueprint('profile', __name__, url_prefix='/api/profile')

VALID_DAILY_GOALS = {5, 10, 15, 20, 30}
VALID_REVIEW_LIMITS = {5, 10, 15, 20, 30}
VALID_LEVELS = {'A1', 'B1', 'B2', 'C1', 'IELTS'}
VALID_TTS_VOICES = {'en-US', 'en-GB'}
VALID_REMINDER_HOURS = {8, 12, 20}


@bp.route('', methods=['GET'])
@token_required
def get_profile():
    user = db.session.get(User, request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404
    return jsonify({'user': user.to_dict()}), 200


def _as_int(value):
    """int(...) an toàn: chuỗi/None/bool -> None (trước đây int('abc') làm API văng lỗi 500)."""
    if isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


@bp.route('', methods=['PUT'])
@token_required
def update_profile():
    user = db.session.get(User, request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    data = request.get_json(silent=True) or {}

    if 'username' in data:
        username = (data['username'] or '').strip() if isinstance(data['username'], str) else ''
        if not 1 <= len(username) <= 50:
            return jsonify({'message': 'Tên người dùng phải từ 1 đến 50 ký tự!'}), 400
        existing = User.query.filter(db.func.lower(User.username) == username.lower(), User.id != user.id).first()
        if existing:
            return jsonify({'message': 'Tên người dùng đã tồn tại!'}), 400
        user.username = username

    if 'daily_goal' in data:
        goal = _as_int(data['daily_goal'])
        if goal not in VALID_DAILY_GOALS:
            return jsonify({'message': f'daily_goal phải là 1 trong {sorted(VALID_DAILY_GOALS)}'}), 400
        user.daily_goal = goal

    if 'review_limit' in data:
        limit = _as_int(data['review_limit'])
        if limit not in VALID_REVIEW_LIMITS:
            return jsonify({'message': f'review_limit phải là 1 trong {sorted(VALID_REVIEW_LIMITS)}'}), 400
        user.review_limit = limit

    if 'level' in data:
        if data['level'] not in VALID_LEVELS:
            return jsonify({'message': f'level phải là 1 trong {sorted(VALID_LEVELS)}'}), 400
        user.level = data['level']

    if 'email_reminder' in data:
        if not isinstance(data['email_reminder'], bool):
            return jsonify({'message': 'email_reminder phải là true hoặc false'}), 400
        user.email_reminder = data['email_reminder']

    if 'reminder_time' in data:
        raw = data['reminder_time']
        hour = minute = None
        if isinstance(raw, int) and not isinstance(raw, bool):
            if raw not in VALID_REMINDER_HOURS:
                return jsonify({'message': f'Giờ nhắc nhở phải là 1 trong {sorted(VALID_REMINDER_HOURS)}'}), 400
            hour, minute = raw, 0
        elif isinstance(raw, str) and ':' in raw:
            h, _, m = raw.partition(':')
            hour, minute = _as_int(h), _as_int(m[:2])
            if hour is None or minute is None or not (0 <= hour <= 23 and 0 <= minute <= 59):
                return jsonify({'message': 'reminder_time phải có dạng HH:MM hợp lệ'}), 400
        else:
            return jsonify({'message': 'reminder_time không hợp lệ'}), 400
        user.reminder_time = dt_time(hour=hour, minute=minute)

    if 'tts_voice' in data:
        if data['tts_voice'] not in VALID_TTS_VOICES:
            return jsonify({'message': "tts_voice phải là 'en-US' hoặc 'en-GB'"}), 400
        user.tts_voice = data['tts_voice']

    db.session.commit()
    return jsonify({'message': 'Cập nhật cài đặt thành công!', 'user': user.to_dict()}), 200
