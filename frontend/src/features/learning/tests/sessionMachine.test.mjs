import test from 'node:test';
import assert from 'node:assert/strict';
import { initMachine, stepMachine } from '../sessionMachine.js';

import { batchProgress, sessionProgress } from '../sessionMachine.js';
test('batchProgress: đúng thì tăng, sai thì lùi, luôn trong 0..1', () => {
  const words = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
  let m = initMachine(words);
  assert.equal(batchProgress(m), 0);
  let r = stepMachine(m, { wordId: m.remaining[0].id, correct: true, batch: words });
  const up = batchProgress(r.state);
  assert.ok(up > 0);
  r = stepMachine(r.state, { wordId: r.state.remaining[0].id, correct: false, batch: words });
  assert.ok(batchProgress(r.state) < up, 'sai phải làm thanh lùi');
  assert.ok(batchProgress(r.state) >= 0 && batchProgress(r.state) <= 1);
  assert.equal(sessionProgress(m, 1, 2), 0.5);
  assert.equal(sessionProgress(m, 0, 0), 0);
});
