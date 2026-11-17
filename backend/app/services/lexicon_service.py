# app/services/lexicon_service.py
"""
KHO TỪ VỰNG: tra từ điển thật + lưu vào database.

Luồng tra từ:  từ điển Anh-Việt tích hợp (lexicon_entries, nạp từ file .mobi)  ->  nếu không có:
database cache (dictionary_entries)  ->  nếu chưa có: Free Dictionary API  ->  dịch nghĩa sang tiếng Việt
->  LƯU vào database  ->  trả về. Từ có trong từ điển tích hợp trả ngay, không gọi dịch vụ ngoài nào.

Luồng lưu từ:  người dùng bấm "Lưu vào thư mục"  ->  từ được ghi vào bảng `words` (kho từ dùng chung
cho SRS/học/ôn) nếu chưa có  ->  gắn vào thư mục cá nhân (`folder_words`).

Nguyên tắc: KHÔNG BAO GIỜ lưu tiếng Anh vào chỗ dành cho nghĩa tiếng Việt. Dịch lỗi thì để trống,
đánh dấu vi_complete=False và thử dịch lại ở lần tra sau.
"""
import functools
import json
import logging
import os
import re
import uuid
from datetime import datetime, timedelta

import requests
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import DictionaryEntry, Folder, FolderWord, LexiconEntry, Word
from app.services import dict_import
from app.utils.sql import escape_like
from app.utils.word_level import tier_for_word

logger = logging.getLogger(__name__)

DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en'
SUGGEST_API = 'https://api.datamuse.com/sug'
HEADWORD_RE = re.compile(r"^[A-Za-z][A-Za-z'\- ]{0,59}$")
NEGATIVE_CACHE = timedelta(hours=24)
RETRY_TRANSLATE_AFTER = timedelta(minutes=10)
MAX_MEANINGS, MAX_DEFS, MAX_SYNONYMS = 6, 4, 8
HTTP_HEADERS = {'User-Agent': 'LearnToday/1.0 (+vocabulary learning app)', 'Accept': 'application/json'}


class LexiconError(Exception):
    def __init__(self, message, status=400, code=''):
        super().__init__(message)
        self.message, self.status, self.code = message, status, code


class LexiconUnavailable(LexiconError):
    def __init__(self, message='Dịch vụ từ điển đang bận, vui lòng thử lại sau.'):
        super().__init__(message, 503, 'DICTIONARY_UNAVAILABLE')


def normalize_headword(query):
    q = re.sub(r'\s+', ' ', (query or '').strip().lower())
    return q if HEADWORD_RE.match(q) else None


# ───────────────────────── gọi từ điển ngoài ─────────────────────────
def _fetch_raw(word):
    """Trả về list dữ liệu thô, hoặc None nếu từ KHÔNG tồn tại. Ném LexiconUnavailable khi dịch vụ lỗi."""
    last_error = None
    for attempt in range(2):
        try:
            res = requests.get(f'{DICT_API}/{requests.utils.quote(word)}', headers=HTTP_HEADERS, timeout=8)
        except requests.RequestException as e:
            last_error = e
            continue
        if res.status_code == 404:
            return None
        if res.status_code == 200:
            try:
                data = res.json()
            except ValueError as e:
                last_error = e
                continue
            return data if isinstance(data, list) and data else None
        last_error = f'HTTP {res.status_code}'
        if res.status_code < 500 and res.status_code != 429:
            break
    logger.warning('Free Dictionary API lỗi khi tra "%s": %s', word, last_error)
    raise LexiconUnavailable()


