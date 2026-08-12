# app/routes/study.py - STT 12 Học 15 phút + STT 13 Nhắc nhở
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from app import db
from app.models import User, UserWord
from app.models.learning_logs import VN_TZ
from app.utils.middleware import token_required

bp = Blueprint('study', __name__, url_prefix='/api/study')

DAILY_STUDY_GOAL_MINUTES = 15
PERSISTENT_BADGE_DAYS = 7


@bp.route('/heartbeat', methods=['POST'])
@token_required
def study_heartbeat():
    """
    Ghi nhận thời gian học (phút). Client gọi định kỳ khi user đang trong app.
    Body: { "minutes": 1 }
    """
    data = request.get_json() or {}
    minutes = int(data.get('minutes', 1))
    if minutes < 1 or minutes > 30:
        return jsonify({'message': 'minutes phải từ 1 đến 30!'}), 400

    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    user.total_study_minutes = (user.total_study_minutes or 0) + minutes

    new_badges = []
    if user.total_study_minutes >= DAILY_STUDY_GOAL_MINUTES:
        if 'study_15min' not in user._parse_badges():
            user.add_badge('study_15min')
            new_badges.append('study_15min')

    if (user.streak or 0) >= PERSISTENT_BADGE_DAYS:
        if 'kien_tri' not in user._parse_badges():
            user.add_badge('kien_tri')
            new_badges.append('kien_tri')

    db.session.commit()

    return jsonify({
        'total_study_minutes': user.total_study_minutes,
        'daily_goal_minutes': DAILY_STUDY_GOAL_MINUTES,
        'goal_met': user.total_study_minutes >= DAILY_STUDY_GOAL_MINUTES,
        'new_badges': new_badges,
    }), 200


@bp.route('/reminders/preview', methods=['GET'])
@token_required
def reminder_preview():
    """STT 13 - Xem số từ cần ôn trong ngày."""
    due_count = UserWord.query.filter(
        UserWord.user_id == request.user_id,
        UserWord.level > 0,
        UserWord.next_review <= datetime.utcnow()
    ).count()

    user = User.query.get(request.user_id)

    return jsonify({
        'due_review_count': due_count,
        'email_reminder': user.email_reminder if user else True,
        'reminder_time': user.reminder_time.isoformat() if user and user.reminder_time else None,
    }), 200


@bp.route('/reminders/send-test', methods=['POST'])
@token_required
def send_test_reminder():
    """
    STT 13 - Gửi email nhắc nhở (stub).
    Cấu hình SMTP_HOST, SMTP_USER, SMTP_PASS trong .env để gửi thật.
    """
    import os
    user = User.query.get(request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    due_count = UserWord.query.filter(
        UserWord.user_id == request.user_id,
        UserWord.level > 0,
        UserWord.next_review <= datetime.utcnow()
    ).count()

    smtp_host = os.environ.get('SMTP_HOST')
    if not smtp_host:
        return jsonify({
            'message': 'Email stub: chưa cấu hình SMTP. Nội dung email mẫu:',
            'email_preview': {
                'to': user.email,
                'subject': f'Learn Today - Bạn có {due_count} từ cần ôn tập',
                'body': f'Xin chào {user.username}, bạn có {due_count} từ đến hạn ôn tập hôm nay!',
            }
        }), 200

    return jsonify({
        'message': f'Đã gửi email nhắc nhở đến {user.email}',
        'due_count': due_count,
    }), 200
