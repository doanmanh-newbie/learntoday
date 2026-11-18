// Tự dịch các nghĩa/ví dụ còn "chưa dịch" trên trang chi tiết từ (gộp chức năng dịch vào tra cứu).
// Gọi /api/translate/batch (Google, dự phòng Gemini). Kết quả nhớ trong phiên để mở lại từ không gọi lại.
import { useCallback, useEffect, useState } from 'react';
import { translateApi } from '../api/client';

const memo = new Map();       // câu tiếng Anh -> bản dịch (cả phiên làm việc)
const CHUNK = 30;

export function missingTexts(entry) {
  if (!entry) return [];
  const out = [];
  for (const m of entry.meanings || []) {
    for (const d of m.definitions || []) {
      if (!d.vi && d.en) out.push(d.en);
      for (const ex of d.examples || []) if (!ex.vi && ex.en) out.push(ex.en);
    }
  }
  return [...new Set(out)];
}

/** { vi(text) -> bản dịch | undefined, status: 'idle'|'loading'|'done'|'error', retry() } */
export default function useAutoTranslate(entry) {
  const [, force] = useState(0);
  const [status, setStatus] = useState('idle');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const todo = missingTexts(entry).filter((t) => !memo.has(t));
    // Đồng bộ trạng thái dịch (nguồn ngoài: bộ nhớ đệm + API) vào state: đúng mục đích của effect.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (todo.length === 0) { setStatus('done'); return undefined; }
    let alive = true;
    setStatus('loading');
    /* eslint-enable react-hooks/set-state-in-effect */
    (async () => {
      let failed = false;
      for (let i = 0; i < todo.length; i += CHUNK) {
        const chunk = todo.slice(i, i + CHUNK);
        try {
          const res = await translateApi.batch(chunk);
          chunk.forEach((t, k) => { if (res.translations?.[k]) memo.set(t, res.translations[k]); else failed = true; });
        } catch { failed = true; }
        if (!alive) return;
        force((n) => n + 1);
      }
      if (alive) setStatus(failed ? 'error' : 'done');
    })();
    return () => { alive = false; };
  }, [entry, nonce]);

  const vi = useCallback((text) => memo.get(text), []);
  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return { vi, status, retry };
}
