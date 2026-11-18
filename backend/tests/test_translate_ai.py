from app.services import ai_service


def test_translate_texts_aligns_by_index_and_blanks_become_none(monkeypatch=None):
    calls = {}

    def fake(system, user_content, tool, max_tokens, timeout):
        calls['user'] = user_content
        return {'translations': ['mạng lưới', '  ', 'kết nối']}

    old = ai_service._call_tool
    ai_service._call_tool = fake
    try:
        out = ai_service.translate_texts(['network', 'xyz', 'connect', 'extra'])
    finally:
        ai_service._call_tool = old
    assert out == ['mạng lưới', None, 'kết nối', None]
    assert '1. network' in calls['user']


def test_translate_texts_empty_input_makes_no_call():
    old = ai_service._call_tool
    ai_service._call_tool = lambda *a, **k: (_ for _ in ()).throw(AssertionError('không được gọi AI'))
    try:
        assert ai_service.translate_texts([]) == []
    finally:
        ai_service._call_tool = old
