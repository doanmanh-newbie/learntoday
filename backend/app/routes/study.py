# app/routes/study.py - STT 12 Học 15 phút + STT 13 Nhắc nhở
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from app import db
from app.models import User, UserWord
from app.models.learning_logs import VN_TZ
from app.utils.middleware import token_required
from app.services.streak_service import STUDY_MINUTES_GOAL, update_streak_if_goal_met
from app.services.study_time import add_study_minutes, get_today_minutes
from app.services.email_service import EmailError, send_email, smtp_configured
from app.services.reminder_service import due_count, reminder_message

bp = Blueprint('study', __name__, url_prefix='/api/study')

DAILY_STUDY_GOAL_MINUTES = STUDY_MINUTES_GOAL      # 15 phút/ngày (STT 12) - dùng chung với luật chuỗi ngày
PERSISTENT_BADGE_DAYS = 7


# Heartbeat: client gọi mỗi ~1 phút khi người dùng đang trong app. Server TỰ đo thời gian thật:
# mỗi lần gọi chỉ được cộng tối đa 1 phút và chỉ khi đã qua ít nhất HEARTBEAT_MIN_GAP giây kể từ lần cộng trước.
# Nên gọi API liên tục / gửi minutes=30 không "học 15 phút" trong vài giây được (trước đây số phút do client quyết định).
HEARTBEAT_MIN_GAP = 50


@bp.route('/heartbeat', methods=['POST'])
@token_required
def study_heartbeat():
    """Ghi nhận thời gian học. Body có thể kèm {"minutes": 1} (giữ để tương thích) nhưng server BỎ QUA giá trị đó."""
    data = request.get_json(silent=True) or {}
    if 'minutes' in data:
        try:
            int(data['minutes'])
        except (TypeError, ValueError):
            return jsonify({'message': 'minutes phải là số nguyên!'}), 400

    user = db.session.get(User, request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    now = datetime.utcnow()
    last = user.last_heartbeat_at
    credited = 0
    if last is None or (now - last).total_seconds() >= HEARTBEAT_MIN_GAP:
        credited = 1
        user.last_heartbeat_at = now

    # STT 12: mục tiêu là >= 15 phút MỖI NGÀY (không phải tổng cộng dồn cả đời).
    today_minutes = add_study_minutes(user, credited) if credited else get_today_minutes(user)

    new_badges = []
    if today_minutes >= DAILY_STUDY_GOAL_MINUTES:
        update_streak_if_goal_met(user.id)              # STT 12: học >= 15 phút cũng tăng chuỗi ngày
    if today_minutes >= DAILY_STUDY_GOAL_MINUTES and 'study_15min' not in user._parse_badges():
        user.add_badge('study_15min')
        new_badges.append('study_15min')

    if (user.streak or 0) >= PERSISTENT_BADGE_DAYS and 'kien_tri' not in user._parse_badges():
        user.add_badge('kien_tri')
        new_badges.append('kien_tri')

    db.session.commit()

    return jsonify({
        'total_study_minutes': user.total_study_minutes,
        'study_minutes_today': today_minutes,
        'daily_goal_minutes': DAILY_STUDY_GOAL_MINUTES,
        'goal_met': today_minutes >= DAILY_STUDY_GOAL_MINUTES,
        'credited_minutes': credited,
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
    user = db.session.get(User, request.user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy user!'}), 404

    due_count_value = due_count(request.user_id)

    subject, body = reminder_message(user, due_count_value)
    if not smtp_configured():
        return jsonify({
            'message': 'Chưa cấu hình SMTP nên chưa gửi email thật. Nội dung email mẫu:',
            'sent': False,
            'email_preview': {'to': user.email, 'subject': subject, 'body': body},
        }), 200

    try:
        send_email(user.email, subject, body)
    except EmailError:
        return jsonify({'message': 'Gửi email thất bại, kiểm tra cấu hình SMTP.', 'sent': False}), 502

    return jsonify({'message': f'Đã gửi email nhắc nhở đến {user.email}', 'sent': True, 'due_count': due_count_value}), 200