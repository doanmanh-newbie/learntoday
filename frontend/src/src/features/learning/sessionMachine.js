// src/features/learning/sessionMachine.js
// STT 6.5 - Máy trạng thái "cơ chế lặp thông minh" (thuần logic, không có UI).
//
// Nguyên tắc cốt lõi:
//   - Sai dạng N  -> quay lại dạng N-1
//   - Chỉ làm với từ sai khi quay lại
//   - Random thứ tự mỗi lần
//
// Khái niệm:
//   gate      : vòng KIỂM TRA CẢ NHÓM ở dạng `level` (mọi từ trong nhóm). Phải đạt
//               0 lỗi thì mới sang dạng kế tiếp.
//   remedial  : vòng LUYỆN LẠI chỉ với các từ sai, ở dạng thấp hơn (level - 1).
//               Riêng dạng 1 không có dạng thấp hơn nên tự lặp lại ở chính nó
//               cho đến khi hết từ sai.
//   stack     : nhớ "sau khi luyện lại xong thì phải kiểm tra cả nhóm ở dạng nào".
//
// Ví dụ: gate dạng 3 có từ sai -> remedial dạng 2 với từ sai -> xong thì gate dạng 3
// lại với CẢ NHÓM. Nếu remedial dạng 2 vẫn sai -> tụt tiếp xuống dạng 1 ... rồi
// đi ngược lên lại.

import { shuffle } from '../../utils/helpers';

export const MAX_LEVEL = 4;

export function initMachine(words) {
  return {
    level: 1,
    kind: 'gate',
    remaining: shuffle(words), // remaining[0] là từ đang hỏi
    roundSize: words.length,
    failed: [], // id các từ sai trong vòng hiện tại
    stack: [],
    gatesCleared: 0, // số dạng đã qua (0-4), dùng cho thanh tiến độ
    seq: 0, // tăng mỗi câu, dùng làm key để React reset component bài tập
  };
}

/**
 * Xử lý xong 1 câu.
 * @param m       trạng thái hiện tại
 * @param wordId  id từ vừa trả lời
 * @param correct trả lời đúng?
 * @param removed từ bị loại khỏi nhóm (người dùng bấm "Bỏ qua từ này")
 * @param batch   danh sách từ CÒN LẠI trong nhóm (đã trừ từ bị loại)
 * @returns { done: true } khi cả nhóm xong 4 dạng, hoặc { done: false, state }
 */
export function stepMachine(m, { wordId, correct, removed = false, batch }) {
  if (batch.length === 0) return { done: true };

  const ids = new Set(batch.map((w) => w.id));
  const remaining = m.remaining.slice(1).filter((w) => ids.has(w.id));
  const failed = (correct || removed ? m.failed : [...m.failed, wordId]).filter((id) => ids.has(id));
  const seq = m.seq + 1;

  // Vòng chưa hết -> câu tiếp theo
  if (remaining.length > 0) {
    return { done: false, state: { ...m, remaining, failed, seq } };
  }

  // ── Hết vòng ──
  const failedWords = batch.filter((w) => failed.includes(w.id));
  const next = (s) => ({ done: false, state: { failed: [], seq, ...s } });
  const fullGate = (level, stack, gatesCleared) =>
    next({ level, kind: 'gate', remaining: shuffle(batch), roundSize: batch.length, stack, gatesCleared });

  if (m.kind === 'gate') {
    if (failedWords.length === 0) {
      if (m.level >= MAX_LEVEL) return { done: true };
      return fullGate(m.level + 1, [], Math.max(m.gatesCleared, m.level));
    }
    // Có từ sai -> luyện lại ở dạng thấp hơn (dạng 1 thì tự lặp ở chính nó)
    return next({
      level: Math.max(m.level - 1, 1),
      kind: 'remedial',
      remaining: shuffle(failedWords),
      roundSize: failedWords.length,
      stack: [...m.stack, m.level],
      gatesCleared: m.gatesCleared,
    });
  }

  // ── remedial ──
  if (failedWords.length === 0) {
    const gateLevel = m.stack[m.stack.length - 1];
    const stack = m.stack.slice(0, -1);
    if (gateLevel === 1) {
      // Dạng 1 tự luyện lại xong = đã qua dạng 1 -> kiểm tra cả nhóm ở dạng 2
      return fullGate(2, stack, Math.max(m.gatesCleared, 1));
    }
    return fullGate(gateLevel, stack, m.gatesCleared);
  }

  // Luyện lại mà vẫn sai
  if (m.level === 1) {
    return next({
      level: 1,
      kind: 'remedial',
      remaining: shuffle(failedWords),
      roundSize: failedWords.length,
      stack: m.stack,
      gatesCleared: m.gatesCleared,
    });
  }
  return next({
    level: m.level - 1,
    kind: 'remedial',
    remaining: shuffle(failedWords),
    roundSize: failedWords.length,
    stack: [...m.stack, m.level],
    gatesCleared: m.gatesCleared,
  });
}
