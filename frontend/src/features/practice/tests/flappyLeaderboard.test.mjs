import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMe } from '../flappyLeaderboardLogic.js';

const rows = [{ rank: 1, username: 'a', score: 9, correct: 5, is_me: false }, { rank: 2, username: 'b', score: 7, correct: 4, is_me: false }];

test('me ngoài top: thêm một hàng cuối is_me', () => {
  const out = mergeMe(rows, { rank: 77, score: 3 });
  assert.equal(out.length, 3);
  assert.deepEqual(out[2], { rank: 77, username: 'Bạn', score: 3, correct: null, is_me: true, outside: true });
  assert.equal(rows.length, 2);
});
test('me đã trong rows: không thêm', () => {
  const r = [rows[0], { ...rows[1], is_me: true }];
  assert.equal(mergeMe(r, { rank: 2, score: 7 }), r);
});
test('me null: giữ nguyên', () => {
  assert.equal(mergeMe(rows, null), rows);
});
