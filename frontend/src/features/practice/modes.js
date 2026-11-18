// Danh sách chế độ luyện tập (id phải khớp QUICK_PRACTICE trong homeLogic.js)
export const PRACTICE_MODE_META = [
  { id: 'flash', icon: '🃏', title: 'Thẻ nhanh', desc: 'Lật thẻ, tự đánh giá — ôn 20 từ trong 2 phút' },
  { id: 'quiz', icon: '⚡', title: 'Trắc nghiệm', desc: '10 câu nhiều dạng: chọn nghĩa, chọn từ, điền chỗ trống, nghe & chọn' },
  { id: 'match', icon: '🧩', title: 'Ghép cặp', desc: 'Nối từ với nghĩa, đua với đồng hồ' },
  { id: 'listen', icon: '🎧', title: 'Nghe & chép', desc: 'Nghe phát âm rồi gõ lại từ' },
  { id: 'hard', icon: '❗', title: 'Từ hay sai', desc: 'Tự gom các từ bạn hay sai, lặp lại nhiều hơn tới khi nhớ', special: true },
];

// Mục Trò chơi (/app/tro-choi/<id>), tách khỏi Luyện tập
export const GAMES = [
  { id: 'flappy', icon: '🐦', title: 'Flappy Bird', desc: 'Điều khiển chú chim bay vào ô nghĩa đúng của từ. 3 mạng, càng đúng càng nhanh' },
];

export const EXTRA_ACTIVITIES = [
  { id: 'datcau', icon: '✍️', title: 'Đặt câu · Sửa lỗi', desc: 'Viết câu với từ đã học, AI sửa giúp', path: '/app/datcau' },
  { id: 'kiem-tra', icon: '🏆', title: 'Kiểm tra Pass', desc: 'Bài đọc hiểu 15 phút theo mốc', path: '/app/kiem-tra' },
  { id: 'doc-bai', icon: '📰', title: 'Học từ bài đọc', desc: 'Dán bài báo/phụ đề, app tách từ chưa biết vào folder của bạn', path: '/app/doc-bai' },
  { id: 'trinh-do', icon: '🧭', title: 'Test trình độ', desc: '3 phút để biết nên bắt đầu từ giai đoạn nào', path: '/app/kiem-tra-trinh-do' },
  { id: 'xep-hang', icon: '🏅', title: 'Bảng xếp hạng tuần', desc: 'Thi đua điểm học với bạn bè', path: '/app/xep-hang' },
];

/** /app/luyen-tap/<mode> -> mode id hợp lệ hoặc null (trang chọn chế độ). */
export function modeFromPath(pathname) {
  const m = String(pathname || '').match(/^\/app\/luyen-tap\/([^/]+)\/?$/);
  if (!m) return null;
  return PRACTICE_MODE_META.some((x) => x.id === m[1]) ? m[1] : null;
}

/** Chọn ngẫu nhiên một chế độ KHÁC chế độ vừa chơi (để bấm "Ngẫu nhiên" không ra lặp một trò). */
export function randomMode(lastId, random = Math.random) {
  const options = PRACTICE_MODE_META.filter((m) => m.id !== lastId && !m.special);   // "Ngẫu nhiên" chỉ chọn 4 trò cơ bản
  return options[Math.floor(random() * options.length)].id;
}

const LAST_KEY = 'lt_last_practice_mode';
export const readLastMode = () => { try { return sessionStorage.getItem(LAST_KEY); } catch { return null; } };
export const saveLastMode = (id) => { try { sessionStorage.setItem(LAST_KEY, id); } catch { /* bỏ qua */ } };
