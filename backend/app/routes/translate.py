# app/routes/translate.py - STT 11 Dịch từ vựng
import os
import uuid

from flask import Blueprint, request, jsonify
from app import db
from app.models import Word
from app.utils.middleware import token_required

bp = Blueprint('translate', __name__, url_prefix='/api/translate')

# Từ điển mẫu khi chưa cấu hình API bên ngoài
SAMPLE_DICT = {
    'hello': 'xin chào',
    'goodbye': 'tạm biệt',
    'thank you': 'cảm ơn',
    'family': 'gia đình',
    'study': 'học',
    'discipline': 'kỷ luật',
}


def _translate_text(text, source_lang, target_lang):
    """Dịch text - ưu tiên deep-translator nếu có, fallback từ điển mẫu."""
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        return translator.translate(text)
    except Exception:
        pass

    key = text.strip().lower()
    if target_lang in ('vi', 'vietnamese') and key in SAMPLE_DICT:
        return SAMPLE_DICT[key]
    if source_lang in ('vi', 'vietnamese') and text.strip() in SAMPLE_DICT.values():
        for en, vi in SAMPLE_DICT.items():
            if vi == text.strip():
                return en

    return f'[{text}] (Cấu hình deep-translator hoặc API dịch để dùng đầy đủ)'


@bp.route('', methods=['POST'])
@token_required
def translate():
    data = request.get_json() or {}
    text = (data.get('text') or '').strip()
    source_lang = data.get('source_lang', 'auto')
    target_lang = data.get('target_lang', 'vi')

    if not text:
        return jsonify({'message': 'Vui lòng nhập nội dung cần dịch!'}), 400

    src = 'auto' if source_lang == 'auto' else source_lang
    translated = _translate_text(text, src, target_lang)

    return jsonify({
        'original': text,
        'translated': translated,
        'source_lang': source_lang,
        'target_lang': target_lang,
        'can_save': True,
    }), 200


@bp.route('/save', methods=['POST'])
@token_required
def save_translated_word():
    """Lưu từ đã dịch vào kho từ (tạo Word mới nếu chưa có)."""
    data = request.get_json() or {}
    word_text = (data.get('word') or '').strip()
    meaning = (data.get('meaning') or '').strip()

    if not word_text or not meaning:
        return jsonify({'message': 'Vui lòng cung cấp word và meaning!'}), 400

    existing = Word.query.filter(
        Word.word.ilike(word_text),
        Word.deleted_at == None
    ).first()

    if existing:
        return jsonify({'message': 'Từ đã tồn tại!', 'word': existing.to_dict()}), 200

    new_word = Word(
        id=str(uuid.uuid4()),
        word=word_text,
        meaning=meaning,
        word_type=data.get('word_type', 'noun'),
        example=data.get('example'),
        example_meaning=data.get('example_meaning'),
    )
    db.session.add(new_word)
    db.session.commit()

    return jsonify({'message': 'Lưu từ thành công!', 'word': new_word.to_dict()}), 201
