"""Test nạp bản dịch dạng bảng (all_done.tsv) thành bản ghi lexicon_entries. Không cần database/mạng."""
import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import dict_import as di  # noqa: E402


class ParseGlossTsvTest(unittest.TestCase):
    def test_parses_rows_and_skips_blank_lines(self):
        rows = di.parse_gloss_tsv('Moment\tnoun\tkhoảnh khắc,  lúc\r\n\nrun\tverb\tchạy\n')
        self.assertEqual(rows, [('moment', 'noun', 'khoảnh khắc, lúc'), ('run', 'verb', 'chạy')])

    def test_rejects_wrong_column_count_with_line_number(self):
        with self.assertRaisesRegex(ValueError, 'dòng 2'):
            di.parse_gloss_tsv('run\tverb\tchạy\nbroken line\n')

    def test_rejects_empty_meaning(self):
        with self.assertRaises(ValueError):
            di.parse_gloss_tsv('run\tverb\t \n')


class RecordFromGlossTest(unittest.TestCase):
    def test_record_works_with_lookup_and_flashcard(self):
        rec = di.record_from_gloss('moment', 'noun', 'khoảnh khắc, lúc', rank=1200)
        self.assertEqual(rec['word'], 'moment')
        self.assertEqual(rec['pos_list'], 'noun')
        self.assertEqual(rec['main_meaning'], 'khoảnh khắc, lúc')
        self.assertEqual(rec['freq_rank'], 1200)
        self.assertGreater(rec['weight'], di.record_from_gloss('rare', 'noun', 'hiếm', rank=90000)['weight'])

        entry = di.to_api_entry(rec)
        self.assertEqual(entry['meanings'][0]['pos_label'], 'Danh từ')
        self.assertEqual(entry['meanings'][0]['definitions'][0]['meaning_vi'], 'khoảnh khắc, lúc')
        card = di.card_for(entry)
        self.assertEqual((card['pos'], card['meaning_vi']), ('noun', 'khoảnh khắc, lúc'))

    def test_slash_does_not_make_meaning_junk(self):
        rec = di.record_from_gloss('spouse', 'noun', 'vợ/chồng', rank=5000)
        self.assertEqual(rec['main_meaning'], 'vợ - chồng')
        self.assertEqual(di.card_for(di.to_api_entry(rec))['meaning_vi'], 'vợ - chồng')

    def test_one_letter_meaning_still_shown(self):
        rec = di.record_from_gloss('oh', 'interjection', 'ồ', rank=900)
        self.assertEqual(rec['main_meaning'], 'ồ')
        self.assertEqual(json.loads(rec['data'])['senses'][0]['meanings'][0]['vi'], 'ồ')

    def test_other_pos_has_no_label_and_extra_words_have_no_rank(self):
        rec = di.record_from_gloss('dna', 'other', 'viết tắt, ADN')
        self.assertIsNone(rec['freq_rank'])
        self.assertEqual(rec['weight'], 1)
        self.assertIsNone(di.to_api_entry(rec)['meanings'][0]['pos_label'])


if __name__ == '__main__':
    unittest.main()
