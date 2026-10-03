# app/services/dictionary_service.py
"""
Service tra cứu từ vựng từ Free Dictionary API.
- Miễn phí, không cần API key
- Docs: https://dictionaryapi.dev/
"""

import requests
import logging
from deep_translator import GoogleTranslator
import time


logger = logging.getLogger(__name__)

DICT_API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en'


def fetch_word_from_api(word: str, retries=3) -> dict | None:
    """Lấy data từ Free Dictionary API. Thêm retry + User-Agent."""
    if not word or not word.strip():
        return None

    word = word.strip().lower()
    url = f'{DICT_API_BASE}/{word}'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
    }

    for attempt in range(retries):
        try:
            print(f'   [Attempt {attempt + 1}/{retries}] GET {url}')
            res = requests.get(url, headers=headers, timeout=30)
            print(f'   → Status: {res.status_code}')

            if res.status_code == 404:
                return None
            if res.status_code != 200:
                if attempt < retries - 1:
                    time.sleep(2)
                    continue
                return None

            data = res.json()
            if not data or not isinstance(data, list):
                return None
            return data[0]

        except requests.exceptions.Timeout:
            print(f'   ⏱️ Timeout lần {attempt + 1}')
            if attempt < retries - 1:
                time.sleep(3)
                continue
            return None
        except Exception as e:
            print(f'   ❌ Lỗi: {e}')
            if attempt < retries - 1:
                time.sleep(2)
                continue
            return None

    return None


def translate_vi(text: str) -> str:
    """Dịch sang tiếng Việt bằng Google Translate (miễn phí qua deep-translator)."""
    if not text:
        return ''
    try:
        return GoogleTranslator(source='en', target='vi').translate(text)
    except Exception as e:
        logger.warning(f'Dịch lỗi: {e}')
        return text


def parse_word_data(raw_data: dict, translate=True) -> dict:
    """
    Parse raw data từ Dictionary API → format của dự án.

    Output:
    {
        'word': str,
        'pronunciation': str,
        'word_type': str,
        'meaning': str,           # Nghĩa tiếng Việt
        'meaning_en': str,        # Nghĩa tiếng Anh
        'example': str,           # Ví dụ tiếng Anh
        'example_meaning': str,   # Ví dụ tiếng Việt
        'audio_url': str,         # URL phát âm
        'synonyms': [str],
        'antonyms': [str],
    }
    """
    word = raw_data.get('word', '')

    # ── Pronunciation ──
    phonetic = raw_data.get('phonetic', '')
    audio_url = ''

    for p in raw_data.get('phonetics', []):
        if p.get('text') and not phonetic:
            phonetic = p['text']
        if p.get('audio') and not audio_url:
            audio_url = p['audio']

    # ── Meanings ──
    meanings = raw_data.get('meanings', [])
    if not meanings:
        return {
            'word': word,
            'pronunciation': phonetic,
            'word_type': '',
            'meaning': '',
            'meaning_en': '',
            'example': '',
            'example_meaning': '',
            'audio_url': audio_url,
            'synonyms': [],
            'antonyms': [],
        }

    # Lấy meaning đầu tiên
    first_meaning = meanings[0]
    word_type = first_meaning.get('partOfSpeech', '')

    # Lấy definition + example đầu tiên
    definitions = first_meaning.get('definitions', [])
    meaning_en = ''
    example_en = ''

    for d in definitions:
        if not meaning_en:
            meaning_en = d.get('definition', '')
        if not example_en and d.get('example'):
            example_en = d['example']
        if meaning_en and example_en:
            break

    # Synonyms/antonyms
    synonyms = first_meaning.get('synonyms', [])[:5]
    antonyms = first_meaning.get('antonyms', [])[:5]

    # Dịch sang tiếng Việt
    meaning_vi = translate_vi(meaning_en) if translate and meaning_en else ''
    example_vi = translate_vi(example_en) if translate and example_en else ''

    return {
        'word': word,
        'pronunciation': phonetic,
        'word_type': word_type,
        'meaning': meaning_vi,
        'meaning_en': meaning_en,
        'example': example_en,
        'example_meaning': example_vi,
        'audio_url': audio_url,
        'synonyms': synonyms,
        'antonyms': antonyms,
    }


def lookup_word(word: str, translate=True) -> dict | None:
    """
    Hàm chính: tra cứu 1 từ → trả về data đã parse.
    Trả về None nếu không tìm thấy.
    """
    raw = fetch_word_from_api(word)
    if not raw:
        return None
    return parse_word_data(raw, translate=translate)


def lookup_multiple_meanings(word: str, translate=True) -> list:
    """
    Lấy TẤT CẢ meanings của 1 từ (không chỉ meaning đầu tiên).
    Dùng cho tính năng "đề xuất nghĩa theo loại từ" trong EditWordModal.
    """
    raw = fetch_word_from_api(word)
    if not raw:
        return []

    results = []
    for meaning in raw.get('meanings', []):
        word_type = meaning.get('partOfSpeech', '')
        for d in meaning.get('definitions', [])[:2]:  # Max 2 defs/meaning
            meaning_en = d.get('definition', '')
            example_en = d.get('example', '')

            results.append({
                'word': raw.get('word', word),
                'word_type': word_type,
                'meaning': translate_vi(meaning_en) if translate else meaning_en,
                'meaning_en': meaning_en,
                'example': example_en,
                'example_meaning': translate_vi(example_en) if translate and example_en else '',
            })

    return results