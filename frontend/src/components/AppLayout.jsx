import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studyApi } from '../api/client';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      studyApi.heartbeat(1).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/app', label: 'Trang chính' },
    { to: '/app/folders', label: 'Folder' },
    { to: '/app/review', label: 'Ôn tập' },
    { to: '/app/search', label: 'Tìm kiếm' },
    { to: '/app/history', label: 'Lịch sử' },
    { to: '/app/translate', label: 'Dịch' },
    { to: '/app/ai-practice', label: 'Luyện câu' },
    { to: '/app/profile', label: 'Cá nhân' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/app" className="text-xl font-bold text-indigo-600 no-underline">
            Learn Today
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className="text-slate-600 no-underline hover:text-indigo-600">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">🔥 {user?.streak || 0}</span>
            <span className="text-slate-600">{user?.username}</span>
            <button type="button" onClick={handleLogout} className="rounded-lg bg-slate-200 px-3 py-1.5 text-slate-700">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
