import { invalidate } from './cache';
// src/api/client.js - MỘT lớp gọi API duy nhất cho toàn app.
// Địa chỉ backend. Mặc định http://127.0.0.1:5000 (chỉ chạy được trên chính máy đang chạy backend).
// Mặc định gọi API CÙNG địa chỉ với trang web (đường dẫn tương đối /api/...): khi chạy `npm run dev`, Vite chuyển tiếp /api
// sang backend (xem vite.config.js), nên không dính CORS và cookie đăng nhập (Refresh Token HttpOnly) luôn được gửi.
// Triển khai thật mà backend nằm ở tên miền khác: đặt VITE_API_URL=https://api.ten-mien-cua-ban.com. Lưu ý: cookie đăng nhập
// chỉ hoạt động ổn khi frontend và API CÙNG "site" (vd app.example.com + api.example.com) - xem backend/docs/BAO_MAT.md.
const ENV_API_URL = import.meta.env?.VITE_API_URL;
const API_BASE = (ENV_API_URL === undefined || ENV_API_URL === null ? '' : ENV_API_URL).replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 20000;

// Các endpoint xác thực: 401 ở đây nghĩa là "sai thông tin" chứ KHÔNG phải "token hết hạn",
// nên không được thử refresh/đăng xuất. (Trước đây nhập sai mật khẩu -> bị coi là hết phiên ->
// tải lại trang /login và mất luôn thông báo lỗi.)
const AUTH_PATHS = [
  '/api/auth/login', '/api/auth/register', '/api/auth/refresh-token',
  '/api/auth/forgot-password', '/api/auth/reset-password',
];

// BẢO MẬT: Refresh Token (sống 7 ngày) nằm trong cookie HttpOnly do server đặt - JavaScript, kể cả mã độc XSS, không đọc được.
// Access Token (1 giờ) chỉ giữ trong BỘ NHỚ, không ghi vào localStorage. Trong localStorage chỉ có cờ `has_session`
// ("có thể đã đăng nhập") để khi tải lại trang biết cần xin Access Token mới bằng cookie.
const SESSION_HINT_KEY = 'has_session';
let accessToken = null;

try {                                                  // dọn token kiểu cũ còn sót từ phiên bản trước
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
} catch { /* localStorage bị chặn */ }

function writeSessionHint(on) {
  try {
    if (on) localStorage.setItem(SESSION_HINT_KEY, '1');
    else localStorage.removeItem(SESSION_HINT_KEY);
  } catch { /* localStorage bị chặn: chỉ mất khả năng khôi phục phiên sau khi tải lại trang */ }
}

function readSessionHint() {
  try { return localStorage.getItem(SESSION_HINT_KEY) === '1'; } catch { return false; }
}

/** Lỗi gọi API có đủ thông tin để UI phân biệt: mất mạng / quá chậm / DB sập / lỗi nhập liệu. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = '', data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;       // NETWORK | TIMEOUT | SESSION_EXPIRED | DB_UNAVAILABLE | DB_CONFLICT | ...
    this.data = data;
  }
  /** Lỗi tạm thời (mất mạng, quá chậm, server/DB đang bận) - đáng để thử lại. */
  get retryable() {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT' || this.status >= 500;
  }
}

export function setAccessToken(access) {
  accessToken = access || null;
  writeSessionHint(!!access);
  // outbox.js lắng nghe để gửi nốt tiến độ học còn kẹt ngay khi phiên được khôi phục
  if (access && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('auth:session'));
}

export function clearSession() {
  accessToken = null;
  writeSessionHint(false);
}

export function getAccessToken() {
  return accessToken;
}

/** Có thể đang đăng nhập (đã có Access Token, hoặc lần trước đã đăng nhập và cookie còn). */
export function hasSession() {
  return !!accessToken || readSessionHint();
}

function messageForStatus(status) {
  if (status === 503) return 'Hệ thống đang bảo trì hoặc không kết nối được cơ sở dữ liệu. Vui lòng thử lại sau ít phút.';
  if (status >= 500) return 'Máy chủ gặp lỗi, vui lòng thử lại.';
  if (status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
  if (status === 429) return 'Bạn thao tác quá nhanh, vui lòng chờ một chút.';
  return 'Có lỗi xảy ra';
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { credentials: 'include', ...options, signal: controller.signal });   // include: gửi cookie Refresh Token
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new ApiError('Máy chủ phản hồi quá lâu, vui lòng thử lại.', { code: 'TIMEOUT' });
    }
    throw new ApiError('Không thể kết nối đến server. Kiểm tra lại kết nối mạng hoặc thử lại sau.', { code: 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }
}

