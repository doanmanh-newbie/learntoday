import test from 'node:test';
import assert from 'node:assert/strict';
import { emojiFor, EMOJI_COUNT } from '../wordEmoji.js';

test('tra emoji: từ gốc, số nhiều, không có thì null', () => {
  assert.equal(emojiFor('apple'), '🍎');
  assert.equal(emojiFor('Apples'), '🍎');
  assert.equal(emojiFor('cherries'), '🍒');
  assert.equal(emojiFor('ingredient'), '🧂');
  assert.equal(emojiFor('philosophy'), null);
  assert.equal(emojiFor(''), null);
  assert.ok(EMOJI_COUNT > 250);
});
