"""
Nạp từ điển Anh-Việt (file .mobi) vào bảng `lexicon_entries`.

Chạy trong thư mục backend/, đã kích hoạt venv, đã `flask db upgrade`:

    # 1) Xem thử, KHÔNG ghi database (in thống kê + vài mục mẫu, tùy chọn xuất file để soát lỗi)
    python scripts/import_dict.py data/eng-viet-dict.mobi --dry-run
    python scripts/import_dict.py data/eng-viet-dict.mobi --dry-run --export out/lexicon.jsonl

    # 2) Nạp thật (bảng phải đang trống; nạp lại từ đầu thì thêm --replace)
    python scripts/import_dict.py data/eng-viet-dict.mobi
    python scripts/import_dict.py data/eng-viet-dict.mobi --replace

    # 3) Tạo các folder chủ đề (Gia đình, Trường học, Du lịch...) từ danh sách từ có sẵn trong data/wordlists/.
    #    Kiểm tra trước (không cần database): từ nào thiếu trong từ điển / thiếu nghĩa
    python scripts/import_dict.py data/eng-viet-dict.mobi --check-lists data/wordlists
    python scripts/import_dict.py --skip-import --topics data/wordlists

    # 4) Tùy chọn: gắn thứ hạng tần suất từ một danh sách từ (mỗi dòng 1 từ, từ phổ biến nhất ở trên cùng)
    #    rồi tạo folder hệ thống từ N từ đầu. Danh sách này KHÔNG kèm sẵn: tự tìm bản có giấy phép phù hợp.
    python scripts/import_dict.py --skip-import --freq data/freq.txt --make-folder "3000 từ thông dụng" --top 3000

Mọi bước chạy lại được nhiều lần (không tạo trùng từ/folder). File danh sách từ: dòng `# name:`, `# icon:`, `# color:`,
`# description:` là thông tin folder; các dòng còn lại là các từ.
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import dict_import  # noqa: E402
from app.utils.mobi_reader import MobiError, mobi_to_html  # noqa: E402

CHUNK = 1000


def load_html(path):
    if path.lower().endswith(('.html', '.htm', '.txt')):
        with open(path, encoding='utf-8', errors='replace') as f:
            return f.read()
    return mobi_to_html(path)


def load_freq(path):
    """Danh sách tần suất: mỗi dòng 1 từ (lấy token đầu của dòng, bỏ dòng trống/ghi chú '#'). Trả {từ: hạng}."""
    ranks = {}
    with open(path, encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            word = line.split()[0].split(',')[0].split('\t')[0].lower()
            if word.isalpha() and word not in ranks:
                ranks[word] = len(ranks) + 1
    return ranks


def print_stats(records, stats):
    with_senses = sum(1 for r in records if r['pos_list'])
    domain_only = sum(1 for r in records if not r['pos_list'] and r['has_domain'])
    see_only = sum(1 for r in records if not r['pos_list'] and not r['has_domain'] and r['see_also'])
    total_mb = sum(len(r['data']) for r in records) / 1e6
    print(f"Đoạn trong file: {stats['paragraphs']} | mục hợp lệ: {stats['entries']} | gộp trùng: {stats['duplicates_merged']} "
          f"| bỏ (rỗng): {stats['empty']}")
    print(f"=> {len(records)} từ: {with_senses} có nghĩa thường, {domain_only} chỉ có nghĩa chuyên ngành, "
          f"{see_only} chỉ trỏ sang từ khác | có phiên âm {sum(1 for r in records if r['ipa'])} "
          f"| có ví dụ {sum(1 for r in records if r['example_en'])} | JSON ~{total_mb:.1f} MB")


def do_import(args):
    t0 = time.time()
    try:
        html = load_html(args.path)
    except (OSError, MobiError) as e:
        print(f'Không đọc được file: {e}')
        return 2
    records, stats = dict_import.build_all(html, limit=args.limit)
    print_stats(records, stats)
    print(f'(giải mã + tách mất {time.time() - t0:.1f}s)')

    if args.export:
        os.makedirs(os.path.dirname(os.path.abspath(args.export)), exist_ok=True)
        with open(args.export, 'w', encoding='utf-8') as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + '\n')
        print(f'Đã xuất {len(records)} dòng ra {args.export}')
    if args.dry_run:
        for r in records[:3]:
            print('  mẫu:', r['word'], r['ipa'], r['pos_list'], '|', r['main_meaning'][:70])
        print('--dry-run: chưa ghi gì vào database.')
        return 0

    from app import create_app, db
    from app.models import LexiconEntry
    from sqlalchemy import inspect

    app = create_app()
    with app.app_context():
        if not inspect(db.engine).has_table('lexicon_entries'):
            print('Chưa có bảng lexicon_entries. Chạy trước:  flask db upgrade')
            return 2
        existing = LexiconEntry.query.count()
        if existing and not args.replace:
            print(f'Bảng đang có {existing} từ. Thêm --replace nếu muốn xóa và nạp lại từ đầu.')
            return 1
        if existing:
            LexiconEntry.query.delete()
            db.session.commit()
        done = 0
        for i in range(0, len(records), CHUNK):
            chunk = records[i:i + CHUNK]
            db.session.bulk_insert_mappings(LexiconEntry, chunk)
            db.session.commit()
            done += len(chunk)
            print(f'  đã nạp {done}/{len(records)}', end='\r', flush=True)
        print(f'\nĐã nạp {done} từ vào lexicon_entries.')
    return 0


def apply_ranks(db, ranks):
    from sqlalchemy import text
    words = list(ranks.items())
    sql = text('UPDATE lexicon_entries SET freq_rank = :r WHERE word = :w')
    for i in range(0, len(words), CHUNK):
        db.session.execute(sql, [{'w': w, 'r': r} for w, r in words[i:i + CHUNK]])
        db.session.commit()
    matched = db.session.execute(text('SELECT COUNT(*) FROM lexicon_entries WHERE freq_rank IS NOT NULL')).scalar()
    print(f'Đã gắn thứ hạng tần suất cho {matched}/{len(words)} từ trong danh sách.')


DEFAULT_OVERRIDES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'card_overrides.json')


def load_overrides(path):
    """Nghĩa flashcard viết tay (xem data/card_overrides.json). Thiếu file thì không ghi đè; file sai cấu trúc thì dừng và báo rõ."""
    if not path or not os.path.exists(path):
        return {}
    try:
        with open(path, encoding='utf-8') as f:
            return dict_import.parse_overrides(f.read())
    except ValueError as e:
        raise SystemExit(f'{path}: {e}')


def build_folder(db, name, words, meta=None, overrides=None):
    """Tạo/cập nhật folder hệ thống `name` từ danh sách từ (giữ thứ tự). Nghĩa lấy từ từ điển tích hợp.
    Chạy lại được: không tạo trùng từ/folder; từ thiếu nghĩa hoặc không có trong từ điển được báo lại, không dừng cả danh sách."""
    import uuid

    from app.models import Folder, FolderWord, Word
    from app.services.lexicon_service import lexicon_entry

    meta = meta or {}
    overrides = overrides or {}
    folder = Folder.query.filter_by(name=name, type='system', deleted_at=None).first()
    if folder is None:
        folder = Folder(id=str(uuid.uuid4()), name=name, type='system', word_count=0, icon=meta.get('icon', '📚'),
                        color=meta.get('color', '#14b8a6'), description=meta.get('description'))
        db.session.add(folder)
        db.session.flush()
    else:
        for field in ('icon', 'color', 'description'):
            if meta.get(field):
                setattr(folder, field, meta[field])

    in_folder = {wid for (wid,) in db.session.query(FolderWord.word_id).filter_by(folder_id=folder.id)}
    next_index = db.session.query(db.func.coalesce(db.func.max(FolderWord.order_index) + 1, 0)).filter(
        FolderWord.folder_id == folder.id).scalar()
    added, missing, no_meaning, seen = 0, [], [], set()
    for requested in words:
        entry = lexicon_entry(requested)
        override = overrides.get(requested) or (overrides.get(entry['word']) if entry else None)
        if entry is None and override is None:
            missing.append(requested)
            continue
        if entry is None:                               # từ không có trong từ điển nhưng có nghĩa viết tay
            entry = {'word': requested, 'phonetic': None, 'meanings': []}
        card = dict_import.apply_override(dict_import.card_for(entry), override)
        if not card or not card['meaning_vi']:
            no_meaning.append(requested)
            continue
        if entry['word'] in seen:                       # "went" và "go" cùng trỏ về "go": chỉ thêm một lần
            continue
        seen.add(entry['word'])
        word = Word.query.filter(db.func.lower(Word.word) == entry['word'], Word.deleted_at.is_(None)).first()
        if word is None:
            word = Word(id=str(uuid.uuid4()), word=entry['word'], pronunciation=(entry.get('phonetic') or None),
                        word_type=card['pos'][:30], meaning=card['meaning_vi'], example=card['example'],
                        example_meaning=card['example_vi'], difficulty=1, category='Từ điển')
            db.session.add(word)
            db.session.flush()
        if word.id in in_folder:
            continue
        db.session.add(FolderWord(id=str(uuid.uuid4()), folder_id=folder.id, word_id=word.id, order_index=next_index))
        in_folder.add(word.id)
        next_index += 1
        added += 1
        if added % 500 == 0:
            db.session.commit()
    folder.word_count = len(in_folder)
    db.session.commit()
    sort_folder(db, folder)                              # từ phổ biến học trước
    print(f'Folder "{name}": thêm {added} từ mới, tổng {folder.word_count} từ.'
          + (f' Không có trong từ điển: {", ".join(missing)}.' if missing else '')
          + (f' Thiếu nghĩa tiếng Việt: {", ".join(no_meaning)}.' if no_meaning else ''))
    return added


def sort_folder(db, folder):
    """Xếp lại thứ tự từ trong folder: từ phổ biến học trước (order_index quyết định thứ tự "Học từ mới")."""
    from app.models import FolderWord, LexiconEntry, Word
    from app.utils.word_rank import popularity_key, builtin_ranks

    rows = (db.session.query(FolderWord, Word.word).join(Word, Word.id == FolderWord.word_id)
            .filter(FolderWord.folder_id == folder.id).all())
    ranks = builtin_ranks()
    freq = {e.word: e.freq_rank for e in LexiconEntry.query.filter(
        LexiconEntry.word.in_([w.lower() for _, w in rows]), LexiconEntry.freq_rank.isnot(None)).all()} if rows else {}
    ordered = sorted(rows, key=lambda r: popularity_key(r[1], freq.get(r[1].lower()), ranks))
    for i, (fw, _) in enumerate(ordered):
        fw.order_index = i
    db.session.commit()
    return len(ordered)


def sort_all_folders(db):
    from app.models import Folder
    for folder in Folder.query.filter_by(type='system', deleted_at=None).all():
        n = sort_folder(db, folder)
        print(f'Folder "{folder.name}": đã xếp lại {n} từ theo mức độ phổ biến.')
    return 0


def make_folder(db, name, top, overrides=None):
    """Folder từ N từ đầu của danh sách tần suất (--freq)."""
    from app.models import LexiconEntry

    rows = (LexiconEntry.query.filter(LexiconEntry.freq_rank.isnot(None), LexiconEntry.pos_list != '')
            .order_by(LexiconEntry.freq_rank).limit(top).all())
    if not rows:
        print('Chưa từ nào có thứ hạng tần suất (cần --freq) nên không tạo folder.')
        return 1
    build_folder(db, name, [r.word for r in rows], {'description': f'{len(rows)} từ thông dụng nhất, nghĩa lấy từ từ điển Anh-Việt tích hợp.'}, overrides)
    return 0


def topic_files(directory):
    if not os.path.isdir(directory):
        raise SystemExit(f'Không thấy thư mục danh sách từ: {directory}')
    return sorted(os.path.join(directory, f) for f in os.listdir(directory) if f.endswith('.txt'))


def make_topic_folders(db, directory, overrides=None):
    """Tạo folder hệ thống từ MỌI file .txt trong thư mục (xem data/wordlists/)."""
    for path in topic_files(directory):
        with open(path, encoding='utf-8') as f:
            meta, words = dict_import.parse_wordlist(f.read())
        if not meta.get('name'):
            print(f'Bỏ qua {os.path.basename(path)}: thiếu dòng "# name: ..."')
            continue
        build_folder(db, meta['name'], words, meta, overrides)
    return 0


def check_lists(directory, by_word, overrides=None):
    """Kiểm tra OFFLINE (không cần database): mỗi từ trong danh sách có trong từ điển và có nghĩa dùng được làm flashcard không."""
    problems = 0
    overrides = overrides or {}
    for path in topic_files(directory):
        with open(path, encoding='utf-8') as f:
            meta, words = dict_import.parse_wordlist(f.read())
        ok, resolved, no_meaning, missing = 0, [], [], []
        for w in words:
            if w in overrides:                            # nghĩa viết tay: dùng được dù từ điển thiếu/hỏng
                ok += 1
                continue
            rec = by_word.get(w)
            if rec is not None and dict_import.is_redirect(rec):
                rec = by_word.get(rec['see_also'])
            if rec is None:
                rec = next((by_word[c] for c in dict_import.lemma_candidates(w) if c in by_word), None)
                if rec is not None:
                    resolved.append(w)
            if rec is None:
                missing.append(w)
            elif not rec['pos_list'] or not rec['main_meaning']:
                no_meaning.append(w)
            else:
                ok += 1
        problems += len(missing) + len(no_meaning)
        print(f"{os.path.basename(path):18} {meta.get('name', '?'):28} {len(words):4} từ | dùng được {ok:4}"
              + (f" | thiếu: {' '.join(missing)}" if missing else '')
              + (f" | không có nghĩa: {' '.join(no_meaning)}" if no_meaning else ''))
    print('Tất cả từ đều dùng được.' if not problems else f'{problems} từ cần xem lại (sửa danh sách rồi chạy lại).')
    return 1 if problems else 0


def main():
    ap = argparse.ArgumentParser(description='Nạp từ điển Anh-Việt (.mobi) vào database.')
    ap.add_argument('path', nargs='?', help='file .mobi (hoặc .html đã giải mã); bỏ trống khi dùng --skip-import')
    ap.add_argument('--dry-run', action='store_true', help='chỉ phân tích và in thống kê, không ghi database')
    ap.add_argument('--export', help='ghi các bản ghi ra file .jsonl để soát lỗi bằng mắt')
    ap.add_argument('--replace', action='store_true', help='xóa dữ liệu cũ trong lexicon_entries rồi nạp lại')
    ap.add_argument('--limit', type=int, help='chỉ xử lý N từ đầu (để thử nhanh)')
    ap.add_argument('--skip-import', action='store_true', help='không nạp từ điển (chỉ gắn --freq / tạo --make-folder)')
    ap.add_argument('--freq', help='file danh sách từ theo tần suất (mỗi dòng 1 từ, phổ biến nhất ở trên)')
    ap.add_argument('--make-folder', metavar='TÊN', help='tạo folder hệ thống từ các từ có thứ hạng tần suất (cần --freq)')
    ap.add_argument('--top', type=int, default=3000, help='số từ cho --make-folder (mặc định 3000)')
    ap.add_argument('--overrides', metavar='FILE', default=DEFAULT_OVERRIDES,
                    help='file nghĩa flashcard viết tay (mặc định data/card_overrides.json)')
    ap.add_argument('--topics', metavar='THƯ_MỤC', help='tạo folder hệ thống từ mọi file .txt trong thư mục (vd data/wordlists)')
    ap.add_argument('--sort-folders', action='store_true', help='xếp lại thứ tự từ trong MỌI folder hệ thống theo mức độ phổ biến')
    ap.add_argument('--check-lists', metavar='THƯ_MỤC', help='kiểm tra offline các danh sách từ với từ điển (cần file .mobi, không ghi database)')
    args = ap.parse_args()

    if args.check_lists:
        if not args.path:
            ap.error('--check-lists cần đường dẫn file .mobi')
        try:
            records, _ = dict_import.build_all(load_html(args.path))
        except (OSError, MobiError) as e:
            print(f'Không đọc được file: {e}')
            return 2
        return check_lists(args.check_lists, {r['word']: r for r in records}, load_overrides(args.overrides))

    if not args.skip_import:
        if not args.path:
            ap.error('thiếu đường dẫn file .mobi (hoặc dùng --skip-import)')
        code = do_import(args)
        if code or args.dry_run:
            return code
    if args.freq or args.make_folder or args.topics or args.sort_folders:
        from app import create_app, db
        app = create_app()
        with app.app_context():
            if args.freq:
                apply_ranks(db, load_freq(args.freq))
            overrides = load_overrides(args.overrides)
            if args.topics:
                make_topic_folders(db, args.topics, overrides)
            if args.sort_folders:
                sort_all_folders(db)
            if args.make_folder:
                return make_folder(db, args.make_folder, args.top, overrides)
    return 0


if __name__ == '__main__':
    sys.exit(main())
