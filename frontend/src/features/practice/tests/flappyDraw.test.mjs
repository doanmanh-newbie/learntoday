import { test } from 'node:test';
import assert from 'node:assert/strict';
import { viewFor } from '../flappyDraw.js';

test('viewFor: chữ hiển thị thật >= 14px ở cả hai thế giới', () => {
  for (const [cw, ww] of [[311, 360], [343, 360], [520, 640], [688, 640], [0, 640]]) {
    const { fontPx } = viewFor(cw, ww);
    assert.ok(fontPx * ((cw || ww) / ww) >= 14, `${cw}/${ww}: ${fontPx}`);
  }
  assert.equal(viewFor(343, 360, true).reducedMotion, true);
});
