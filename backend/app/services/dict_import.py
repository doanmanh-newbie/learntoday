# app/services/dict_import.py - tách từ điển Anh-Việt (dạng HTML của file .mobi) thành bản ghi có cấu trúc
"""
Hàm thuần (không đụng database) để dễ kiểm thử:

    html -> parse_dictionary(html) -> các `entry` thô -> build_record(entry) -> bản ghi cho bảng lexicon_entries

Định dạng nguồn (mỗi mục là một <p>):
    <p> go &mdash; /gou/<br/> danh từ, số nhiều goes<br/> sự đi<br/>=full of go+ đầy sức sống<br/> ...
      * dòng loại từ         : "danh từ", "ngoại động từ took; taken", "tính từ & phó từ" ...
      * dòng nghĩa           : văn bản thường
      * dòng ví dụ           : "=English sentence+ nghĩa tiếng Việt"
      * dòng thành ngữ       : "!in the long run" (các dòng nghĩa sau nó thuộc thành ngữ đó)
      * "@Chuyên ngành X" / "@Lĩnh vực: Y" : nghĩa chuyên ngành (kỹ thuật, kinh tế, y học...) - tách riêng
      * "xem X" / "như X"    : tham chiếu sang từ khác (went -> xem go)

Dữ liệu nguồn có lỗi sẵn từ lúc chuyển đổi (nhãn dạng "(giải phẫu)" bị hỏng thành thẻ rác như <ph u="">):
các thẻ này bị bỏ đi, KHÔNG đoán lại nhãn bị mất.
"""
import html as html_lib
import json
import re

MAX_BLOCK_MEANINGS = 60
MAX_IDIOMS = 40
MAX_DOMAIN_MEANINGS = 30
MAX_EXAMPLES = 3
CARD_MEANING_LIMIT = 160

POS_EN = {
    'trợ động từ': 'verb', 'ngoại động từ': 'verb', 'nội động từ': 'verb', 'động từ': 'verb', 'danh từ': 'noun', 'tính từ': 'adjective',
    'phó từ': 'adverb', 'trạng từ': 'adverb', 'giới từ': 'preposition', 'liên từ': 'conjunction',
    'đại từ': 'pronoun', 'thán từ': 'interjection', 'mạo từ': 'article', 'số từ': 'numeral',
}
_POS_ALT = '|'.join(sorted(POS_EN, key=len, reverse=True))
IRREGULAR_PREFIX_RE = re.compile(r'^\(\s*bất\s+qui?\s+tắc\s*\)\s*', re.I)
POS_LINE_RE = re.compile(rf'^({_POS_ALT})(?P<rest>.*)$', re.I)
POS_ANY_RE = re.compile(_POS_ALT, re.I)
HEAD_RE = re.compile(r"^[A-Za-z][A-Za-z'\-\. ]{0,59}$")
TAG_RE = re.compile(r'<[^<>]*>')
SEE_RE = re.compile(r"^(xem|như)\s+([A-Za-z][A-Za-z'\-]*)\.?$", re.I)
DOMAIN_RE = re.compile(r'^@\s*Chuyên ngành\s*(.*)$', re.I)
FIELD_RE = re.compile(r'^@\s*Lĩnh vực\s*:?\s*(.*)$', re.I)
EXAMPLE_RE = re.compile(r'^=\s*(.*?)\s*\+\s*(.*)$')
IPA_RE = re.compile(r'^(/[^/]+/)(.*)$')


def clean_text(text):
    """Bỏ thẻ rác, ký tự < > lẻ và khoảng trắng thừa."""
    text = TAG_RE.sub(' ', text or '')
    text = text.replace('<', ' ').replace('>', ' ')
    return re.sub(r'\s+', ' ', text).strip()


# ───────────────────────── tách đoạn ─────────────────────────
def iter_paragraphs(html_text):
    for m in re.finditer(r'<p>(.*?)</p>', html_text, flags=re.S):
        yield m.group(1)


def parse_paragraph(paragraph):
    """Một đoạn <p> -> {'head','ipa','lines'} hoặc None nếu không phải mục từ hợp lệ."""
    p = html_lib.unescape(paragraph).strip()
    m = re.match(r'^(?P<head>[^—<]{1,80}?)\s*—\s*(?P<rest>.*)$', p, flags=re.S)
    if not m:
        return None
    head = m.group('head').strip()
    if not HEAD_RE.match(head):
        return None
    segments = re.split(r'<br\s*/?>', m.group('rest'))
    ipa, lines = '', []
    first = segments[0].strip()
    ipa_match = IPA_RE.match(first)
    if ipa_match:
        ipa = ipa_match.group(1).strip()
        tail = ipa_match.group(2)
        if tail.strip() and '/' not in tail:        # phần còn lại không phải biến thể phiên âm -> coi là dòng nội dung
            lines.append(tail)
    elif first:
        lines.append(first)
    lines.extend(segments[1:])
    return {'head': head.lower(), 'ipa': ipa, 'lines': lines}


