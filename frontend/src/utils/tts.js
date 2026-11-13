// src/utils/tts.js
// STT 6.6 - Phát âm tự động. Tách riêng vì sẽ còn dùng ở Tìm kiếm (STT 9),
// Dịch từ (STT 11), và cần sửa lại khi làm chọn giọng đọc ở Cài đặt (STT 15).

import { getTtsVoice } from "./prefs";

export function speak(word, lang = getTtsVoice()) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = lang;
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
