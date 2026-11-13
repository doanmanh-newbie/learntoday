// src/components/brand/BrandLogo.jsx - logo dùng CHUNG cho landing, đăng nhập/đăng ký và ứng dụng
import { useId } from 'react';
import { Link } from 'react-router-dom';

export function LogoMark({ size = 36 }) {
  const gid = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gid})`} />
      {/* quyển sách mở */}
      <path d="M10 13.5c3.2-1.2 6.5-.9 10 1.2v13.3c-3.5-2.1-6.8-2.4-10-1.2V13.5z" fill="#fff" fillOpacity=".96" />
      <path d="M30 13.5c-3.2-1.2-6.5-.9-10 1.2v13.3c3.5-2.1 6.8-2.4 10-1.2V13.5z" fill="#fff" fillOpacity=".7" />
      {/* chấm đỏ: "hôm nay" - điểm nhấn màu phụ */}
      <circle cx="31" cy="10" r="3.4" fill="#ef4444" stroke="#0f1214" strokeWidth="1.6" />
    </svg>
  );
}

/** to = đường dẫn khi bấm (mặc định về trang chủ); to={null} = không bấm được. */
export default function BrandLogo({ size = 36, to = '/', showText = true, className = '' }) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className="font-display text-xl font-extrabold tracking-tight text-ink">
          Learn<span className="text-brand-300">Today</span>
        </span>
      )}
    </span>
  );
  return to ? <Link to={to} aria-label="Learn Today - về trang chủ" className="rounded-lg">{content}</Link> : content;
}
