// Chân trang: chỉ chứa liên kết có trang đích thật (bản cũ trỏ tới /privacy-policy, /terms-of-service, /support chưa tồn tại).
import { Link } from 'react-router-dom';
import BrandLogo from '../../brand/BrandLogo';

const COLS = [
  { title: 'Sản phẩm', links: [['Tính năng', '#tinh-nang'], ['Cách hoạt động', '#cach-hoat-dong'], ['Luyện câu cùng AI', '#luyen-cau-ai'], ['Chủ đề', '#chu-de']] },
  { title: 'Tài khoản', links: [['Đăng nhập', '/login'], ['Đăng ký', '/register']] },
];

export default function SiteFooterSection() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandLogo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
            Học từ vựng tiếng Anh bằng lặp lại ngắt quãng và luyện câu cùng AI.
          </p>
        </div>
        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink">{col.title}</h3>
            <ul className="space-y-3 text-sm">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith('#')
                    ? <a href={href} className="text-ink-muted transition hover:text-brand-300">{label}</a>
                    : <Link to={href} className="text-ink-muted transition hover:text-brand-300">{label}</Link>}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line px-5 py-5 text-center text-xs text-ink-subtle">
        © {new Date().getFullYear()} Learn Today
      </div>
    </footer>
  );
}