def parse_dictionary(html_text):
    """Sinh từng mục từ thô. Bỏ qua các đoạn không đúng định dạng (đếm trong stats nếu cần)."""
    for paragraph in iter_paragraphs(html_text):
        entry = parse_paragraph(paragraph)
        if entry:
            yield entry


# ───────────────────────── phân tích dòng của 1 mục ─────────────────────────
def _pos_from_line(text):
    """Nếu `text` là dòng loại từ trả (khóa_en, nhãn_vi, ghi_chú, nghĩa_kèm_theo|None), ngược lại None.

    Dòng động từ bất quy tắc của nguồn có dạng "(bất qui tắc) động từ began; bắt đầu, mở đầu": các đoạn đầu (cách nhau bằng dấu ;)
    toàn chữ không dấu hoặc dạng "(số ít was, số nhiều were)" là các dạng chia (ghi chú); từ đoạn đầu tiên có dấu tiếng Việt trở đi
    là MỘT nghĩa. Nghĩa tiếng Việt viết KHÔNG dấu (vd "mua") không phân biệt được với dạng chia nên vẫn nằm trong ghi chú
    (xem data/card_overrides.json)."""
    irregular = IRREGULAR_PREFIX_RE.match(text)
    body = text[irregular.end():] if irregular else text
    m = POS_LINE_RE.match(body)
    if not m:
        return None
    rest = m.group('rest')
    stripped = rest.strip()
    inline_meaning = None
    if irregular:
        segments = [x.strip() for x in POS_ANY_RE.sub('', stripped).strip(' ,;&').split(';')]
        is_form = lambda seg: seg.isascii() or re.match(r'^\(?\s*số (ít|nhiều)', seg) is not None
        meaning_from = next((i for i, seg in enumerate(segments) if seg and not is_form(seg)), None)
        if meaning_from is not None:
            inline_meaning = '; '.join(segments[meaning_from:])
            stripped = '; '.join(segments[:meaning_from])
        looks_like_pos = True
    else:
        looks_like_pos = (
            stripped == '' or stripped[0] in ',;&(' or stripped.startswith(('số nhiều', 'số ít'))
            or re.fullmatch(r"[\sA-Za-z;,\.'\-/]*", rest) is not None
        )
    if not looks_like_pos:
        return None
    labels = [x.lower() for x in POS_ANY_RE.findall(body)]
    key = POS_EN[labels[0]]
    label = ' & '.join(dict.fromkeys(labels))
    note = POS_ANY_RE.sub('', stripped).strip(' ,;&')
    return key, label, note, inline_meaning


