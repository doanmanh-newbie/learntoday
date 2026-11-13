// Cụm từ / thành ngữ / cụm động từ (dữ liệu tĩnh, học bằng thẻ nhanh & trắc nghiệm; chưa tính vào SRS).
// Mỗi mục: [cụm từ, nghĩa tiếng Việt, câu ví dụ (EN), dịch ví dụ (VI)]
const g = (id, name, desc, color, rows) => ({
  id, name, desc, color,
  phrases: rows.map(([phrase, meaning, en, vi]) => ({ phrase, meaning, en, vi })),
});

export const PHRASE_GROUPS = [
  g('pf1', 'Cụm từ Công việc', 'Collocations & phrases thông dụng trong môi trường văn phòng', '#14b8a6', [
    ['take the lead', 'đứng đầu, chủ động dẫn dắt', 'She took the lead on the new project.', 'Cô ấy chủ động dẫn dắt dự án mới.'],
    ['meet a deadline', 'kịp thời hạn', 'We must meet the deadline on Friday.', 'Chúng ta phải kịp thời hạn vào thứ Sáu.'],
    ['on the same page', 'cùng hiểu một ý, đồng thuận', 'Let us make sure we are on the same page.', 'Hãy đảm bảo mọi người cùng hiểu như nhau.'],
    ['touch base', 'liên lạc nhanh để cập nhật', 'I will touch base with you next week.', 'Tuần sau tôi sẽ liên lạc để cập nhật với bạn.'],
    ['get back to', 'trả lời lại sau', 'I will get back to you by tomorrow.', 'Tôi sẽ trả lời bạn trước ngày mai.'],
    ['follow up', 'theo dõi tiếp, hỏi lại', 'I am writing to follow up on our meeting.', 'Tôi viết thư để hỏi lại về cuộc họp của chúng ta.'],
    ['in charge of', 'phụ trách', 'He is in charge of the sales team.', 'Anh ấy phụ trách đội kinh doanh.'],
    ['work overtime', 'làm thêm giờ', 'They worked overtime to finish the report.', 'Họ làm thêm giờ để hoàn thành báo cáo.'],
    ['call in sick', 'gọi báo ốm xin nghỉ', 'He called in sick this morning.', 'Sáng nay anh ấy gọi báo ốm xin nghỉ.'],
    ['give a presentation', 'thuyết trình', 'She gave a presentation to the clients.', 'Cô ấy thuyết trình trước các khách hàng.'],
    ['run a meeting', 'điều hành cuộc họp', 'Who will run the meeting today?', 'Hôm nay ai sẽ điều hành cuộc họp?'],
    ['a heavy workload', 'khối lượng công việc nặng', 'I have a heavy workload this month.', 'Tháng này tôi có khối lượng công việc nặng.'],
  ]),
  g('pf2', 'Thành ngữ thông dụng', 'Idioms hay gặp trong văn nói và văn viết tiếng Anh', '#ef4444', [
    ['hit the nail on the head', 'nói trúng phóc', 'You hit the nail on the head with that answer.', 'Câu trả lời đó của bạn trúng phóc.'],
    ['under the weather', 'hơi mệt, không khỏe', 'I am feeling a bit under the weather today.', 'Hôm nay tôi thấy hơi mệt.'],
    ['bite the bullet', 'cắn răng chịu đựng, đối mặt', 'I had to bite the bullet and tell him the truth.', 'Tôi phải cắn răng nói thật với anh ấy.'],
    ['break a leg', 'chúc may mắn (trước buổi biểu diễn)', 'Break a leg at your audition tonight!', 'Chúc bạn may mắn ở buổi thử giọng tối nay!'],
    ['piece of cake', 'rất dễ', 'The exam was a piece of cake.', 'Bài thi dễ ơi là dễ.'],
    ['once in a blue moon', 'rất hiếm khi', 'We only eat out once in a blue moon.', 'Chúng tôi rất hiếm khi đi ăn ngoài.'],
    ['cost an arm and a leg', 'rất đắt', 'That car cost an arm and a leg.', 'Chiếc xe đó đắt cắt cổ.'],
    ['spill the beans', 'lỡ tiết lộ bí mật', 'Who spilled the beans about the party?', 'Ai đã lỡ tiết lộ chuyện bữa tiệc vậy?'],
    ['the ball is in your court', 'đến lượt bạn quyết định', 'I have made my offer, so the ball is in your court.', 'Tôi đã đưa đề nghị, giờ đến lượt bạn quyết định.'],
    ['let the cat out of the bag', 'để lộ bí mật', 'He let the cat out of the bag by mistake.', 'Anh ấy lỡ miệng để lộ bí mật.'],
    ['a blessing in disguise', 'trong cái rủi có cái may', 'Losing that job was a blessing in disguise.', 'Mất việc đó hóa ra lại là trong cái rủi có cái may.'],
    ['kill two birds with one stone', 'một công đôi việc', 'Walking to work kills two birds with one stone.', 'Đi bộ đi làm là một công đôi việc.'],
  ]),
  g('pf3', 'Cụm động từ (Phrasal Verbs)', 'Các phrasal verb quan trọng nhất cho giao tiếp hàng ngày', '#86a24d', [
    ['give up', 'từ bỏ', 'Never give up on your dreams.', 'Đừng bao giờ từ bỏ ước mơ.'],
    ['look into', 'điều tra, xem xét', 'We will look into the problem.', 'Chúng tôi sẽ xem xét vấn đề này.'],
    ['carry on', 'tiếp tục', 'Please carry on with your work.', 'Xin cứ tiếp tục công việc của bạn.'],
    ['run out of', 'hết, cạn kiệt', 'We have run out of milk.', 'Chúng ta hết sữa rồi.'],
    ['look forward to', 'mong chờ', 'I look forward to meeting you.', 'Tôi mong được gặp bạn.'],
    ['find out', 'tìm ra, biết được', 'I need to find out what happened.', 'Tôi cần biết chuyện gì đã xảy ra.'],
    ['turn down', 'từ chối; vặn nhỏ', 'She turned down the job offer.', 'Cô ấy từ chối lời mời làm việc.'],
    ['put off', 'trì hoãn', 'Do not put off your homework.', 'Đừng trì hoãn bài tập về nhà.'],
    ['come up with', 'nghĩ ra', 'He came up with a great idea.', 'Anh ấy nghĩ ra một ý tưởng hay.'],
    ['get along with', 'hòa thuận với', 'I get along well with my coworkers.', 'Tôi hòa thuận với đồng nghiệp.'],
    ['take off', 'cất cánh; cởi ra', 'The plane takes off at noon.', 'Máy bay cất cánh vào buổi trưa.'],
    ['set up', 'thiết lập, thành lập', 'They set up a new company last year.', 'Họ thành lập một công ty mới hồi năm ngoái.'],
  ]),
  g('pf4', 'Cụm từ Du lịch', 'Hội thoại và từ vựng thiết yếu khi đi du lịch nước ngoài', '#a3bd6a', [
    ['check in', 'làm thủ tục nhận phòng / lên máy bay', 'We checked in at the hotel at noon.', 'Chúng tôi nhận phòng khách sạn vào buổi trưa.'],
    ['check out', 'trả phòng', 'You must check out before 11 a.m.', 'Bạn phải trả phòng trước 11 giờ sáng.'],
    ['round trip', 'vé khứ hồi', 'I would like a round trip ticket to Hanoi.', 'Tôi muốn mua một vé khứ hồi đi Hà Nội.'],
    ['one-way ticket', 'vé một chiều', 'A one-way ticket is cheaper.', 'Vé một chiều rẻ hơn.'],
    ['local cuisine', 'ẩm thực địa phương', 'I want to try the local cuisine.', 'Tôi muốn thử ẩm thực địa phương.'],
    ['off the beaten track', 'nơi ít người biết đến', 'We found a village off the beaten track.', 'Chúng tôi tìm thấy một ngôi làng ít người biết đến.'],
    ['book a room', 'đặt phòng', 'I would like to book a room for two nights.', 'Tôi muốn đặt một phòng trong hai đêm.'],
    ['boarding pass', 'thẻ lên máy bay', 'Please show your boarding pass.', 'Xin hãy xuất trình thẻ lên máy bay.'],
    ['travel insurance', 'bảo hiểm du lịch', 'Do you have travel insurance?', 'Bạn có bảo hiểm du lịch không?'],
    ['sightseeing tour', 'chuyến tham quan', 'We joined a sightseeing tour of the city.', 'Chúng tôi tham gia chuyến tham quan thành phố.'],
    ['tourist attraction', 'điểm thu hút khách du lịch', 'The castle is a popular tourist attraction.', 'Lâu đài là một điểm thu hút khách du lịch nổi tiếng.'],
    ['jet lag', 'mệt mỏi do lệch múi giờ', 'I am suffering from jet lag.', 'Tôi đang bị mệt vì lệch múi giờ.'],
  ]),
];

