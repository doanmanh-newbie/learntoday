// Học từ nội dung thật: dán bài báo/phụ đề -> tách từ chưa biết -> tra từ điển và thêm vào folder cá nhân.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dictionaryApi, foldersApi, historyApi } from '../../api/client';
import { extractCandidates } from './extractWords';

const MAX_CHARS = 20000;
const card = { padding: 20, borderRadius: 16, marginBottom: 16, background: 'rgba(255,255,255,0.03)', border: '0.8px solid rgba(255,255,255,0.08)' };
const btn = { padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0f766e,#0e8077)' };
const ghost = { padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#dde2e5', background: 'rgba(255,255,255,0.05)', border: '0.8px solid rgba(255,255,255,0.12)' };

/** Từ người học đã có (đã học + trong folder cá nhân) để không gợi ý lại. */
async function loadKnown() {
  const known = new Set();
  for (let page = 1; page <= 5; page++) {
    const res = await historyApi.words(page, 100).catch(() => null);
    (res?.words || []).forEach((w) => w.word && known.add(String(w.word).toLowerCase()));
    if (!res?.pagination?.has_more) break;
  }
  return known;
}

export default function ReaderPage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [known, setKnown] = useState(null);
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [newName, setNewName] = useState('Từ bài đọc');
  const [candidates, setCandidates] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [progress, setProgress] = useState(null);    // { done, total, saved, failed: [] }
  const [error, setError] = useState('');

  useEffect(() => {
    loadKnown().then(setKnown);
    foldersApi.list().then((r) => {
      const personal = r.personal_folders || [];
      setFolders(personal);
      if (personal[0]) setFolderId(personal[0].id);
    }).catch(() => {});
  }, []);

  const tooLong = text.length > MAX_CHARS;
  const analyze = () => {
    setError('');
    setProgress(null);
    if (!text.trim()) { setError('Hãy dán một đoạn văn tiếng Anh (bài báo, phụ đề, lời bài hát…).'); return; }
    if (tooLong) return;
    const list = extractCandidates(text, known || new Set(), { limit: 60 });
    setCandidates(list);
    setSelected(new Set(list.slice(0, 20).map((c) => c.word)));
  };
  const toggle = (w) => setSelected((s) => { const n = new Set(s); if (n.has(w)) n.delete(w); else n.add(w); return n; });

  const save = async () => {
    setError('');
    let target = folderId;
    try {
      if (!target) {
        const created = await foldersApi.create(newName.trim() || 'Từ bài đọc');
        target = created.folder?.id || created.id;
        if (!target) throw new Error('Không tạo được folder.');
      }
    } catch (e) { setError(e.message || 'Không tạo được folder.'); return; }
    const words = [...selected];
    const state = { done: 0, total: words.length, saved: 0, failed: [] };
    setProgress({ ...state });
    for (const word of words) {                     // lần lượt từng từ: lần đầu tra từ mới backend phải gọi từ điển + dịch
      try { await dictionaryApi.save({ word, folder_id: target }); state.saved += 1; }
      catch { state.failed.push(word); }
      state.done += 1;
      setProgress({ ...state, failed: [...state.failed] });
    }
    setFolderId(target);
  };

  const selectedCount = selected.size;
  const shown = useMemo(() => candidates || [], [candidates]);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 6px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 26, color: '#f4f6f7' }}>📰 Học từ bài đọc</h1>
      <p style={{ color: '#a2acb3', marginTop: 0 }}>Dán bài báo, phụ đề phim hoặc lời bài hát tiếng Anh. App tách các từ bạn chưa học, bạn chọn từ muốn học rồi thêm vào folder cá nhân.</p>

      <section style={card}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} aria-label="Nội dung tiếng Anh"
          placeholder="Dán nội dung tiếng Anh vào đây…"
          style={{ width: '100%', boxSizing: 'border-box', padding: 14, borderRadius: 12, fontSize: 14.5, lineHeight: 1.6, resize: 'vertical', outline: 'none',
            background: 'rgba(255,255,255,0.04)', border: '0.8px solid rgba(255,255,255,0.12)', color: '#e9edef', fontFamily: 'Inter, sans-serif' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: tooLong ? '#fca5a5' : '#848f97' }}>{text.length.toLocaleString('vi-VN')}/{MAX_CHARS.toLocaleString('vi-VN')} ký tự{tooLong ? ' (quá dài, hãy cắt bớt)' : ''}</span>
          <button style={{ ...btn, opacity: tooLong || known == null ? 0.6 : 1 }} disabled={tooLong || known == null} onClick={analyze}>
            {known == null ? 'Đang tải từ đã học…' : '✂️ Tách từ chưa biết'}
          </button>
        </div>
        {error && <p style={{ color: '#fca5a5', margin: '10px 0 0' }}>⚠️ {error}</p>}
      </section>

      {candidates && (
        <section style={card}>
          {shown.length === 0 ? <p style={{ color: '#dde2e5', margin: 0 }}>🎉 Bạn đã biết hết các từ đáng học trong đoạn này.</p> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <b style={{ color: '#f4f6f7' }}>{shown.length} từ chưa biết · đã chọn {selectedCount}</b>
                <span style={{ display: 'flex', gap: 8 }}>
                  <button style={ghost} onClick={() => setSelected(new Set(shown.map((c) => c.word)))}>Chọn hết</button>
                  <button style={ghost} onClick={() => setSelected(new Set())}>Bỏ chọn</button>
                </span>
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {shown.map((c) => (
                  <label key={c.word} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 4px', borderBottom: '0.8px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selected.has(c.word)} onChange={() => toggle(c.word)} style={{ marginTop: 3, accentColor: '#14b8a6' }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ color: '#f1f5f9' }}>{c.word}</b>
                      {c.count > 1 && <span style={{ color: '#5eead4', fontSize: 12, marginLeft: 8 }}>×{c.count}</span>}
                      <span style={{ display: 'block', color: '#a2acb3', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.sentence}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
                <span style={{ color: '#a2acb3', fontSize: 14 }}>Thêm vào:</span>
                <select value={folderId} onChange={(e) => setFolderId(e.target.value)} aria-label="Folder"
                  style={{ padding: '8px 10px', borderRadius: 10, background: '#1a1f22', color: '#e9edef', border: '0.8px solid rgba(255,255,255,0.15)' }}>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  <option value="">+ Folder mới…</option>
                </select>
                {!folderId && <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} aria-label="Tên folder mới"
                  style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#e9edef', border: '0.8px solid rgba(255,255,255,0.15)' }} />}
                <button style={{ ...btn, opacity: selectedCount === 0 || (progress && progress.done < progress.total) ? 0.6 : 1 }}
                  disabled={selectedCount === 0 || (progress && progress.done < progress.total)} onClick={save}>
                  ➕ Thêm {selectedCount} từ
                </button>
              </div>
            </>
          )}
          {progress && (
            <div style={{ marginTop: 12, color: '#dde2e5', fontSize: 14 }}>
              {progress.done < progress.total ? `Đang tra và lưu ${progress.done}/${progress.total} từ…` : `✓ Đã thêm ${progress.saved} từ.`}
              {progress.failed.length > 0 && progress.done >= progress.total && (
                <div style={{ color: '#fca5a5', marginTop: 4 }}>Không tìm thấy trong từ điển: {progress.failed.join(', ')}</div>
              )}
              {progress.done >= progress.total && progress.saved > 0 && (
                <button style={{ ...ghost, marginTop: 10 }} onClick={() => navigate(`/app/thuvien/${folderId}`)}>Mở folder để học →</button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
