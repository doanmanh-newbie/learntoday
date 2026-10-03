# seed_data.py
# Seed data: 6 folders system + 10 từ mỗi folder + ảnh riêng

from app import create_app, db
from app.models import User, Folder, Word, FolderWord
from app.utils.auth import hash_password
import uuid

app = create_app()

# ── FOLDERS với ảnh riêng ──────────────────────────────────────────────
FOLDERS = [
    {
        'name': 'Công nghệ', 'icon': '💻', 'color': '#6366f1',
        'image': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop&auto=format',
        'description': 'Từ vựng công nghệ, lập trình, AI',
    },
    {
        'name': 'Du lịch', 'icon': '✈️', 'color': '#06b6d4',
        'image': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop&auto=format',
        'description': 'Từ vựng du lịch, khách sạn, giao thông',
    },
    {
        'name': 'Kinh doanh', 'icon': '💼', 'color': '#8b5cf6',
        'image': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&auto=format',
        'description': 'Từ vựng kinh doanh, marketing, đàm phán',
    },
    {
        'name': 'Khoa học', 'icon': '🔬', 'color': '#f59e0b',
        'image': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&h=400&fit=crop&auto=format',
        'description': 'Từ vựng khoa học, nghiên cứu',
    },
    {
        'name': 'Ẩm thực', 'icon': '🍜', 'color': '#10b981',
        'image': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&auto=format',
        'description': 'Từ vựng ẩm thực, nấu ăn',
    },
    {
        'name': 'IELTS', 'icon': '📚', 'color': '#f43f5e',
        'image': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop&auto=format',
        'description': 'Từ vựng học thuật cho IELTS',
    },
]

