"""Sắp xếp từ theo mức độ phổ biến (từ dễ/thường gặp học trước).

Thứ tự ưu tiên của `popularity_key`:
  0. thứ hạng tần suất thật (lexicon_entries.freq_rank, nạp bằng `import_dict.py --freq`)
  1. thứ hạng trong data/common_words.txt (danh sách gần đúng viết tay)
  2. còn lại: từ ngắn đứng trước (từ ngắn thường phổ biến hơn), rồi theo bảng chữ cái
"""
import os

_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data', 'common_words.txt')
_BUILTIN = None


def builtin_ranks(path=_PATH):
    global _BUILTIN
    if _BUILTIN is None or path != _PATH:
        ranks = {}
        try:
            with open(path, encoding='utf-8') as f:
                for line in f:
                    if line.startswith('#'):
                        continue
                    for w in line.lower().split():
                        ranks.setdefault(w, len(ranks) + 1)
        except OSError:
            ranks = {}
        if path != _PATH:
            return ranks
        _BUILTIN = ranks
    return _BUILTIN


def popularity_key(word, freq_rank=None, ranks=None):
    w = str(word or '').strip().lower()
    if freq_rank:
        return (0, int(freq_rank), w)
    r = (ranks if ranks is not None else builtin_ranks()).get(w)
    if r:
        return (1, r, w)
    return (2, len(w), w)


def sort_by_popularity(items, key_word=lambda x: x, key_rank=lambda x: None):
    ranks = builtin_ranks()
    return sorted(items, key=lambda it: popularity_key(key_word(it), key_rank(it), ranks))
