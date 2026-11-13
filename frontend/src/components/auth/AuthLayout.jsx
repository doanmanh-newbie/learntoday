// src/components/auth/AuthLayout.jsx
// Khung chung cho Đăng nhập / Đăng ký: cùng logo, nền, font và bảng màu với trang giới thiệu và ứng dụng.
// Trái (ẩn trên điện thoại): giá trị của sản phẩm. Phải: biểu mẫu.
import { Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';
import { IconRepeat, IconSparkles, IconBook } from '../brand/icons';

const POINTS = [
  { icon: IconBook, title: 'Học theo chủ đề', text: 'Folder từ vựng có sẵn và thư mục riêng của bạn.' },
  { icon: IconRepeat, title: 'Ôn tập ngắt quãng (SRS)', text: '6 cấp độ, nhắc đúng lúc bạn sắp quên.' },
  { icon: IconSparkles, title: 'AI chấm và sửa câu', text: 'Điểm ngữ pháp, từ vựng, độ tự nhiên kèm giải thích.' },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg text-ink">
      {/* ánh sáng nền: xanh ngọc (chủ đạo) và một chút đỏ (nhấn) */}
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/15 blur-[110px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-52 -right-40 h-[30rem] w-[30rem] rounded-full bg-red-500/10 blur-[120px]" />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
        <BrandLogo />
        <Link to="/" className="text-sm font-medium text-ink-muted transition hover:text-ink">← Về trang chủ</Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-5 pb-12 pt-2 sm:px-10 lg:grid-cols-[1.05fr_1fr]">
        <section className="hidden lg:block">
          <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight">
            Nhớ từ vựng <span className="text-brand-300">lâu hơn</span>,<br />học mỗi ngày một chút.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
            Học từ mới, ôn đúng thời điểm và luyện đặt câu cùng AI — tất cả trong một nơi.
          </p>
          <ul className="mt-8 space-y-5">
            {POINTS.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
                  <Icon size={22} />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{t}</span>
                  <span className="block text-sm text-ink-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-line bg-surface p-7 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-9">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>}
        </section>
      </main>
    </div>
  );
}

