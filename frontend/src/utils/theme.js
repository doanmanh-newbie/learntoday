// Chế độ sáng / tối. Lưu lựa chọn trong localStorage (nếu bị chặn thì chỉ giữ trong phiên). Mặc định: tối (giao diện gốc).
const KEY = 'lt_theme';
export const THEMES = ['dark', 'light'];

export function readTheme(storage = globalThis.localStorage) {
  try {
    const v = storage?.getItem(KEY);
    return THEMES.includes(v) ? v : 'dark';
  } catch { return 'dark'; }
}

export function nextTheme(theme) { return theme === 'light' ? 'dark' : 'light'; }

export function applyTheme(theme, doc = globalThis.document) {
  const t = THEMES.includes(theme) ? theme : 'dark';
  if (doc?.documentElement) doc.documentElement.setAttribute('data-theme', t);
  return t;
}

export function saveTheme(theme, storage = globalThis.localStorage) {
  try { storage?.setItem(KEY, theme); } catch { /* không lưu được: vẫn đổi trong phiên này */ }
}
