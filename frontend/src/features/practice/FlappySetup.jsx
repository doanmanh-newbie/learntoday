import { useEffect, useMemo, useState } from 'react';
import { foldersApi } from '../../api/client';
import { PRIMARY_BTN, SECONDARY_BTN } from './modeStyles';
import { loadFolderWords, describePool } from './flappyPool';
import { usableWords } from './practiceLogic';
import FlappyLeaderboard from './FlappyLeaderboard.jsx';

const chip = (on) => ({ ...SECONDARY_BTN, padding: '9px 14px', ...(on ? { background: 'rgba(45,212,191,0.18)', border: '1px solid #2dd4bf' } : {}) });

export default function FlappySetup({ learnedWords, onStart }) {
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState(null);   // null = kho từ đã học
  const [includeUnlearned, setIncludeUnlearned] = useState(false);
  const [folderWords, setFolderWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('play');   // 'play' | 'board'
  const learned = useMemo(() => usableWords(learnedWords), [learnedWords]);

  useEffect(() => {
    foldersApi.list()
      .then((r) => setFolders([...(r.system_folders || []), ...(r.personal_folders || [])]))
      .catch(() => {});   // không có thư mục vẫn chơi được bằng kho từ đã học
  }, []);

  // Đổi nguồn/công tắc: reset đồng bộ trong handler để không có render nào giữ từ của nguồn cũ với Chơi đang mở.
  const switchTo = (id, unlearned) => {
    if (id === folderId && unlearned === includeUnlearned) return;   // không đổi gì thì effect không chạy lại, đừng bật loading
    setFolderId(id); setIncludeUnlearned(unlearned);
    setFolderWords([]); setError(''); setLoading(id != null);
  };

  useEffect(() => {
    if (folderId == null) return undefined;
    let stale = false;
    loadFolderWords(folderId, (page, limit) => foldersApi.words(folderId, { page, limit }), { includeUnlearned })
      .then((w) => { if (!stale) { setFolderWords(w); setLoading(false); } })
      .catch((e) => { if (!stale) { setError(e?.message || 'Không tải được thư mục này.'); setLoading(false); } });
    return () => { stale = true; };
  }, [folderId, includeUnlearned]);

  const words = folderId == null ? learned : folderWords;
  const pool = describePool(words, folderId == null ? 'learned' : 'folder');
  const start = () => onStart({ words, folderId: folderId == null ? null : String(folderId), distractorPool: learned });

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 16, color: '#e9edef', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button type="button" style={{ ...chip(view === 'play'), flex: 1 }} onClick={() => setView('play')}>Chơi</button>
        <button type="button" style={{ ...chip(view === 'board'), flex: 1 }} onClick={() => setView('board')}>Xếp hạng</button>
      </div>
      {view === 'board' ? <FlappyLeaderboard /> : (<>
      <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Chọn bộ từ</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <button type="button" style={chip(folderId == null)} onClick={() => switchTo(null, false)}>Kho từ đã học</button>
        {folders.map((f) => (
          <button key={f.id} type="button" style={chip(folderId === f.id)} onClick={() => switchTo(f.id, false)}>{f.name}</button>
        ))}
      </div>
      {folderId != null && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, fontSize: 14 }}>
          <input type="checkbox" checked={includeUnlearned} onChange={(e) => switchTo(folderId, e.target.checked)} />
          Gồm cả từ chưa học
        </label>
      )}
      {error && <p role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>}
      <p style={{ fontSize: 14, opacity: 0.85, minHeight: 20 }}>{loading ? 'Đang tải từ...' : (!error && pool.note)}</p>
      <button type="button" style={{ ...PRIMARY_BTN, width: '100%', opacity: pool.playable && !loading ? 1 : 0.45 }} disabled={!pool.playable || loading} onClick={start}>Chơi</button>
      </>)}
    </div>
  );
}