def parse_lines(lines):
    """Danh sách dòng -> {'senses','idioms','domains','see'}."""
    senses, idioms, domains = [], [], []
    see = None
    mode = 'general'                                 # 'general' | 'idiom' | 'domain'
    block = item = idiom = None
    d_field = d_sub = None
    domain_cache = {}

    def new_block(key, label, note):
        nonlocal block, item
        block = {'pos': key, 'label': label, 'note': note, 'meanings': []}
        senses.append(block)
        item = None

    for raw in lines:
        text = clean_text(raw)
        if not text:
            continue

        if text.startswith('@'):
            m = DOMAIN_RE.match(text)
            if m:
                d_field, d_sub, mode = (m.group(1).strip() or 'khác'), None, 'domain'
            else:
                m = FIELD_RE.match(text)
                if m:
                    d_field = d_field or 'khác'
                    d_sub, mode = m.group(1).strip() or None, 'domain'
            continue

        pos = _pos_from_line(text)
        if pos:
            mode = 'general'
            new_block(*pos[:3])
            if pos[3]:                                    # nghĩa nằm ngay trên dòng loại từ (động từ bất quy tắc)
                item = {'vi': pos[3], 'examples': []}
                block['meanings'].append(item)
            continue

        if text.startswith('!'):
            idiom = {'phrase': text[1:].strip(), 'meanings': []}
            if idiom['phrase'] and len(idioms) < MAX_IDIOMS:
                idioms.append(idiom)
            mode, item = 'idiom', None
            continue

        if text.startswith('='):
            m = EXAMPLE_RE.match(text)
            en, vi = (m.group(1), m.group(2)) if m else (text[1:].strip(), '')
            if item is not None and mode != 'domain' and len(item['examples']) < MAX_EXAMPLES and en:
                item['examples'].append({'en': en, 'vi': vi})
            continue

        see_match = SEE_RE.match(text)
        if see_match and not any(b['meanings'] for b in senses) and not idioms:
            see = see_match.group(2).lower()
            if see_match.group(1).lower() == 'xem':   # "xem X" chỉ là tham chiếu; "như X" vẫn là một nghĩa
                continue

        if mode == 'domain':
            key = (d_field, d_sub)
            dom = domain_cache.get(key)
            if dom is None:
                dom = {'field': d_field, 'sub': d_sub, 'meanings': []}
                domain_cache[key] = dom
                domains.append(dom)
            if text not in dom['meanings'] and len(dom['meanings']) < MAX_DOMAIN_MEANINGS:
                dom['meanings'].append(text)
            continue

        if mode == 'idiom':
            if idiom is not None and len(idiom['meanings']) < MAX_BLOCK_MEANINGS and idiom in idioms:
                item = {'vi': text, 'examples': []}
                idiom['meanings'].append(item)
            continue

        if block is None:
            new_block('other', '', '')
        if len(block['meanings']) < MAX_BLOCK_MEANINGS:
            item = {'vi': text, 'examples': []}
            block['meanings'].append(item)

    senses = _dedupe_blocks(senses)
    return {'senses': senses, 'idioms': [i for i in idioms if i['meanings']], 'domains': domains, 'see': see}


def _dedupe_blocks(blocks):
    """Bỏ khối loại từ trống hoặc trùng hệt khối trước đó (nguồn có mục lặp, vd: cineaste)."""
    out, seen = [], set()
    for b in blocks:
        if not b['meanings']:
            continue
        sig = (b['pos'], tuple(m['vi'] for m in b['meanings']))
        if sig in seen:
            continue
        seen.add(sig)
        out.append(b)
    return out


# ───────────────────────── bản ghi cho database ─────────────────────────
def _short(text, limit=CARD_MEANING_LIMIT):
    text = text.strip()
    return text if len(text) <= limit else text[:limit - 1].rstrip() + '…'


IPA_CHARS = set('əɑæɔʃʒθðŋɪʊʌɛɜɒ')


def is_junk_meaning(text):
    """Nghĩa hỏng sẵn trong file nguồn: phiên âm lọt vào chỗ nghĩa (vd "uây oác['grænmə,mɑ:]"), ký tự & treo cuối dòng
    (vd "nhuấy &"), hoặc quá ngắn để là một nghĩa. Dùng để KHÔNG chọn chúng làm nghĩa trên flashcard (vẫn hiện ở trang chi tiết)."""
    t = (text or '').strip()
    if sum(ch.isalpha() for ch in t) < 2:
        return True
    return '[' in t or ']' in t or '/' in t or t.endswith('&') or any(ch in IPA_CHARS for ch in t)


def _usable(meanings):
    return [m for m in meanings if not is_junk_meaning(m['vi'] if isinstance(m, dict) else m)]


def _weight(meanings):
    """Độ "dày" của một khối nghĩa: mỗi nghĩa dùng được 1 điểm, mỗi ví dụ thêm 2 điểm. Nghĩa phổ biến thường có nhiều dòng/ví dụ hơn nghĩa hiếm."""
    return sum(1 + 2 * len(m.get('examples') or []) for m in _usable(meanings) if isinstance(m, dict)) \
        + len([m for m in _usable(meanings) if not isinstance(m, dict)])


def pick_block(blocks):
    """Chọn khối nghĩa tốt nhất cho flashcard. `blocks`: list các (pos, [nghĩa]), nghĩa là chuỗi hoặc dict có 'vi'/'examples'.
    Trả chỉ số khối hoặc None. Mặc định lấy khối đầu có nghĩa dùng được (thứ tự của từ điển); chỉ khi khối đó mỏng hơn hẳn
    (điểm < một nửa khối dày nhất) mới lấy khối dày nhất. Ví dụ "mail": khối đầu "áo giáp" (nghĩa cổ, 1 dòng) nhường cho
    "thư từ" (4 dòng); "sell": khối danh từ hiếm "vố chơi khăm" nhường cho động từ "bán"."""
    weights = [_weight(meanings) for _, meanings in blocks]
    usable = [i for i, w in enumerate(weights) if w]
    if not usable:
        return None
    first = usable[0]
    best = max(usable, key=lambda i: (weights[i], -i))
    return first if weights[first] * 2 >= weights[best] else best


