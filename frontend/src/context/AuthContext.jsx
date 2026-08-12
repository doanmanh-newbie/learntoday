import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, setTokens, clearTokens, getAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const data = await authApi.register(username, email, password);
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    const rt = localStorage.getItem('refresh_token');
    try {
      if (rt) await authApi.logout(rt);
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, reloadUser: loadUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
