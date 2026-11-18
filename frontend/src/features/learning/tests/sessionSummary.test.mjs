import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSession } from '../sessionSummary.js';

const words = [{ id: 1, word: 'apple' }, { id: 2, word: 'brave' }, { id: 3, word: 'cloud' }, { id: 4, word: 'dance' }, { id: 5, word: 'eager' }];

test('summarizeSession: độ chính xác làm tròn', () => {
  const s = summarizeSession({ words, wrongCounts: {}, answered: 3, correct: 2 });
  assert.equal(s.count, 5);
  assert.equal(s.accuracy, 67);
});
test('summarizeSession: từ sai nhiều nhất, tối đa 3, giảm dần', () => {
  const s = summarizeSession({ words, wrongCounts: { 1: 1, 2: 4, 3: 2, 4: 3 }, answered: 30, correct: 20 });
  assert.deepEqual(s.hardest.map((h) => h.word), ['brave', 'dance', 'cloud']);
  assert.equal(s.hardest[0].wrong, 4);
});
test('summarizeSession: chưa làm câu nào -> accuracy null, không chia cho 0', () => {
  const s = summarizeSession({ words: [], wrongCounts: {}, answered: 0, correct: 0 });
  assert.equal(s.accuracy, null);
  assert.deepEqual(s.hardest, []);
});
test('summarizeSession: lời nhắc ngày mai theo số từ đến hạn', () => {
  assert.match(summarizeSession({ words, wrongCounts: {}, answered: 5, correct: 5, dueTomorrow: 12 }).reminder, /12 từ/);
  assert.match(summarizeSession({ words, wrongCounts: { 2: 3 }, answered: 5, correct: 2 }).reminder, /brave/);
});
