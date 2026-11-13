// Lộ trình học: 5 giai đoạn theo số từ đã học + gợi ý folder tiếp theo. Logic thuần (test được bằng node).
export const STAGES = [
  { id: 1, name: 'Khởi động', from: 0, to: 20, goal: 'Làm quen cách học và học 20 từ đầu tiên', folders: ['Gia đình', 'Nhà cửa'] },
  { id: 2, name: 'Nền tảng', from: 20, to: 80, goal: 'Nắm từ vựng đời sống hằng ngày', folders: ['Trường học', 'Động từ thông dụng', 'Tính từ thông dụng'] },
  { id: 3, name: 'Giao tiếp', from: 80, to: 200, goal: 'Nói về cảm xúc, mua sắm, sức khỏe', folders: ['Cảm xúc & tính cách', 'Mua sắm & tiền bạc', 'Sức khỏe & cơ thể'] },
  { id: 4, name: 'Mở rộng', from: 200, to: 400, goal: 'Công việc, đi lại, thiên nhiên', folders: ['Công việc & nghề nghiệp', 'Văn phòng & công sở', 'Giao thông & di chuyển', 'Thời tiết & thiên nhiên'] },
  { id: 5, name: 'Nâng cao', from: 400, to: Infinity, goal: 'Từ vựng học thuật và bài kiểm tra Pass', folders: ['Từ vựng học thuật'] },
];

export function stageFor(totalLearned) {
  const n = Math.max(0, Number(totalLearned) || 0);
  const stage = STAGES.find((s) => n >= s.from && n < s.to) || STAGES[STAGES.length - 1];
  const span = Number.isFinite(stage.to) ? stage.to - stage.from : 0;
  const into = n - stage.from;
  return {
    stage,
    index: stage.id - 1,
    percent: span ? Math.min(100, Math.round((into / span) * 100)) : 100,
    remaining: Number.isFinite(stage.to) ? stage.to - n : 0,
  };
}

const norm = (s) => String(s || '').normalize('NFC').toLowerCase().trim();

/** Folder nên học tiếp: trong các folder của giai đoạn, folder đầu tiên chưa học hết; nếu hết thì thử các giai đoạn sau. */
export function nextFolder(totalLearned, folders) {
  const list = folders || [];
  const { index } = stageFor(totalLearned);
  for (let i = index; i < STAGES.length; i++) {
    for (const name of STAGES[i].folders) {
      const f = list.find((x) => norm(x.name) === norm(name));
      if (f && (f.total_words ?? 0) > (f.learned_words ?? 0)) return { folder: f, stage: STAGES[i] };
    }
  }
  const any = list.find((x) => (x.total_words ?? 0) > (x.learned_words ?? 0));
  return any ? { folder: any, stage: null } : null;
}

export const GUIDE_STEPS = [
  { icon: '📚', title: 'Chọn chủ đề & xem từ mới', text: 'Vào "Thư viện", chọn một chủ đề rồi bấm "Bắt đầu học". Mỗi lượt học 5 từ.' },
  { icon: '🧠', title: 'Làm 4 dạng bài', text: 'Gõ chính tả → chọn nghĩa → chọn từ → nghe và gõ. Sai thì quay lại dạng dễ hơn, cứ làm là nhớ.' },
  { icon: '🔁', title: 'Ôn đúng hạn', text: 'Từ đã học sẽ hẹn giờ ôn lại (sau 20 phút, 10 giờ, 1 ngày...). Vào "Ôn tập" khi trang chủ báo có từ đến hạn.' },
  { icon: '🎮', title: 'Luyện tập & kiểm tra', text: 'Chơi thẻ nhanh, trắc nghiệm, ghép cặp; đạt các mốc từ thì làm bài kiểm tra Pass.' },
];

const GUIDE_KEY = 'lt_guide_seen';
export const guideSeen = (storage = globalThis.localStorage) => { try { return storage?.getItem(GUIDE_KEY) === '1'; } catch { return false; } };
export const markGuideSeen = (storage = globalThis.localStorage) => { try { storage?.setItem(GUIDE_KEY, '1'); } catch { /* bỏ qua */ } };
