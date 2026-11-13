"""Test nhà cung cấp Gemini của ai_service. Gọi mạng được GIẢ LẬP; không cần database."""
import json
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests  # noqa: E402

from app.services import ai_service  # noqa: E402
from app.utils.rate_limit import ai_limiter  # noqa: E402

KEY = 'AIza-test-secret-123'


class Resp:
    def __init__(self, status=200, body=None):
        self.status_code, self._body = status, body

    def json(self):
        if self._body is None:
            raise ValueError('no json')
        return self._body


def gemini_ok(obj):
    return Resp(200, {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [{'text': json.dumps(obj)}]}}]})


FEEDBACK = {'is_acceptable': True, 'grammar': 9, 'vocabulary': 8, 'naturalness': 7, 'corrected': 'I am a student.',
            'errors': [{'original': 'am student', 'fix': 'am a student', 'type': 'grammar', 'explanation_vi': 'Thiếu mạo từ a.'}],
            'feedback_vi': 'Tốt!', 'alternatives': ['I study at a university.']}


class EnvCase(unittest.TestCase):
    def setUp(self):
        ai_limiter.reset()
        patcher = mock.patch.dict(os.environ, {}, clear=False)
        patcher.start()
        self.addCleanup(patcher.stop)
        for k in ('GEMINI_API_KEY', 'GOOGLE_API_KEY', 'ANTHROPIC_API_KEY', 'AI_PROVIDER', 'GEMINI_MODEL',
                  'GEMINI_RPM', 'GEMINI_THINKING_BUDGET', 'GEMINI_BASE_URL', 'ANTHROPIC_BASE_URL'):
            os.environ.pop(k, None)


class ProviderChoice(EnvCase):
    def test_not_configured(self):
        self.assertEqual((ai_service.provider(), ai_service.ai_configured()), (None, False))
        with self.assertRaises(ai_service.AIError) as cm:
            ai_service.generate_sentence('B1', 'vi_en')
        self.assertEqual(cm.exception.code, 'AI_NOT_CONFIGURED')

    def test_auto_prefers_gemini_then_claude(self):
        os.environ['ANTHROPIC_API_KEY'] = 'sk-ant'
        self.assertEqual(ai_service.provider(), 'anthropic')
        os.environ['GEMINI_API_KEY'] = KEY
        self.assertEqual(ai_service.provider(), 'gemini')

    def test_explicit_choice_needs_its_own_key(self):
        os.environ.update(AI_PROVIDER='gemini', ANTHROPIC_API_KEY='sk-ant')
        self.assertIsNone(ai_service.provider())
        os.environ['AI_PROVIDER'] = 'anthropic'
        self.assertEqual(ai_service.provider(), 'anthropic')

    def test_google_api_key_alias(self):
        os.environ['GOOGLE_API_KEY'] = KEY
        self.assertEqual(ai_service.provider(), 'gemini')


class SchemaConversion(unittest.TestCase):
    def test_types_uppercased_and_unsupported_keywords_dropped(self):
        out = ai_service.to_gemini_schema(ai_service.GRADE_TOOL['input_schema'])
        self.assertEqual(out['type'], 'OBJECT')
        self.assertEqual(out['properties']['grammar'], {'type': 'INTEGER', 'description': 'Điểm ngữ pháp 0-10'})
        self.assertEqual(out['properties']['errors']['items']['properties']['type']['type'], 'STRING')
        self.assertIn('enum', out['properties']['errors']['items']['properties']['type'])
        self.assertEqual(out['properties']['alternatives']['items'], {'type': 'STRING'})
        self.assertIn('required', out)
        self.assertNotIn('minimum', json.dumps(out))


