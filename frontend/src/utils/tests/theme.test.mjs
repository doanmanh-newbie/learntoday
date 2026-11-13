import test from 'node:test';
import assert from 'node:assert/strict';
import { readTheme, nextTheme, applyTheme, saveTheme } from '../theme.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
test('mặc định tối, đọc lại được lựa chọn đã lưu, giá trị lạ bị bỏ qua', () => {
  const s = mem();
  assert.equal(readTheme(s), 'dark');
  saveTheme('light', s);
  assert.equal(readTheme(s), 'light');
  s.setItem('lt_theme', 'hack');
  assert.equal(readTheme(s), 'dark');
});
test('nextTheme và applyTheme', () => {
  assert.equal(nextTheme('dark'), 'light');
  assert.equal(nextTheme('light'), 'dark');
  const attrs = {};
  const doc = { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } };
  assert.equal(applyTheme('light', doc), 'light');
  assert.equal(attrs['data-theme'], 'light');
  assert.equal(applyTheme('xx', doc), 'dark');
});
test('hỏng localStorage không làm sập', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(readTheme(bad), 'dark');
  saveTheme('light', bad);
});
