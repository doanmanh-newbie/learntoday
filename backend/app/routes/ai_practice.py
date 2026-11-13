# app/routes/ai_practice.py - STT 17 Đặt câu + Sửa lỗi AI (AI thật: Gemini hoặc Claude, xem ai_service.py)
import os
import random
import re

from flask import Blueprint, current_app, jsonify, request
from itsdangerous import BadSignature, URLSafeTimedSerializer

from app import db
from app.models import Folder, FolderWord, User, UserWord, Word
from app.services import ai_service
from app.services.ai_service import AIError, TOPICS
from app.services.lexicon_service import HEADWORD_RE
from app.utils.middleware import token_required
from app.utils.rate_limit import ai_limiter

bp = Blueprint('ai_practice', __name__, url_prefix='/api/ai-practice')

TOKEN_MAX_AGE = 3 * 3600          # câu hỏi hết hạn sau 3 giờ
MAX_ANSWER_LEN = 500

# Câu mẫu DỰ PHÒNG: chỉ dùng khi AI chưa bật/đang lỗi (khi đó chỉ so khớp đáp án mẫu, không chấm điểm).
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




def _normalize(text):
    """So khớp không phân biệt hoa/thường, bỏ dấu câu và khoảng trắng thừa (giữ chữ có dấu tiếng Việt)."""
    return re.sub(r'\s+', ' ', re.sub(r"[^\w\s']", ' ', (text or '').lower())).strip()


def _serializer():
    return URLSafeTimedSerializer(current_app.config['JWT_SECRET'], salt='ai-practice-v1')


