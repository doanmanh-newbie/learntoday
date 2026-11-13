# app/routes/pass_test.py - STT 16 Kiểm tra Pass
import json
from datetime import datetime

from flask import Blueprint, request, jsonify
from app import db
from app.models import UserMilestone
from app.services.pass_test_logic import get_passage_for_milestone, grade_test, public_test
from app.utils.middleware import token_required
from app.utils.pass_timer import (
    TIME_LIMIT_SECONDS, answers_for_grading, clean_answers, elapsed_seconds, is_overtime, leave, remaining_seconds,
    start_or_resume, touch,
)

bp = Blueprint('pass_test', __name__, url_prefix='/api/pass-test')


@bp.route('/status', methods=['GET'])
@token_required
def pass_test_status():
    milestones = UserMilestone.query.filter_by(user_id=request.user_id).order_by(
        UserMilestone.milestone.asc()
    ).all()

    pending = []
    for m in milestones:
        if m.tested_at:
            continue
        now = datetime.utcnow()
        pending.append({
            **m.to_dict(),
            'countdown_seconds': max(0, int((m.test_available_at - now).total_seconds())) if m.test_available_at > now else 0,
        })

    return jsonify({
        'milestones': [m.to_dict() for m in milestones],
        'pending_tests': pending,
    }), 200


def _own_pending(milestone_id):
    """(record, lỗi_response). Bài phải của người dùng, chưa làm và đã đến giờ mở."""
    record = UserMilestone.query.filter_by(id=milestone_id, user_id=request.user_id).first()
    if not record:
        return None, (jsonify({'message': 'Không tìm thấy bài kiểm tra!'}), 404)
    if record.tested_at:
        return None, (jsonify({'message': 'Bài kiểm tra này đã hoàn thành, không thể làm lại!'}), 409)
    if datetime.utcnow() < record.test_available_at:
        remaining = int((record.test_available_at - datetime.utcnow()).total_seconds())
        return None, (jsonify({'message': 'Bài kiểm tra chưa sẵn sàng!', 'countdown_seconds': remaining}), 403)
    return record, None


def _progress_payload(record, now, resumed=False):
    elapsed = elapsed_seconds(record.timer_state(), now)
    return {
        'time_limit_seconds': TIME_LIMIT_SECONDS,
        'remaining_seconds': remaining_seconds(elapsed),
        'time_up': elapsed >= TIME_LIMIT_SECONDS,
        'answers': record.answers(),
        'resumed': resumed,
    }


@bp.route('/<milestone_id>', methods=['GET'])
@token_required
def get_test(milestone_id):
    """Mở bài (hoặc LÀM TIẾP bài dở dang): bắt đầu một phiên mới của đồng hồ 15 phút. Đề KHÔNG kèm đáp án/giải thích."""
    record, error = _own_pending(milestone_id)
    if error:
        return error

    now = datetime.utcnow()
    resumed = record.started_at is not None
    record.apply_timer_state(start_or_resume(record.timer_state(), now))
    db.session.commit()

    test_data = public_test(get_passage_for_milestone(record.milestone))
    return jsonify({'milestone': record.to_dict(), 'test': test_data, 'progress': _progress_payload(record, now, resumed)}), 200


@bp.route('/<milestone_id>/progress', methods=['PUT'])
@token_required
def save_progress(milestone_id):
    """Lưu câu đã trả lời (client gọi mỗi khi chọn đáp án và mỗi ~30 giây để giữ phiên). Hết giờ -> 409 TIME_UP."""
    record, error = _own_pending(milestone_id)
    if error:
        return error
    if record.session_started_at is None:
        return jsonify({'message': 'Bài chưa được mở, hãy mở lại bài kiểm tra.', 'code': 'NO_SESSION'}), 409

    now = datetime.utcnow()
    elapsed = elapsed_seconds(record.timer_state(), now)
    if is_overtime(elapsed):
        return jsonify({'message': 'Đã hết giờ làm bài.', 'code': 'TIME_UP', 'remaining_seconds': 0}), 409

    data = request.get_json(silent=True) or {}
    questions = get_passage_for_milestone(record.milestone)['questions']
    record.saved_answers = json.dumps(clean_answers(data.get('answers'), questions))
    record.apply_timer_state(touch(record.timer_state(), now))
    db.session.commit()
    return jsonify({'remaining_seconds': remaining_seconds(elapsed), 'saved': len(record.answers())}), 200


@bp.route('/<milestone_id>/leave', methods=['POST'])
@token_required
def leave_test(milestone_id):
    """Thoát giữa chừng: lưu câu đã trả lời (nếu còn giờ) và DỪNG đồng hồ. Gọi lại được nhiều lần."""
    record, error = _own_pending(milestone_id)
    if error:
        return error

    now = datetime.utcnow()
    data = request.get_json(silent=True) or {}
    if record.session_started_at is not None:
        if not is_overtime(elapsed_seconds(record.timer_state(), now)) and 'answers' in data:
            questions = get_passage_for_milestone(record.milestone)['questions']
            record.saved_answers = json.dumps(clean_answers(data.get('answers'), questions))
        record.apply_timer_state(leave(record.timer_state(), now))
        db.session.commit()
    return jsonify({'message': 'Đã lưu tiến độ.', 'remaining_seconds': remaining_seconds(elapsed_seconds(record.timer_state(), now))}), 200


@bp.route('/<milestone_id>/submit', methods=['POST'])
@token_required
def submit_test(milestone_id):
    record, error = _own_pending(milestone_id)
    if error:
        return error

    now = datetime.utcnow()
    data = request.get_json(silent=True) or {}
    test_data = get_passage_for_milestone(record.milestone)
    questions = test_data['questions']

    overtime = is_overtime(elapsed_seconds(record.timer_state(), now))
    answers = answers_for_grading(record.answers(), clean_answers(data.get('answers'), questions), overtime)
    correct, results = grade_test(test_data, answers)
    total = len(questions)
    score = int((correct / total) * 100)

    # Cập nhật có điều kiện (tested_at còn trống): 2 request nộp bài cùng lúc chỉ 1 request được ghi điểm
    updated = UserMilestone.query.filter_by(id=record.id, tested_at=None).update(
        {'score': score, 'tested_at': now, 'session_started_at': None, 'saved_answers': json.dumps(answers)},
        synchronize_session=False)
    if not updated:
        db.session.rollback()
        return jsonify({'message': 'Bài kiểm tra đã hoàn thành!'}), 409
    db.session.commit()

    return jsonify({
        'message': 'Nộp bài thành công!' if not overtime else 'Đã hết giờ: chỉ tính các câu bạn đã trả lời trước khi hết giờ.',
        'late': overtime,
        'score': score,
        'correct_count': correct,
        'total_questions': total,
        'results': results,
    }), 200
