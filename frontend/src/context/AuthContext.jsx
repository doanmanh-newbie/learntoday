// src/context/AuthContext.jsx
import { useState, useEffect, useRef } from 'react';
import { authApi, setTokens, clearTokens, getAccessToken, getRefreshToken } from '../api/client';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!getAccessToken());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Timeout 10s để tránh treo loading mãi
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        clearTokens();
        setUser(null);
        setLoading(false);
      }
    }, 10000);

    authApi
      .me()
      .then((data) => {
        if (mountedRef.current) setUser(data.user);
      })
      .catch(() => {
        if (mountedRef.current) clearTokens();
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (mountedRef.current) setLoading(false);
      });

    return () => clearTimeout(timeoutId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      // Bỏ qua lỗi logout
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