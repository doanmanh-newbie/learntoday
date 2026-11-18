import test from 'node:test';
import assert from 'node:assert/strict';
import { initPlacement, answerPlacement, placementResult, PLACEMENT_LEVELS, questionFor } from '../placement.js';

const run = (answers) => answers.reduce((s, ok) => (s.done ? s : answerPlacement(s, ok)), initPlacement());

test('placement: trượt ngay mức đầu -> A1', () => {
  const s = run([false, false, false]);
  assert.equal(s.done, true);
  assert.equal(placementResult(s).level, 'A1');
});
test('placement: qua A1 (2/3) rồi trượt B1 -> A1 đã đạt, gợi ý giai đoạn tương ứng', () => {
  const s = run([true, false, true, false, false, true]);
  assert.equal(s.done, true);
  assert.equal(placementResult(s).level, 'A1');
});
test('placement: qua A1, B1 rồi trượt B2 -> B1', () => {
  const s = run([true, true, true, true, true, false, false, false, false]);
  assert.equal(placementResult(s).level, 'B1');
});
test('placement: đúng hết -> IELTS, tối đa 3 câu mỗi mức', () => {
  const s = run(Array(30).fill(true));
  assert.equal(placementResult(s).level, 'IELTS');
  assert.equal(s.answered, PLACEMENT_LEVELS.length * 3);
});
test('placement: stageIndex tăng theo trình độ', () => {
  const lo = placementResult(run([false, false, false])).stageIndex;
  const hi = placementResult(run(Array(30).fill(true))).stageIndex;
  assert.ok(hi > lo);
});
test('questionFor: 4 lựa chọn, có đáp án đúng', () => {
  const q = questionFor(initPlacement(), () => 0.5);
  assert.equal(q.choices.length, 4);
  assert.ok(q.choices.includes(q.answer));
});
