import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRACTOR_BANK, buildPool } from '../distractorBank.js';
import { meaningChoices, wordChoices } from '../quizChoices.js';

test('chỉ còn 1 từ chưa học vẫn đủ 4 lựa chọn (lỗi báo cáo: chỉ có 1 đáp án)', () => {
  const only = { id: 'w1', word: 'zebra', meaning: 'ngựa vằn' };
  const pool = buildPool([only], DISTRACTOR_BANK);
  const m = meaningChoices(only, pool);
  const w = wordChoices(only, pool);
  assert.equal(m.length, 4);
  assert.equal(w.length, 4);
  assert.equal(new Set(m).size, 4);
  assert.ok(m.includes('ngựa vằn') && w.includes('zebra'));
});
test('buildPool: bỏ trùng id và trùng chữ, từ thật đứng trước', () => {
  const real = [{ id: 'a', word: 'Table', meaning: 'bàn thật' }];
  const pool = buildPool(real, DISTRACTOR_BANK);
  assert.equal(pool[0].id, 'a');
  assert.equal(pool.filter((x) => x.word.toLowerCase() === 'table').length, 1);
});
test('ngân hàng dự phòng đủ lớn và id không trùng', () => {
  assert.ok(DISTRACTOR_BANK.length >= 30);
  assert.equal(new Set(DISTRACTOR_BANK.map((w) => w.id)).size, DISTRACTOR_BANK.length);
});
