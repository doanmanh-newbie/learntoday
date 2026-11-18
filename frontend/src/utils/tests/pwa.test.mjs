import test from 'node:test';
import assert from 'node:assert/strict';
import { msUntilReminder } from '../pwa.js';

test('msUntilReminder: giờ nhắc còn trong hôm nay', () => {
  assert.equal(msUntilReminder(new Date(2026, 10, 13, 18, 30), 20), 90 * 60 * 1000);
});
test('msUntilReminder: đã qua giờ -> ngày mai', () => {
  assert.equal(msUntilReminder(new Date(2026, 10, 13, 21, 0), 20), 23 * 3600 * 1000);
});
test('msUntilReminder: đúng giờ -> 24h sau', () => {
  assert.equal(msUntilReminder(new Date(2026, 10, 13, 20, 0), 20), 24 * 3600 * 1000);
});
