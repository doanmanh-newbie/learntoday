# backend/seed.py
"""
Seed dữ liệu hệ thống - CHẠY ĐƯỢC NHIỀU LẦN (idempotent), an toàn cả khi DB đã có dữ liệu.

    python seed.py            # folder hệ thống + từ vựng (từ data/crawled + data/vi_overrides.json)
    python seed.py --admin    # thêm tài khoản admin (cần ADMIN_EMAIL + ADMIN_PASSWORD trong .env)

Khác bản cũ (seed_data.py + seed_from_crawl.py):
  * Một seeder duy nhất (trước đây 2 file tạo folder TRÙNG TÊN, bộ folder khác nhau).
  * Áp bản dịch tiếng Việt (data/vi_overrides.json). Dữ liệu crawl có meaning = định nghĩa tiếng Anh,
    từ đa nghĩa lấy nhầm nghĩa cổ (vd: "cloud" = "đá tảng", "physics" = "thuốc xổ").
  * Cập nhật cả từ ĐÃ tồn tại (bản cũ bỏ qua nên không bao giờ sửa được dữ liệu sai).
  * Tải trước dữ liệu để dùng ~6 truy vấn thay vì hàng trăm (DB ở xa -> mỗi truy vấn ~100ms).
  * 1 transaction: lỗi giữa chừng thì hoàn tác sạch, không để folder dở dang.
  * Tính lại folders.word_count theo số liên kết THẬT (bộ đếm cộng dồn từng bị lệch).
  * Không còn tài khoản admin mặc định admin@gmail.com / 123456.
"""
import argparse
import json
import os
import sys
import uuid
from pathlib import Path

from app import create_app, db
from app.models import Folder, FolderWord, User, Word
from app.utils.auth import hash_password

CRAWLED_DIR = Path(__file__).parent / 'data' / 'crawled'
OVERRIDES_FILE = Path(__file__).parent / 'data' / 'vi_overrides.json'

