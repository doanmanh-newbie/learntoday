import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitSize, getWordImage, setWordImage } from '../wordImages.js';

test('fitSize: thu nhỏ giữ tỉ lệ, không phóng to', () => {
  assert.deepEqual(fitSize(1600, 800), { width: 800, height: 400 });
  assert.deepEqual(fitSize(600, 1200), { width: 400, height: 800 });
  assert.deepEqual(fitSize(300, 200), { width: 300, height: 200 });
  assert.deepEqual(fitSize(0, 10), { width: 0, height: 0 });
});

test('không có IndexedDB (Node): vẫn lưu/đọc được trong bộ nhớ', async () => {
  assert.equal(await getWordImage(7), null);
  await setWordImage(7, 'data:image/jpeg;base64,AAA');
  assert.equal(await getWordImage(7), 'data:image/jpeg;base64,AAA');
});
