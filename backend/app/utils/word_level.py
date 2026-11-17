"""Bậc khó của từ (words.difficulty 1..4) suy từ CEFR-J (A1-B2) và NAWL.

Dữ liệu nằm ở data/wordlists/cefr_levels.csv (word,level) và nawl.txt (mỗi dòng một từ).
Thiếu file thì mọi từ là bậc 1.
"""
import csv
import os

DEFAULT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data', 'wordlists')
_DIR = DEFAULT_DIR
_DATA = None
_CEFR_TIER = {'A1': 1, 'A2': 1, 'B1': 2, 'B2': 3}


def tier_for(word, cefr, nawl):
    w = str(word or '').strip().lower()
    if not w:
        return 1
    level = cefr.get(w)
    if level:
        return _CEFR_TIER.get(str(level).strip().upper(), 1)
    return 4 if w in nawl else 1


def load_levels(directory=None):
    d = directory or _DIR
    cefr, nawl = {}, set()
    try:
        with open(os.path.join(d, 'cefr_levels.csv'), encoding='utf-8', newline='') as f:
            for row in csv.DictReader(f):
                cefr[(row.get('word') or '').strip().lower()] = (row.get('level') or '').strip()
    except OSError:
        pass
    try:
        with open(os.path.join(d, 'nawl.txt'), encoding='utf-8') as f:
            nawl = {ln.strip().lower() for ln in f if ln.strip() and not ln.startswith('#')}
    except OSError:
        pass
    return cefr, nawl


def tier_for_word(word):
    global _DATA
    if _DATA is None:
        _DATA = load_levels()
    return tier_for(word, *_DATA)
