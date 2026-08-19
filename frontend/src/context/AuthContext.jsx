// src/context/AuthContext.jsx
import { useState, useEffect } from 'react';
import { authApi, setTokens, clearTokens, getAccessToken, getRefreshToken } from '../api/client';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading = true trong lúc đang kiểm tra token cũ lúc mới mở app,
  // tránh việc trang "nháy" sang trạng thái chưa đăng nhập rồi mới nhảy lại.
  // Khởi tạo dựa thẳng vào việc có token sẵn hay không, để không phải gọi
  // setState đồng bộ ngay trong effect khi không có token.
  const [loading, setLoading] = useState(() => !!getAccessToken());

  // Khi app khởi động, nếu đã có sẵn accessToken (từ lần đăng nhập trước),
  // thử gọi /api/auth/me để khôi phục lại thông tin user
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    authApi
      .me()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        // Token hết hạn hoặc không hợp lệ - xóa để tránh vòng lặp gọi lỗi
        clearTokens();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function saveSession(data) {
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
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
      // dù API logout lỗi (mất mạng, token đã hết hạn...) vẫn xóa phiên ở client
    }
    clearTokens();
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