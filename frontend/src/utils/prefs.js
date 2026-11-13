// src/utils/prefs.js - tùy chọn người dùng cần dùng ở những nơi không có sẵn `user` (vd: hàm phát âm).
const VOICE_KEY = 'lt_tts_voice';
export const TTS_VOICES = { 'en-US': 'Anh - Mỹ', 'en-GB': 'Anh - Anh' };

export function getTtsVoice() {
  try {
    const v = localStorage.getItem(VOICE_KEY);
    return v in TTS_VOICES ? v : 'en-US';
  } catch {
    return 'en-US';
  }
}

export function setTtsVoice(voice) {
  try {
    if (voice in TTS_VOICES) localStorage.setItem(VOICE_KEY, voice);
  } catch { /* localStorage bị chặn: dùng mặc định */ }
}

/** Gọi sau khi biết thông tin user (đăng nhập / khôi phục phiên / lưu cài đặt). */
export function applyUserPrefs(user) {
  if (user?.tts_voice) setTtsVoice(user.tts_voice);
}
