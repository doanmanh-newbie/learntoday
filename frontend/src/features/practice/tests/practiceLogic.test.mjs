import test from 'node:test';
import assert from 'node:assert/strict';
import { usableWords, enoughWords, buildQuiz, scoreQuiz, gradeLabel, buildMatchRound, isMatch, maskedWord, formatSeconds, readBest, saveBestIfBetter } from '../practiceLogic.js';

const W = (id, word, meaning) => ({ id, word, meaning });
const pool = [W(1, 'apple', 'quả táo'), W(2, 'book', 'quyển sách'), W(3, 'cat', 'con mèo'), W(4, 'dog', 'con chó'), W(5, 'egg', 'quả trứng'), W(6, 'fish', 'con cá')];
const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test('usableWords bỏ từ thiếu nghĩa và trùng', () => {
  assert.equal(usableWords([...pool, W(9, 'APPLE', 'x'), W(10, 'zzz', ''), null]).length, 6);
  assert.equal(enoughWords(pool.slice(0, 3)), false);
  assert.equal(enoughWords(pool.slice(0, 4)), true);
});
test('buildQuiz: đáp án đúng luôn nằm trong lựa chọn, không trùng', () => {
  for (let k = 0; k < 30; k++) {
    for (const q of buildQuiz(pool, 6)) {
      assert.ok(q.choices.includes(q.answer));
      assert.equal(new Set(q.choices).size, q.choices.length);
    }
  }
});
test('buildQuiz: đủ nhiều dạng câu hỏi, không dồn một dạng', () => {
  const withEx = pool.map((w) => ({ ...w, examples: [{ en: `I really like the ___ very much.`, vi: '' }] }));
  const kinds = buildQuiz(withEx, 6).map((q) => q.kind);
  assert.ok(new Set(kinds).size >= 3, `chỉ có dạng: ${kinds}`);
});
test('buildQuiz: dạng điền chỗ trống có câu chứa ___, từ không có ví dụ thì chuyển dạng khác', () => {
  const noEx = pool.map((w) => ({ ...w, examples: [{ en: '___', vi: w.meaning }] }));
  assert.ok(buildQuiz(noEx, 6).every((q) => q.kind !== 'blank'));
  const withEx = pool.map((w) => ({ ...w, examples: [{ en: 'We eat the ___ every day at home.', vi: '' }] }));
  for (const q of buildQuiz(withEx, 6, Math.random, ['blank'])) assert.ok(q.prompt.includes('___'));
});
test('buildQuiz: dạng nghe chọn nghĩa trả đáp án là nghĩa', () => {
  for (const q of buildQuiz(pool, 6, Math.random, ['listen'])) { assert.equal(q.answer, q.word.meaning); assert.ok(q.choices.includes(q.answer)); }
});
test('scoreQuiz và gradeLabel', () => {
  assert.equal(scoreQuiz([true, false, true]), 2);
  assert.equal(gradeLabel(9, 10), 'Xuất sắc!');
  assert.equal(gradeLabel(0, 0), '');
});
test('buildMatchRound: hai cột cùng bộ id; isMatch', () => {
  const r = buildMatchRound(pool, 4);
  assert.equal(r.left.length, 4);
  assert.deepEqual(r.left.map((x) => x.id).sort(), r.right.map((x) => x.id).sort());
  assert.ok(isMatch(2, 2)); assert.ok(!isMatch(2, 3)); assert.ok(!isMatch(null, null));
});
test('maskedWord, formatSeconds', () => {
  assert.equal(maskedWord('apple'), 'a____');
  assert.equal(formatSeconds(75), '1:15');
  assert.equal(formatSeconds(-3), '0:00');
});
test('kỷ lục chỉ ghi khi tốt hơn', () => {
  const s = mem();
  assert.equal(saveBestIfBetter('quiz', 5, s), true);
  assert.equal(saveBestIfBetter('quiz', 5, s), false);
  assert.equal(saveBestIfBetter('quiz', 7, s), true);
  assert.equal(readBest('quiz', s), 7);
});