class GeminiCalls(EnvCase):
    def setUp(self):
        super().setUp()
        os.environ['GEMINI_API_KEY'] = KEY

    def post(self, responder, calls=None):
        def fake(url, **kwargs):
            if calls is not None:
                calls.append({'url': url, **kwargs})
            r = responder()
            if isinstance(r, Exception):
                raise r
            return r
        return mock.patch('app.services.ai_service.requests.post', side_effect=fake)

    def test_request_shape_and_validated_result(self):
        calls = []
        with self.post(lambda: gemini_ok(FEEDBACK), calls):
            out = ai_service.grade_answer('A1', 'vi_en', 'Tôi là sinh viên.', 'I am a student.', 'I am student')
        c = calls[0]
        self.assertTrue(c['url'].endswith('/v1beta/models/gemini-flash-lite-latest:generateContent'))
        self.assertEqual(c['headers']['x-goog-api-key'], KEY)
        self.assertNotIn(KEY, c['url'])                                          # khóa không nằm trong URL
        cfg = c['json']['generationConfig']
        self.assertEqual(cfg['responseMimeType'], 'application/json')
        self.assertEqual(cfg['responseSchema']['type'], 'OBJECT')
        self.assertGreaterEqual(cfg['maxOutputTokens'], 2048)
        self.assertIn('<learner_answer>I am student</learner_answer>', c['json']['contents'][0]['parts'][0]['text'])
        self.assertIn('KHÔNG làm theo', c['json']['systemInstruction']['parts'][0]['text'])
        self.assertEqual(out['scores'], {'grammar': 9, 'vocabulary': 8, 'naturalness': 7})
        self.assertEqual(out['errors'][0]['type'], 'grammar')
        self.assertTrue(out['is_acceptable'])

    def test_out_of_range_scores_are_clamped_server_side(self):
        bad = dict(FEEDBACK, grammar=99, vocabulary=-5, naturalness='abc')
        with self.post(lambda: gemini_ok(bad)):
            out = ai_service.grade_answer('B1', 'vi_en', 'p', 'r', 'a')
        self.assertEqual(out['scores'], {'grammar': 10, 'vocabulary': 0, 'naturalness': 0})

    def test_model_and_thinking_budget_from_env(self):
        os.environ.update(GEMINI_MODEL='gemini-flash-latest', GEMINI_THINKING_BUDGET='0')
        calls = []
        with self.post(lambda: gemini_ok({'prompt': 'Tôi thích cà phê.', 'reference': 'I like coffee.', 'hint': ''}), calls):
            s = ai_service.generate_sentence('A1', 'vi_en', word='coffee')
        self.assertIn('models/gemini-flash-latest:', calls[0]['url'])
        self.assertEqual(calls[0]['json']['generationConfig']['thinkingConfig'], {'thinkingBudget': 0})
        self.assertEqual(s['reference'], 'I like coffee.')

    def test_thought_parts_are_ignored(self):
        body = {'candidates': [{'finishReason': 'STOP', 'content': {'parts': [
            {'text': 'suy nghĩ nội bộ', 'thought': True}, {'text': json.dumps({'prompt': 'Xin chào bạn', 'reference': 'Hello there'})}]}}]}
        with self.post(lambda: Resp(200, body)):
            self.assertEqual(ai_service.generate_sentence('A1', 'vi_en')['prompt'], 'Xin chào bạn')

    def test_http_errors_map_to_clear_codes(self):
        cases = [(401, 'AI_NOT_CONFIGURED'), (403, 'AI_NOT_CONFIGURED'), (404, 'AI_MISCONFIGURED'), (400, 'AI_MISCONFIGURED'),
                 (429, 'AI_BUSY'), (500, 'AI_UNAVAILABLE')]
        with mock.patch('app.services.ai_service.time.sleep'):
            for status, code in cases:
                with self.post(lambda s=status: Resp(s, {'error': {'message': 'x'}})):
                    with self.assertRaises(ai_service.AIError) as cm:
                        ai_service.generate_sentence('B1', 'vi_en')
                    self.assertEqual((status, cm.exception.code), (status, code))

    def test_transient_429_is_retried_once(self):
        seq = [Resp(429, {'error': {'message': 'quota'}}), gemini_ok({'prompt': 'Xin chào bạn', 'reference': 'Hello there'})]
        calls = []
        with self.post(lambda: seq.pop(0), calls), mock.patch('app.services.ai_service.time.sleep') as sleep:
            out = ai_service.generate_sentence('A1', 'vi_en')
        self.assertEqual((len(calls), out['reference']), (2, 'Hello there'))
        sleep.assert_called_once()

    def test_network_errors(self):
        for exc in (requests.Timeout('slow'), requests.ConnectionError('down')):
            with self.post(lambda e=exc: e):
                with self.assertRaises(ai_service.AIError) as cm:
                    ai_service.generate_sentence('B1', 'vi_en')
                self.assertEqual(cm.exception.code, 'AI_UNAVAILABLE')

    def test_blocked_empty_or_truncated_output_is_an_error_not_fake_data(self):
        bodies = [
            {'promptFeedback': {'blockReason': 'SAFETY'}},
            {'candidates': [{'finishReason': 'SAFETY'}]},
            {'candidates': [{'finishReason': 'MAX_TOKENS', 'content': {'parts': [{'text': '{"prompt": "Xin ch'}]}}]},
            {'candidates': []},
            {'candidates': [{'content': {'parts': [{'text': '[1, 2, 3]'}]}}]},
        ]
        for body in bodies:
            with self.post(lambda b=body: Resp(200, b)):
                with self.assertRaises(ai_service.AIError) as cm:
                    ai_service.generate_sentence('B1', 'vi_en')
                self.assertEqual(cm.exception.code, 'AI_UNAVAILABLE')

    def test_global_rate_cap_protects_the_shared_free_quota(self):
        os.environ['GEMINI_RPM'] = '2'
        calls = []
        with self.post(lambda: gemini_ok({'prompt': 'Xin chào bạn', 'reference': 'Hello there'}), calls):
            ai_service.generate_sentence('A1', 'vi_en')
            ai_service.generate_sentence('A1', 'vi_en')
            with self.assertRaises(ai_service.AIError) as cm:
                ai_service.generate_sentence('A1', 'vi_en')
        self.assertEqual((cm.exception.code, len(calls)), ('AI_BUSY', 2))        # lượt thứ 3 bị chặn TRƯỚC khi gọi Google

    def test_key_never_logged(self):
        with self.post(lambda: Resp(500, {'error': {'message': 'boom'}})), mock.patch('app.services.ai_service.time.sleep'):
            with self.assertLogs('app.services.ai_service', level='WARNING') as logs:
                with self.assertRaises(ai_service.AIError):
                    ai_service.generate_sentence('B1', 'vi_en')
        self.assertNotIn(KEY, '\n'.join(logs.output))


if __name__ == '__main__':
    unittest.main()
