// src/features/learning/quizChoices.js - logic thuần cho bài trắc nghiệm / chấm đáp án (không có UI, test được bằng node)
import { shuffle } from '../../utils/helpers';

/** Chuẩn hóa để so sánh: Unicode NFC (tiếng Việt có dấu có thể được mã hóa khác nhau), thường, gộp khoảng trắng. */
export function normalizeText(text) {
  return String(text ?? '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
}

export const sameText = (a, b) => normalizeText(a) === normalizeText(b);

/**
 * Trộn đáp án đúng với tối đa `count` đáp án nhiễu lấy từ `candidates`.
 * Loại đáp án nhiễu rỗng, trùng nhau, hoặc trùng với đáp án đúng: nếu không loại, 2 từ cùng nghĩa (hoặc cùng chữ) sẽ cho ra
 * 2 lựa chọn giống hệt nhau, hoặc 2 lựa chọn "đúng" mà chỉ 1 cái được chấm.
 */
export function buildChoices(correct, candidates, count = 3) {
  const seen = new Set([normalizeText(correct)]);
  const picks = [];
  for (const candidate of shuffle(candidates)) {
    const key = normalizeText(candidate);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    picks.push(candidate);
    if (picks.length >= count) break;
  }
  return shuffle([correct, ...picks]);
}

/** Lựa chọn nghĩa tiếng Việt cho `word` (từ trong `pool`; bỏ chính nó). */
export function meaningChoices(word, pool, count = 3) {
  return buildChoices(word.meaning, pool.filter((w) => w.id !== word.id).map((w) => w.meaning), count);
}

/**
 * Lựa chọn từ tiếng Anh cho nghĩa của `word`. Loại cả những từ có CÙNG NGHĨA với từ đúng (vd "beautiful" và "pretty" cùng nghĩa
 * "đẹp") vì khi câu hỏi hiện nghĩa tiếng Việt thì chúng cũng là đáp án đúng.
 */
export function wordChoices(word, pool, count = 3) {
  const others = pool.filter((w) => w.id !== word.id && w.word && !sameText(w.meaning, word.meaning));
  return buildChoices(word.word, others.map((w) => w.word), count);
}
