// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { registerApi, loginApi, getCurrentUserApi } from '../api/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading = true trong lúc đang kiểm tra token cũ lúc mới mở app,
  // tránh việc trang "nháy" sang trạng thái chưa đăng nhập rồi mới nhảy lại
  const [loading, setLoading] = useState(true);

  // Khi app khởi động, nếu localStorage có sẵn accessToken (từ lần đăng nhập
  // trước), thử gọi /api/auth/me để khôi phục lại thông tin user
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setLoading(false);
      return;
    }

    getCurrentUserApi()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        // Token hết hạn hoặc không hợp lệ - xóa để tránh vòng lặp gọi lỗi
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function saveSession({ access_token, refresh_token, user: userData }) {
    localStorage.setItem('accessToken', access_token);
    localStorage.setItem('refreshToken', refresh_token);
    setUser(userData);
  }

  async function register({ username, email, password }) {
    const data = await registerApi({ username, email, password });
    saveSession(data);
    return data;
  }

  async function login({ email, password }) {
    const data = await loginApi({ email, password });
    saveSession(data);
    return data;
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
