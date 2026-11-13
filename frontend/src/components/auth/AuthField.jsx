// src/components/auth/AuthField.jsx - ô nhập có nhãn, gợi ý và nút hiện/ẩn mật khẩu
import { useId, useState } from 'react';
import { IconEye, IconEyeOff } from '../brand/icons';

export default function AuthField({ label, type = 'text', value, onChange, hint, error, autoComplete, placeholder, required = true }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && shown ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!error}
          aria-describedby={hint || error ? `${id}-note` : undefined}
          className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-[15px] text-ink placeholder:text-ink-subtle outline-none transition
            focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 ${error ? 'border-red-500' : 'border-line'} ${isPassword ? 'pr-12' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={shown}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink-muted transition hover:text-ink"
          >
            {shown ? <IconEyeOff size={20} /> : <IconEye size={20} />}
          </button>
        )}
      </div>
      {(hint || error) && (
        <p id={`${id}-note`} className={`mt-1.5 text-xs ${error ? 'text-red-400' : 'text-ink-subtle'}`}>{error || hint}</p>
      )}
    </div>
  );
}
