import test from 'node:test';
import assert from 'node:assert/strict';
import { splitEmoji } from '../emojiIcons.js';

test('splitEmoji tách emoji màu, giữ chữ', () => {
  assert.deepEqual(splitEmoji('🔥 Chuỗi ngày'), [{ text: '🔥', emoji: true }, { text: ' Chuỗi ngày', emoji: false }]);
  assert.deepEqual(splitEmoji('⚙️ Cài đặt')[0], { text: '⚙️', emoji: true });
  assert.deepEqual(splitEmoji('👍🏽')[0], { text: '👍🏽', emoji: true });
  assert.equal(splitEmoji('Không có icon ✔ © ⇄'), null);   // ký hiệu dạng chữ không bị bọc
  assert.equal(splitEmoji('12 từ'), null);
});
