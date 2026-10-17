// src/context/AuthContext.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { authApi, setTokens, clearTokens, getAccessToken, getRefreshToken } from '../api/client';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!getAccessToken());
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
        setUser(data.user);
        setConnectionError(null);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        if (err?.status === 401 || err?.code === 'SESSION_EXPIRED') {
          clearTokens();                       // token thật sự hỏng/hết hạn
          setConnectionError(null);
        } else {
          setConnectionError(err?.message || 'Không kết nối được máy chủ.');
        }
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, []);

  // Khôi phục phiên khi mở app (nếu có token từ lần trước)
  useEffect(() => {
    if (!getAccessToken()) return;
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
    setTokens(data.access_token, data.refresh_token);
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
      await authApi.logout(getRefreshToken());
    } catch {
      // Lỗi mạng khi đăng xuất: vẫn xóa phiên phía client
    }
    clearTokens();
    setUser(null);
  }

  const value = {
    user,
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
