
// Dùng trong module học từ vựng (STT 6.5) để xáo đáp án/thứ tự câu hỏi.
// Cũng generic đủ để STT 16 (Kiểm tra) tái dùng cho xáo đáp án trắc nghiệm.
// src/utils/helpers.js

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom(arr, n) {
  return shuffle(arr).slice(0, n);
}
// ── Data ─────────────────────────────────────────────────────────────────────