# ── WORDS: 10 từ/folder ─────────────────────────────────────────────────
WORDS_BY_FOLDER = {
    'Công nghệ': [
        {'word': 'algorithm', 'pronunciation': '/ˈælɡərɪðəm/', 'word_type': 'n', 'meaning': 'thuật toán',
         'example': 'The ___ sorts data efficiently.', 'example_meaning': 'Thuật toán sắp xếp dữ liệu hiệu quả.'},
        {'word': 'database', 'pronunciation': '/ˈdeɪtəbeɪs/', 'word_type': 'n', 'meaning': 'cơ sở dữ liệu',
         'example': 'The ___ stores millions of records.', 'example_meaning': 'Cơ sở dữ liệu lưu hàng triệu bản ghi.'},
        {'word': 'interface', 'pronunciation': '/ˈɪntərfeɪs/', 'word_type': 'n', 'meaning': 'giao diện',
         'example': 'The user ___ is intuitive.', 'example_meaning': 'Giao diện người dùng rất trực quan.'},
        {'word': 'innovative', 'pronunciation': '/ˈɪnəveɪtɪv/', 'word_type': 'adj', 'meaning': 'sáng tạo, đổi mới',
         'example': 'They developed an ___ solution.', 'example_meaning': 'Họ phát triển một giải pháp sáng tạo.'},
        {'word': 'encryption', 'pronunciation': '/ɪnˈkrɪpʃn/', 'word_type': 'n', 'meaning': 'mã hóa',
         'example': '___ protects sensitive data.', 'example_meaning': 'Mã hóa bảo vệ dữ liệu nhạy cảm.'},
        {'word': 'network', 'pronunciation': '/ˈnetwɜːrk/', 'word_type': 'n', 'meaning': 'mạng lưới',
         'example': 'The ___ connects millions of devices.', 'example_meaning': 'Mạng lưới kết nối hàng triệu thiết bị.'},
        {'word': 'software', 'pronunciation': '/ˈsɔːftwer/', 'word_type': 'n', 'meaning': 'phần mềm',
         'example': 'The ___ needs an update.', 'example_meaning': 'Phần mềm cần cập nhật.'},
        {'word': 'hardware', 'pronunciation': '/ˈhɑːrdwer/', 'word_type': 'n', 'meaning': 'phần cứng',
         'example': 'The ___ is outdated.', 'example_meaning': 'Phần cứng đã lỗi thời.'},
        {'word': 'cloud', 'pronunciation': '/klaʊd/', 'word_type': 'n', 'meaning': 'đám mây (điện toán)',
         'example': 'We store data on the ___.', 'example_meaning': 'Chúng tôi lưu dữ liệu trên đám mây.'},
        {'word': 'artificial', 'pronunciation': '/ˌɑːrtɪˈfɪʃl/', 'word_type': 'adj', 'meaning': 'nhân tạo',
         'example': '___ intelligence is transforming industries.', 'example_meaning': 'Trí tuệ nhân tạo đang thay đổi các ngành công nghiệp.'},
    ],
    'Du lịch': [
        {'word': 'itinerary', 'pronunciation': '/aɪˈtɪnəreri/', 'word_type': 'n', 'meaning': 'lịch trình',
         'example': 'We planned a detailed ___.', 'example_meaning': 'Chúng tôi lên kế hoạch lịch trình chi tiết.'},
        {'word': 'destination', 'pronunciation': '/ˌdestɪˈneɪʃn/', 'word_type': 'n', 'meaning': 'điểm đến',
         'example': 'Paris is a popular tourist ___.', 'example_meaning': 'Paris là điểm đến du lịch phổ biến.'},
        {'word': 'accommodation', 'pronunciation': '/əˌkɒməˈdeɪʃn/', 'word_type': 'n', 'meaning': 'chỗ ở',
         'example': 'We booked ___ near the beach.', 'example_meaning': 'Chúng tôi đặt chỗ ở gần bãi biển.'},
        {'word': 'excursion', 'pronunciation': '/ɪkˈskɜːrʒn/', 'word_type': 'n', 'meaning': 'chuyến du ngoạn',
         'example': 'We went on an ___ to the mountains.', 'example_meaning': 'Chúng tôi đi du ngoạn lên núi.'},
        {'word': 'passport', 'pronunciation': '/ˈpæspɔːrt/', 'word_type': 'n', 'meaning': 'hộ chiếu',
         'example': "Don't forget your ___!", 'example_meaning': 'Đừng quên hộ chiếu!'},
        {'word': 'souvenir', 'pronunciation': '/ˌsuːvəˈnɪər/', 'word_type': 'n', 'meaning': 'đồ lưu niệm',
         'example': 'She bought a ___ for her mom.', 'example_meaning': 'Cô ấy mua đồ lưu niệm cho mẹ.'},
        {'word': 'departure', 'pronunciation': '/dɪˈpɑːrtʃər/', 'word_type': 'n', 'meaning': 'sự khởi hành',
         'example': 'The ___ time is 8 AM.', 'example_meaning': 'Giờ khởi hành là 8 giờ sáng.'},
        {'word': 'arrival', 'pronunciation': '/əˈraɪvl/', 'word_type': 'n', 'meaning': 'sự đến',
         'example': 'Our ___ was delayed.', 'example_meaning': 'Chuyến đến của chúng tôi bị hoãn.'},
        {'word': 'sightseeing', 'pronunciation': '/ˈsaɪtsiːɪŋ/', 'word_type': 'n', 'meaning': 'tham quan',
         'example': 'We spent the day ___.', 'example_meaning': 'Chúng tôi dành cả ngày để tham quan.'},
        {'word': 'luggage', 'pronunciation': '/ˈlʌɡɪdʒ/', 'word_type': 'n', 'meaning': 'hành lý',
         'example': 'Please keep your ___ with you.', 'example_meaning': 'Vui lòng giữ hành lý bên mình.'},
    ],
    'Kinh doanh': [
        {'word': 'deadline', 'pronunciation': '/ˈdedlaɪn/', 'word_type': 'n', 'meaning': 'thời hạn chót',
         'example': 'We must meet the ___.', 'example_meaning': 'Chúng ta phải kịp thời hạn.'},
        {'word': 'negotiate', 'pronunciation': '/nɪˈɡoʊʃieɪt/', 'word_type': 'v', 'meaning': 'đàm phán',
         'example': 'We need to ___ the contract.', 'example_meaning': 'Chúng ta cần đàm phán hợp đồng.'},
        {'word': 'revenue', 'pronunciation': '/ˈrevənuː/', 'word_type': 'n', 'meaning': 'doanh thu',
         'example': 'The company increased its ___.', 'example_meaning': 'Công ty đã tăng doanh thu.'},
        {'word': 'investment', 'pronunciation': '/ɪnˈvestmənt/', 'word_type': 'n', 'meaning': 'đầu tư',
         'example': 'This is a good ___ opportunity.', 'example_meaning': 'Đây là cơ hội đầu tư tốt.'},
        {'word': 'strategy', 'pronunciation': '/ˈstrætədʒi/', 'word_type': 'n', 'meaning': 'chiến lược',
         'example': 'We need a new marketing ___.', 'example_meaning': 'Chúng ta cần chiến lược marketing mới.'},
        {'word': 'productivity', 'pronunciation': '/ˌprɒdʌkˈtɪvəti/', 'word_type': 'n', 'meaning': 'năng suất',
         'example': 'Remote work boosts ___.', 'example_meaning': 'Làm việc từ xa tăng năng suất.'},
        {'word': 'delegate', 'pronunciation': '/ˈdelɪɡeɪt/', 'word_type': 'v', 'meaning': 'giao việc',
         'example': 'A good manager knows how to ___.', 'example_meaning': 'Người quản lý giỏi biết cách giao việc.'},
        {'word': 'milestone', 'pronunciation': '/ˈmaɪlstoʊn/', 'word_type': 'n', 'meaning': 'cột mốc',
         'example': 'Launching the product was a major ___.', 'example_meaning': 'Ra mắt sản phẩm là cột mốc lớn.'},
        {'word': 'stakeholder', 'pronunciation': '/ˈsteɪkhoʊldər/', 'word_type': 'n', 'meaning': 'cổ đông, bên liên quan',
         'example': 'We need to consult all ___.', 'example_meaning': 'Chúng ta cần tham khảo ý kiến tất cả bên liên quan.'},
        {'word': 'profitable', 'pronunciation': '/ˈprɒfɪtəbl/', 'word_type': 'adj', 'meaning': 'có lợi nhuận',
         'example': 'The business is highly ___.', 'example_meaning': 'Doanh nghiệp có lợi nhuận cao.'},
    ],
    'Khoa học': [
        {'word': 'hypothesis', 'pronunciation': '/haɪˈpɒθəsɪs/', 'word_type': 'n', 'meaning': 'giả thuyết',
         'example': 'We tested the ___.', 'example_meaning': 'Chúng tôi đã kiểm tra giả thuyết.'},
        {'word': 'experiment', 'pronunciation': '/ɪkˈsperɪmənt/', 'word_type': 'n', 'meaning': 'thí nghiệm',
         'example': 'The ___ produced unexpected results.', 'example_meaning': 'Thí nghiệm cho kết quả bất ngờ.'},
        {'word': 'molecule', 'pronunciation': '/ˈmɒlɪkjuːl/', 'word_type': 'n', 'meaning': 'phân tử',
         'example': 'Water ___s consist of H2O.', 'example_meaning': 'Phân tử nước gồm H2O.'},
        {'word': 'analysis', 'pronunciation': '/əˈnæləsɪs/', 'word_type': 'n', 'meaning': 'phân tích',
         'example': 'The ___ revealed important patterns.', 'example_meaning': 'Phân tích tiết lộ các mẫu quan trọng.'},
        {'word': 'evolution', 'pronunciation': '/ˌiːvəˈluːʃn/', 'word_type': 'n', 'meaning': 'tiến hóa',
         'example': 'Darwin studied ___.', 'example_meaning': 'Darwin nghiên cứu tiến hóa.'},
        {'word': 'gravity', 'pronunciation': '/ˈɡrævəti/', 'word_type': 'n', 'meaning': 'trọng lực',
         'example': '___ pulls objects downward.', 'example_meaning': 'Trọng lực kéo vật xuống.'},
        {'word': 'particle', 'pronunciation': '/ˈpɑːrtɪkl/', 'word_type': 'n', 'meaning': 'hạt',
         'example': 'Subatomic ___s are studied in physics.', 'example_meaning': 'Hạt hạ nguyên tử được nghiên cứu trong vật lý.'},
        {'word': 'genome', 'pronunciation': '/ˈdʒiːnoʊm/', 'word_type': 'n', 'meaning': 'bộ gen',
         'example': 'Scientists mapped the human ___.', 'example_meaning': 'Các nhà khoa học đã lập bản đồ bộ gen người.'},
        {'word': 'reaction', 'pronunciation': '/riˈækʃn/', 'word_type': 'n', 'meaning': 'phản ứng',
         'example': 'The chemical ___ was explosive.', 'example_meaning': 'Phản ứng hóa học rất mạnh.'},
        {'word': 'theory', 'pronunciation': '/ˈθɪəri/', 'word_type': 'n', 'meaning': 'lý thuyết',
         'example': 'Einstein proposed the ___ of relativity.', 'example_meaning': 'Einstein đề xuất thuyết tương đối.'},
    ],
    'Ẩm thực': [
        {'word': 'cuisine', 'pronunciation': '/kwɪˈziːn/', 'word_type': 'n', 'meaning': 'ẩm thực',
         'example': 'Vietnamese ___ is famous worldwide.', 'example_meaning': 'Ẩm thực Việt Nam nổi tiếng toàn cầu.'},
        {'word': 'ingredient', 'pronunciation': '/ɪnˈɡriːdiənt/', 'word_type': 'n', 'meaning': 'nguyên liệu',
         'example': 'Fresh ___s make great dishes.', 'example_meaning': 'Nguyên liệu tươi tạo món ăn tuyệt vời.'},
        {'word': 'marinate', 'pronunciation': '/ˈmærɪneɪt/', 'word_type': 'v', 'meaning': 'ướp',
         'example': '___ the meat for 2 hours.', 'example_meaning': 'Ướp thịt trong 2 giờ.'},
        {'word': 'seasoning', 'pronunciation': '/ˈsiːzənɪŋ/', 'word_type': 'n', 'meaning': 'gia vị',
         'example': 'Add ___ to taste.', 'example_meaning': 'Thêm gia vị cho vừa ăn.'},
        {'word': 'appetizer', 'pronunciation': '/ˈæpɪtaɪzər/', 'word_type': 'n', 'meaning': 'món khai vị',
         'example': 'The ___ was delicious.', 'example_meaning': 'Món khai vị rất ngon.'},
        {'word': 'recipe', 'pronunciation': '/ˈresəpi/', 'word_type': 'n', 'meaning': 'công thức',
         'example': 'She followed the ___ carefully.', 'example_meaning': 'Cô ấy làm theo công thức cẩn thận.'},
        {'word': 'simmer', 'pronunciation': '/ˈsɪmər/', 'word_type': 'v', 'meaning': 'ninh nhỏ lửa',
         'example': '___ the sauce for 10 minutes.', 'example_meaning': 'Ninh nước sốt trong 10 phút.'},
        {'word': 'garnish', 'pronunciation': '/ˈɡɑːrnɪʃ/', 'word_type': 'v', 'meaning': 'trang trí món ăn',
         'example': '___ with fresh herbs.', 'example_meaning': 'Trang trí với rau thơm tươi.'},
        {'word': 'savory', 'pronunciation': '/ˈseɪvəri/', 'word_type': 'adj', 'meaning': 'mặn, đậm đà',
         'example': 'The dish is ___ and rich.', 'example_meaning': 'Món ăn mặn mà và đậm đà.'},
        {'word': 'gourmet', 'pronunciation': '/ˈɡʊrmeɪ/', 'word_type': 'n', 'meaning': 'người sành ăn',
         'example': 'He is a true ___.', 'example_meaning': 'Anh ấy là người sành ăn thực thụ.'},
    ],
    'IELTS': [
        {'word': 'exacerbate', 'pronunciation': '/ɪɡˈzæsərbeɪt/', 'word_type': 'v', 'meaning': 'làm trầm trọng hơn',
         'example': 'Pollution will ___ the crisis.', 'example_meaning': 'Ô nhiễm sẽ làm trầm trọng cuộc khủng hoảng.'},
        {'word': 'mitigate', 'pronunciation': '/ˈmɪtɪɡeɪt/', 'word_type': 'v', 'meaning': 'giảm thiểu',
         'example': 'We must ___ climate change.', 'example_meaning': 'Chúng ta phải giảm thiểu biến đổi khí hậu.'},
        {'word': 'substantiate', 'pronunciation': '/səbˈstænʃieɪt/', 'word_type': 'v', 'meaning': 'chứng minh',
         'example': 'You need evidence to ___.', 'example_meaning': 'Bạn cần bằng chứng để chứng minh.'},
        {'word': 'proliferate', 'pronunciation': '/prəˈlɪfəreɪt/', 'word_type': 'v', 'meaning': 'phát triển nhanh',
         'example': 'Social media continues to ___.', 'example_meaning': 'Mạng xã hội tiếp tục phát triển nhanh.'},
        {'word': 'encompass', 'pronunciation': '/ɪnˈkʌmpəs/', 'word_type': 'v', 'meaning': 'bao gồm',
         'example': 'The course ___es many topics.', 'example_meaning': 'Khóa học bao gồm nhiều chủ đề.'},
        {'word': 'alleviate', 'pronunciation': '/əˈliːvieɪt/', 'word_type': 'v', 'meaning': 'giảm nhẹ',
         'example': 'Exercise can ___ stress.', 'example_meaning': 'Tập thể dục có thể giảm căng thẳng.'},
        {'word': 'detrimental', 'pronunciation': '/ˌdetrɪˈmentl/', 'word_type': 'adj', 'meaning': 'có hại',
         'example': 'Smoking is ___ to health.', 'example_meaning': 'Hút thuốc có hại cho sức khỏe.'},
        {'word': 'unprecedented', 'pronunciation': '/ʌnˈpresɪdentɪd/', 'word_type': 'adj', 'meaning': 'chưa từng có',
         'example': 'The pandemic was ___.', 'example_meaning': 'Đại dịch chưa từng có tiền lệ.'},
        {'word': 'sustainable', 'pronunciation': '/səˈsteɪnəbl/', 'word_type': 'adj', 'meaning': 'bền vững',
         'example': 'We need ___ development.', 'example_meaning': 'Chúng ta cần phát triển bền vững.'},
        {'word': 'infrastructure', 'pronunciation': '/ˈɪnfrəstrʌktʃər/', 'word_type': 'n', 'meaning': 'cơ sở hạ tầng',
         'example': 'The country invested in ___.', 'example_meaning': 'Quốc gia đầu tư vào cơ sở hạ tầng.'},
    ],
}


