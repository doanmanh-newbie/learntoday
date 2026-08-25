// src/utils/tts.js
// STT 6.6 - Phát âm tự động. Tách riêng vì sẽ còn dùng ở Tìm kiếm (STT 9),
// Dịch từ (STT 11), và cần sửa lại khi làm chọn giọng đọc ở Cài đặt (STT 15).

export function speak(word) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = "en-US";
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
