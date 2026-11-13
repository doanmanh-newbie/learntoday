"""Test phần nhập từ điển: giải mã MOBI, tách mục từ, đưa dạng biến đổi về dạng gốc. Không cần database/mạng."""
import json
import os
import struct
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import dict_import as di  # noqa: E402
from app.utils import mobi_reader as mr  # noqa: E402


def palmdoc_literal(data):
    """Nén PalmDOC kiểu đơn giản nhất: ký tự ASCII để nguyên, byte còn lại bọc bằng "n byte thô" (n <= 8)."""
    out, i = bytearray(), 0
    while i < len(data):
        b = data[i]
        if 9 <= b <= 0x7F:
            out.append(b)
            i += 1
        else:
            chunk = data[i:i + 8]
            out.append(len(chunk))
            out += chunk
            i += len(chunk)
    return bytes(out)


def build_mobi(text, codepage=65001):
    body = palmdoc_literal(text.encode('utf-8'))
    header_len = 232
    r0 = struct.pack('>HHIHHH', 2, 0, len(text.encode('utf-8')), 1, 4096, 0) + b'\0\0'
    r0 += b'MOBI' + struct.pack('>I', header_len) + b'\0' * 4 + b'\0' * 4 + struct.pack('>I', codepage)
    r0 = r0.ljust(16 + header_len + 8, b'\0')
    records = [r0, body]
    header = bytearray(78 + 8 * len(records) + 2)
    header[60:68] = b'BOOKMOBI'
    header[76:78] = struct.pack('>H', len(records))
    offset = len(header)
    for i, rec in enumerate(records):
        header[78 + 8 * i:82 + 8 * i] = struct.pack('>I', offset)
        offset += len(rec)
    return bytes(header) + b''.join(records)


SAMPLE = '''<html><body>
<p> go &mdash; /gou/<br/> danh từ, số nhiều goes<br/> sự đi<br/> sức sống; nhiệt tình<br/>=full of go+ đầy sức sống<br/>=at one go+ một lần<br/>
 ngoại động từ went; gone<br/> đi, đi lại<br/>=to go to school+ đi học<br/>!to go in for<br/> tham gia, dự thi<br/>@Chuyên ngành kinh tế<br/>chạy, vận hành<br/>@Chuyên ngành kỹ thuật<br/>@Lĩnh vực: điện<br/>sự chạy máy </p>
<p> went &mdash; /went/<br/> xem go </p>
<p> adductor &mdash; <br/> danh từ<br/> <ph u=""> cơ khép<br/>@Chuyên ngành kỹ thuật<br/>@Lĩnh vực: y học<br/>cơ khép </p>
<p> adenine &mdash; @Chuyên ngành kỹ thuật<br/>@Lĩnh vực: y học<br/>adenin </p>
<p> cineaste &mdash; <br/> danh từ<br/> như cineast<br/> danh từ<br/> như cineast </p>
<p> pollock &mdash; /'pɔlək/ (pollock) /'pɔlək/<br/> danh từ<br/> (động vật học) cá pôlăc </p>
<p> happy &mdash; /'hæpi/<br/> tính từ & phó từ<br/> vui </p>
<p> happy &mdash; <br/> tính từ<br/> hạnh phúc </p>
<p> not an entry without dash </p>
</body></html>'''


class MobiReader(unittest.TestCase):
    def test_palmdoc_literals_backreference_and_space_char(self):
        # "hello " + tham chiếu lùi (lùi 6, chép 5 ký tự = "hello") + "world" + (0xE1 = dấu cách + 'a')
        data = b'hello ' + bytes([0x80, 0x32]) + b'world' + bytes([0xE1])
        self.assertEqual(mr.palmdoc_decompress(data), b'hello helloworld a')

    def test_bad_backreference_raises(self):
        with self.assertRaises(mr.MobiError):
            mr.palmdoc_decompress(bytes([0x80, 0x0A]))

    def test_roundtrip_utf8_text_through_a_synthetic_mobi(self):
        text = '<p> chào &mdash; <br/> xin chào, tiếng Việt có dấu </p>'
        self.assertEqual(mr.mobi_to_html(build_mobi(text)), text)

    def test_rejects_non_mobi_and_unsupported_compression(self):
        with self.assertRaises(mr.MobiError):
            mr.mobi_to_html(b'x' * 500)
        data = bytearray(build_mobi('abc'))
        r0_start = struct.unpack('>I', bytes(data[78:82]))[0]
        data[r0_start:r0_start + 2] = struct.pack('>H', 17480)          # HUFF/CDIC
        with self.assertRaises(mr.MobiError):
            mr.mobi_to_html(bytes(data))