def _strip_leading_notes(text):
    """Bỏ nhãn trong ngoặc ở ĐẦU nghĩa (nhãn lĩnh vực/phong cách/cấu trúc câu như "(thông tục)", "(thực vật học)", "(+ at)",
    "((thường) + of)") để thẻ học gọn. Giữ "(thuộc) ..." và "(như) ..." vì đó là một phần của nghĩa. Nếu bỏ xong còn rỗng thì giữ nguyên."""
    t = text.strip()
    original = t
    while t.startswith('('):
        depth, end = 0, None
        for i, ch in enumerate(t):
            depth += ch == '('
            depth -= ch == ')'
            if depth == 0:
                end = i
                break
        if end is None:
            break
        inner = t[1:end].strip().lower()
        if inner.startswith(('thuộc', 'như')):
            break
        t = t[end + 1:].lstrip(' ,;')
    return t or original


def card_meaning(block, count=2):
    """Nghĩa ngắn cho flashcard: tối đa `count` nghĩa đầu dùng được của khối, đã bỏ nhãn đầu dòng."""
    picks = [c for c in (_strip_leading_notes(m['vi']) for m in _usable(block['meanings'])) if c][:count]
    return _short('; '.join(picks))


def first_example(block):
    for m in block['meanings']:
        if m['examples']:
            return m['examples'][0]
    return None


def _finalize(word, ipa, data, see):
    """Từ + phiên âm + dữ liệu (senses/idioms/domains) -> dict các cột của bảng lexicon_entries."""
    senses, domains = data['senses'], data['domains']
    general = [m for b in senses for m in b['meanings']]
    examples = sum(len(m['examples']) for m in general)
    main, example = '', None
    best = pick_block([(b['pos'], [{'vi': m['vi'], 'examples': m['examples']} for m in b['meanings']]) for b in senses])
    if best is not None:
        main, example = card_meaning(senses[best]), first_example(senses[best])
    elif domains:
        main = _short('; '.join(domains[0]['meanings'][:2]))
    return {
        'word': word[:60],
        'ipa': (ipa or '')[:120] or None,
        'pos_list': ','.join(dict.fromkeys(b['pos'] for b in senses))[:120],
        'main_meaning': main,
        'example_en': example['en'] if example else None,
        'example_vi': (example['vi'] or None) if example else None,
        'see_also': see,
        'has_domain': bool(domains),
        'weight': min(500, len(general) + 2 * examples),
        'data': json.dumps(data, ensure_ascii=False, separators=(',', ':')),
    }


def build_record(entry):
    """Mục thô -> dict các cột của bảng lexicon_entries."""
    parsed = parse_lines(entry['lines'])
    data = {'senses': parsed['senses'], 'idioms': parsed['idioms'], 'domains': parsed['domains']}
    return _finalize(entry['head'], entry['ipa'], data, parsed['see'])


def merge_records(a, b):
    """Gộp 2 bản ghi trùng từ (nguồn có ~250 từ trùng): nối nghĩa, giữ phiên âm đầu tiên."""
    da, db_ = json.loads(a['data']), json.loads(b['data'])
    known = {(s['pos'], tuple(m['vi'] for m in s['meanings'])) for s in da['senses']}
    da['senses'] += [s for s in db_['senses'] if (s['pos'], tuple(m['vi'] for m in s['meanings'])) not in known]
    phrases = {i['phrase'] for i in da['idioms']}
    da['idioms'] += [i for i in db_['idioms'] if i['phrase'] not in phrases][:max(0, MAX_IDIOMS - len(da['idioms']))]
    da['domains'] += db_['domains']
    see = None if da['senses'] else (a['see_also'] or b['see_also'])
    return _finalize(a['word'], a['ipa'] or b['ipa'], da, see)


def build_all(html_text, limit=None):
    """Toàn bộ HTML -> (danh sách bản ghi đã gộp trùng, thống kê)."""
    records, order = {}, []
    stats = {'paragraphs': 0, 'entries': 0, 'duplicates_merged': 0, 'empty': 0}
    for paragraph in iter_paragraphs(html_text):
        stats['paragraphs'] += 1
        entry = parse_paragraph(paragraph)
        if not entry:
            continue
        rec = build_record(entry)
        if not json.loads(rec['data'])['senses'] and not rec['has_domain'] and not rec['see_also']:
            stats['empty'] += 1
            continue
        stats['entries'] += 1
        if rec['word'] in records:
            records[rec['word']] = merge_records(records[rec['word']], rec)
            stats['duplicates_merged'] += 1
        else:
            records[rec['word']] = rec
            order.append(rec['word'])
        if limit and len(order) >= limit:
            break
    return [records[w] for w in order], stats


