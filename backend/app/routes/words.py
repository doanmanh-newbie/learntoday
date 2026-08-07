# app/routes/words.py
from flask import Blueprint, request, jsonify
from app.utils.middleware import token_required
from app.services.study_service import (
    check_step_answer, complete_learn, complete_review, ServiceError
)

bp = Blueprint('words', __name__, url_prefix='/api/words')


# ===== MODULE 6.5: CHẤM ĐIỂM 1 BƯỚC =====
@bp.route('/<word_id>/check-answer', methods=['POST'])
@token_required
def check_answer(word_id):
    """
    Body theo từng step:
    - spelling: { "step": "spelling", "answer": "apple" }
    - quiz1/quiz2: { "step": "quiz1", "selected_word_id": "..." }
    - quiz3: { "step": "quiz3", "pairs": [ {"word_id": "...", "matched_meaning": "..."}, ... ] }
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

    step = data.get('step')

    try:
        result = check_step_answer(word_id, step, data)
        return jsonify(result), 200
    except ServiceError as e:
        return jsonify({'message': e.message}), e.status_code


# ===== MODULE 6.5: HOÀN THÀNH HỌC TỪ MỚI (nhánh "learn") =====
@bp.route('/<word_id>/complete-learn', methods=['POST'])
@token_required
def complete_learn_route(word_id):
    try:
        result = complete_learn(request.user_id, word_id)
        return jsonify({
            'message': 'Hoàn thành học từ mới!',
            **result
        }), 200
    except ServiceError as e:
        return jsonify({'message': e.message}), e.status_code


# ===== MODULE 6.5: HOÀN THÀNH ÔN TẬP (nhánh "review") =====
@bp.route('/<word_id>/complete-review', methods=['POST'])
@token_required
def complete_review_route(word_id):
    """
    Body:
    { "wrong_count": 2, "choice": null }
      -> wrong_count < 4: tự động "hoàn_thành"

    { "wrong_count": 5, "choice": "quay_ve_lv1" | "lui_1_lv" | "bo_qua" }
      -> wrong_count >= 4: BẮT BUỘC có choice
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Vui lòng gửi dữ liệu JSON!'}), 400

    wrong_count = data.get('wrong_count')
    choice = data.get('choice')

    try:
        result = complete_review(request.user_id, word_id, wrong_count, choice)
        return jsonify({
            'message': 'Hoàn thành ôn tập từ!',
            **result
        }), 200
    except ServiceError as e:
        return jsonify({'message': e.message}), e.status_code