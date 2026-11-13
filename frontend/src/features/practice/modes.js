// Danh sách chế độ luyện tập (id phải khớp QUICK_PRACTICE trong homeLogic.js)
export const PRACTICE_MODE_META = [
  { id: 'flash', icon: '🃏', title: 'Thẻ nhanh', desc: 'Lật thẻ, tự đánh giá — ôn 20 từ trong 2 phút' },
  { id: 'quiz', icon: '⚡', title: 'Trắc nghiệm', desc: '10 câu nhiều dạng: chọn nghĩa, chọn từ, điền chỗ trống, nghe & chọn' },
  { id: 'match', icon: '🧩', title: 'Ghép cặp', desc: 'Nối từ với nghĩa, đua với đồng hồ' },
  { id: 'listen', icon: '🎧', title: 'Nghe & chép', desc: 'Nghe phát âm rồi gõ lại từ' },
];

export const EXTRA_ACTIVITIES = [
  { id: 'datcau', icon: '✍️', title: 'Đặt câu · Sửa lỗi', desc: 'Viết câu với từ đã học, AI sửa giúp', path: '/app/datcau' },
  { id: 'kiem-tra', icon: '🏆', title: 'Kiểm tra Pass', desc: 'Bài đọc hiểu 15 phút theo mốc', path: '/app/kiem-tra' },
];

/** /app/luyen-tap/<mode> -> mode id hợp lệ hoặc null (trang chọn chế độ). */
export function modeFromPath(pathname) {
  const m = String(pathname || '').match(/^\/app\/luyen-tap\/([^/]+)\/?$/);
  if (!m) return null;
  return PRACTICE_MODE_META.some((x) => x.id === m[1]) ? m[1] : null;
}

/** Chọn ngẫu nhiên một chế độ KHÁC chế độ vừa chơi (để bấm "Ngẫu nhiên" không ra lặp một trò). */
export function randomMode(lastId, random = Math.random) {
  const options = PRACTICE_MODE_META.filter((m) => m.id !== lastId);
  return options[Math.floor(random() * options.length)].id;
}

const LAST_KEY = 'lt_last_practice_mode';
export const readLastMode = () => { try { return sessionStorage.getItem(LAST_KEY); } catch { return null; } };
export const saveLastMode = (id) => { try { sessionStorage.setItem(LAST_KEY, id); } catch { /* bỏ qua */ } };