FOLDER_META = {
    'Công nghệ': {'icon': '💻', 'color': '#6366f1', 'description': 'Từ vựng công nghệ, lập trình, AI',
                  'image': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop'},
    'Du lịch': {'icon': '✈️', 'color': '#06b6d4', 'description': 'Từ vựng du lịch, khách sạn, giao thông',
                'image': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop'},
    'Kinh doanh': {'icon': '💼', 'color': '#8b5cf6', 'description': 'Từ vựng kinh doanh, marketing',
                   'image': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop'},
    'Khoa học': {'icon': '🔬', 'color': '#f59e0b', 'description': 'Từ vựng khoa học',
                 'image': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=400&fit=crop'},
    'Ẩm thực': {'icon': '🍜', 'color': '#10b981', 'description': 'Từ vựng ẩm thực',
                'image': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop'},
    'IELTS': {'icon': '📚', 'color': '#f43f5e', 'description': 'Từ vựng học thuật cho IELTS',
              'image': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop'},
}


def load_overrides():
    if not OVERRIDES_FILE.exists():
        return {}
    with open(OVERRIDES_FILE, encoding='utf-8') as f:
        return json.load(f)


def seed_words_and_folders(overrides=None, crawled_dir=CRAWLED_DIR):
    """Trả về dict thống kê. Gọi trong app context; tự commit/rollback."""
    overrides = load_overrides() if overrides is None else overrides
    stats = {'folders_created': 0, 'words_created': 0, 'words_updated': 0, 'links_created': 0, 'no_vi': []}

    # Tải trước: 3 truy vấn cho toàn bộ quá trình
    folders = {(f.name): f for f in Folder.query.filter_by(type='system', deleted_at=None).all()}
    words = {w.word.lower(): w for w in Word.query.filter(Word.deleted_at.is_(None)).all()}
    links = {(fw.folder_id, fw.word_id) for fw in FolderWord.query.all()}

    try:
        for json_file in sorted(Path(crawled_dir).glob('*.json')):
            with open(json_file, encoding='utf-8') as f:
                data = json.load(f)
            folder_name = data['folder']
            meta = FOLDER_META.get(folder_name, {})

            folder = folders.get(folder_name)
            if not folder:
                folder = Folder(
                    id=str(uuid.uuid4()), name=folder_name, type='system', word_count=0,
                    icon=meta.get('icon'), color=meta.get('color', '#6366f1'),
                    image=meta.get('image'), description=meta.get('description'),
                )
                db.session.add(folder)
                folders[folder_name] = folder
                stats['folders_created'] += 1
            else:                       # giữ meta (ảnh/màu/icon) luôn khớp file cấu hình
                for k in ('icon', 'color', 'image', 'description'):
                    if meta.get(k):
                        setattr(folder, k, meta[k])

            for i, wd in enumerate(data['words']):
                key = wd['word'].lower()
                ov = overrides.get(wd['word'], {})
                values = {
                    'pronunciation': wd.get('pronunciation') or None,
                    'word_type': ov.get('word_type') or wd.get('word_type'),
                    'meaning': ov.get('meaning') or wd.get('meaning', ''),
                    'meaning_en': wd.get('meaning_en') or None,
                    'example': ov.get('example') or wd.get('example') or None,
                    'example_meaning': ov.get('example_meaning') or wd.get('example_meaning') or None,
                    'audio_url': wd.get('audio_url') or None,
                }
                if not ov:
                    stats['no_vi'].append(wd['word'])

                word = words.get(key)
                if word is None:
                    word = Word(id=str(uuid.uuid4()), word=wd['word'], difficulty=1, category=folder_name, **values)
                    db.session.add(word)
                    words[key] = word
                    stats['words_created'] += 1
                else:
                    changed = False
                    for k, v in values.items():
                        if getattr(word, k) != v:
                            setattr(word, k, v)
                            changed = True
                    stats['words_updated'] += int(changed)

                db.session.flush()       # cần word.id / folder.id cho liên kết
                if (folder.id, word.id) not in links:
                    db.session.add(FolderWord(id=str(uuid.uuid4()), folder_id=folder.id, word_id=word.id, order_index=i))
                    links.add((folder.id, word.id))
                    stats['links_created'] += 1

        db.session.flush()
        # word_count = số liên kết thật
        counts = dict(db.session.query(FolderWord.folder_id, db.func.count(FolderWord.id)).group_by(FolderWord.folder_id).all())
        for folder in folders.values():
            folder.word_count = int(counts.get(folder.id, 0))
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return stats


def seed_admin():
    email = (os.environ.get('ADMIN_EMAIL') or '').strip().lower()
    password = os.environ.get('ADMIN_PASSWORD') or ''
    if not email or len(password) < 8:
        print('⚠️  Bỏ qua admin: đặt ADMIN_EMAIL và ADMIN_PASSWORD (>= 8 ký tự) trong .env rồi chạy lại với --admin.')
        return False
    user = User.query.filter(db.func.lower(User.email) == email).first()
    if user:
        if user.role != 'admin':
            user.role = 'admin'
            db.session.commit()
        print(f'ℹ️  Tài khoản {email} đã tồn tại (role={user.role}).')
        return True
    db.session.add(User(id=str(uuid.uuid4()), username=email.split('@')[0], email=email,
                        password_hash=hash_password(password), role='admin', daily_goal=10, review_limit=10))
    db.session.commit()
    print(f'✅ Đã tạo admin: {email}')
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(description='Seed dữ liệu Learn Today')
    parser.add_argument('--admin', action='store_true', help='tạo/nâng quyền tài khoản admin từ ADMIN_EMAIL/ADMIN_PASSWORD')
    args = parser.parse_args(argv)

    app = create_app()
    with app.app_context():
        print('🌱 Seed dữ liệu...')
        stats = seed_words_and_folders()
        print(f"✅ folder mới: {stats['folders_created']} | từ mới: {stats['words_created']} | "
              f"từ được cập nhật: {stats['words_updated']} | liên kết mới: {stats['links_created']}")
        if stats['no_vi']:
            print(f"⚠️  {len(stats['no_vi'])} từ chưa có bản dịch trong data/vi_overrides.json: {', '.join(stats['no_vi'][:10])}...")
        if args.admin:
            seed_admin()
        print('🎉 Xong!')


if __name__ == '__main__':
    sys.exit(main())