export const PHRASE_ALL_ID = 'all';

export function groupById(id) {
  return PHRASE_GROUPS.find((x) => x.id === id) || null;
}

/** "phrase-pf1" -> "pf1"; không phải đường dẫn cụm từ -> null */
export function phraseIdFromFolderId(folderId) {
  const m = String(folderId || '').match(/^phrase-([a-z0-9]+)$/i);
  return m ? m[1] : null;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Chuyển các mục thành "từ" cho các chế độ luyện tập (thẻ nhanh, trắc nghiệm...). */
export function toPracticeWords(groupOrPhrases, idPrefix = 'ph') {
  const list = Array.isArray(groupOrPhrases) ? groupOrPhrases : groupOrPhrases.phrases;
  return list.map((p, i) => {
    // câu có chỗ trống: thay cụm từ (hoặc dạng chia như "checked in") bằng ___
    const stem = p.phrase.split(' ')[0].replace(/e$/, '');
    const re = new RegExp(`\\b${escapeRe(stem)}\\w*(\\s+\\w+){0,${Math.max(0, p.phrase.split(' ').length - 1)}}`, 'i');
    const blanked = re.test(p.en) ? p.en.replace(re, '___') : '___';
    return { id: `${idPrefix}-${i}-${p.phrase}`, word: p.phrase, meaning: p.meaning, word_type: 'phrase', phonetic: '',
      examples: [{ en: blanked, vi: p.vi }], example: p.en };
  });
}