def parse_entry(raw_list, word):
    """Dữ liệu thô -> cấu trúc gọn dùng chung (chưa có tiếng Việt)."""
    phonetic, audio = '', {}
    meanings = {}                                     # gộp theo loại từ (API có thể trả nhiều entry)
    for raw in raw_list:
        phonetic = phonetic or raw.get('phonetic') or ''
        for p in raw.get('phonetics') or []:
            phonetic = phonetic or p.get('text') or ''
            url = (p.get('audio') or '').strip()
            if url:
                key = 'uk' if '-uk' in url else 'us' if '-us' in url else 'default'
                audio.setdefault(key, url)
        for m in raw.get('meanings') or []:
            pos = (m.get('partOfSpeech') or 'other').lower()
            block = meanings.setdefault(pos, {'pos': pos, 'definitions': [], 'synonyms': [], 'antonyms': []})
            for d in m.get('definitions') or []:
                text = (d.get('definition') or '').strip()
                if text and len(block['definitions']) < MAX_DEFS and all(text != x['definition_en'] for x in block['definitions']):
                    block['definitions'].append({
                        'definition_en': text, 'meaning_vi': None,
                        'example': (d.get('example') or '').strip() or None, 'example_vi': None,
                    })
                for key in ('synonyms', 'antonyms'):
                    for w in d.get(key) or []:
                        if w not in block[key] and len(block[key]) < MAX_SYNONYMS:
                            block[key].append(w)
            for key in ('synonyms', 'antonyms'):
                for w in m.get(key) or []:
                    if w not in block[key] and len(block[key]) < MAX_SYNONYMS:
                        block[key].append(w)
    blocks = [b for b in meanings.values() if b['definitions']][:MAX_MEANINGS]
    if not blocks:
        return None
    audio_default = audio.get('default') or audio.get('us') or audio.get('uk') or ''
    return {
        'word': (raw_list[0].get('word') or word).lower(),
        'phonetic': phonetic,
        'audio': {'us': audio.get('us') or audio_default, 'uk': audio.get('uk') or audio_default},
        'meanings': blocks,
        'vi_complete': False,
    }


# ───────────────────────── dịch sang tiếng Việt ─────────────────────────
def translate_many(texts):
    """Dịch hàng loạt EN->VI. Trả dict {câu gốc: bản dịch}; câu nào lỗi thì KHÔNG có trong dict."""
    unique = [t for t in dict.fromkeys(texts) if t]
    if not unique:
        return {}
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source='en', target='vi')
        out = {}
        for i in range(0, len(unique), 20):
            chunk = unique[i:i + 20]
            results = translator.translate_batch(chunk)
            for src, vi in zip(chunk, results):
                if vi and vi.strip() and vi.strip().lower() != src.strip().lower():
                    out[src] = vi.strip()
        return out
    except Exception as e:  # noqa: BLE001 - thư viện dịch lỗi mạng/giới hạn đủ kiểu
        logger.warning('Dịch EN->VI lỗi: %s', e)
        return {}


def fill_vietnamese(entry):
    """Điền meaning_vi/example_vi còn thiếu. Trả True nếu mọi nghĩa đã có tiếng Việt."""
    todo = []
    for block in entry['meanings']:
        for d in block['definitions']:
            if not d.get('meaning_vi'):
                todo.append(d['definition_en'])
            if d.get('example') and not d.get('example_vi'):
                todo.append(d['example'])
    if todo:
        translated = translate_many(todo)
        for block in entry['meanings']:
            for d in block['definitions']:
                d['meaning_vi'] = d.get('meaning_vi') or translated.get(d['definition_en'])
                if d.get('example'):
                    d['example_vi'] = d.get('example_vi') or translated.get(d['example'])
    entry['vi_complete'] = all(d.get('meaning_vi') for b in entry['meanings'] for d in b['definitions'])
    return entry['vi_complete']


# ───────────────────────── từ điển Anh-Việt tích hợp ─────────────────────────
@functools.lru_cache(maxsize=1)
def card_overrides():
    """Nghĩa flashcard viết tay (data/card_overrides.json, đổi đường dẫn bằng LEXICON_OVERRIDES_PATH). File lỗi/thiếu -> không ghi đè gì."""
    path = os.environ.get('LEXICON_OVERRIDES_PATH') or os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'card_overrides.json')
    try:
        with open(path, encoding='utf-8') as f:
            return dict_import.parse_overrides(f.read())
    except (OSError, ValueError):
        logger.warning('Không đọc được %s - bỏ qua nghĩa ghi đè.', path)
        return {}


def _has_content(row):
    return bool(row.pos_list or row.has_domain)


