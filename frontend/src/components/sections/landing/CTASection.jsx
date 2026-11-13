// Lời kêu gọi cuối trang - dẫn thẳng tới đăng ký/đăng nhập (bản cũ có ô nhập email không gửi đi đâu và gói "VIP" không tồn tại).
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

export default function CallToActionSection() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="bg-bg">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-surface px-6 py-14 text-center sm:px-12">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/20 blur-[90px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 -right-20 h-64 w-64 rounded-full bg-red-500/10 blur-[90px]" />
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Sẵn sàng nhớ từ vựng lâu hơn?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Tạo tài khoản, chọn một chủ đề và học 5 từ đầu tiên ngay hôm nay.
          </p>
          <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to="/app" className="rounded-xl bg-brand-700 px-8 py-3.5 text-base font-bold text-white transition hover:bg-brand-600">Vào ứng dụng</Link>
            ) : (
              <>
                <Link to="/register" className="rounded-xl bg-brand-700 px-8 py-3.5 text-base font-bold text-white shadow-[0_10px_30px_rgba(15,118,110,0.4)] transition hover:bg-brand-600">Tạo tài khoản</Link>
                <Link to="/login" className="rounded-xl border border-line px-7 py-3.5 text-base font-semibold text-ink transition hover:bg-surface-2">Tôi đã có tài khoản</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
