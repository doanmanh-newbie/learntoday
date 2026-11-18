// Ô tra cứu dùng chung cho TRA TỪ và DỊCH: từ/cụm tiếng Anh ngắn -> trang chi tiết từ; câu, tiếng Việt, dấu câu -> dịch ngay.
export const MAX_TRANSLATE_CHARS = 500;
const ENGLISH_PHRASE = /^[a-z][a-z'\- ]*$/i;

/** 'empty' | 'word' | 'translate' | 'too-long' */
export function queryKind(q) {
  const text = String(q ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return 'empty';
  if (text.length > MAX_TRANSLATE_CHARS) return 'too-long';
  if (ENGLISH_PHRASE.test(text) && text.split(' ').length <= 3) return 'word';
  return 'translate';
}
