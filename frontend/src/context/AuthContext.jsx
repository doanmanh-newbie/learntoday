// src/context/AuthContext.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { authApi, setAccessToken, clearSession, hasSession } from '../api/client';
import { AuthContext } from './auth-context';
import { applyUserPrefs } from '../utils/prefs';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => hasSession());
  // Có token nhưng server/DB tạm thời không trả lời: KHÔNG đăng xuất, cho người dùng bấm "Thử lại".
  // (Trước đây mọi lỗi - kể cả mất mạng hay Supabase đang bận - đều xóa token => bị đăng xuất oan.)
  const [connectionError, setConnectionError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const bootstrap = useCallback(() => {
    return authApi
      .me()
      .then((data) => {
        if (!mountedRef.current) return;
        applyUserPrefs(data.user);
        setUser(data.user);
        setConnectionError(null);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        if (err?.status === 401 || err?.code === 'SESSION_EXPIRED') {
          clearSession();                      // phiên thật sự hỏng/hết hạn
          setConnectionError(null);
        } else {
          setConnectionError(err?.message || 'Không kết nối được máy chủ.');
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, []);

  // Khôi phục phiên khi mở app: Access Token chỉ nằm trong bộ nhớ nên sau khi tải lại trang chưa có; request /me đầu tiên
  // nhận 401 rồi client.js tự xin Access Token mới bằng cookie Refresh Token (HttpOnly) và gửi lại.
  useEffect(() => {
    if (!hasSession()) return;
    bootstrap();
  }, [bootstrap]);

  // client.js phát sự kiện này khi refresh token hỏng -> về trạng thái chưa đăng nhập (không reload trang)
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const retryConnection = useCallback(() => {
    setLoading(true);
    setConnectionError(null);
    bootstrap();
  }, [bootstrap]);

  function saveSession(data) {
    setAccessToken(data.access_token);
    applyUserPrefs(data.user);
    setUser(data.user);
    setConnectionError(null);
  }

  async function register({ username, email, password }) {
    const data = await authApi.register(username, email, password);
    saveSession(data);
    return data;
  }

  async function login({ email, password }) {
    const data = await authApi.login(email, password);
    saveSession(data);
    return data;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Lỗi mạng khi đăng xuất: vẫn xóa phiên phía client
    }
    clearSession();
    setUser(null);
  }

  // Trang Cài đặt gọi sau khi lưu để Header/Dashboard thấy tên + mục tiêu mới ngay
  const updateUser = useCallback((next) => {
    applyUserPrefs(next);
    setUser(next);
  }, []);

  const value = {
    user,
    updateUser,
    loading,
    connectionError,
    retryConnection,
    isAuthenticated: !!user,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
