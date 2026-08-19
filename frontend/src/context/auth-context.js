// src/context/auth-context.js
// Tách riêng object Context ra khỏi AuthContext.jsx để file đó chỉ export
// component (AuthProvider) — đúng yêu cầu của react-refresh/only-export-components,
// tránh mất Fast Refresh khi sửa code trong AuthContext.jsx.
import { createContext } from 'react';

export const AuthContext = createContext(null);
