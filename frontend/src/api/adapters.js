// src/api/adapters.js
// MỘT nơi duy nhất chuyển từ vựng backend -> dạng UI dùng. Trước đây đoạn map này chép ở 3 nơi
// (LearnPage, ReviewPage, Dashboard) với khác biệt nhỏ, và quan trọng hơn: ví dụ KHÔNG được che
// từ cần học bằng "___" nên bài điền từ/chính tả lộ luôn đáp án.

const POS_SHORT = { noun: 'n', verb: 'v', adjective: 'adj', adverb: 'adv', preposition: 'prep', pronoun: 'pron', conjunction: 'conj' };

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Dạng bất quy tắc thường gặp (động từ + danh từ số nhiều). Dạng có quy tắc (-s/-es/-ed/-ing/-ies/-ied, gấp đôi phụ âm) được sinh tự động.
const IRREGULAR_FORMS = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'], begin: ['began', 'begun'], break: ['broke', 'broken'],
  bring: ['brought'], build: ['built'], buy: ['bought'], catch: ['caught'], choose: ['chose', 'chosen'],
  come: ['came'], cost: [], cut: [], deal: ['dealt'], do: ['did', 'done', 'does'], draw: ['drew', 'drawn'],
  drink: ['drank', 'drunk'], drive: ['drove', 'driven'], eat: ['ate', 'eaten'], fall: ['fell', 'fallen'],
  feel: ['felt'], fight: ['fought'], find: ['found'], fly: ['flew', 'flown'], forget: ['forgot', 'forgotten'],
  get: ['got', 'gotten'], give: ['gave', 'given'], go: ['went', 'gone', 'goes'], grow: ['grew', 'grown'],
  have: ['had', 'has'], hear: ['heard'], hide: ['hid', 'hidden'], hold: ['held'], keep: ['kept'], know: ['knew', 'known'],
  lead: ['led'], leave: ['left'], lend: ['lent'], let: [], lose: ['lost'], make: ['made'], mean: ['meant'],
  meet: ['met'], pay: ['paid'], put: [], read: [], ride: ['rode', 'ridden'], rise: ['rose', 'risen'], run: ['ran'],
  say: ['said'], see: ['saw', 'seen'], sell: ['sold'], send: ['sent'], set: [], shake: ['shook', 'shaken'],
  show: ['shown'], sing: ['sang', 'sung'], sit: ['sat'], sleep: ['slept'], speak: ['spoke', 'spoken'],
  spend: ['spent'], stand: ['stood'], steal: ['stole', 'stolen'], swim: ['swam', 'swum'], take: ['took', 'taken'],
  teach: ['taught'], tell: ['told'], think: ['thought'], throw: ['threw', 'thrown'], understand: ['understood'],
  wake: ['woke', 'woken'], wear: ['wore', 'worn'], win: ['won'], write: ['wrote', 'written'],
  child: ['children'], man: ['men'], woman: ['women'], person: ['people'], foot: ['feet'], tooth: ['teeth'],
  mouse: ['mice'], life: ['lives'], knife: ['knives'], wife: ['wives'], leaf: ['leaves'], wolf: ['wolves'],
  good: ['better', 'best'], bad: ['worse', 'worst'], far: ['further', 'farther'],
};

/** Mọi dạng của `word` mà ta nhận ra (gồm chính nó), chữ thường, không trùng. */
export function wordForms(word) {
  const w = String(word).toLowerCase();
  const forms = new Set([w, `${w}s`, `${w}es`]);
  const consonantY = /[^aeiou]y$/.test(w);
  if (consonantY) {
    forms.add(`${w.slice(0, -1)}ies`);
    forms.add(`${w.slice(0, -1)}ied`);
    forms.add(`${w}ing`);
  } else if (w.endsWith('e')) {
    forms.add(`${w}d`);
    forms.add(`${w.slice(0, -1)}ing`);
  } else {
    forms.add(`${w}ed`);
    forms.add(`${w}ing`);
  }
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(w)) {           // run -> running/runner-like, stop -> stopped
    const doubled = w + w.slice(-1);
    forms.add(`${doubled}ed`);
    forms.add(`${doubled}ing`);
  }
  (IRREGULAR_FORMS[w] || []).forEach((f) => forms.add(f));
  return [...forms];
}

/**
 * Che từ cần học trong câu ví dụ: che MỌI chỗ xuất hiện, kể cả biến thể (-s/-es/-ed/-ing/-ies, gấp đôi phụ âm, dạng bất quy tắc
 * như ran/went/children). Trả null (-> dùng câu dự phòng, KHÔNG để lộ đáp án) nếu câu không chứa từ, hoặc sau khi che vẫn còn
 * một dạng khác của từ mà ta không nhận ra (vd "studies" khi từ gốc là "study" nhưng quy tắc không bắt được).
 */