# ───────────────────────── bản ghi -> dạng API dùng chung với giao diện ─────────────────────────
def to_api_entry(record, redirected_from=None, matched_from=None):
    """Dạng `entry` khớp với dữ liệu mà /api/dictionary/lookup đã trả (meanings/definitions/...)."""
    data = json.loads(record['data']) if isinstance(record['data'], str) else record['data']
    grouped = {}                                       # gộp ngoại/nội động từ... về cùng khóa tiếng Anh
    for block_index, s in enumerate(data['senses']):
        g = grouped.setdefault(s['pos'], {'pos': s['pos'], 'labels': [], 'notes': [], 'definitions': []})
        label = (s['label'] or '').capitalize()
        if label and label not in g['labels']:
            g['labels'].append(label)
        if s.get('note') and s['note'] not in g['notes']:
            g['notes'].append(s['note'])
        for m in s['meanings']:
            g['definitions'].append({
                'definition_en': None, 'meaning_vi': m['vi'],
                'example': m['examples'][0]['en'] if m['examples'] else None,
                'example_vi': (m['examples'][0]['vi'] or None) if m['examples'] else None,
                'examples': m['examples'],
                'block': block_index,                      # khối nguồn (để chọn nghĩa cho flashcard, xem card_for)
            })
    meanings = [{
        'pos': g['pos'], 'pos_label': ' / '.join(g['labels']) or None, 'note': '; '.join(g['notes']) or None,
        'definitions': g['definitions'], 'synonyms': [], 'antonyms': [],
    } for g in grouped.values()]
    return {
        'word': record['word'], 'phonetic': record.get('ipa') or '', 'audio': {'us': '', 'uk': ''},
        'meanings': meanings,
        'idioms': [{'phrase': i['phrase'], 'meanings': i['meanings']} for i in data['idioms']],
        'domains': data['domains'],
        'vi_complete': True, 'origin': 'lexicon',
        'redirected_from': redirected_from, 'matched_from': matched_from,
    }


def card_for(entry, pos=None):
    """Thẻ học (nghĩa ngắn + ví dụ) từ entry dạng API. Chọn khối nghĩa tốt nhất (pick_block) trong các khối của `pos` nếu có
    (ngược lại trong mọi khối); nghĩa hỏng sẵn trong nguồn bị bỏ qua. Trả None nếu không có nghĩa dùng được."""
    blocks = []                                           # (pos, [định nghĩa]) theo khối nguồn, giữ thứ tự từ điển
    for g in entry['meanings']:
        if pos and g['pos'] != pos.lower():
            continue
        by_block = {}
        for d in g['definitions']:
            by_block.setdefault(d.get('block', 0), []).append(d)
        blocks += [(g['pos'], defs) for _, defs in sorted(by_block.items())]
    if not blocks and pos:
        return card_for(entry)                            # `pos` không có trong từ này: dùng khối tốt nhất bất kỳ
    best = pick_block([(p, [{'vi': d.get('meaning_vi'), 'examples': d.get('examples') or []} for d in defs]) for p, defs in blocks])
    if best is None:
        return None
    block_pos, defs = blocks[best]
    usable = [d for d in defs if not is_junk_meaning(d.get('meaning_vi'))]
    meanings = [c for c in (_strip_leading_notes(d['meaning_vi']) for d in usable) if c][:2]
    first = next((d for d in usable if d.get('example')), None)
    return {
        'pos': block_pos, 'meaning_vi': _short('; '.join(meanings)) if meanings else '',
        'example': first['example'] if first else None, 'example_vi': first.get('example_vi') if first else None,
    }

