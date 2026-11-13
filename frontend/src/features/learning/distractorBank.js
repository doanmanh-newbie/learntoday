// Từ nhiễu dự phòng cho bài trắc nghiệm: khi nhóm từ đang học quá ít (vd chỉ còn 1 từ chưa học) thì vẫn đủ lựa chọn.
// id bắt đầu bằng "bank-" để không bao giờ trùng id từ thật.
const RAW = [
  ['table', 'cái bàn'], ['window', 'cửa sổ'], ['happy', 'vui vẻ'], ['river', 'dòng sông'], ['teacher', 'giáo viên'],
  ['market', 'chợ'], ['borrow', 'mượn'], ['quickly', 'một cách nhanh chóng'], ['mountain', 'ngọn núi'], ['answer', 'câu trả lời'],
  ['healthy', 'khỏe mạnh'], ['journey', 'chuyến đi dài'], ['kitchen', 'nhà bếp'], ['believe', 'tin tưởng'], ['dangerous', 'nguy hiểm'],
  ['neighbor', 'hàng xóm'], ['library', 'thư viện'], ['expensive', 'đắt tiền'], ['forget', 'quên'], ['bridge', 'cây cầu'],
  ['careful', 'cẩn thận'], ['weather', 'thời tiết'], ['improve', 'cải thiện'], ['crowded', 'đông đúc'], ['silence', 'sự im lặng'],
  ['collect', 'thu thập'], ['festival', 'lễ hội'], ['comfortable', 'thoải mái'], ['explain', 'giải thích'], ['pocket', 'túi áo'],
  ['gentle', 'dịu dàng'], ['harvest', 'vụ thu hoạch'], ['repair', 'sửa chữa'], ['empty', 'trống rỗng'], ['shadow', 'cái bóng'],
  ['invite', 'mời'], ['ticket', 'tấm vé'], ['useful', 'hữu ích'], ['damage', 'thiệt hại'], ['signal', 'tín hiệu'],
];

export const DISTRACTOR_BANK = RAW.map(([word, meaning], i) => ({ id: `bank-${i}`, word, meaning, bank: true }));

/** Gộp các nguồn từ làm "đề bài + đáp án nhiễu", bỏ trùng id/chữ; từ thật luôn đứng trước từ dự phòng. */
export function buildPool(...sources) {
  const seenId = new Set();
  const seenWord = new Set();
  const out = [];
  for (const list of sources) {
    for (const w of list || []) {
      if (!w || !w.word || seenId.has(w.id) || seenWord.has(String(w.word).toLowerCase())) continue;
      seenId.add(w.id);
      seenWord.add(String(w.word).toLowerCase());
      out.push(w);
    }
  }
  return out;
}
