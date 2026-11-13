// src/pages/Register.jsx
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import { IconAlert } from '../components/brand/icons';

const MIN_PASSWORD = 8;

export default function Register() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/app" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password) {
      setError('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Mật khẩu cần tối thiểu ${MIN_PASSWORD} ký tự.`);
      return;
    }

    setSubmitting(true);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Bắt đầu học từ vựng theo cách nhớ lâu hơn."
      footer={<>Đã có tài khoản? <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">Đăng nhập</Link></>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <AuthField label="Tên hiển thị" value={username} onChange={setUsername} autoComplete="nickname" placeholder="Ví dụ: Minh Anh" />
        <AuthField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="ban@example.com" />
        <AuthField
          label="Mật khẩu" type="password" value={password} onChange={setPassword} autoComplete="new-password"
          placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`} hint={`Dùng ít nhất ${MIN_PASSWORD} ký tự.`}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-700 px-5 py-3 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(15,118,110,0.35)] transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>
    </AuthLayout>
  );
}
