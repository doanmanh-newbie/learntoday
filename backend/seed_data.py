# seed_data.py
# Đặt file này ở thư mục gốc backend/ (ngang hàng với run.py)
# Chạy: python seed_data.py
#
# Script này tạo:
# - 1 user test (email: test@test.com / password: 123456)
# - 1 folder hệ thống "Gia đình"
# - 5 từ vựng mẫu, gắn vào folder trên
# Dùng để test nhanh STT 6 mà không cần tạo tay qua Postman.

from app import create_app, db
from app.models import User, Folder, Word, FolderWord
from app.utils.auth import hash_password
import uuid

app = create_app()

SAMPLE_WORDS = [
    {
        'word': 'family',
        'pronunciation': '/ˈfæməli/',
        'word_type': 'noun',
        'meaning': 'gia đình',
        'example': 'I love spending time with my family.',
        'example_meaning': 'Tôi thích dành thời gian với gia đình.'
    },
    {
        'word': 'father',
        'pronunciation': '/ˈfɑːðər/',
        'word_type': 'noun',
        'meaning': 'cha, bố',
        'example': 'My father works as a teacher.',
        'example_meaning': 'Bố tôi làm giáo viên.'
    },
    {
        'word': 'mother',
        'pronunciation': '/ˈmʌðər/',
        'word_type': 'noun',
        'meaning': 'mẹ',
        'example': 'My mother cooks dinner every night.',
        'example_meaning': 'Mẹ tôi nấu bữa tối mỗi đêm.'
    },
    {
        'word': 'sibling',
        'pronunciation': '/ˈsɪblɪŋ/',
        'word_type': 'noun',
        'meaning': 'anh chị em ruột',
        'example': 'I have two siblings.',
        'example_meaning': 'Tôi có hai anh chị em.'
    },
    {
        'word': 'grandparent',
        'pronunciation': '/ˈɡrænpeərənt/',
        'word_type': 'noun',
        'meaning': 'ông bà',
        'example': 'I visit my grandparents every weekend.',
        'example_meaning': 'Tôi thăm ông bà mỗi cuối tuần.'
    },
]


def seed():
    with app.app_context():
        # ===== 1. Tạo user test =====
        user = User.query.filter_by(email='test@test.com').first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                username='testuser',
                email='test@test.com',
                password_hash=hash_password('123456'),
                daily_goal=5
            )
            db.session.add(user)
            db.session.commit()
            print(f'✅ Tạo user test: test@test.com / 123456 (id={user.id})')
        else:
            print(f'ℹ️  User test đã tồn tại (id={user.id})')

        # ===== 2. Tạo folder hệ thống =====
        folder = Folder.query.filter_by(name='Gia đình', type='system').first()
        if not folder:
            folder = Folder(
                id=str(uuid.uuid4()),
                name='Gia đình',
                type='system',
                user_id=None
            )
            db.session.add(folder)
            db.session.commit()
            print(f'✅ Tạo folder: Gia đình (id={folder.id})')
        else:
            print(f'ℹ️  Folder "Gia đình" đã tồn tại (id={folder.id})')

        # ===== 3. Tạo từ vựng + gắn vào folder =====
        order_index = 0
        for w in SAMPLE_WORDS:
            word = Word.query.filter_by(word=w['word'], deleted_at=None).first()
            if not word:
                word = Word(
                    id=str(uuid.uuid4()),
                    word=w['word'],
                    pronunciation=w['pronunciation'],
                    word_type=w['word_type'],
                    meaning=w['meaning'],
                    example=w['example'],
                    example_meaning=w['example_meaning']
                )
                db.session.add(word)
                db.session.commit()
                print(f'  ✅ Tạo từ: {w["word"]} (id={word.id})')
            else:
                print(f'  ℹ️  Từ "{w["word"]}" đã tồn tại (id={word.id})')

            link = FolderWord.query.filter_by(folder_id=folder.id, word_id=word.id).first()
            if not link:
                link = FolderWord(
                    id=str(uuid.uuid4()),
                    folder_id=folder.id,
                    word_id=word.id,
                    order_index=order_index
                )
                db.session.add(link)
                db.session.commit()
                print(f'    ✅ Gắn "{w["word"]}" vào folder "Gia đình"')

            order_index += 1

        # Cập nhật word_count cho folder
        folder.word_count = FolderWord.query.filter_by(folder_id=folder.id).count()
        db.session.commit()

        print('\n🎉 Seed xong! Dùng thông tin sau để test:')
        print(f'   Email: test@test.com | Password: 123456')
        print(f'   Folder ID: {folder.id}')


if __name__ == '__main__':
    seed()