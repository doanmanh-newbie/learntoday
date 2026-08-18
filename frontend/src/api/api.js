// src/api/api.js
const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Hàm gọi API dùng chung cho toàn bộ app.
 * - Tự động thêm header Content-Type: application/json
 * - Tự động gắn Authorization: Bearer <token> nếu có accessToken trong localStorage
 * - Ném lỗi (throw) kèm message từ backend nếu response không ok, để nơi gọi
 *   dùng try/catch bắt được
 */
async function apiFetch(path, options = {}) {
  const accessToken = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Backend luôn trả về { message: '...' } khi lỗi - dùng lại message đó
    const error = new Error(data.message || 'Đã có lỗi xảy ra, vui lòng thử lại!');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ===== AUTH =====

export function registerApi({ username, email, password }) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export function loginApi({ email, password }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUserApi() {
  return apiFetch('/api/auth/me', { method: 'GET' });
}

export function forgotPasswordApi({ email }) {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordApi({ reset_token, new_password }) {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ reset_token, new_password }),
  });
}

// ===== FOLDERS (STT 3) - chuẩn bị sẵn cho các trang sau này =====

export function getFoldersApi() {
  return apiFetch('/api/folders', { method: 'GET' });
}

export function createFolderApi({ name }) {
  return apiFetch('/api/folders', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export default apiFetch;
