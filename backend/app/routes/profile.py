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
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404
    return jsonify({'user': user.to_dict()}), 200


@bp.route('', methods=['PUT'])
@token_required
def update_profile():
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    data = request.get_json() or {}

    if 'username' in data and data['username']:
        existing = User.query.filter(User.username == data['username'], User.id != user.id).first()
        if existing:
            return jsonify({'message': 'Tên người dùng đã tồn tại!'}), 400
        user.username = data['username'].strip()

    if 'daily_goal' in data:
        goal = int(data['daily_goal'])
        if goal not in VALID_DAILY_GOALS:
            return jsonify({'message': f'daily_goal phải là 1 trong {sorted(VALID_DAILY_GOALS)}'}), 400
        user.daily_goal = goal

    if 'review_limit' in data:
        limit = int(data['review_limit'])
        if limit not in VALID_REVIEW_LIMITS:
            return jsonify({'message': f'review_limit phải là 1 trong {sorted(VALID_REVIEW_LIMITS)}'}), 400
        user.review_limit = limit

    if 'level' in data:
        if data['level'] not in VALID_LEVELS:
            return jsonify({'message': f'level phải là 1 trong {sorted(VALID_LEVELS)}'}), 400
        user.level = data['level']

    if 'email_reminder' in data:
        user.email_reminder = bool(data['email_reminder'])

    if 'reminder_time' in data:
        hour = data['reminder_time']
        if isinstance(hour, int):
            if hour not in VALID_REMINDER_HOURS:
                return jsonify({'message': f'Giờ nhắc nhở phải là 1 trong {sorted(VALID_REMINDER_HOURS)}'}), 400
            user.reminder_time = dt_time(hour=hour, minute=0)
        elif isinstance(hour, str) and ':' in hour:
            parts = hour.split(':')
            user.reminder_time = dt_time(hour=int(parts[0]), minute=int(parts[1]))

    if 'tts_voice' in data:
        if data['tts_voice'] not in VALID_TTS_VOICES:
            return jsonify({'message': "tts_voice phải là 'en-US' hoặc 'en-GB'"}), 400
        user.tts_voice = data['tts_voice']

    db.session.commit()
    return jsonify({'message': 'Cập nhật cài đặt thành công!', 'user': user.to_dict()}), 200
