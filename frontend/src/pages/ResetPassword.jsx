// src/pages/ResetPassword.jsx - đặt mật khẩu mới từ liên kết trong email: /reset-password#token=...
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import { IconAlert, IconCheck } from '../components/brand/icons';
import { authApi } from '../api/client';

const MIN_PASSWORD = 8;

/** Token nằm sau dấu # nên không bị gửi lên server/log/referrer. (Hàm thuần: React StrictMode gọi bộ khởi tạo state 2 lần.) */
function readTokenFromUrl() {
  return new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') || '';
}

export default function ResetPassword() {
  const [token] = useState(readTokenFromUrl);       // chỉ đọc một lần khi mở trang
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Xóa token khỏi thanh địa chỉ (không nằm lại trong lịch sử trình duyệt); token vẫn còn trong state của trang
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD) {
      setError(`Mật khẩu cần tối thiểu ${MIN_PASSWORD} ký tự.`);
      return;
    }
    if (password !== confirm) {
      setError('Hai mật khẩu chưa giống nhau.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const footer = <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">Về trang đăng nhập</Link>;

  if (done) {
    return (
      <AuthLayout title="Đã đổi mật khẩu" subtitle="Bạn đã được đăng xuất khỏi mọi thiết bị." footer={footer}>
        <div role="status" className="flex items-start gap-2.5 rounded-xl border border-brand-400/35 bg-brand-400/10 px-4 py-3 text-sm text-brand-200">
          <IconCheck size={18} className="mt-0.5 shrink-0" />
          <span>Mật khẩu mới đã được lưu. Hãy đăng nhập lại bằng mật khẩu mới.</span>
        </div>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout title="Liên kết không hợp lệ" subtitle="Liên kết đặt lại mật khẩu bị thiếu hoặc đã bị cắt." footer={footer}>
        <p className="text-sm text-ink-muted">
          Hãy mở đúng liên kết trong email, hoặc{' '}
          <Link to="/forgot-password" className="font-semibold text-brand-300 hover:text-brand-200">yêu cầu liên kết mới</Link>.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Đặt mật khẩu mới" subtitle="Chọn mật khẩu mà bạn chưa dùng ở nơi khác." footer={footer}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            <span>
              {error}{' '}
              {/liên kết|hết hạn|sử dụng/i.test(error) && (
                <Link to="/forgot-password" className="font-semibold underline">Yêu cầu liên kết mới</Link>
              )}
            </span>
          </div>
        )}
        <AuthField
          label="Mật khẩu mới" type="password" value={password} onChange={setPassword} autoComplete="new-password"
          placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`} hint={`Dùng ít nhất ${MIN_PASSWORD} ký tự.`}
        />
        <AuthField label="Nhập lại mật khẩu mới" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" placeholder="Nhập lại để chắc chắn" />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-700 px-5 py-3 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(15,118,110,0.35)] transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
        </button>
      </form>
    </AuthLayout>
  );
}
