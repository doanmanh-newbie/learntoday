// Hình minh họa cho một từ: ảnh của từ (nếu có) -> emoji -> ảnh Wikipedia (chỉ danh từ, tải lười, nhớ kết quả) -> chữ cái đầu.
import { useEffect, useState } from 'react';
import { emojiFor } from './wordEmoji';

const cache = new Map();   // word -> url | '' (đã thử, không có)

async function wikiThumb(word) {
  const key = word.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  let url = '';
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const text = `${data.description || ''} ${data.extract || ''}`;
      // bỏ trang định hướng ("may refer to") và trang không có ảnh
      if (data.type === 'standard' && !/may refer to|disambiguation/i.test(text)) url = data.thumbnail?.source || '';
    }
  } catch { /* offline/bị chặn: dùng chữ cái đầu */ }
  cache.set(key, url);
  return url;
}

export default function WordPicture({ word, size = 56, radius = 14, allowWeb = true }) {
  const emoji = emojiFor(word?.word);
  const own = word?.image_url || '';
  const [web, setWeb] = useState('');
  const isNoun = !word?.pos || word.pos === 'n';

  useEffect(() => {
    let alive = true;
    if (own || emoji || !allowWeb || !isNoun || !word?.word) return undefined;
    wikiThumb(word.word).then((u) => { if (alive) setWeb(u); });
    return () => { alive = false; };
  }, [own, emoji, allowWeb, isNoun, word?.word]);

  const box = {
    flexShrink: 0, width: size, height: size, borderRadius: radius, display: 'grid', placeItems: 'center', overflow: 'hidden',
    background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)',
  };
  const src = own || web;
  if (src) return <div style={box}><img src={src} alt={word.word} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>;
  if (emoji) return <div style={{ ...box, fontSize: size * 0.58 }} role="img" aria-label={word.word}>{emoji}</div>;
  return <div style={{ ...box, fontSize: size * 0.42, fontWeight: 800, color: '#5eead4', fontFamily: 'Outfit, sans-serif' }} aria-hidden>{String(word?.word || '?').charAt(0).toUpperCase()}</div>;
}
