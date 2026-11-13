"""Test tra cứu bằng từ điển Anh-Việt tích hợp (lexicon_entries) qua API. Không gọi mạng: nếu code lỡ gọi ra ngoài, test lỗi."""
from unittest import mock

from tests.base import ApiTestCase
from tests.test_dict_import import SAMPLE
from tests.test_dictionary_ai import dict_api, translator


def no_network():
    def boom(*a, **k):
        raise AssertionError('Từ có trong từ điển tích hợp nhưng code vẫn gọi dịch vụ ngoài!')
    return mock.patch('app.services.lexicon_service.requests.get', side_effect=boom)


class LexiconApi(ApiTestCase):
    def setUp(self):
        super().setUp()
        from app.models import LexiconEntry
        from app.services.dict_import import build_all
        records, _ = build_all(SAMPLE)
        self.db.session.bulk_insert_mappings(LexiconEntry, records)     # đúng cách script import_dict.py nạp dữ liệu
        self.db.session.commit()
        self.headers, _ = self.register()

    def lookup(self, q):
        return self.client.get(f'/api/dictionary/lookup?q={q}', headers=self.headers)

    def _folder(self, name='Của tôi'):
        return self.client.post('/api/folders', json={'name': name}, headers=self.headers).get_json()['folder']['id']

    def test_lookup_comes_from_lexicon_without_any_external_call(self):
        with no_network():
            r = self.lookup('Go')
        body = r.get_json()
        self.assertEqual((r.status_code, body['source']), (200, 'lexicon'))
        e = body['entry']
        self.assertEqual((e['word'], e['phonetic'], e['vi_complete']), ('go', '/gou/', True))
        self.assertEqual([m['pos'] for m in e['meanings']], ['noun', 'verb'])
        self.assertEqual(e['meanings'][0]['definitions'][0]['meaning_vi'], 'sự đi')
        self.assertEqual(e['idioms'][0]['phrase'], 'to go in for')
        self.assertEqual([d['field'] for d in e['domains']], ['kinh tế', 'kỹ thuật'])
        self.assertIsNone(body['word_id'])

    def test_cross_reference_followed_and_inflection_reduced_to_base(self):
        with no_network():
            went = self.lookup('went').get_json()['entry']
            goes = self.lookup('goes').get_json()['entry']
        self.assertEqual((went['word'], went['redirected_from']), ('go', 'went'))
        self.assertEqual((goes['word'], goes['matched_from']), ('go', 'goes'))

    def test_domain_only_word_is_found(self):
        with no_network():
            e = self.lookup('adenine').get_json()['entry']
        self.assertEqual((e['meanings'], e['domains'][0]['meanings']), ([], ['adenin']))

    def test_unknown_word_still_uses_online_fallback_and_cache(self):
        with dict_api(), translator():
            first = self.lookup('accomplish').get_json()
            second = self.lookup('accomplish').get_json()
        self.assertEqual((first['source'], second['source']), ('api', 'database'))

    def test_history_is_recorded_for_lexicon_words(self):
        with no_network():
            self.lookup('go')
        history = self.client.get('/api/search/history', headers=self.headers).get_json()
        self.assertIn('go', str(history))

    def test_suggest_uses_lexicon_ordered_by_richness_and_skips_external_source(self):
        with no_network():
            s = self.client.get('/api/dictionary/suggest?q=g', headers=self.headers).get_json()['suggestions']
        self.assertEqual(s, ['go'])                                      # 'went' (chỉ trỏ) và từ khác không lọt vào
        with no_network():
            s = self.client.get('/api/dictionary/suggest?q=ad', headers=self.headers).get_json()['suggestions']
        self.assertEqual(s, ['adductor'])                                # 'adenine' chỉ có nghĩa chuyên ngành nên không gợi ý

    def test_save_builds_flashcard_from_two_short_meanings(self):
        from app.models import FolderWord, Word
        fid = self._folder()
        with no_network():
            r = self.client.post('/api/dictionary/save', json={'word': 'go', 'folder_id': fid}, headers=self.headers)
            again = self.client.post('/api/dictionary/save', json={'word': 'go', 'folder_id': fid}, headers=self.headers)
        self.assertEqual(r.status_code, 201)
        w = r.get_json()['word']
        self.assertEqual((w['word'], w['word_type'], w['meaning'], w['pronunciation']), ('go', 'noun', 'sự đi; sức sống; nhiệt tình', '/gou/'))
        self.assertEqual((w['example'], w['example_meaning'], w['meaning_en']), ('full of go', 'đầy sức sống', None))
        self.assertEqual((again.status_code, again.get_json()['already_saved']), (200, True))
        self.assertEqual((Word.query.filter_by(word='go').count(), FolderWord.query.count()), (1, 1))

    def test_save_respects_requested_part_of_speech_and_follows_redirect(self):
        from app.models import Word
        fid = self._folder()
        with no_network():
            r = self.client.post('/api/dictionary/save', json={'word': 'went', 'folder_id': fid, 'pos': 'verb'}, headers=self.headers)
        w = r.get_json()['word']
        self.assertEqual((r.status_code, w['word'], w['word_type'], w['meaning']), (201, 'go', 'verb', 'đi, đi lại'))
        self.assertEqual(Word.query.filter_by(word='went').count(), 0)

    def test_word_without_general_meaning_cannot_be_saved_and_nothing_is_written(self):
        from app.models import Word
        fid = self._folder()
        with no_network():
            r = self.client.post('/api/dictionary/save', json={'word': 'adenine', 'folder_id': fid}, headers=self.headers)
        self.assertEqual((r.status_code, r.get_json()['code']), (422, 'NO_MEANING'))
        self.assertEqual(Word.query.count(), 0)

    def test_saved_lexicon_word_enters_learning_flow(self):
        fid = self._folder()
        with no_network():
            saved = self.client.post('/api/dictionary/save', json={'word': 'go', 'folder_id': fid}, headers=self.headers).get_json()
        words = self.client.get(f'/api/folders/{fid}/words', headers=self.headers).get_json()
        self.assertIn(saved['word']['id'], str(words))
