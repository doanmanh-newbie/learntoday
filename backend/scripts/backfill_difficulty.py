"""Điền words.difficulty (bậc 1..4) cho mọi từ chưa xóa. Chạy lại nhiều lần cho cùng kết quả.

Chạy (trong backend/): python scripts/backfill_difficulty.py
"""
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.word_level import tier_for_word  # noqa: E402


def backfill(session, Word, batch=500):
    """Cập nhật theo lô, trả về Counter số từ theo bậc."""
    counts = Counter()
    n = 0
    for w in session.query(Word).filter(Word.deleted_at.is_(None)).all():
        t = tier_for_word(w.word)
        counts[t] += 1
        if w.difficulty != t:
            w.difficulty = t
            n += 1
            if n % batch == 0:
                session.commit()
    session.commit()
    return counts


if __name__ == '__main__':
    from app import create_app, db
    from app.models import Word
    with create_app().app_context():
        counts = backfill(db.session, Word)
    for t in sorted(counts):
        print(f'bậc {t}: {counts[t]}')
