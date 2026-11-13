import test from 'node:test';
import assert from 'node:assert/strict';
import { isCopyShortcut, noCopyProps } from '../antiCopy.js';

test('chặn Ctrl/Cmd + C,X,A,U,S,P; không chặn phím thường', () => {
  for (const k of ['c', 'C', 'x', 'a', 'u', 's', 'p']) assert.ok(isCopyShortcut({ ctrlKey: true, key: k }));
  assert.ok(isCopyShortcut({ metaKey: true, key: 'c' }));
  assert.ok(!isCopyShortcut({ key: 'c' }));
  assert.ok(!isCopyShortcut({ ctrlKey: true, key: 'v' }));
});
test('sự kiện copy/cut/chuột phải đều bị preventDefault', () => {
  for (const h of ['onCopy', 'onCut', 'onContextMenu', 'onDragStart']) {
    let blocked = false;
    noCopyProps[h]({ preventDefault: () => { blocked = true; } });
    assert.ok(blocked, h);
  }
});