class ParseDictionary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records, cls.stats = di.build_all(SAMPLE)
        cls.by = {r['word']: r for r in cls.records}

    def test_counts_and_merge_of_duplicates(self):
        self.assertEqual(self.stats['duplicates_merged'], 1)
        self.assertEqual(sorted(self.by), ['adductor', 'adenine', 'cineaste', 'go', 'happy', 'pollock', 'went'])

    def test_senses_examples_idioms_and_domains(self):
        go = self.by['go']
        data = json.loads(go['data'])
        self.assertEqual(go['ipa'], '/gou/')
        self.assertEqual(go['pos_list'], 'noun,verb')
        noun, verb = data['senses']
        self.assertEqual(noun['note'], 'số nhiều goes')
        self.assertEqual([m['vi'] for m in noun['meanings']], ['sự đi', 'sức sống; nhiệt tình'])
        self.assertEqual(noun['meanings'][1]['examples'], [{'en': 'full of go', 'vi': 'đầy sức sống'}, {'en': 'at one go', 'vi': 'một lần'}])
        self.assertEqual((verb['label'], verb['note']), ('ngoại động từ', 'went; gone'))
        self.assertEqual(data['idioms'][0]['phrase'], 'to go in for')
        self.assertEqual(data['idioms'][0]['meanings'][0]['vi'], 'tham gia, dự thi')
        fields = [(d['field'], d['sub'], d['meanings']) for d in data['domains']]
        self.assertEqual(fields, [('kinh tế', None, ['chạy, vận hành']), ('kỹ thuật', 'điện', ['sự chạy máy'])])
        self.assertEqual(go['main_meaning'], 'sự đi; sức sống; nhiệt tình')
        self.assertEqual((go['example_en'], go['example_vi']), ('full of go', 'đầy sức sống'))
        self.assertTrue(go['has_domain'])

    def test_cross_reference_entry(self):
        went = self.by['went']
        self.assertEqual((went['see_also'], went['pos_list'], went['has_domain']), ('go', '', False))
        self.assertTrue(di.is_redirect(went))
        self.assertFalse(di.is_redirect(self.by['go']))

    def test_like_x_only_entry_is_redirect_but_keeps_its_meaning(self):
        c = self.by['cineaste']
        self.assertEqual(c['see_also'], 'cineast')
        self.assertEqual(len(json.loads(c['data'])['senses']), 1)       # khối trùng hệt bị bỏ
        self.assertTrue(di.is_redirect(c))

    def test_broken_source_tags_are_stripped_not_guessed(self):
        data = json.loads(self.by['adductor']['data'])
        self.assertEqual(data['senses'][0]['meanings'][0]['vi'], 'cơ khép')
        self.assertNotIn('<', self.by['adductor']['data'])

    def test_domain_only_entry_is_kept(self):
        r = self.by['adenine']
        self.assertEqual((r['pos_list'], r['has_domain'], r['main_meaning']), ('', True, 'adenin'))
        self.assertFalse(di.is_redirect(r))

    def test_ipa_takes_first_pronunciation_only(self):
        self.assertEqual(self.by['pollock']['ipa'], "/'pɔlək/")

    def test_merged_duplicate_keeps_both_senses_and_first_ipa(self):
        data = json.loads(self.by['happy']['data'])
        self.assertEqual([(s['pos'], s['meanings'][0]['vi']) for s in data['senses']], [('adjective', 'vui'), ('adjective', 'hạnh phúc')])
        self.assertEqual(self.by['happy']['ipa'], "/'hæpi/")

    def test_combined_pos_line(self):
        s = json.loads(self.by['happy']['data'])['senses'][0]
        self.assertEqual((s['pos'], s['label']), ('adjective', 'tính từ & phó từ'))