def lexicon_entry(key):
    """Tra trong lexicon_entries. Trả `entry` dạng API hoặc None (không có / chưa nạp từ điển).

    * "went" chỉ ghi "xem go"        -> trả mục của "go" (kèm redirected_from='went')
    * "studies" không có mục riêng   -> đoán dạng gốc "study" (kèm matched_from='studies')
    """
    row = LexiconEntry.query.filter_by(word=key).first()
    if row is not None:
        record = row.as_record()
        if dict_import.is_redirect(record):
            target = LexiconEntry.query.filter_by(word=row.see_also).first()
            if target is not None and _has_content(target) and not dict_import.is_redirect(target.as_record()):
                return dict_import.to_api_entry(target.as_record(), redirected_from=key)
        if _has_content(row):
            return dict_import.to_api_entry(record)
        return None

    candidates = dict_import.lemma_candidates(key)
    if not candidates:
        return None
    rows = {r.word: r for r in LexiconEntry.query.filter(LexiconEntry.word.in_(candidates)).all()}
    for cand in candidates:                                  # giữ đúng thứ tự ưu tiên của lemma_candidates
        base = rows.get(cand)
        if base is not None and _has_content(base) and not dict_import.is_redirect(base.as_record()):
            return dict_import.to_api_entry(base.as_record(), matched_from=key)
    return None


# ───────────────────────── kho trong database ─────────────────────────
def get_entry(word):
    """(entry | None, nguồn). Ném LexiconUnavailable nếu chưa có trong DB và dịch vụ ngoài không dùng được."""
    key = normalize_headword(word)
    if not key:
        raise LexiconError('Từ cần tra chỉ gồm chữ cái tiếng Anh (tối đa 60 ký tự).', 400, 'INVALID_WORD')

    local = lexicon_entry(key)
    if local is not None:
        return local, 'lexicon'

    row = DictionaryEntry.query.filter_by(word=key).first()
    if row and row.found:
        entry = row.entry()
        # Lần trước dịch chưa xong -> thử lại (tối đa 10 phút/lần để không gọi dịch vụ dịch ở MỌI lần tra)
        if not entry.get('vi_complete') and datetime.utcnow() - row.fetched_at > RETRY_TRANSLATE_AFTER:
            fill_vietnamese(entry)
            row.data, row.fetched_at = json.dumps(entry, ensure_ascii=False), datetime.utcnow()
            db.session.commit()
        return entry, 'database'
    if row and not row.found and datetime.utcnow() - row.fetched_at < NEGATIVE_CACHE:
        return None, 'database'

    raw = _fetch_raw(key)
    if raw is None:
        _store(key, found=False, data=None, row=row)
        return None, 'api'
    entry = parse_entry(raw, key)
    if entry is None:
        _store(key, found=False, data=None, row=row)
        return None, 'api'
    fill_vietnamese(entry)
    _store(key, found=True, data=entry, row=row)
    return entry, 'api'


def _store(key, found, data, row=None):
    try:
        if row is None:
            row = DictionaryEntry(id=str(uuid.uuid4()), word=key)
            db.session.add(row)
        row.found, row.fetched_at = found, datetime.utcnow()
        row.data = json.dumps(data, ensure_ascii=False) if data else None
        db.session.commit()
    except IntegrityError:                              # 2 người tra cùng 1 từ mới cùng lúc
        db.session.rollback()


def record_lookup(word):
    DictionaryEntry.query.filter_by(word=normalize_headword(word)).update(
        {'lookups': DictionaryEntry.lookups + 1}, synchronize_session=False)
    db.session.commit()


# ───────────────────────── gợi ý khi gõ ─────────────────────────
def suggest(prefix, limit=8):
    key = re.sub(r'\s+', ' ', (prefix or '').strip().lower())
    if not key or not HEADWORD_RE.match(key):
        return []
    like = f'{escape_like(key)}%'
    found = []

    def add(w):
        w = (w or '').lower()
        if w and w not in found and HEADWORD_RE.match(w):
            found.append(w)

    for (w,) in (db.session.query(LexiconEntry.word)             # từ điển tích hợp: từ "dày" nghĩa (thường gặp) lên đầu
                 .filter(LexiconEntry.pos_list != '', LexiconEntry.word.like(like, escape='\\'))
                 .order_by(LexiconEntry.weight.desc(), db.func.length(LexiconEntry.word)).limit(limit)):
        add(w)
    from_lexicon = bool(found)

    for (w,) in (db.session.query(DictionaryEntry.word)
                 .filter(DictionaryEntry.found.is_(True), DictionaryEntry.word.like(like, escape='\\'))
                 .order_by(DictionaryEntry.lookups.desc(), db.func.length(DictionaryEntry.word)).limit(limit)):
        add(w)
    for (w,) in (db.session.query(Word.word)
                 .filter(Word.deleted_at.is_(None), Word.word.ilike(like, escape='\\'))
                 .order_by(db.func.length(Word.word)).limit(limit)):
        add(w)

    if len(found) < limit and not from_lexicon:         # bổ sung từ nguồn gợi ý bên ngoài; lỗi thì bỏ qua
        try:
            res = requests.get(SUGGEST_API, params={'s': key, 'max': limit}, headers=HTTP_HEADERS, timeout=3)
            if res.status_code == 200:
                for item in res.json():
                    add(item.get('word'))
        except (requests.RequestException, ValueError, AttributeError):
            pass
    return found[:limit]