def seed():
    with app.app_context():
        print('🌱 Bắt đầu seed...')

        # 1. Admin
        admin = User.query.filter_by(email='admin@gmail.com').first()
        if not admin:
            admin = User(
                id=str(uuid.uuid4()),
                username='admin',
                email='admin@gmail.com',
                password_hash=hash_password('123456'),
                role='admin',
                daily_goal=10,
                review_limit=10,
            )
            db.session.add(admin)
            db.session.commit()
            print('✅ Tạo admin: admin@gmail.com / 123456')
        else:
            print(f'ℹ️  Admin đã tồn tại')

        # 2. Folders
        folder_map = {}
        for fd in FOLDERS:
            existing = Folder.query.filter_by(name=fd['name'], type='system').first()
            if existing:
                # Cập nhật ảnh nếu chưa có
                if not existing.image:
                    existing.image = fd['image']
                    existing.color = fd['color']
                    existing.icon = fd['icon']
                folder_map[fd['name']] = existing
                print(f'⏭️  Folder "{fd["name"]}" đã tồn tại')
                continue

            folder = Folder(
                id=str(uuid.uuid4()),
                name=fd['name'],
                type='system',
                icon=fd['icon'],
                color=fd['color'],
                image=fd['image'],
                description=fd['description'],
                word_count=0,
            )
            db.session.add(folder)
            folder_map[fd['name']] = folder
            print(f'✅ Tạo folder: {fd["name"]}')

        db.session.commit()

        # 3. Words
        total = 0
        for folder_name, words in WORDS_BY_FOLDER.items():
            folder = folder_map.get(folder_name)
            if not folder:
                continue

            for i, wd in enumerate(words):
                existing = Word.query.filter_by(word=wd['word'], deleted_at=None).first()
                if existing:
                    word = existing
                else:
                    word = Word(
                        id=str(uuid.uuid4()),
                        word=wd['word'],
                        pronunciation=wd['pronunciation'],
                        word_type=wd['word_type'],
                        meaning=wd['meaning'],
                        example=wd['example'],
                        example_meaning=wd['example_meaning'],
                        difficulty=1,
                        category=folder_name,
                    )
                    db.session.add(word)
                    db.session.flush()
                    total += 1

                link = FolderWord.query.filter_by(folder_id=folder.id, word_id=word.id).first()
                if not link:
                    db.session.add(FolderWord(
                        id=str(uuid.uuid4()),
                        folder_id=folder.id,
                        word_id=word.id,
                        order_index=i,
                    ))
                    folder.word_count = (folder.word_count or 0) + 1

            print(f'  ✅ {len(words)} từ vào "{folder_name}"')

        db.session.commit()
        print(f'\n🎉 Xong! {len(FOLDERS)} folders, {total} từ mới.')
        print(f'📧 Login: admin@gmail.com / 123456')


if __name__ == '__main__':
    seed()