/** Thêm hàng của chính mình vào cuối khi nằm ngoài top (outside: để UI vẽ dấu "…"). */
export function mergeMe(rows, me) {
  if (!me || rows.some((r) => r.is_me)) return rows;
  return [...rows, { rank: me.rank, username: 'Bạn', score: me.score, correct: null, is_me: true, outside: true }];
}
