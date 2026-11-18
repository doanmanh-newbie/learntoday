import { GAMES } from '../practice/modes.js';

export const GAMES_PATH = '/app/tro-choi';

/** /app/tro-choi/<id> -> id game hợp lệ hoặc null (trang danh sách). */
export function gameFromPath(pathname) {
  const m = String(pathname || '').match(/^\/app\/tro-choi\/([^/]+)\/?$/);
  return m && GAMES.some((g) => g.id === m[1]) ? m[1] : null;
}
