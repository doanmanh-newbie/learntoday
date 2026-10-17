// src/api/client.js - MỘT lớp gọi API duy nhất cho toàn app.
const API_BASE = (import.meta.env?.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 20000;

// Các endpoint xác thực: 401 ở đây nghĩa là "sai thông tin" chứ KHÔNG phải "token hết hạn",
// nên không được thử refresh/đăng xuất. (Trước đây nhập sai mật khẩu -> bị coi là hết phiên ->
// tải lại trang /login và mất luôn thông báo lỗi.)
const AUTH_PATHS = [
  '/api/auth/login', '/api/auth/register', '/api/auth/refresh-token',
  '/api/auth/forgot-password', '/api/auth/reset-password',
];

let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');

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

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem('access_token', access);
  else localStorage.removeItem('access_token');
  if (refresh) localStorage.setItem('refresh_token', refresh);
  else localStorage.removeItem('refresh_token');
}

export function clearTokens() {
  setTokens(null, null);
}

export function getAccessToken() {
  return accessToken || localStorage.getItem('access_token');
}

export function getRefreshToken() {
  return refreshToken || localStorage.getItem('refresh_token');
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
    return await fetch(url, { ...options, signal: controller.signal });
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
      const rt = getRefreshToken();
      if (!rt) return 'invalid';
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        }, REQUEST_TIMEOUT_MS);
        if (res.status >= 500) return 'error';
        if (!res.ok) return 'invalid';
        const data = await res.json();
        setTokens(data.access_token, rt);
        return 'ok';
      } catch {
        return 'error';
      }
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

function notifySessionExpired() {
  clearTokens();
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

  if (res.status === 401 && !isAuthPath && !_retry && getRefreshToken()) {
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
  logout: (refresh_token) =>
    apiRequest('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  me: () => apiRequest('/api/auth/me'),
};

export const foldersApi = {
  list: () => apiRequest('/api/folders'),
  create: (name) => apiRequest('/api/folders', { method: 'POST', body: JSON.stringify({ name }) }),
  update: (id, name) => apiRequest(`/api/folders/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  remove: (id) => apiRequest(`/api/folders/${id}`, { method: 'DELETE' }),
  progress: (id) => apiRequest(`/api/folders/${id}/progress`),
  words: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/api/folders/${id}/words${qs ? `?${qs}` : ''}`);
  },
  addWord: (folderId, wordId) =>
    apiRequest(`/api/folders/${folderId}/words`, { method: 'POST', body: JSON.stringify({ word_id: wordId }) }),
  removeWord: (folderId, wordId) =>
    apiRequest(`/api/folders/${folderId}/words/${wordId}`, { method: 'DELETE' }),
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
};

export const aiPracticeApi = {
  sentence: (level, mode) =>
    apiRequest(`/api/ai-practice/sentence?level=${level}&mode=${mode}`),
  check: (data) =>
    apiRequest('/api/ai-practice/check', { method: 'POST', body: JSON.stringify(data) }),
};

export function speakWord(text, voice = 'en-US') {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
