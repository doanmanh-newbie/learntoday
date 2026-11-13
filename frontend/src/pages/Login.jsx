// src/pages/Login.jsx
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import { IconAlert } from '../components/brand/icons';

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // ProtectedRoute lưu trang người dùng định vào: đăng nhập xong quay lại đúng trang đó
  const destination = location.state?.from?.pathname || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Đã đăng nhập rồi thì không cần thấy form nữa
  if (!loading && user) return <Navigate to={destination} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu!');
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục chuỗi học của bạn."
      footer={<>Chưa có tài khoản? <Link to="/register" className="font-semibold text-brand-300 hover:text-brand-200">Đăng ký</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <AuthField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="ban@example.com" />
        <AuthField label="Mật khẩu" type="password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Nhập mật khẩu" />
        <div className="-mt-2 text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-300 hover:text-brand-200">Quên mật khẩu?</Link>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-700 px-5 py-3 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(15,118,110,0.35)] transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </AuthLayout>
  );
}