def _rate_limited():
    """None nếu được phép; ngược lại là response 429. Mỗi lần gọi AI tốn tiền nên giới hạn theo người dùng."""
    limit = int(os.environ.get('AI_RATE_LIMIT_PER_HOUR', 60))
    ok, wait = ai_limiter.check(f'ai:{request.user_id}', limit)
    if ok:
        return None
    minutes = max(1, wait // 60)
    return jsonify({'message': f'Bạn đã dùng hết {limit} lượt AI trong 1 giờ. Thử lại sau khoảng {minutes} phút.',
                    'code': 'AI_RATE_LIMITED', 'retry_after': wait}), 429


def _error(err):
    return jsonify({'message': err.message, 'code': err.code}), err.status


def _pick_word(folder_id, user_id):
    """Chọn ngẫu nhiên 1 từ trong folder (ưu tiên từ người dùng ĐÃ học) để ra đề có từ đó."""
    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder or (folder.type == 'personal' and folder.user_id != user_id):
        return None, (jsonify({'message': 'Không tìm thấy folder!'}), 404)
    base = (db.session.query(Word.word).join(FolderWord, FolderWord.word_id == Word.id)
            .filter(FolderWord.folder_id == folder_id, Word.deleted_at.is_(None)))
    learned = base.join(UserWord, db.and_(UserWord.word_id == Word.id, UserWord.user_id == user_id,
                                          UserWord.level >= 1))
    row = learned.order_by(db.func.random()).first() or base.order_by(db.func.random()).first()
    if not row:
        return None, (jsonify({'message': 'Folder này chưa có từ nào để luyện.'}), 400)
    return row[0], None


@bp.route('/sentence', methods=['GET'])
@token_required
def get_sentence():
    """Ra đề: AI soạn câu theo trình độ (và theo 1 từ trong folder nếu có). AI chưa bật/lỗi -> câu mẫu dự phòng."""
    user = db.session.get(User, request.user_id)
    level = request.args.get('level') or (user.level if user and user.level in SENTENCES else 'B1')
    mode = request.args.get('mode', 'vi_en')
    if level not in SENTENCES:
        return jsonify({'message': 'level không hợp lệ!'}), 400
    if mode not in ('vi_en', 'en_vi'):
        return jsonify({'message': "mode phải là 'vi_en' hoặc 'en_vi'!"}), 400

    word = (request.args.get('word') or '').strip().lower() or None
    if word and not HEADWORD_RE.match(word):
        return jsonify({'message': 'word không hợp lệ!'}), 400
    if not word and request.args.get('folder_id'):
        word, err = _pick_word(request.args['folder_id'], request.user_id)
        if err:
            return err

    result = {'level': level, 'mode': mode, 'word': word, 'ai_available': False, 'ai_error': None,
              'suggested_level': user.level if user else 'B1'}
    sentence = None
    if ai_service.ai_configured():
        limited = _rate_limited()
        if limited:
            return limited
        try:
            sentence = ai_service.generate_sentence(level, mode, word=word, topic=random.choice(TOPICS))
            result.update(ai_available=True, source='ai')
        except AIError as e:
            # AI lỗi/quá tải: vẫn cho luyện bằng câu mẫu, nhưng nói rõ lý do (không giả vờ có AI)
            result['ai_error'] = {'code': e.code, 'message': e.message}
    else:
        result['ai_error'] = {'code': 'AI_NOT_CONFIGURED', 'message': 'Chưa bật AI nên chưa chấm điểm chi tiết được.'}

    if sentence is None:
        fallback = SENTENCES[level][mode]
        sentence = {'prompt': fallback['prompt'], 'reference': fallback['answer'], 'hint': ''}
        result['source'] = 'static'

    payload = {'uid': request.user_id, 'level': level, 'mode': mode, 'word': word, 'src': result['source'],
               'prompt': sentence['prompt'], 'reference': sentence['reference']}
    result.update(prompt=sentence['prompt'], hint=sentence.get('hint', ''),
                  token=_serializer().dumps(payload))
    return jsonify(result), 200


@bp.route('/check', methods=['POST'])
@token_required
def check_answer():
    """Chấm câu trả lời. Có AI: điểm thật + lỗi + câu đã sửa. Không có AI: chỉ so khớp đáp án mẫu (không có điểm)."""
    data = request.get_json(silent=True) or {}
    answer = (data.get('answer') or '').strip() if isinstance(data.get('answer'), str) else ''
    if not answer:
        return jsonify({'message': 'Vui lòng nhập câu trả lời!'}), 400
    if len(answer) > MAX_ANSWER_LEN:
        return jsonify({'message': f'Câu trả lời tối đa {MAX_ANSWER_LEN} ký tự!'}), 400
    try:
        # Câu hỏi được ký bằng khóa server: client không thể gửi đề tùy ý để dùng AI như chatbot miễn phí
        q = _serializer().loads(data.get('token') or '', max_age=TOKEN_MAX_AGE)
    except BadSignature:
        return jsonify({'message': 'Câu hỏi đã hết hạn hoặc không hợp lệ, hãy lấy câu mới.', 'code': 'INVALID_TOKEN'}), 400
    if q.get('uid') != request.user_id:
        return jsonify({'message': 'Câu hỏi không thuộc về bạn.', 'code': 'INVALID_TOKEN'}), 400

    reference = q['reference']
    if q.get('src') == 'ai' and ai_service.ai_configured():
        limited = _rate_limited()
        if limited:
            return limited
        try:
            graded = ai_service.grade_answer(q['level'], q['mode'], q['prompt'], reference, answer, word=q.get('word'))
        except AIError as e:
            return _error(e)
        return jsonify({
            'graded_by': 'ai', 'correct': graded['is_acceptable'], 'scores': graded['scores'],
            'corrected': graded['corrected'], 'errors': graded['errors'], 'feedback': graded['feedback_vi'],
            'alternatives': graded['alternatives'], 'expected_answer': reference,
        }), 200

    correct = _normalize(answer) == _normalize(reference)
    return jsonify({
        'graded_by': 'reference', 'correct': correct, 'scores': None, 'corrected': None, 'errors': [], 'alternatives': [],
        'feedback': ('Chính xác!' if correct else 'Chưa khớp đáp án mẫu. Lưu ý: chế độ này chỉ so khớp đúng 1 cách dịch; '
                     'bật AI để được chấm công bằng với mọi cách dịch đúng.'),
        'expected_answer': reference,
    }), 200