export function blankWord(sentence, word) {
  if (!sentence || !word) return null;
  const forms = wordForms(word).sort((a, b) => b.length - a.length).map(escapeRegExp);
  const re = new RegExp(`\\b(?:${forms.join('|')})\\b`, 'gi');
  if (!re.test(sentence)) return null;
  const blanked = sentence.replace(re, '___');
  const stem = String(word).toLowerCase().slice(0, Math.max(3, String(word).length - 2));
  return new RegExp(`\\b${escapeRegExp(stem)}`, 'i').test(blanked) ? null : blanked;
}

export function shortPos(wordType) {
  if (!wordType) return 'n';
  const key = String(wordType).toLowerCase();
  return POS_SHORT[key] || (key.length <= 4 ? key : key.slice(0, 4));
}

/** @param w từ do API trả về (Word.to_dict() + level/next_review nếu có) */
export function toUiWord(w) {
  const level = w.level ?? w.lv ?? 0;
  const meaning = w.meaning || '';

  // example_meaning cũ có thể chỉ là bản copy tiếng Anh (crawl lỗi) -> không hiển thị làm "tiếng Việt"
  const exVi = w.example_meaning && w.example_meaning !== w.example ? w.example_meaning : '';
  const blanked = blankWord(w.example, w.word);
  const examples = Array.isArray(w.examples) && w.examples.length
    ? w.examples
    : [blanked
        ? { en: blanked, vi: exVi }
        : { en: '___', vi: meaning }];       // không có ví dụ dùng được: vẫn đủ để làm bài (hiện nghĩa tiếng Việt)

  return {
    id: w.id,
    word: w.word,
    phonetic: w.pronunciation || w.phonetic || '',
    pronunciation: w.pronunciation || w.phonetic || '',
    pos: shortPos(w.word_type || w.pos),
    word_type: w.word_type || w.pos || 'noun',
    meaning,
    meaning_en: w.meaning_en || '',
    example: w.example || '',
    example_meaning: w.example_meaning || '',
    examples,
    audio_url: w.audio_url || '',
    difficulty: w.difficulty || 1,
    lv: level,
    level,
    next_review: w.next_review || null,
  };
}

const POS_VI = {
  noun: 'Danh từ', verb: 'Động từ', adjective: 'Tính từ', adverb: 'Trạng từ', preposition: 'Giới từ',
  pronoun: 'Đại từ', conjunction: 'Liên từ', interjection: 'Thán từ', exclamation: 'Thán từ', article: 'Mạo từ',
  determiner: 'Từ hạn định', numeral: 'Số từ', other: 'Khác',
};

export const posLabelVi = (pos) => POS_VI[String(pos || '').toLowerCase()] || pos || 'Khác';

/** Mục từ điển từ /api/dictionary/lookup -> dạng UI: có sẵn nhãn tiếng Việt cho từ loại và cờ chưa-dịch. */
export function toUiEntry(entry) {
  return {
    word: entry.word,
    phonetic: entry.phonetic || '',
    audio: entry.audio || {},
    viComplete: !!entry.vi_complete,
    origin: entry.origin || '',                       // 'lexicon' = từ điển Anh-Việt tích hợp (không có định nghĩa tiếng Anh)
    redirectedFrom: entry.redirected_from || '',      // vd: tra "went" -> hiển thị mục "go"
    matchedFrom: entry.matched_from || '',            // vd: tra "studies" -> hiển thị mục "study"
    meanings: (entry.meanings || []).map((m) => ({
      pos: m.pos,
      posLabel: m.pos_label || posLabelVi(m.pos),     // nhãn gốc của từ điển (vd "Ngoại động từ") nếu có
      note: m.note || '',                              // vd: "took; taken", "số nhiều goes"
      synonyms: m.synonyms || [],
      antonyms: m.antonyms || [],
      definitions: (m.definitions || []).map((d) => ({
        en: d.definition_en || '',
        vi: d.meaning_vi || '',          // rỗng = CHƯA dịch (không bao giờ điền tiếng Anh vào đây)
        example: d.example || '',
        exampleVi: d.example_vi || '',
        examples: d.examples && d.examples.length ? d.examples : (d.example ? [{ en: d.example, vi: d.example_vi || '' }] : []),
      })),
    })),
    idioms: (entry.idioms || []).map((i) => ({ phrase: i.phrase, meanings: i.meanings || [] })),
    domains: entry.domains || [],
  };
}
