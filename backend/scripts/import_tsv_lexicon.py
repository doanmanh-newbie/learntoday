"""
Nạp bản dịch dạng bảng (mặc định data/translate_batches/all_done.tsv: từ<TAB>loại từ<TAB>nghĩa) vào `lexicon_entries`.

Chạy trong thư mục backend/, đã kích hoạt venv, đã `flask db upgrade`:

    python scripts/import_tsv_lexicon.py --dry-run     # chỉ kiểm tra file + đếm, KHÔNG ghi database
    python scripts/import_tsv_lexicon.py               # nạp thật

Chỉ THÊM từ chưa có trong bảng, nên chạy lại bao nhiêu lần cũng không tạo trùng; từ đã có (vd nạp từ .mobi bằng
scripts/import_dict.py) giữ nguyên. Thứ tự dòng trong file là thứ hạng phổ biến (freq_rank): dòng 1 phổ biến nhất.
Lưu ý: scripts/import_dict.py chỉ chạy khi bảng trống (hoặc --replace, xóa cả dữ liệu nạp từ file này).
"""
import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import dict_import  # noqa: E402

CHUNK = 1000
DEFAULT_TSV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'translate_batches', 'all_done.tsv')


def load_records(path, ranked):
    with open(path, encoding='utf-8-sig') as f:
        rows = dict_import.parse_gloss_tsv(f.read())
    seen, records = set(), []
    for i, (word, pos, gloss) in enumerate(rows, 1):
        if word in seen:
            raise ValueError(f'từ bị lặp trong file: {word}')
        seen.add(word)
        records.append(dict_import.record_from_gloss(word, pos, gloss, rank=i if i <= ranked else None))
    return records


def main():
    ap = argparse.ArgumentParser(description='Nạp bản dịch .tsv vào lexicon_entries (chỉ thêm từ chưa có).')
    ap.add_argument('path', nargs='?', default=DEFAULT_TSV, help='file .tsv (mặc định all_done.tsv)')
    ap.add_argument('--dry-run', action='store_true', help='chỉ kiểm tra và đếm, không ghi database')
    ap.add_argument('--ranked', type=int, default=96276,
                    help='số dòng đầu có thứ hạng tần suất (mặc định 96276 = dwyl_common_words.txt; các dòng sau là từ bổ sung)')
    args = ap.parse_args()

    try:
        records = load_records(args.path, args.ranked)
    except (OSError, ValueError) as e:
        print(f'File lỗi: {e}')
        return 2
    no_card = [r['word'] for r in records if not dict_import.card_for(dict_import.to_api_entry(r))]
    print(f'{len(records)} từ hợp lệ trong {os.path.basename(args.path)} | {len(no_card)} từ có nghĩa quá ngắn để làm '
          f'flashcard (vẫn tra được), ví dụ: {", ".join(no_card[:8])}')

    from sqlalchemy import inspect

    from app import create_app, db
    from app.models import LexiconEntry

    app = create_app()
    with app.app_context():
        if not inspect(db.engine).has_table('lexicon_entries'):
            print('Chưa có bảng lexicon_entries. Chạy trước:  flask db upgrade')
            return 2
        existing = {w for (w,) in db.session.query(LexiconEntry.word)}
        todo = [r for r in records if r['word'] not in existing]
        print(f'Database đang có {len(existing)} từ | sẽ thêm {len(todo)} | bỏ qua (đã có) {len(records) - len(todo)}')
        if args.dry_run:
            for r in todo[:3]:
                print('  mẫu:', r['word'], r['pos_list'], r['freq_rank'], '|', r['main_meaning'])
            print('--dry-run: chưa ghi gì vào database.')
            return 0
        t0, done = time.time(), 0
        for i in range(0, len(todo), CHUNK):
            db.session.bulk_insert_mappings(LexiconEntry, todo[i:i + CHUNK])
            db.session.commit()
            done += len(todo[i:i + CHUNK])
            print(f'  đã nạp {done}/{len(todo)}', end='\r', flush=True)
        total = LexiconEntry.query.count()
        print(f'\nĐã nạp {done} từ trong {time.time() - t0:.0f}s. Bảng lexicon_entries hiện có {total} từ.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