def parse_overrides(text):
    """data/card_overrides.json -> {từ: {'pos', 'meaning', 'example'?, 'example_vi'?}}.

    Một số từ tự chọn nghĩa vẫn sai (nguồn xếp nghĩa hiếm/cổ lên đầu, hoặc nghĩa bị hỏng): file này cho phép GHI ĐÈ nghĩa
    trên flashcard bằng nghĩa viết tay. Chỉ ảnh hưởng thẻ học, không ảnh hưởng trang chi tiết từ. Dữ liệu sai cấu trúc -> ValueError."""
    import json as _json
    raw = _json.loads(text)
    if not isinstance(raw, dict):
        raise ValueError('card_overrides.json phải là một object {từ: {...}}')
    valid_pos = set(POS_EN.values())
    out = {}
    for word, spec in raw.items():
        key = str(word).strip().lower()
        if not re.fullmatch(r"[a-z][a-z'\-]*", key):
            raise ValueError(f'từ không hợp lệ: {word!r}')
        if not isinstance(spec, dict) or not isinstance(spec.get('meaning'), str) or not spec['meaning'].strip():
            raise ValueError(f'"{word}": thiếu "meaning" (chuỗi không rỗng)')
        pos = spec.get('pos')
        if pos is not None and pos not in valid_pos:
            raise ValueError(f'"{word}": pos phải là một trong {sorted(valid_pos)}')
        out[key] = {'pos': pos, 'meaning': _short(spec['meaning']), 'example': spec.get('example'), 'example_vi': spec.get('example_vi')}
    return out


def apply_override(card, override):
    """Thẻ sau khi áp nghĩa ghi đè. Ví dụ của từ điển bị bỏ (có thể thuộc nghĩa khác) trừ khi override tự kèm ví dụ."""
    if not override:
        return card
    base = card or {'pos': override.get('pos') or 'noun'}
    return {'pos': override.get('pos') or base['pos'], 'meaning_vi': override['meaning'],
            'example': override.get('example'), 'example_vi': override.get('example_vi')}


def parse_wordlist(text):
    """File danh sách từ theo chủ đề -> (meta, [từ]). Dòng `# name: ...` / `# icon:` / `# color:` / `# description:` là thông tin
    folder; các dòng khác là từ (cách nhau bằng dấu cách/phẩy), giữ đúng thứ tự, bỏ trùng, chữ thường."""
    meta, words = {}, []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith('#'):
            m = re.match(r'^#\s*(name|icon|color|description)\s*:\s*(.+)$', line, re.I)
            if m:
                meta[m.group(1).lower()] = m.group(2).strip()
            continue
        for token in re.split(r'[\s,;]+', line):
            token = token.strip().lower()
            if re.fullmatch(r"[a-z][a-z'\-]*", token) and token not in words:
                words.append(token)
    return meta, words


def is_redirect(record):
    """Mục chỉ để trỏ sang từ khác (went -> go): không có nghĩa riêng hoặc nghĩa duy nhất là "như <từ>"."""
    see = record.get('see_also')
    if not see:
        return False
    if not record.get('pos_list') and not record.get('has_domain'):
        return True
    return (record.get('main_meaning') or '').strip().lower().rstrip('.') == f'như {see}'


# ───────────────────────── đưa dạng biến đổi về dạng gốc ─────────────────────────
def lemma_candidates(word):
    """Các dạng gốc có thể có của `word` (đã chữ thường), theo thứ tự thử. Chỉ dùng khi từ KHÔNG có trong kho."""
    w, out = word.lower(), []

    def add(x):
        if len(x) >= 2 and x != w and x not in out:
            out.append(x)

    doubled = lambda s: len(s) >= 3 and s[-1] == s[-2] and s[-1] not in 'aeiou'
    if w.endswith('ies'):
        add(w[:-3] + 'y')
    if w.endswith('ves'):
        add(w[:-3] + 'f')
        add(w[:-3] + 'fe')
    if w.endswith(('ches', 'shes', 'sses', 'xes', 'zes', 'oes')):
        add(w[:-2])
    if w.endswith('s') and not w.endswith('ss'):
        add(w[:-1])
    if w.endswith('es'):
        add(w[:-2])
    if w.endswith('ied'):
        add(w[:-3] + 'y')
    if w.endswith('ed'):
        stem = w[:-2]
        if doubled(stem):
            add(stem[:-1])
        add(w[:-1])
        add(stem)
    if w.endswith('ing'):
        stem = w[:-3]
        if doubled(stem):
            add(stem[:-1])
        add(stem + 'e')
        add(stem)
    for suffix in ('est', 'er'):
        if w.endswith(suffix):
            stem = w[:-len(suffix)]
            if stem.endswith('i'):
                add(stem[:-1] + 'y')
            if doubled(stem):
                add(stem[:-1])
            add(stem + 'e')
            add(stem)
    if w.endswith('ily'):
        add(w[:-3] + 'y')
    if w.endswith('ly'):
        add(w[:-2])
    return out
