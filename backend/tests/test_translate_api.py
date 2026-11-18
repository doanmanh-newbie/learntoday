from unittest import mock

from tests.base import ApiTestCase


class TranslateApiTest(ApiTestCase):
    def test_translates_text_and_rejects_too_long(self):
        h, _ = self.register()
        with mock.patch('app.routes.translate._translate_text', return_value='Xin chào thế giới'):
            r = self.client.post('/api/translate', json={'text': 'Hello world', 'source_lang': 'en', 'target_lang': 'vi'}, headers=h)
        self.assertEqual(r.status_code, 200, r.get_json())
        self.assertEqual(r.get_json()['translated'], 'Xin chào thế giới')
        r = self.client.post('/api/translate', json={'text': 'a' * 5001}, headers=h)
        self.assertEqual(r.status_code, 400)
