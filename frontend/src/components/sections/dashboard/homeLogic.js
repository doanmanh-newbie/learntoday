// Logic thuần của trang chủ: "việc nên làm bây giờ" — chỉ MỘT bước tiếp theo rõ ràng.

export const reviewMinutes = (dueCount) => Math.max(1, Math.round((dueCount || 0) * 0.3));

/** Bước tiếp theo duy nhất cho người dùng. key: start | review | learn | practice */
export function nextStep({ dueCount = 0, learnedToday = 0, target = 10, totalLearned = 0 }) {
  if (!totalLearned && !learnedToday) {
    return { key: 'start', title: 'Bắt đầu học từ đầu tiên', hint: 'Chọn một chủ đề rồi học 5 từ — chỉ mất vài phút.', cta: 'Chọn chủ đề' };
  }
  if (dueCount > 0) {
    return { key: 'review', title: `Ôn ${dueCount} từ đến hạn`, hint: `Khoảng ${reviewMinutes(dueCount)} phút — ôn đúng lúc để nhớ lâu.`, cta: 'Ôn tập ngay' };
  }
  if (learnedToday < target) {
    return { key: 'learn', title: `Học thêm từ mới (${learnedToday}/${target})`, hint: 'Còn một chút nữa là đạt mục tiêu hôm nay.', cta: 'Học từ mới' };
  }
  return { key: 'practice', title: 'Hôm nay xong rồi 🎉', hint: 'Chơi một trò luyện tập để nhớ chắc hơn.', cta: 'Luyện tập' };
}

export function planSteps({ dueCount = 0, learnedToday = 0, target = 10 }) {
  return [
    { id: 'review', label: dueCount > 0 ? `Ôn ${dueCount} từ đến hạn` : 'Ôn tập', done: dueCount === 0 },
    { id: 'learn', label: `Học từ mới ${Math.min(learnedToday, target)}/${target}`, done: learnedToday >= target },
  ];
}

export const QUICK_PRACTICE = ['flash', 'quiz', 'match', 'listen'];

export const progressPercent = (done, target) => (target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0);
