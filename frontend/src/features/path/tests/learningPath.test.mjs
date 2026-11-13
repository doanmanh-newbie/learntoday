import test from 'node:test';
import assert from 'node:assert/strict';
import { stageFor, nextFolder, STAGES, guideSeen, markGuideSeen } from '../learningPath.js';

test('stageFor: đúng giai đoạn và phần trăm', () => {
  assert.equal(stageFor(0).stage.id, 1);
  assert.equal(stageFor(19).stage.id, 1);
  assert.equal(stageFor(20).stage.id, 2);
  assert.equal(stageFor(50).percent, 50);
  assert.equal(stageFor(5000).stage.id, 5);
  assert.equal(stageFor(5000).percent, 100);
  assert.equal(stageFor(10).remaining, 10);
});
test('các giai đoạn liền nhau, không hở', () => {
  for (let i = 1; i < STAGES.length; i++) assert.equal(STAGES[i].from, STAGES[i - 1].to);
});
test('nextFolder: chọn folder chưa học hết đầu tiên của giai đoạn, rồi sang giai đoạn sau', () => {
  const f = (name, t, l) => ({ id: name, name, total_words: t, learned_words: l });
  const folders = [f('Gia đình', 40, 40), f('Nhà cửa', 40, 10), f('Trường học', 40, 0)];
  assert.equal(nextFolder(5, folders).folder.name, 'Nhà cửa');
  const done = [f('Gia đình', 40, 40), f('Nhà cửa', 40, 40), f('Trường học', 40, 0)];
  assert.equal(nextFolder(5, done).folder.name, 'Trường học');
  assert.equal(nextFolder(0, [f('Lạ', 5, 5)]), null);
  assert.equal(nextFolder(0, [f('Tự tạo', 5, 0)]).folder.name, 'Tự tạo');
});
test('cờ đã xem hướng dẫn', () => {
  const m = new Map();
  const s = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.equal(guideSeen(s), false);
  markGuideSeen(s);
  assert.equal(guideSeen(s), true);
});
