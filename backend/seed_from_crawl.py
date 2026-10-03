# backend/seed_from_crawl.py
"""Import data đã crawl vào database."""

import json
from pathlib import Path
from app import create_app, db
from app.models import Folder, Word, FolderWord
import uuid

app = create_app()
CRAWLED_DIR = Path(__file__).parent / 'data' / 'crawled'

# Ảnh + màu + icon cho từng folder
FOLDER_META = {
    'Công nghệ': {
        'icon': '💻', 'color': '#6366f1',
        'image': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
        'description': 'Từ vựng công nghệ, lập trình, AI',
    },
    'Du lịch': {
        'icon': '✈️', 'color': '#06b6d4',
        'image': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop',
        'description': 'Từ vựng du lịch, khách sạn, giao thông',
    },
    'Kinh doanh': {
        'icon': '💼', 'color': '#8b5cf6',
        'image': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
        'description': 'Từ vựng kinh doanh, marketing',
    },
    'Khoa học': {
        'icon': '🔬', 'color': '#f59e0b',
        'image': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=400&fit=crop',
        'description': 'Từ vựng khoa học',
    },
    'Ẩm thực': {
        'icon': '🍜', 'color': '#10b981',
        'image': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
        'description': 'Từ vựng ẩm thực',
    },
    'IELTS': {
        'icon': '📚', 'color': '#f43f5e',
        'image': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
        'description': 'Từ vựng học thuật cho IELTS',
    },
}


def seed():
    with app.app_context():
        print('🌱 Import từ data đã crawl...\n')

        for json_file in sorted(CRAWLED_DIR.glob('*.json')):
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            folder_name = data['folder']
            words = data['words']
            meta = FOLDER_META.get(folder_name, {})

            # Tạo/cập nhật folder
            folder = Folder.query.filter_by(name=folder_name, type='system').first()
            if not folder:
                folder = Folder(
                    id=str(uuid.uuid4()),
                    name=folder_name,
                    type='system',
                    icon=meta.get('icon'),
                    color=meta.get('color', '#6366f1'),
                    image=meta.get('image'),
                    description=meta.get('description'),
                    word_count=0,
                )
                db.session.add(folder)
                db.session.commit()
                print(f'✅ Tạo folder: {folder_name}')

            # Import words
            added = 0
            for i, wd in enumerate(words):
                existing = Word.query.filter_by(word=wd['word'], deleted_at=None).first()
                if existing:
                    word = existing
                else:
                    word = Word(
                        id=str(uuid.uuid4()),
                        word=wd['word'],
                        pronunciation=wd.get('pronunciation'),
                        word_type=wd.get('word_type'),
                        meaning=wd.get('meaning', ''),
                        example=wd.get('example'),
                        example_meaning=wd.get('example_meaning'),
                        audio_url=wd.get('audio_url'),
                        difficulty=1,
                        category=folder_name,
                    )
                    db.session.add(word)
                    db.session.flush()
                    added += 1

                link = FolderWord.query.filter_by(folder_id=folder.id, word_id=word.id).first()
                if not link:
                    db.session.add(FolderWord(
                        id=str(uuid.uuid4()),
                        folder_id=folder.id,
                        word_id=word.id,
                        order_index=i,
                    ))
                    folder.word_count = (folder.word_count or 0) + 1

            db.session.commit()
            print(f'  ✅ {added} từ mới vào "{folder_name}"')

        print('\n🎉 Import xong!')


if __name__ == '__main__':
    seed()