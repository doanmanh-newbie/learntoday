# app/routes/pass_test.py - STT 16 Kiểm tra Pass
from datetime import datetime

from flask import Blueprint, request, jsonify
from app import db
from app.models import UserMilestone
from app.services.pass_test_service import get_passage_for_milestone
from app.utils.middleware import token_required

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


@bp.route('/<milestone_id>', methods=['GET'])
@token_required
def get_test(milestone_id):
    record = UserMilestone.query.filter_by(id=milestone_id, user_id=request.user_id).first()
    if not record:
        return jsonify({'message': 'Không tìm thấy bài kiểm tra!'}), 404

    if record.tested_at:
        return jsonify({'message': 'Bài kiểm tra này đã hoàn thành, không thể làm lại!'}), 409

    if datetime.utcnow() < record.test_available_at:
        remaining = int((record.test_available_at - datetime.utcnow()).total_seconds())
        return jsonify({
            'message': 'Bài kiểm tra chưa sẵn sàng!',
            'countdown_seconds': remaining,
        }), 403

    test_data = get_passage_for_milestone(record.milestone)
    return jsonify({'milestone': record.to_dict(), 'test': test_data}), 200


@bp.route('/<milestone_id>/submit', methods=['POST'])
@token_required
def submit_test(milestone_id):
    record = UserMilestone.query.filter_by(id=milestone_id, user_id=request.user_id).first()
    if not record:
        return jsonify({'message': 'Không tìm thấy bài kiểm tra!'}), 404

    if record.tested_at:
        return jsonify({'message': 'Bài kiểm tra đã hoàn thành!'}), 409

    if datetime.utcnow() < record.test_available_at:
        return jsonify({'message': 'Bài kiểm tra chưa sẵn sàng!'}), 403

    data = request.get_json() or {}
    answers = data.get('answers', {})

    test_data = get_passage_for_milestone(record.milestone)
    correct = 0
    results = []

    for q in test_data['questions']:
        user_answer = answers.get(q['id'])
        is_correct = user_answer == q['correct_index']
        if is_correct:
            correct += 1
        results.append({
            'question_id': q['id'],
            'correct': is_correct,
            'correct_index': q['correct_index'],
            'explanation': q['explanation'],
        })

    score = int((correct / len(test_data['questions'])) * 100)
    record.score = score
    record.tested_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'message': 'Nộp bài thành công!',
        'score': score,
        'correct_count': correct,
        'total_questions': len(test_data['questions']),
        'results': results,
    }), 200
