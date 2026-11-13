// Logic thuần cho các chế độ Luyện tập (không có UI, test được bằng node).
import { shuffle } from '../../utils/helpers';
import { meaningChoices, wordChoices, normalizeText, sameText } from '../learning/quizChoices';

export const MIN_WORDS = 4;

/** Từ dùng được để luyện: có chữ và có nghĩa tiếng Việt, bỏ trùng. */
export function usableWords(words) {
  const seen = new Set();
  const out = [];
  for (const w of words || []) {
    if (!w || !w.word || !String(w.meaning || '').trim()) continue;
    const key = normalizeText(w.word);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(w);
  }
  return out;
}

export const enoughWords = (words) => usableWords(words).length >= MIN_WORDS;

export function pickWords(words, n) {
  return shuffle(usableWords(words)).slice(0, n);
}

/** Câu có chỗ trống dùng được làm câu hỏi: ví dụ đã che từ (có "___") và còn đủ chữ để đoán. */
export function blankSentence(word) {
  const ex = (word.examples || []).find((e) => e && typeof e.en === 'string' && e.en.includes('___') && e.en.replace(/_/g, '').trim().split(/\s+/).length >= 3);
  return ex ? ex.en : null;
}

export const QUIZ_KINDS = ['meaning', 'word', 'blank', 'listen'];

function makeQuestion(kind, w, pool) {
  if (kind === 'meaning') return { id: w.id, kind, prompt: w.word, answer: w.meaning, choices: meaningChoices(w, pool), word: w };
  if (kind === 'word') return { id: w.id, kind, prompt: w.meaning, answer: w.word, choices: wordChoices(w, pool), word: w };
  if (kind === 'blank') return { id: w.id, kind, prompt: blankSentence(w), hint: w.meaning, answer: w.word, choices: wordChoices(w, pool), word: w };
  return { id: w.id, kind: 'listen', prompt: w.word, answer: w.meaning, choices: meaningChoices(w, pool), word: w };   // nghe rồi chọn nghĩa
}

/**
 * Bộ câu hỏi trắc nghiệm có NHIỀU DẠNG: hỏi nghĩa, hỏi từ, điền chỗ trống trong câu, nghe rồi chọn nghĩa.
 * Các dạng được chia luân phiên (không dồn một dạng), dạng không dùng được cho từ nào (vd thiếu câu ví dụ) thì thử dạng khác.
 * `random` chỉ để test.
 */
export function buildQuiz(words, n = 10, random = Math.random, kinds = QUIZ_KINDS) {
  const pool = usableWords(words);
  const picked = pickWords(pool, n);
  const order = [];
  while (order.length < picked.length) order.push(...shuffle(kinds, random));
  return picked.map((w, i) => {
    const wanted = order[i];
    const tryOrder = [wanted, ...kinds.filter((k) => k !== wanted)];
    const kind = tryOrder.find((k) => k !== 'blank' || blankSentence(w)) || 'meaning';
    return makeQuestion(kind, w, pool);
  });
}

export const scoreQuiz = (answers) => answers.filter(Boolean).length;

export function gradeLabel(correct, total) {
  if (!total) return '';
  const r = correct / total;
  if (r >= 0.9) return 'Xuất sắc!';
  if (r >= 0.7) return 'Tốt lắm!';
  if (r >= 0.5) return 'Khá ổn, luyện thêm nhé';
  return 'Cần ôn lại những từ này';
}

/** Ghép cặp: một ván gồm `size` từ -> cột từ tiếng Anh và cột nghĩa đã xáo riêng. */
export function buildMatchRound(words, size = 6) {
  const picked = pickWords(words, size);
  return {
    left: shuffle(picked.map((w) => ({ id: w.id, text: w.word }))),
    right: shuffle(picked.map((w) => ({ id: w.id, text: w.meaning }))),
  };
}

export const isMatch = (leftId, rightId) => leftId != null && leftId === rightId;

/** Che từ trong chuỗi bằng gạch dưới (cho bài nghe-chép gợi ý chữ cái đầu). */
export function maskedWord(word) {
  const w = String(word || '');
  return w.length <= 1 ? w : w[0] + w.slice(1).replace(/[A-Za-z]/g, '_');
}

export function formatSeconds(s) {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

const bestKey = (mode) => `lt_best_${mode}`;
export function readBest(mode, storage = globalThis.localStorage) {
  try { const v = Number(storage?.getItem(bestKey(mode))); return Number.isFinite(v) && v > 0 ? v : null; } catch { return null; }
}
/** Lưu nếu tốt hơn (điểm cao hơn là tốt hơn). Trả true nếu là kỷ lục mới. */
export function saveBestIfBetter(mode, score, storage = globalThis.localStorage) {
  const prev = readBest(mode, storage);
  if (prev != null && score <= prev) return false;
  try { storage?.setItem(bestKey(mode), String(score)); } catch { return false; }
  return true;
}

export { sameText };
