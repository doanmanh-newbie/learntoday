// Chấm phát âm từ kết quả nhận dạng giọng nói của trình duyệt. Bắt lỗi hay gặp của người Việt: nuốt âm cuối -s / -ed.
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const saysWord = (alt, word) => alt === word || alt.split(' ').includes(word);

/** Âm cuối -s/-es hoặc -ed của từ và cách đọc đúng; null nếu từ không có đuôi này. */
export function endingLesson(word) {
  const w = norm(word);
  if (w.length > 3 && w.endsWith('ed')) {
    const stem = w.slice(0, -2);
    if (/[td]$/.test(stem)) return { ending: '-ed', sound: '/ɪd/', rule: 'Từ gốc tận cùng bằng âm /t/ hoặc /d/ thì "-ed" đọc là /ɪd/ (thêm một âm tiết), ví dụ wanted, needed.' };
    if (/(p|k|f|s|x|c|ch|sh|gh)$/.test(stem)) return { ending: '-ed', sound: '/t/', rule: 'Từ gốc tận cùng bằng âm vô thanh (/p/, /k/, /f/, /s/, /ʃ/, /tʃ/) thì "-ed" đọc là /t/, ví dụ worked, stopped, watched.' };
    return { ending: '-ed', sound: '/d/', rule: 'Các trường hợp còn lại "-ed" đọc là /d/, ví dụ played, cleaned. Nhớ bật nhẹ âm /d/ ở cuối, đừng nuốt mất.' };
  }
  if (w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w)) {
    if (/(ses|xes|zes|ches|shes|ges|ces)$/.test(w)) return { ending: '-s', sound: '/ɪz/', rule: 'Từ tận cùng bằng âm /s/, /z/, /ʃ/, /tʃ/, /dʒ/ thì "-es/-s" đọc là /ɪz/ (thêm một âm tiết), ví dụ watches, changes.' };
    if (/(p|t|k|f|th)s$/.test(w)) return { ending: '-s', sound: '/s/', rule: 'Từ tận cùng bằng âm vô thanh /p/, /t/, /k/, /f/, /θ/ thì "-s" đọc là /s/, ví dụ cats, books. Giữ âm /s/ rõ ở cuối.' };
    return { ending: '-s', sound: '/z/', rule: 'Các trường hợp còn lại "-s" đọc là /z/ (rung nhẹ), ví dụ dogs, plays. Đừng bỏ âm cuối.' };
  }
  return null;
}

/** { ok, issue: 'final-s' | 'final-ed' | null, heard } từ danh sách phương án trình duyệt nghe được. */
export function judge(target, alternatives = []) {
  const t = norm(target);
  const heardList = (alternatives || []).map(norm).filter(Boolean);
  const heard = heardList[0] || '';
  if (heardList.some((a) => saysWord(a, t))) return { ok: true, issue: null, heard };
  const lesson = endingLesson(t);
  if (lesson) {
    const stems = lesson.ending === '-ed' ? [t.slice(0, -2), t.slice(0, -1)] : [t.slice(0, -1), t.slice(0, -2)];
    if (heardList.some((a) => stems.some((s) => s.length > 1 && saysWord(a, s)))) {
      return { ok: false, issue: lesson.ending === '-ed' ? 'final-ed' : 'final-s', heard };
    }
  }
  return { ok: false, issue: null, heard };
}
