// src/api/adapters.js
// MỘT nơi duy nhất chuyển từ vựng backend -> dạng UI dùng. Trước đây đoạn map này chép ở 3 nơi
// (LearnPage, ReviewPage, Dashboard) với khác biệt nhỏ, và quan trọng hơn: ví dụ KHÔNG được che
// từ cần học bằng "___" nên bài điền từ/chính tả lộ luôn đáp án.

const POS_SHORT = { noun: 'n', verb: 'v', adjective: 'adj', adverb: 'adv', preposition: 'prep', pronoun: 'pron', conjunction: 'conj' };

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Che từ cần học trong câu ví dụ (kèm biến thể -s/-es/-ed/-d/-ing). Trả null nếu câu không chứa từ. */
export function blankWord(sentence, word) {
  if (!sentence || !word) return null;
  const re = new RegExp(`\\b${escapeRegExp(word)}(?:s|es|ed|d|ing)?\\b`, 'i');
  return re.test(sentence) ? sentence.replace(re, '___') : null;
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
    lv: level,
    level,
    next_review: w.next_review || null,
  };
}