class ApiShape(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        records, _ = di.build_all(SAMPLE)
        cls.by = {r['word']: r for r in records}

    def test_entry_matches_ui_contract(self):
        e = di.to_api_entry(self.by['go'], redirected_from='went')
        self.assertEqual((e['word'], e['phonetic'], e['vi_complete'], e['redirected_from']), ('go', '/gou/', True, 'went'))
        self.assertEqual([m['pos'] for m in e['meanings']], ['noun', 'verb'])      # mỗi khóa tiếng Anh một lần
        d = e['meanings'][0]['definitions'][1]
        self.assertEqual((d['meaning_vi'], d['definition_en'], d['example'], d['example_vi']),
                         ('sức sống; nhiệt tình', None, 'full of go', 'đầy sức sống'))
        self.assertEqual(e['meanings'][1]['pos_label'], 'Ngoại động từ')

    def test_transitive_and_intransitive_verbs_merge_into_one_block(self):
        from_text = '<p> run &mdash; <br/> nội động từ<br/> chạy<br/> ngoại động từ<br/> điều hành </p>'
        rec = di.build_all(from_text)[0][0]
        e = di.to_api_entry(rec)
        self.assertEqual(len(e['meanings']), 1)
        self.assertEqual(e['meanings'][0]['pos_label'], 'Nội động từ / Ngoại động từ')
        self.assertEqual(len(e['meanings'][0]['definitions']), 2)

    def test_flashcard_card_uses_two_short_meanings_and_first_example(self):
        e = di.to_api_entry(self.by['go'])
        card = di.card_for(e)
        self.assertEqual(card, {'pos': 'noun', 'meaning_vi': 'sự đi; sức sống; nhiệt tình',
                                'example': 'full of go', 'example_vi': 'đầy sức sống'})
        self.assertEqual(di.card_for(e, 'verb')['meaning_vi'], 'đi, đi lại')
        self.assertIsNone(di.card_for(di.to_api_entry(self.by['adenine'])))


class Lemma(unittest.TestCase):
    def test_common_inflections(self):
        c = di.lemma_candidates
        self.assertEqual(c('studies')[0], 'study')
        self.assertEqual(c('running')[0], 'run')            # phụ âm đôi
        self.assertEqual(c('hoping')[:2], ['hope', 'hop'])   # bỏ -ing, thêm -e trước
        self.assertEqual(c('boxes')[0], 'box')
        self.assertEqual(c('houses')[0], 'house')
        self.assertEqual(c('happier')[0], 'happy')
        self.assertIn('wolf', c('wolves'))
        self.assertIn('study', c('studied'))
        self.assertIn('quick', c('quickly'))

    def test_never_returns_the_word_itself_or_tiny_stems(self):
        for w in ['is', 'as', 'bus', 'sing']:
            self.assertNotIn(w, di.lemma_candidates(w))
            self.assertTrue(all(len(x) >= 2 for x in di.lemma_candidates(w)))


if __name__ == '__main__':
    unittest.main()


CARD_SAMPLE = '''<html><body>
<p> mail &mdash; /meil/<br/> danh từ<br/> áo giáp<br/> ngoại động từ<br/> mặc áo giáp<br/> danh từ<br/> thư từ; bưu kiện, bưu phẩm<br/> chuyển thư<br/> bưu điện<br/> xe thư (xe lửa) </p>
<p> sell &mdash; /sel/<br/> danh từ<br/> (thực vật học) sự làm thất vọng; vố chơi khăm<br/> ngoại động từ<br/> bán (hàng hoá)<br/>=to sell goods+ bán hàng<br/> phản bội<br/> quảng cáo<br/> thuyết phục </p>
<p> grandma &mdash; <br/> danh từ<br/> uây oác['grænmə,mɑ:]<br/> danh từ<br/> (thân mật) bà </p>
<p> buy &mdash; /bai/<br/> (bất qui tắc) ngoại động từ bought; mua<br/> danh từ<br/> sự mua </p>
<p> begin &mdash; /bi'gin/<br/> (bất qui tắc) động từ began; bắt đầu, mở đầu, khởi đầu<br/> sự khởi đầu </p>
<p> take &mdash; /teik/<br/> (bất qui tắc) ngoại động từ took; taken<br/> cầm, nắm, giữ </p>
<p> dad &mdash; /dæd/<br/> danh từ<br/> (thông tục) ba, cha, bố, thầy </p>
</body></html>'''


class CardQuality(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records, _ = di.build_all(CARD_SAMPLE)
        cls.by = {r['word']: r for r in cls.records}

    def card(self, word, pos=None):
        return di.card_for(di.to_api_entry(self.by[word]), pos)

    def test_junk_meanings_are_recognised(self):
        for junk in ("uây oác['grænmə,mɑ:]", 'nhuấy &', '/saw/, seen; /seen/', "'estimeit/", 'x', '', '  ', None):
            self.assertTrue(di.is_junk_meaning(junk), repr(junk))
        for fine in ('bà', 'ông', 'chạy', '(thuộc) con người', 'bán (hàng hoá)'):
            self.assertFalse(di.is_junk_meaning(fine), fine)

    def test_card_skips_junk_meaning_and_uses_the_next_block(self):
        self.assertEqual(self.card('grandma')['meaning_vi'], 'bà')                   # trước đây "uây oác[...]"
        self.assertEqual(self.by['grandma']['main_meaning'], 'bà')

    def test_a_thin_archaic_first_block_yields_to_the_thick_common_one(self):
        self.assertEqual(self.card('mail')['meaning_vi'], 'thư từ; bưu kiện, bưu phẩm; chuyển thư')   # không phải "áo giáp"
        self.assertEqual(self.by['mail']['main_meaning'], 'thư từ; bưu kiện, bưu phẩm; chuyển thư')

    def test_rare_noun_sense_yields_to_the_common_verb_across_parts_of_speech(self):
        card = self.card('sell')
        self.assertEqual((card['pos'], card['meaning_vi']), ('verb', 'bán (hàng hoá); phản bội'))
        self.assertEqual(card['example'], 'to sell goods')

    def test_requested_pos_restricts_the_choice(self):
        self.assertEqual(self.card('sell', 'noun')['meaning_vi'], 'sự làm thất vọng; vố chơi khăm')
        self.assertEqual(self.card('mail', 'verb')['meaning_vi'], 'mặc áo giáp')
        self.assertEqual(self.card('mail', 'adjective')['pos'], 'noun')              # pos không có trong từ: dùng khối tốt nhất

    def test_pick_block_keeps_dictionary_order_when_blocks_are_comparable(self):
        blocks = [('noun', ['một', 'hai', 'ba']), ('verb', ['bốn', 'năm', 'sáu', 'bảy'])]
        self.assertEqual(di.pick_block(blocks), 0)
        self.assertEqual(di.pick_block([('noun', ['một']), ('verb', ['bốn', 'năm', 'sáu'])]), 1)
        self.assertEqual(di.pick_block([('noun', ['uây[x]']), ('noun', ['bà'])]), 1)
        self.assertIsNone(di.pick_block([('noun', ['[x]'])]))
        self.assertIsNone(di.pick_block([]))

    def test_leading_labels_are_stripped_but_not_the_meaningful_ones(self):
        s = di._strip_leading_notes
        self.assertEqual(s('(thông tục) ba, cha, bố, thầy'), 'ba, cha, bố, thầy')
        self.assertEqual(s('(thực vật học), (vật lý) tiêu điểm'), 'tiêu điểm')
        self.assertEqual(s('((thường) + of) kiêu ngạo'), 'kiêu ngạo')
        self.assertEqual(s('(+at) ngạc nhiên'), 'ngạc nhiên')
        self.assertEqual(s('(thuộc) con người'), '(thuộc) con người')
        self.assertEqual(s('(như) grad'), '(như) grad')
        self.assertEqual(s('(thơ ca)'), '(thơ ca)')                                  # bỏ xong còn rỗng thì giữ nguyên
        self.assertEqual(s('(chưa đóng ngoặc'), '(chưa đóng ngoặc')
        self.assertEqual(self.card('dad')['meaning_vi'], 'ba, cha, bố, thầy')

    def test_irregular_verb_lines_become_note_plus_meaning_not_a_fake_meaning(self):
        begin = json.loads(self.by['begin']['data'])['senses'][0]
        self.assertEqual((begin['pos'], begin['note']), ('verb', 'began'))
        self.assertEqual([m['vi'] for m in begin['meanings']][:2], ['bắt đầu, mở đầu, khởi đầu', 'sự khởi đầu'])
        take = json.loads(self.by['take']['data'])['senses'][0]
        self.assertEqual((take['note'], [m['vi'] for m in take['meanings']]), ('took; taken', ['cầm, nắm, giữ']))   # "taken" không thành nghĩa
        rec = di.build_all('<p> be &mdash; /bi:/<br/> (bất qui tắc) nội động từ & trợ động từ (số ít was, số nhiều were, been); thì, là<br/> có, tồn tại </p>'
                           '<p> become &mdash; /bi\'kʌm/<br/> (bất qui tắc) nội động từ, became; become; trở nên, trở thành </p>')[0]
        be, become = (json.loads(r['data'])['senses'][0] for r in rec)
        self.assertEqual((be['note'], be['meanings'][0]['vi']), ('(số ít was, số nhiều were, been)', 'thì, là'))
        self.assertEqual((become['note'], become['meanings'][0]['vi']), ('became; become', 'trở nên, trở thành'))
        # Nghĩa tiếng Việt viết không dấu ("bought; mua") không phân biệt được với dạng chia: khối rỗng bị bỏ -> dùng card_overrides.json
        buy = json.loads(self.by['buy']['data'])['senses']
        self.assertEqual([(s['pos'], s['meanings'][0]['vi']) for s in buy], [('noun', 'sự mua')])


class Overrides(unittest.TestCase):
    def test_valid_file(self):
        out = di.parse_overrides(json.dumps({'Plane': {'pos': 'noun', 'meaning': 'máy bay; mặt phẳng'}, 'run': {'meaning': 'chạy'}}))
        self.assertEqual(out['plane'], {'pos': 'noun', 'meaning': 'máy bay; mặt phẳng', 'example': None, 'example_vi': None})
        self.assertIsNone(out['run']['pos'])

    def test_invalid_files_are_rejected_with_a_clear_error(self):
        bad = [[], {'a b': {'meaning': 'x'}}, {'ok': 'text'}, {'ok': {}}, {'ok': {'meaning': ' '}}, {'ok': {'meaning': 'x', 'pos': 'noon'}}, {'1x': {'meaning': 'x'}}]
        for data in bad:
            with self.assertRaises(ValueError, msg=repr(data)):
                di.parse_overrides(json.dumps(data))

    def test_override_replaces_meaning_and_drops_the_dictionary_example(self):
        card = {'pos': 'noun', 'meaning_vi': 'áo giáp', 'example': 'a coat of mail', 'example_vi': 'áo giáp'}
        out = di.apply_override(card, {'pos': 'noun', 'meaning': 'thư từ', 'example': None, 'example_vi': None})
        self.assertEqual(out, {'pos': 'noun', 'meaning_vi': 'thư từ', 'example': None, 'example_vi': None})
        self.assertEqual(di.apply_override(card, None), card)
        self.assertEqual(di.apply_override(None, {'pos': None, 'meaning': 'x'})['pos'], 'noun')


class WordLists(unittest.TestCase):
    def test_parse_wordlist(self):
        meta, words = di.parse_wordlist("# name: Gia đình\n# icon: 👨\n# note: bị bỏ\n\nmother Father, son;\nmother  grand-parent  Bad1 'x\n")
        self.assertEqual(meta, {'name': 'Gia đình', 'icon': '👨'})
        self.assertEqual(words, ['mother', 'father', 'son', 'grand-parent'])          # không trùng, chữ thường, bỏ token có số/ký tự lạ

    def test_shipped_lists_are_well_formed(self):
        folder = os.path.join(os.path.dirname(__file__), '..', 'data', 'wordlists')
        files = sorted(f for f in os.listdir(folder) if f.endswith('.txt'))
        self.assertGreaterEqual(len(files), 12)
        names, all_words = set(), set()
        for f in files:
            meta, words = di.parse_wordlist(open(os.path.join(folder, f), encoding='utf-8').read())
            self.assertTrue(all(meta.get(k) for k in ('name', 'icon', 'color', 'description')), f)
            self.assertRegex(meta['color'], r'^#[0-9a-f]{6}$', f)
            self.assertGreaterEqual(len(words), 50, f)
            self.assertNotIn(meta['name'], names, f)
            names.add(meta['name'])
            all_words.update(words)
        self.assertGreaterEqual(len(all_words), 700)

    def test_shipped_overrides_are_valid_and_not_stale(self):
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
        overrides = di.parse_overrides(open(os.path.join(data_dir, 'card_overrides.json'), encoding='utf-8').read())
        listed = set()
        for f in os.listdir(os.path.join(data_dir, 'wordlists')):
            listed.update(di.parse_wordlist(open(os.path.join(data_dir, 'wordlists', f), encoding='utf-8').read())[1])
        self.assertEqual(sorted(set(overrides) - listed), [])                          # mỗi override đều dùng cho một từ trong danh sách
        self.assertTrue(all(o['pos'] for o in overrides.values()))
