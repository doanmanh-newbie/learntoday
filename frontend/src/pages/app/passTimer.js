// src/pages/app/passTimer.js - hàm thuần cho đồng hồ bài kiểm tra Pass (test được bằng node)
export const SAVE_DEBOUNCE_MS = 700;      // chờ người dùng dừng chọn rồi mới lưu tiến độ
export const HEARTBEAT_MS = 30000;        // lưu định kỳ để server biết phiên còn hoạt động (đóng tab chỉ mất thời gian tới lần lưu cuối)

/** 754 -> "12:34". Âm/NaN -> "00:00". */
export function formatClock(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** 85520 -> "23:45:20" (đếm ngược tới lúc bài kiểm tra mở, STT 16). */
export function formatHms(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  return `${String(h).padStart(2, '0')}:${formatClock(s - h * 3600)}`;
}

/** Số giây còn lại tới hạn chót (mili-giây epoch), làm tròn lên để không hiện 00:00 khi còn chưa đầy 1 giây. */
export function secondsLeft(deadlineMs, nowMs) {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

/** Chỉ giữ {mã_câu: số_nguyên >= 0}; dữ liệu server trả về hoặc state hỏng không làm vỡ giao diện. */
export function sanitizeAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return {};
  return Object.fromEntries(Object.entries(answers).filter(([, v]) => Number.isInteger(v) && v >= 0));
}

export function answeredCount(answers, questions) {
  return (questions || []).filter((q) => Number.isInteger(answers?.[q.id])).length;
}

export const sameAnswers = (a, b) => JSON.stringify(Object.entries(a || {}).sort()) === JSON.stringify(Object.entries(b || {}).sort());
