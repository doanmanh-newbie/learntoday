import test from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_MODE_META, modeFromPath, randomMode } from '../modes.js';
import { QUICK_PRACTICE } from '../../../components/sections/dashboard/homeLogic.js';

test('modeFromPath', () => {
  assert.equal(modeFromPath('/app/luyen-tap/quiz'), 'quiz');
  assert.equal(modeFromPath('/app/luyen-tap/quiz/'), 'quiz');
  assert.equal(modeFromPath('/app/luyen-tap'), null);
  assert.equal(modeFromPath('/app/luyen-tap/hack'), null);
});
test('QUICK_PRACTICE khớp danh sách chế độ', () => {
  const ids = PRACTICE_MODE_META.map((m) => m.id);
  for (const id of QUICK_PRACTICE) assert.ok(ids.includes(id));
});
test('randomMode không bao giờ trả lại chế độ vừa chơi', () => {
  for (let i = 0; i < 50; i++) assert.notEqual(randomMode('quiz'), 'quiz');
  const picked = randomMode(null);
  assert.ok(PRACTICE_MODE_META.some((m) => m.id === picked));
});
