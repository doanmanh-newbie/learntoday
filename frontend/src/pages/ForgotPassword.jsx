// src/pages/ForgotPassword.jsx - yêu cầu email đặt lại mật khẩu
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthField from '../components/auth/AuthField';
import { IconAlert, IconCheck } from '../components/brand/icons';
import { authApi } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Vui lòng nhập email!');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);                       // server luôn trả cùng một thông báo, dù email có tài khoản hay không
    } catch (err) {
      setError(err.message);               // gồm cả "thao tác quá nhiều lần" (429)
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu."
      footer={<>Nhớ ra rồi? <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">Đăng nhập</Link></>}
    >
      {sent ? (
        <div role="status" className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-brand-400/35 bg-brand-400/10 px-4 py-3 text-sm text-brand-200">
            <IconCheck size={18} className="mt-0.5 shrink-0" />
            <span>
              Nếu email này có tài khoản, liên kết đặt lại mật khẩu đã được gửi (có hiệu lực 15 phút, dùng được một lần).
              Hãy kiểm tra cả thư mục spam.
            </span>
          </div>
          <button type="button" onClick={() => setSent(false)} className="text-sm font-semibold text-brand-300 hover:text-brand-200">
            Gửi lại hoặc dùng email khác
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <IconAlert size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <AuthField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="ban@example.com" />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-700 px-5 py-3 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(15,118,110,0.35)] transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
