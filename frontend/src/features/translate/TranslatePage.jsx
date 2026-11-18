// Tab "Dịch văn bản" trong Từ điển: dịch Anh <-> Việt (gọi /api/translate: Google, dự phòng Gemini).
import { useState } from 'react';
import { translateApi } from '../../api/client';

export const MAX_TRANSLATE_CHARS = 5000;   // khớp giới hạn ở backend/app/routes/translate.py
const LANG = { en: 'Tiếng Anh', vi: 'Tiếng Việt' };

const box = {
  width: '100%', boxSizing: 'border-box', minHeight: 200, padding: 14, borderRadius: 12, fontSize: 15, lineHeight: 1.6,
  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#e9edef',
  fontFamily: 'Inter, sans-serif', resize: 'vertical',
};
const btn = { padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#e9edef' };

export default function TranslatePage() {
  const [src, setSrc] = useState('en');
  const tgt = src === 'en' ? 'vi' : 'en';
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('idle');     // idle | loading | error
  const [error, setError] = useState('');

  const translate = async () => {
    if (!text.trim() || status === 'loading') return;
    setStatus('loading'); setError('');
    try {
      const res = await translateApi.translate(text, src, tgt);
      setResult(res.translated || '');
      setStatus('idle');
    } catch (e) {
      setError(e?.message || 'Không dịch được, thử lại sau.');
      setStatus('error');
    }
  };

  const swap = () => { setSrc(tgt); setText(result); setResult(text); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 10px', flexWrap: 'wrap' }}>
        <strong style={{ color: '#e9edef' }}>{LANG[src]}</strong>
        <button type="button" onClick={swap} aria-label="Đổi chiều dịch" style={{ ...btn, padding: '6px 14px' }}>⇄</button>
        <strong style={{ color: '#e9edef' }}>{LANG[tgt]}</strong>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
        <div>
          <textarea value={text} maxLength={MAX_TRANSLATE_CHARS} aria-label={`Văn bản ${LANG[src]}`}
            placeholder="Nhập hoặc dán văn bản…" style={box}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) translate(); }} />
          <div style={{ fontSize: 12, color: '#a2acb3', textAlign: 'right' }}>{text.length}/{MAX_TRANSLATE_CHARS}</div>
        </div>
        <div>
          <div role="status" aria-live="polite" aria-label={`Bản dịch ${LANG[tgt]}`}
            style={{ ...box, whiteSpace: 'pre-wrap', color: result ? '#e9edef' : '#a2acb3' }}>
            {status === 'loading' ? 'Đang dịch…' : result || 'Bản dịch sẽ hiện ở đây'}
          </div>
          {result && (
            <button type="button" style={{ ...btn, marginTop: 8, padding: '6px 14px', fontSize: 13 }}
              onClick={() => navigator.clipboard?.writeText(result).catch(() => {})}>📋 Sao chép</button>
          )}
        </div>
      </div>

      {error && <p style={{ color: '#fca5a5' }}>⚠️ {error}</p>}
      <button type="button" onClick={translate} disabled={!text.trim() || status === 'loading'}
        style={{ ...btn, marginTop: 14, border: 'none', color: '#fff', background: 'linear-gradient(135deg,#0f766e,#0e8077)', opacity: !text.trim() || status === 'loading' ? 0.6 : 1 }}>
        {status === 'loading' ? 'Đang dịch…' : 'Dịch (Ctrl+Enter)'}
      </button>
    </div>
  );
}
