import { useEffect, useState } from 'react';
import { foldersApi } from '../../api/client';
import { PRIMARY_BTN, SECONDARY_BTN } from './modeStyles';
import { loadFolderWords, describePool } from './flappyPool';
import { usableWords } from './practiceLogic';

const chip = (on) => ({ ...SECONDARY_BTN, padding: '9px 14px', ...(on ? { background: 'rgba(45,212,191,0.18)', border: '1px solid #2dd4bf' } : {}) });

export default function FlappySetup({ learnedWords, onStart }) {
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState(null);   // null = kho từ đã học
  const [includeUnlearned, setIncludeUnlearned] = useState(false);
  const [words, setWords] = useState(() => usableWords(learnedWords));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    foldersApi.list()
      .then((r) => setFolders([...(r.system_folders || []), ...(r.personal_folders || [])]))
      .catch(() => {});   // không có thư mục vẫn chơi được bằng kho từ đã học
  }, []);

  useEffect(() => {
    setError('');
    if (folderId == null) { setWords(usableWords(learnedWords)); return undefined; }
    let stale = false;
    setLoading(true);
    loadFolderWords(folderId, (page, limit) => foldersApi.words(folderId, { page, limit }), { includeUnlearned })
      .then((w) => { if (!stale) setWords(w); })
      .catch((e) => { if (!stale) { setWords([]); setError(e?.message || 'Không tải được thư mục này.'); } })
      .finally(() => { if (!stale) setLoading(false); });
    return () => { stale = true; };
  }, [folderId, includeUnlearned, learnedWords]);

  const pool = describePool(words);
  const start = () => onStart({ words, folderId: folderId == null ? null : String(folderId), distractorPool: usableWords(learnedWords) });

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 16, color: '#e9edef', fontFamily: 'Outfit, sans-serif' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Chọn bộ từ</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <button type="button" style={chip(folderId == null)} onClick={() => setFolderId(null)}>Kho từ đã học</button>
        {folders.map((f) => (
          <button key={f.id} type="button" style={chip(folderId === f.id)} onClick={() => setFolderId(f.id)}>{f.name}</button>
        ))}
      </div>
      {folderId != null && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, fontSize: 14 }}>
          <input type="checkbox" checked={includeUnlearned} onChange={(e) => setIncludeUnlearned(e.target.checked)} />
          Gồm cả từ chưa học
        </label>
      )}
      {error && <p role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>}
      <p style={{ fontSize: 14, opacity: 0.85, minHeight: 20 }}>{loading ? 'Đang tải từ...' : (!error && pool.note)}</p>
      <button type="button" style={{ ...PRIMARY_BTN, width: '100%', opacity: pool.playable && !loading ? 1 : 0.45 }} disabled={!pool.playable || loading} onClick={start}>Chơi</button>
    </div>
  );
}
