"""
Gộp mọi bản dịch thành một file all_done.tsv theo đúng thứ tự dwyl_common_words.txt.

Chạy trong thư mục backend/:
    python data/translate_batches/merge_all.py

Nguồn: common_done.tsv, 10lo/lo_XX/* (khớp với part_NNN.txt theo NỘI DUNG, không theo tên file,
vì mỗi AI đặt tên khác nhau), nguoc/*.tsv. File 10lo/fixes_khong_ro.tsv ghi đè các dòng bị dịch "không rõ".
extra_done.tsv: từ không có trong danh sách gốc, được nối vào cuối file.
Script dừng và báo lỗi nếu thiếu từ, thừa từ, trùng từ hoặc loại từ lạ; chỉ ghi file khi mọi kiểm tra đều đạt.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LO_DIR = os.path.join(HERE, '10lo')
OUT = os.path.join(HERE, 'all_done.tsv')
ALLOWED = {'noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun', 'conjunction',
           'determiner', 'interjection', 'number', 'other'}
POS_ALIASES = {'adj': 'adjective', 'adv': 'adverb', 'interj': 'interjection', 'prep': 'preposition',
               'pron': 'pronoun', 'num': 'number', 'conj': 'conjunction', 'det': 'determiner'}
UNCLEAR = ('không rõ nghĩa', '$')    # "$ x": rác AI từng sinh ra thay cho nghĩa


def read_lines(path):
    with open(path, encoding='utf-8-sig', errors='strict') as f:
        return [l.rstrip('\r\n') for l in f if l.strip()]


def parse_tsv(path):
    """Trả list (word, pos, gloss). Dòng sai số cột -> ValueError kèm tên file và số dòng."""
    rows = []
    for i, line in enumerate(read_lines(path), 1):
        cols = line.split('\t')
        if len(cols) != 3:
            raise ValueError(f'{path}:{i}: cần 3 cột, có {len(cols)}')
        rows.append((cols[0].strip().lower(), cols[1].strip().lower(), ' '.join(cols[2].split())))
    return rows


def lo_rows(errors):
    """Với mỗi part_NNN.txt, tìm file dịch có danh sách từ trùng khớp hoàn toàn (theo thứ tự)."""
    out = []
    for lo in sorted(d for d in os.listdir(LO_DIR) if d.startswith('lo_')):
        d = os.path.join(LO_DIR, lo)
        candidates = {}
        for f in sorted(os.listdir(d)):
            p = os.path.join(d, f)
            if f.startswith('part_') or not os.path.isfile(p) or not f.lower().endswith('.tsv'):
                continue
            try:
                rows = parse_tsv(p)
            except (ValueError, UnicodeDecodeError) as e:
                errors.append(f'{lo}/{f}: {e}')
                continue
            candidates.setdefault(tuple(r[0] for r in rows), []).append((f, rows))
        for f in sorted(x for x in os.listdir(d) if x.startswith('part_') and x.endswith('.txt')):
            words = tuple(w.strip().lower() for w in read_lines(os.path.join(d, f)))
            found = candidates.get(words)
            if not found:
                errors.append(f'{lo}/{f}: không có file dịch nào khớp đủ {len(words)} từ')
                continue
            if len({tuple(r) for _, r in found}) > 1:
                errors.append(f'{lo}/{f}: nhiều bản dịch KHÁC nhau: {", ".join(n for n, _ in found)}')
                continue
            out.extend(found[0][1])
    return out


def main():
    errors = []
    master = []
    for line in read_lines(os.path.join(HERE, 'dwyl_common_words.txt')):
        master.append(line.split()[0].lower())
    if len(set(master)) != len(master):
        errors.append('dwyl_common_words.txt có từ trùng')

    rows = parse_tsv(os.path.join(HERE, 'common_done.tsv'))
    rows += lo_rows(errors)
    nguoc = os.path.join(HERE, 'nguoc')
    for f in sorted(os.listdir(nguoc)):
        if f.endswith('.tsv'):
            rows += parse_tsv(os.path.join(nguoc, f))

    by_word = {}
    for w, pos, gloss in rows:
        if w in by_word:
            errors.append(f'từ bị dịch 2 lần: {w}')
        by_word[w] = [pos, gloss]

    fixes = parse_tsv(os.path.join(LO_DIR, 'fixes_khong_ro.tsv'))
    for w, pos, gloss in fixes:
        if w not in by_word:
            errors.append(f'fixes_khong_ro.tsv: "{w}" không có trong bản dịch')
        by_word[w] = [pos, gloss]

    unclear, bad_pos, empty = [], [], []
    for w, entry in by_word.items():
        entry[0] = POS_ALIASES.get(entry[0], entry[0])
        if entry[0] not in ALLOWED:
            bad_pos.append(f'{w} ({entry[0]})')
        if not entry[1]:
            empty.append(w)
        if any(u in entry[1].lower() for u in UNCLEAR) and w != 'gabble':
            unclear.append(w)

    # Từ không có trong danh sách gốc (vd blog, website) được dịch riêng, nối vào cuối file.
    extra_path = os.path.join(HERE, 'extra_done.tsv')
    extras = parse_tsv(extra_path) if os.path.exists(extra_path) else []
    seen_extra = set()
    for w, pos, gloss in extras:
        pos = POS_ALIASES.get(pos, pos)
        if w in by_word or w in seen_extra:
            errors.append(f'extra_done.tsv: "{w}" bị trùng')
        if pos not in ALLOWED:
            bad_pos.append(f'{w} ({pos})')
        if not gloss:
            empty.append(w)
        seen_extra.add(w)

    missing = [w for w in master if w not in by_word]
    extra = sorted(set(by_word) - set(master))
    for label, items in (('thiếu bản dịch', missing), ('thừa (không có trong danh sách gốc)', extra),
                         ('loại từ lạ', bad_pos), ('nghĩa trống', empty), ('nghĩa rác hoặc "không rõ nghĩa"', unclear)):
        if items:
            errors.append(f'{label}: {len(items)} từ, ví dụ {", ".join(items[:10])}')

    if errors:
        print('KHÔNG ghi file vì còn lỗi:')
        for e in errors:
            print(' -', e)
        return 1

    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        for w in master:
            pos, gloss = by_word[w]
            f.write(f'{w}\t{pos}\t{gloss}\n')
        for w, pos, gloss in extras:
            f.write(f'{w}\t{POS_ALIASES.get(pos, pos)}\t{gloss}\n')
    print(f'Đã ghi {len(master) + len(extras)} dòng vào {OUT}')
    print(f'  nguồn: {len(rows)} dòng, ghi đè từ fixes: {len(fixes)}, từ bổ sung: {len(extras)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
