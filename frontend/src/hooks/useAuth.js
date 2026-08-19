// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/auth-context';

/**
 * Hook tiện dùng để lấy trạng thái đăng nhập ở bất kỳ component nào.
 * Ví dụ: const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  }

  return context;
}
