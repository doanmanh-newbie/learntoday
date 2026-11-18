import test from 'node:test';
import assert from 'node:assert/strict';
import { gameFromPath } from '../gameRoutes.js';

test('gameFromPath', () => {
  assert.equal(gameFromPath('/app/tro-choi/flappy'), 'flappy');
  assert.equal(gameFromPath('/app/tro-choi/flappy/'), 'flappy');
  assert.equal(gameFromPath('/app/tro-choi'), null);
  assert.equal(gameFromPath('/app/tro-choi/hack'), null);
});
