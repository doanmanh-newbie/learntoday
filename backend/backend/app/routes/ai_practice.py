# app/routes/ai_practice.py - STT 17 Đặt câu + Sửa lỗi AI
from flask import Blueprint, request, jsonify
from app.models import User
from app.utils.middleware import token_required
from app.services.study_service import normalize_text

bp = Blueprint('ai_practice', __name__, url_prefix='/api/ai-practice')

SENTENCES = {
    'A1': {
        'vi_en': {'prompt': 'Tôi là sinh viên.', 'answer': 'I am a student.'},
        'en_vi': {'prompt': 'I am a student.', 'answer': 'Tôi là sinh viên.'},
    },
    'B1': {
        'vi_en': {'prompt': 'Kỷ luật rất quan trọng.', 'answer': 'Discipline is very important.'},
        'en_vi': {'prompt': 'Discipline is very important.', 'answer': 'Kỷ luật rất quan trọng.'},
    },
    'B2': {
        'vi_en': {'prompt': 'Kỷ luật giúp tôi tập trung học tập.', 'answer': 'Discipline helps me focus on my studies.'},
        'en_vi': {'prompt': 'Discipline helps me focus on my studies.', 'answer': 'Kỷ luật giúp tôi tập trung học tập.'},
    },
    'C1': {
        'vi_en': {'prompt': 'Kỷ luật là yếu tố then chốt dẫn đến thành công.', 'answer': 'Discipline is a key factor leading to success.'},
        'en_vi': {'prompt': 'Discipline is a key factor leading to success.', 'answer': 'Kỷ luật là yếu tố then chốt dẫn đến thành công.'},
    },
    'IELTS': {
        'vi_en': {
            'prompt': 'Kỷ luật nghiêm ngặt trong môi trường giáo dục là nền tảng để đạt được thành tích học tập xuất sắc.',
            'answer': 'Strict discipline in the educational environment is the foundation for achieving academic excellence.',
        },
        'en_vi': {
            'prompt': 'Strict discipline in the educational environment is the foundation for achieving academic excellence.',
            'answer': 'Kỷ luật nghiêm ngặt trong môi trường giáo dục là nền tảng để đạt được thành tích học tập xuất sắc.',
        },
    },
}


@bp.route('/sentence', methods=['GET'])
@token_required
def get_sentence():
    user = User.query.get(request.user_id)
    level = request.args.get('level') or (user.level if user else 'A1')
    mode = request.args.get('mode', 'vi_en')

    if level not in SENTENCES:
        return jsonify({'message': f'level không hợp lệ!'}), 400
    if mode not in ('vi_en', 'en_vi'):
        return jsonify({'message': "mode phải là 'vi_en' hoặc 'en_vi'!"}), 400

    data = SENTENCES[level][mode]
    return jsonify({
        'level': level,
        'mode': mode,
        'prompt': data['prompt'],
        'suggested_level': user.level if user else 'A1',
    }), 200


@bp.route('/check', methods=['POST'])
@token_required
def check_answer():
    data = request.get_json() or {}
    level = data.get('level', 'A1')
    mode = data.get('mode', 'vi_en')
    user_answer = data.get('answer', '')

    if level not in SENTENCES or mode not in SENTENCES[level]:
        return jsonify({'message': 'level/mode không hợp lệ!'}), 400

    expected = SENTENCES[level][mode]['answer']
    is_correct = normalize_text(user_answer) == normalize_text(expected)

    feedback = 'Chính xác!' if is_correct else f'Gợi ý: {expected}'

    return jsonify({
        'correct': is_correct,
        'feedback': feedback,
        'expected_answer': expected,
    }), 200
