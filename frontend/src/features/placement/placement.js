// Bài test trình độ đầu vào (~3 phút): 3 câu chọn nghĩa mỗi mức, đúng >= 2 thì lên mức kế, sai 2 câu trong một mức thì dừng.
export const PLACEMENT_LEVELS = ['A1', 'B1', 'B2', 'C1', 'IELTS'];
const PER_LEVEL = 3;
const PASS = 2;

export const PLACEMENT_BANK = {
  A1: [['family', 'gia đình'], ['water', 'nước'], ['happy', 'vui vẻ'], ['kitchen', 'nhà bếp'], ['cheap', 'rẻ'], ['morning', 'buổi sáng']],
  B1: [['improve', 'cải thiện'], ['journey', 'chuyến đi'], ['borrow', 'mượn'], ['opinion', 'ý kiến'], ['reliable', 'đáng tin cậy'], ['ancient', 'cổ xưa']],
  B2: [['reluctant', 'miễn cưỡng'], ['consequence', 'hậu quả'], ['thrive', 'phát triển mạnh'], ['scarce', 'khan hiếm'], ['obstacle', 'chướng ngại vật'], ['negotiate', 'đàm phán']],
  C1: [['meticulous', 'tỉ mỉ'], ['ubiquitous', 'có mặt khắp nơi'], ['alleviate', 'làm dịu bớt'], ['inherent', 'vốn có'], ['scrutiny', 'sự xem xét kỹ lưỡng'], ['pragmatic', 'thực tế, thực dụng']],
  IELTS: [['ameliorate', 'làm cho tốt hơn'], ['obfuscate', 'làm cho khó hiểu'], ['ephemeral', 'chóng tàn, phù du'], ['juxtapose', 'đặt cạnh nhau để so sánh'], ['quintessential', 'điển hình nhất'], ['exacerbate', 'làm trầm trọng thêm']],
};

// Trình độ đã qua -> giai đoạn lộ trình nên bắt đầu (chỉ số trong STAGES của learningPath.js)
const STAGE_BY_PASSED = { '-1': 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 4 };

export function initPlacement() {
  return { levelIdx: 0, inLevel: 0, correctInLevel: 0, passed: -1, answered: 0, asked: [], done: false };
}

export function answerPlacement(state, correct, questionId) {
  if (state.done) return state;
  const s = { ...state, inLevel: state.inLevel + 1, correctInLevel: state.correctInLevel + (correct ? 1 : 0),
    answered: state.answered + 1, asked: questionId ? [...state.asked, questionId] : state.asked };
  const wrong = s.inLevel - s.correctInLevel;
  if (wrong > PER_LEVEL - PASS) return { ...s, done: true };                // trượt mức này: dừng sớm
  if (s.inLevel < PER_LEVEL) return s;
  const passed = s.levelIdx;
  if (passed >= PLACEMENT_LEVELS.length - 1) return { ...s, passed, done: true };
  return { ...s, passed, levelIdx: s.levelIdx + 1, inLevel: 0, correctInLevel: 0 };
}

export function placementResult(state) {
  return {
    level: state.passed >= 0 ? PLACEMENT_LEVELS[state.passed] : 'A1',
    stageIndex: STAGE_BY_PASSED[state.passed] ?? 0,
  };
}

/** Câu hỏi kế: một từ chưa hỏi của mức hiện tại + 4 nghĩa (1 đúng, 3 nghĩa khác cùng mức). */
export function questionFor(state, random = Math.random) {
  const level = PLACEMENT_LEVELS[state.levelIdx];
  const bank = PLACEMENT_BANK[level];
  const fresh = bank.filter(([en]) => !state.asked.includes(`${level}:${en}`));
  const [en, vi] = (fresh.length ? fresh : bank)[Math.floor(random() * (fresh.length || bank.length))];
  const others = bank.filter(([e]) => e !== en).map(([, v]) => v);
  const picked = [];
  while (picked.length < 3 && others.length) picked.push(others.splice(Math.floor(random() * others.length), 1)[0]);
  const choices = [vi, ...picked];
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  return { id: `${level}:${en}`, level, prompt: en, answer: vi, choices };
}
