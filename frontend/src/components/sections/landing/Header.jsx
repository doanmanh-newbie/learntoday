// Thanh đầu trang giới thiệu: cùng logo/màu với trang đăng nhập và ứng dụng.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import BrandLogo from '../../brand/BrandLogo';
import { IconMenu, IconX } from '../../brand/icons';

const NAV = [
  { label: 'Tính năng', href: '#tinh-nang' },
  { label: 'Cách hoạt động', href: '#cach-hoat-dong' },
  { label: 'Luyện câu cùng AI', href: '#luyen-cau-ai' },
  { label: 'Chủ đề', href: '#chu-de' },
];

const btnGhost = 'rounded-xl px-4 py-2 text-sm font-semibold text-ink-muted transition hover:bg-surface-2 hover:text-ink';
const btnPrimary = 'rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600';

export default function SiteHeaderSection() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  const actions = isAuthenticated ? (
    <>
      <Link to="/app" className={btnPrimary} onClick={() => setOpen(false)}>Vào ứng dụng</Link>
      <button type="button" onClick={handleLogout} className={btnGhost}>Đăng xuất</button>
    </>
  ) : (
    <>
      <Link to="/login" className={btnGhost} onClick={() => setOpen(false)}>Đăng nhập</Link>
      <Link to="/register" className={btnPrimary} onClick={() => setOpen(false)}>Bắt đầu</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <BrandLogo />

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface-2 hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">{actions}</div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-2 hover:text-ink lg:hidden"
        >
          {open ? <IconX size={24} /> : <IconMenu size={24} />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-surface px-5 pb-5 pt-3 lg:hidden">
          <nav aria-label="Điều hướng chính (di động)" className="flex flex-col">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-ink-muted hover:bg-surface-2 hover:text-ink">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 [&>*]:text-center">{actions}</div>
        </div>
      )}
    </header>
  );
}