# ───────────────────────── lưu từ vào thư mục ─────────────────────────
def save_to_folder(user_id, word, folder_id, pos=None):
    """Lưu 1 từ tra cứu vào thư mục cá nhân. Trả (Word, Folder, already_saved)."""
    folder = Folder.query.filter_by(id=folder_id, deleted_at=None).first()
    if not folder:
        raise LexiconError('Không tìm thấy thư mục!', 404)
    if folder.type != 'personal' or folder.user_id != user_id:
        raise LexiconError('Bạn không có quyền thêm từ vào thư mục này!', 403)

    entry, _ = get_entry(word)
    if entry is None:
        raise LexiconError(f'Không tìm thấy từ "{word}" trong từ điển.', 404, 'WORD_NOT_FOUND')

    db_word = Word.query.filter(db.func.lower(Word.word) == entry['word'], Word.deleted_at.is_(None)).first()
    if db_word is None:
        if entry.get('origin') == 'lexicon':
            card = dict_import.apply_override(dict_import.card_for(entry, pos), card_overrides().get(entry['word']))
            if not card or not card['meaning_vi']:
                raise LexiconError('Từ này chưa có nghĩa tiếng Việt để lưu.', 422, 'NO_MEANING')
            word_type, meaning, meaning_en = card['pos'], card['meaning_vi'], None
            example, example_vi, audio = card['example'], card['example_vi'], None
        else:
            block = next((b for b in entry['meanings'] if pos and b['pos'] == pos.lower()), entry['meanings'][0])
            sense = block['definitions'][0]
            if not sense.get('meaning_vi'):
                # Không lưu tiếng Anh vào cột nghĩa tiếng Việt: báo lỗi để người dùng thử lại
                raise LexiconError('Chưa dịch được nghĩa tiếng Việt, vui lòng thử lại sau ít phút.', 503, 'TRANSLATION_UNAVAILABLE')
            word_type, meaning, meaning_en = block['pos'], sense['meaning_vi'], sense['definition_en']
            example, example_vi = sense.get('example'), sense.get('example_vi')
            audio = entry['audio'].get('us') or entry['audio'].get('uk') or None
        phonetic = entry.get('phonetic') or None
        db_word = Word(
            id=str(uuid.uuid4()), word=entry['word'],
            pronunciation=phonetic[:100] if phonetic else None,
            word_type=word_type[:30], meaning=meaning, meaning_en=meaning_en,
            example=example, example_meaning=example_vi,
            audio_url=audio[:255] if audio else None,
            difficulty=tier_for_word(entry['word']), category='Từ điển',
        )
        db.session.add(db_word)
        db.session.flush()

    if FolderWord.query.filter_by(folder_id=folder.id, word_id=db_word.id).first():
        return db_word, folder, True

    next_index = db.session.query(db.func.coalesce(db.func.max(FolderWord.order_index) + 1, 0)).filter(
        FolderWord.folder_id == folder.id).scalar()
    db.session.add(FolderWord(id=str(uuid.uuid4()), folder_id=folder.id, word_id=db_word.id, order_index=next_index))
    Folder.query.filter_by(id=folder.id).update({'word_count': db.func.coalesce(Folder.word_count, 0) + 1})
    try:
        db.session.commit()
    except IntegrityError:                              # bấm lưu 2 lần cùng lúc
        db.session.rollback()
        return Word.query.filter(db.func.lower(Word.word) == entry['word']).first() or db_word, folder, True
    return db_word, folder, False
