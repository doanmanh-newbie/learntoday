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
    
    # ===== STT 6: ĐÁNH DẤU "ĐÃ BIẾT" =====
@bp.route('/<word_id>/mark-known', methods=['POST'])
@token_required
def mark_known_route(word_id):
    try:
        from app.services.study_service import mark_known
        result = mark_known(request.user_id, word_id)
        return jsonify({'message': 'Đã đánh dấu từ đã biết!', **result}), 200
    except ServiceError as e:
        return jsonify({'message': e.message}), e.status_code


# ===== STT 6: BỎ QUA TỪ =====
@bp.route('/<word_id>/skip', methods=['POST'])
@token_required
def skip_word_route(word_id):
    try:
        from app.services.study_service import skip_word
        result = skip_word(request.user_id, word_id)
        return jsonify({'message': 'Đã bỏ qua từ!', **result}), 200
    except ServiceError as e:
        return jsonify({'message': e.message}), e.status_code


# ===== STT 6: NHẮC NHỞ SAU X NGÀY =====
@bp.route('/<word_id>/snooze', methods=['POST'])
@token_required
def snooze_word_route(word_id):
    data = request.get_json() or {}
    days = data.get('days', 7)
    try:
        from app.services.study_service import snooze_word
        result = snooze_word(request.user_id, word_id, days)
        return jsonify({'message': f'Sẽ nhắc lại sau {days} ngày!', **result}), 200
    except ServiceError as e:
        return jsonify({'message': e.message}), e.status_code
    
    # ===== TRA CỨU TỪ VỰNG TỪ DICTIONARY API =====
@bp.route('/lookup/<word>', methods=['GET'])
@token_required
def lookup_word_route(word):
    """
    Tra cứu 1 từ từ Free Dictionary API.
    Query params:
    - translate=true|false (default true)
    
    Trả về: data từ đã parse
    """
    from app.services.dictionary_service import lookup_word
    from flask import request
    
    translate = request.args.get('translate', 'true').lower() == 'true'
    
    try:
        result = lookup_word(word, translate=translate)
        if not result:
            return jsonify({
                'message': f'Không tìm thấy từ "{word}" trong từ điển',
                'found': False,
            }), 404
        
        return jsonify({
            'found': True,
            'word': result,
        }), 200
    except Exception as e:
        return jsonify({'message': f'Lỗi: {str(e)}'}), 500


# ===== TRA CỨU NHIỀU NGHĨA (cho EditWordModal) =====
@bp.route('/suggestions/<word>', methods=['GET'])
@token_required
def word_suggestions_route(word):
    """
    Lấy danh sách nghĩa đề xuất cho 1 từ (dùng trong EditWordModal).
    Query params:
    - pos=verb|noun|adj|... (filter theo loại từ, optional)
    """
    from app.services.dictionary_service import lookup_multiple_meanings
    from flask import request
    
    pos_filter = request.args.get('pos', '').strip()
    
    try:
        results = lookup_multiple_meanings(word)
        
        # Filter theo POS nếu có
        if pos_filter:
            results = [r for r in results if r['word_type'] == pos_filter]
        
        return jsonify({
            'word': word,
            'suggestions': results,
            'count': len(results),
        }), 200
    except Exception as e:
        return jsonify({'message': f'Lỗi: {str(e)}'}), 500