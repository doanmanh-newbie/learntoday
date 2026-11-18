// "Từ hay sai": không tạo folder, chỉ là danh mục tự động (từ có wrong_count > 0). Từ sai càng nhiều thì càng hay xuất hiện.

/** Điểm khó: tỉ lệ sai (có làm mượt) nhân thêm theo số lần sai. 0 nếu chưa sai lần nào. */
export function hardScore(wrong, correct) {
  const w = Math.max(0, Number(wrong) || 0);
  const c = Math.max(0, Number(correct) || 0);
  if (w === 0) return 0;
  return (w / (w + c + 1)) * (1 + Math.log2(1 + w));
}

/** Hàng đợi n câu, chọn ngẫu nhiên có trọng số theo hardScore, không để 2 câu cùng từ đứng liền nhau. */
export function buildHardQueue(words, n, random = Math.random) {
  const list = (words || []).filter(Boolean);
  if (list.length <= 1) return list.slice(0, 1);
  const weights = list.map((w) => Math.max(0.1, hardScore(w.wrong_count, w.correct_count)));
  const out = [];
  for (let i = 0; i < n; i++) {
    const prev = out[out.length - 1];
    const total = list.reduce((sum, w, k) => sum + (w === prev ? 0 : weights[k]), 0);
    let r = random() * total;
    let pick = list.find((w) => w !== prev);
    for (let k = 0; k < list.length; k++) {
      if (list[k] === prev) continue;
      r -= weights[k];
      if (r <= 0) { pick = list[k]; break; }
    }
    out.push(pick);
  }
  return out;
}

/** Trả lời sai: chèn lại từ đó sau `gap` câu nữa (ôn ngay trong lượt, kiểu lặp ngắt quãng). */
export function requeue(queue, pos, item, gap = 3) {
  const next = queue.slice();
  next.splice(Math.min(pos + gap + 1, next.length), 0, item);
  return next;
}
