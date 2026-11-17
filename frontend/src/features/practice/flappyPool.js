// Logic thuần chọn bộ từ cho Flappy (không UI, test được bằng node).
import { toUiWord } from '../../api/adapters';
import { usableWords, MIN_WORDS } from './practiceLogic';
import { maxScore } from './flappyLogic';

const PAGE_LIMIT = 100;   // server chặn ở 100

/** Duyệt mọi trang của thư mục; fetchPage(page, limit) -> { words, pagination }. */
export async function loadFolderWords(folderId, fetchPage, { includeUnlearned = false } = {}) {
  const all = [];
  for (let page = 1; ; page++) {
    const res = await fetchPage(page, PAGE_LIMIT);
    const words = res?.words || [];
    all.push(...words);
    // dừng khi hết trang, hoặc trang rỗng (tránh lặp vô hạn nếu server sai has_more)
    if (!words.length || res?.pagination?.has_more === false || !res?.pagination) break;
  }
  const ui = all.map(toUiWord);
  return usableWords(includeUnlearned ? ui : ui.filter((w) => w.level >= 1));
}

export function describePool(words, source = 'folder') {
  const list = usableWords(words);
  const count = list.length;
  const playable = count >= MIN_WORDS;
  const max = maxScore(list);
  const note = !playable
    ? `Cần ít nhất ${MIN_WORDS} từ để chơi.`
    : `${source === 'learned' ? 'Kho từ của bạn' : 'Thư mục này'} chỉ có ${count} từ nên điểm tối đa là ${max}.`;
  return { count, maxScore: max, playable, note };
}
