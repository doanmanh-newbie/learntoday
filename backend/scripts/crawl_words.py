# backend/scripts/crawl_words.py
"""
Script crawl từ vựng hàng loạt từ Free Dictionary API.
Chạy: python scripts/crawl_words.py
Output: data/words_crawled.json
"""

import json
import sys
import time
from pathlib import Path

# Thêm path để import được app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.dictionary_service import lookup_word


# ── Danh sách từ cần crawl theo chủ đề ────────────────────────────────────
WORD_LISTS = {
    'Công nghệ': [
        'algorithm', 'database', 'network', 'software', 'hardware',
        'interface', 'encryption', 'cloud', 'server', 'protocol',
        'framework', 'application', 'binary', 'compiler', 'debugging',
    ],
    'Du lịch': [
        'itinerary', 'destination', 'accommodation', 'excursion', 'passport',
        'souvenir', 'departure', 'arrival', 'luggage', 'boarding',
        'reservation', 'terminal', 'visa', 'customs', 'transit',
    ],
    'Kinh doanh': [
        'deadline', 'negotiate', 'revenue', 'investment', 'strategy',
        'productivity', 'delegate', 'milestone', 'stakeholder', 'profitable',
        'entrepreneur', 'marketing', 'budget', 'contract', 'shareholder',
    ],
    'Khoa học': [
        'hypothesis', 'experiment', 'molecule', 'analysis', 'evolution',
        'gravity', 'particle', 'genome', 'reaction', 'theory',
        'chemistry', 'physics', 'biology', 'laboratory', 'microscope',
    ],
    'Ẩm thực': [
        'cuisine', 'ingredient', 'marinate', 'seasoning', 'appetizer',
        'recipe', 'simmer', 'garnish', 'savory', 'gourmet',
        'delicious', 'nutritious', 'beverage', 'dessert', 'appetite',
    ],
    'IELTS': [
        'exacerbate', 'mitigate', 'substantiate', 'proliferate', 'encompass',
        'alleviate', 'detrimental', 'unprecedented', 'sustainable', 'infrastructure',
        'comprehensive', 'significant', 'fundamental', 'phenomenon', 'hypothesis',
    ],
}


def crawl_words(word_list, delay=0.5):
    """Crawl nhiều từ, trả về list data."""
    results = []
    total = len(word_list)

    for i, word in enumerate(word_list, 1):
        print(f'[{i}/{total}] Đang lấy: {word}...', end=' ')
        try:
            data = lookup_word(word, translate=True)
            if data:
                results.append(data)
                print(f'✅ ({data["word_type"]}) {data["meaning"][:50]}')
            else:
                print('❌ Không tìm thấy')
        except Exception as e:
            print(f'❌ Lỗi: {e}')

        time.sleep(delay)  # Tránh rate limit

    return results


def main():
    output_dir = Path(__file__).parent.parent / 'data' / 'crawled'
    output_dir.mkdir(parents=True, exist_ok=True)

    for folder_name, word_list in WORD_LISTS.items():
        print(f'\n📂 Đang crawl folder: {folder_name}')
        print('=' * 60)

        results = crawl_words(word_list)

        # Lưu vào file JSON
        filename = folder_name.lower().replace(' ', '_') + '.json'
        output_file = output_dir / filename

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                'folder': folder_name,
                'words': results,
            }, f, ensure_ascii=False, indent=2)

        print(f'\n✅ Đã lưu {len(results)}/{len(word_list)} từ vào {output_file}')

    print('\n🎉 Crawl hoàn thành!')


if __name__ == '__main__':
    main()