// Nhiều request cùng gặp 401 -> chỉ gọi refresh MỘT lần, các request còn lại chờ chung kết quả.
let refreshPromise = null;

/** @returns {'ok' | 'invalid' | 'error'}  invalid = refresh token hỏng/hết hạn (phải đăng nhập lại);
 *  error = lỗi tạm thời (mất mạng/server bận) -> KHÔNG đăng xuất người dùng. */
function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      if (!hasSession()) return 'invalid';
      try {
        // Refresh Token nằm trong cookie HttpOnly nên trình duyệt tự đính kèm; header X-Requested-With chống CSRF
        const res = await fetchWithTimeout(`${API_BASE}/api/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
          body: '{}',
        }, REQUEST_TIMEOUT_MS);
        if (res.status >= 500) return 'error';
        if (!res.ok) return 'invalid';
        const data = await res.json();
        setAccessToken(data.access_token);
        return 'ok';
      } catch {
        return 'error';
      }
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function notifySessionExpired() {
  clearSession();
  // AuthContext lắng nghe sự kiện này -> user = null -> ProtectedRoute tự chuyển sang /login
  // (không tải lại trang, và không đá người đang xem trang chủ công khai).
  window.dispatchEvent(new CustomEvent('auth:expired'));
}

export async function apiRequest(path, options = {}) {
  const { _retry, timeout = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));

  const headers = { 'Content-Type': 'application/json', ...fetchOptions.headers };
  const token = getAccessToken();
  if (token && !isAuthPath) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithTimeout(`${API_BASE}${path}`, { ...fetchOptions, headers }, timeout);

  if (res.status === 401 && !isAuthPath && !_retry && hasSession()) {
    const outcome = await refreshAccessToken();
    if (outcome === 'ok') return apiRequest(path, { ...options, _retry: true });
    if (outcome === 'invalid') {
      notifySessionExpired();
      throw new ApiError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', { status: 401, code: 'SESSION_EXPIRED' });
    }
    throw new ApiError('Không thể làm mới phiên đăng nhập lúc này, vui lòng thử lại.', { code: 'NETWORK' });
  }

  const data = await res.json().catch(() => ({}));   // backend luôn trả JSON; phòng khi proxy trả HTML
  if (!res.ok) {
    if (res.status === 401 && !isAuthPath) notifySessionExpired();
    throw new ApiError(data.message || messageForStatus(res.status), {
      status: res.status, code: data.code || '', data,
    });
  }
  return data;
}

export const authApi = {
  login: (email, password) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (username, email, password) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  // Server đọc Refresh Token từ cookie, thu hồi nó và xóa cookie (không cần Access Token còn hạn)
  logout: () =>
    apiRequest('/api/auth/logout', { method: 'POST', headers: { 'X-Requested-With': 'fetch' }, body: '{}' }),
  me: () => apiRequest('/api/auth/me'),
  forgotPassword: (email) =>
    apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (reset_token, new_password) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ reset_token, new_password }) }),
};

export const FOLDERS_CACHE_KEY = 'folders:list';
export const foldersApi = {
  list: () => apiRequest('/api/folders'),
  create: (name) => apiRequest('/api/folders', { method: 'POST', body: JSON.stringify({ name }) }).finally(() => invalidate('folders')),
  update: (id, name) => apiRequest(`/api/folders/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }).finally(() => invalidate('folders')),
  remove: (id) => apiRequest(`/api/folders/${id}`, { method: 'DELETE' }).finally(() => invalidate('folders')),
  progress: (id) => apiRequest(`/api/folders/${id}/progress`),
  words: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/api/folders/${id}/words${qs ? `?${qs}` : ''}`);
  },
  addWord: (folderId, wordId) =>
    apiRequest(`/api/folders/${folderId}/words`, { method: 'POST', body: JSON.stringify({ word_id: wordId }) }).finally(() => invalidate('folders')),
  removeWord: (folderId, wordId) =>
    apiRequest(`/api/folders/${folderId}/words/${wordId}`, { method: 'DELETE' }).finally(() => invalidate('folders')),
};

export const learningApi = {
  newWords: (folderId, limit = 5) =>
    apiRequest(`/api/learning/folders/${folderId}/new-words?limit=${limit}`),
  todayProgress: () => apiRequest('/api/learning/progress/today'),
};

export const reviewApi = {
  dueCount: () => apiRequest('/api/review/due-count'),
  dueWords: (limit) => apiRequest(`/api/review/due-words${limit ? `?limit=${limit}` : ''}`),
};

export const wordsApi = {
  checkAnswer: (wordId, body) =>
    apiRequest(`/api/words/${wordId}/check-answer`, { method: 'POST', body: JSON.stringify(body) }),
  completeLearn: (wordId) =>
    apiRequest(`/api/words/${wordId}/complete-learn`, { method: 'POST', body: '{}' }),
  completeReview: (wordId, body) =>
    apiRequest(`/api/words/${wordId}/complete-review`, { method: 'POST', body: JSON.stringify(body) }),
  markKnown: (wordId) =>
    apiRequest(`/api/words/${wordId}/mark-known`, { method: 'POST', body: '{}' }),
  skip: (wordId) =>
    apiRequest(`/api/words/${wordId}/skip`, { method: 'POST', body: '{}' }),
  snooze: (wordId, days = 7) =>
    apiRequest(`/api/words/${wordId}/snooze`, { method: 'POST', body: JSON.stringify({ days }) }),
  
  // ✅ THÊM 2 API MỚI
  lookup: (word, translate = true) =>
    apiRequest(`/api/words/lookup/${encodeURIComponent(word)}?translate=${translate}`),
  suggestions: (word, pos = '') => {
    const qs = pos ? `?pos=${pos}` : '';
    return apiRequest(`/api/words/suggestions/${encodeURIComponent(word)}${qs}`);
  },
};

export const profileApi = {
  get: () => apiRequest('/api/profile'),
  update: (data) => apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const historyApi = {
  words: (page = 1, limit = 100) => apiRequest(`/api/history/words?page=${page}&limit=${limit}`),
  stats: () => apiRequest('/api/history/stats'),
  logs: (limit = 200) => apiRequest(`/api/history/logs?limit=${limit}`),
};

export const searchApi = {
  query: (q) => apiRequest(`/api/search?q=${encodeURIComponent(q)}`),
  history: () => apiRequest('/api/search/history'),
  popular: () => apiRequest('/api/search/popular'),
};

export const translateApi = {
  translate: (text, source_lang = 'auto', target_lang = 'vi') =>
    apiRequest('/api/translate', { method: 'POST', body: JSON.stringify({ text, source_lang, target_lang }) }),
  save: (data) => apiRequest('/api/translate/save', { method: 'POST', body: JSON.stringify(data) }),
};

export const studyApi = {
  heartbeat: (minutes = 1) =>
    apiRequest('/api/study/heartbeat', { method: 'POST', body: JSON.stringify({ minutes }) }),
  reminderPreview: () => apiRequest('/api/study/reminders/preview'),
};

export const passTestApi = {
  status: () => apiRequest('/api/pass-test/status'),
  get: (id) => apiRequest(`/api/pass-test/${id}`),
  submit: (id, answers) =>
    apiRequest(`/api/pass-test/${id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  // Lưu câu đã trả lời + giữ phiên (server đo đồng hồ 15 phút). Hết giờ -> lỗi code TIME_UP
  saveProgress: (id, answers) =>
    apiRequest(`/api/pass-test/${id}/progress`, { method: 'PUT', body: JSON.stringify({ answers }) }),
  // Thoát giữa chừng: lưu câu đã trả lời và DỪNG đồng hồ. keepalive: vẫn gửi được khi đang đóng tab/chuyển trang
  leave: (id, answers, { keepalive = false } = {}) =>
    apiRequest(`/api/pass-test/${id}/leave`, { method: 'POST', body: JSON.stringify({ answers }), keepalive }),
};

