// Tổng kết cuối phiên học/ôn: số từ, độ chính xác, từ sai nhiều nhất, lời nhắc ngày mai. Logic thuần.
export function summarizeSession({ words = [], wrongCounts = {}, answered = 0, correct = 0, dueTomorrow } = {}) {
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : null;
  const hardest = words
    .map((w) => ({ id: w.id, word: w.word, meaning: w.meaning, wrong: wrongCounts[w.id] || 0 }))
    .filter((w) => w.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3);
  let reminder;
  if (dueTomorrow > 0) reminder = `Ngày mai có ${dueTomorrow} từ đến hạn ôn, vào ôn để giữ chuỗi nhé.`;
  else if (hardest.length) reminder = `Ngày mai ôn lại "${hardest[0].word}" và các từ khác trong mục "Từ hay sai".`;
  else reminder = 'Ngày mai quay lại học tiếp để giữ chuỗi nhé!';
  return { count: words.length, accuracy, hardest, reminder };
}
