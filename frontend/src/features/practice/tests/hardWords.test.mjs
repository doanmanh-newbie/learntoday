import test from 'node:test';
import assert from 'node:assert/strict';
import { hardScore, buildHardQueue, requeue } from '../hardWords.js';

function seeded(seed = 7) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

test('hardScore: sai nhiều, đúng ít -> điểm cao hơn', () => {
  assert.ok(hardScore(5, 1) > hardScore(1, 5));
  assert.ok(hardScore(3, 0) > hardScore(1, 0));
  assert.equal(hardScore(0, 9), 0);
});
test('buildHardQueue: từ khó xuất hiện nhiều hơn', () => {
  const words = [{ id: 'a', wrong_count: 8, correct_count: 0 }, { id: 'b', wrong_count: 1, correct_count: 6 }, { id: 'c', wrong_count: 1, correct_count: 6 }];
  const q = buildHardQueue(words, 60, seeded());
  assert.equal(q.length, 60);
  const n = (id) => q.filter((w) => w.id === id).length;
  assert.ok(n('a') > n('b') && n('a') > n('c'));
});
test('buildHardQueue: không có 2 từ giống nhau đứng liền', () => {
  const words = [{ id: 'a', wrong_count: 9, correct_count: 0 }, { id: 'b', wrong_count: 1, correct_count: 0 }];
  const q = buildHardQueue(words, 40, seeded(3));
  for (let i = 1; i < q.length; i++) assert.notEqual(q[i].id, q[i - 1].id);
});
test('buildHardQueue: danh sách rỗng hoặc 1 từ', () => {
  assert.deepEqual(buildHardQueue([], 10), []);
  assert.equal(buildHardQueue([{ id: 'x', wrong_count: 2, correct_count: 0 }], 10).length, 1);
});
test('requeue: chèn lại từ sai sau gap câu', () => {
  const q = ['a', 'b', 'c', 'd', 'e'];
  assert.deepEqual(requeue(q, 0, 'a', 3), ['a', 'b', 'c', 'd', 'a', 'e']);
  assert.deepEqual(requeue(['a', 'b'], 0, 'a', 3), ['a', 'b', 'a']);
});