// Từ điển thật + kho từ vựng trong database (backend: /api/dictionary/*)
export const dictionaryApi = {
  // Lần đầu tra 1 từ: backend gọi từ điển trực tuyến + dịch + lưu vào DB (vài giây); các lần sau trả ngay từ DB
  lookup: (q) => apiRequest(`/api/dictionary/lookup?q=${encodeURIComponent(q)}`, { timeout: 30000 }),
  suggest: (q, limit = 8) => apiRequest(`/api/dictionary/suggest?q=${encodeURIComponent(q)}&limit=${limit}`, { timeout: 8000 }),
  save: (data) => apiRequest('/api/dictionary/save', { method: 'POST', body: JSON.stringify(data), timeout: 30000 }),
};

// AI thật (Gemini/Claude) ra đề + chấm/sửa lỗi câu dịch (STT 17)
export const aiPracticeApi = {
  sentence: (level, mode, { folderId, word } = {}) => {
    const qs = new URLSearchParams({ level, mode });
    if (folderId) qs.set('folder_id', folderId);
    if (word) qs.set('word', word);
    return apiRequest(`/api/ai-practice/sentence?${qs}`, { timeout: 30000 });
  },
  // data = { token, answer }  (token do /sentence trả về)
  check: (data) =>
    apiRequest('/api/ai-practice/check', { method: 'POST', body: JSON.stringify(data), timeout: 45000 }),
};

export function speakWord(text, voice = 'en-US') {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
