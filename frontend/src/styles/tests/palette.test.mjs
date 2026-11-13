// Chạy:  node --test src/styles/tests/palette.test.mjs
// 1) Giữ bảng màu: không cho màu cũ (chàm/tím/cam/xanh lá lạ/nền xanh đen) lọt lại vào code.
// 2) Kiểm độ tương phản (WCAG AA) của các cặp màu chữ/nền quan trọng ngay trong theme.css.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'tests') yield* walk(p); }
    else if (/\.(jsx?|css)$/.test(name)) yield p;
  }
}

// ── 1) màu cũ ──
const LEGACY_HEX = ['#6366f1', '#8b5cf6', '#a5b4fc', '#c7d2fe', '#818cf8', '#4f46e5', '#7c3aed', '#10b981', '#34d399', '#059669',
  '#f59e0b', '#fbbf24', '#d97706', '#f97316', '#07091a', '#0d1030', '#8892b0', '#8190b3'];
// Họ màu Tailwind không thuộc bảng (xám + xanh ngọc "brand" + đỏ + xanh rêu "moss")
const FORBIDDEN_CLASS = /\b(?:bg|text|border|from|to|via|ring|fill|stroke|shadow|divide|outline|accent|placeholder)-(?:slate|gray|zinc|neutral|stone|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

test('không còn màu cũ (hex, rgba, class Tailwind) trong mã nguồn', () => {
  const problems = [];
  for (const file of walk(SRC)) {
    if (file.endsWith('theme.css') || file.includes(`${join('components', 'ui')}`)) continue;   // theme = nơi ĐỊNH NGHĨA; ui = bộ shadcn dùng token
    const text = readFileSync(file, 'utf8');
    for (const hex of LEGACY_HEX) if (text.toLowerCase().includes(hex)) problems.push(`${file.replace(SRC, 'src')}: ${hex}`);
    const cls = text.match(FORBIDDEN_CLASS);
    if (cls) problems.push(`${file.replace(SRC, 'src')}: class ${cls[0]}`);
    if (/rgba?\(\s*(?:99\s*,\s*102\s*,\s*241|139\s*,\s*92\s*,\s*246|165\s*,\s*180\s*,\s*252|7\s*,\s*9\s*,\s*26)\b/.test(text)) problems.push(`${file.replace(SRC, 'src')}: rgba cũ`);
  }
  assert.deepEqual(problems, [], 'Màu cũ xuất hiện lại. Dùng token trong styles/theme.css (bg-surface, text-brand-300, text-moss-400, text-red-400...)');
});

// ── 2) tương phản ──
const css = readFileSync(join(SRC, 'styles', 'theme.css'), 'utf8');
const token = (name) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `thiếu token ${name}`);
  return m[1];
};
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const AA = 4.5;
const PAIRS = [
  ['chữ chính / nền', 'ink', 'bg'], ['chữ chính / bề mặt', 'ink', 'surface'], ['chữ phụ / nền', 'ink-muted', 'bg'],
  ['chữ phụ / bề mặt 2', 'ink-muted', 'surface-2'], ['chữ mờ / nền', 'ink-subtle', 'bg'], ['chữ mờ / bề mặt 2', 'ink-subtle', 'surface-2'],
  ['liên kết xanh ngọc / nền', 'brand-300', 'bg'], ['nhấn xanh ngọc / nền', 'brand-400', 'bg'],
  ['chữ đỏ / nền', 'red-400', 'bg'], ['chữ đỏ / bề mặt', 'red-400', 'surface'], ['chữ xanh rêu / nền', 'moss-400', 'bg'], ['chữ xanh rêu / bề mặt', 'moss-400', 'surface'],
];
for (const [label, fg, bg] of PAIRS) {
  test(`tương phản ≥ ${AA}: ${label}`, () => assert.ok(ratio(token(fg), token(bg)) >= AA, `${label}: ${ratio(token(fg), token(bg)).toFixed(2)}`));
}
for (const [label, bg] of [['nút chính (brand-700)', 'brand-700'], ['nút đỏ (red-600)', 'red-600'], ['nút xanh rêu (moss-700)', 'moss-700']]) {
  test(`chữ trắng trên ${label} ≥ ${AA}`, () => assert.ok(ratio('#ffffff', token(bg)) >= AA, `${ratio('#ffffff', token(bg)).toFixed(2)}`));
}
