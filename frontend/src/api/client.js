const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');

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

async function refreshAccessToken() {
  const rt = refreshToken || localStorage.getItem('refresh_token');
  if (!rt) return false;

  const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  setTokens(data.access_token, rt);
  return true;
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && !options._retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest(path, { ...options, _retry: true });
    }
    clearTokens();
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập đã hết hạn');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra');
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
  words: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/api/folders/${id}/words?${qs}`);
  },
  addWord: (folderId, wordId) =>
    apiRequest(`/api/folders/${folderId}/words`, { method: 'POST', body: JSON.stringify({ word_id: wordId }) }),
};

export const learningApi = {
  newWords: (folderId, limit = 5) =>
    apiRequest(`/api/learning/folders/${folderId}/new-words?limit=${limit}`),
  todayProgress: () => apiRequest('/api/learning/progress/today'),
};

export const reviewApi = {
  dueCount: () => apiRequest('/api/review/due-count'),
  dueWords: (limit) => apiRequest(`/api/review/due-words?limit=${limit || ''}`),
};

export const wordsApi = {
  checkAnswer: (wordId, body) =>
    apiRequest(`/api/words/${wordId}/check-answer`, { method: 'POST', body: JSON.stringify(body) }),
  completeLearn: (wordId) =>
    apiRequest(`/api/words/${wordId}/complete-learn`, { method: 'POST', body: '{}' }),
  completeReview: (wordId, body) =>
    apiRequest(`/api/words/${wordId}/complete-review`, { method: 'POST', body: JSON.stringify(body) }),
};

export const profileApi = {
  get: () => apiRequest('/api/profile'),
  update: (data) => apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const historyApi = {
  words: (page = 1) => apiRequest(`/api/history/words?page=${page}`),
  stats: () => apiRequest('/api/history/stats'),
  logs: () => apiRequest('/api/history/logs'),
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