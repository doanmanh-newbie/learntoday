// src/pages/app/FolderWordsPage.jsx
// STT 3 - Phần B: bấm vào 1 folder -> xem DANH SÁCH TỪ trong folder (cuộn vô hạn 20 từ/lần,
// tìm kiếm, lọc theo từ loại và trạng thái) -> bấm "Bắt đầu học" mới vào phiên học (STT 6).
// (Trước đây bấm folder là vào học luôn, người học không biết folder có những từ nào.)
import { useState, useEffect, useRef, useCallback } from 'react';
import { foldersApi } from '../../api/client';
import { toUiWord, posLabelVi } from '../../api/adapters';
import { speak } from '../../utils/tts';
import WordPicture from '../../components/word/WordPicture.jsx';
import { SRS_LABELS } from '../../constants/srs';

const PAGE_SIZE = 20;

const POS_OPTIONS = [
  ['all', 'Tất cả loại từ'],
  ['noun', 'Danh từ'],
  ['verb', 'Động từ'],
  ['adjective', 'Tính từ'],
  ['adverb', 'Trạng từ'],
];
const STATUS_OPTIONS = [
  ['all', 'Tất cả'],
  ['new', 'Chưa học'],
  ['learned', 'Đã học'],
];

const chip = (active) => ({
  padding: '6px 14px', borderRadius: 9999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  fontFamily: 'Inter, sans-serif', transition: 'all .2s',
  background: active ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.05)',
  color: active ? '#99f6e4' : '#a2acb3',
  border: active ? '0.8px solid rgba(20,184,166,0.45)' : '0.8px solid rgba(255,255,255,0.08)',
});

function WordRow({ word, canRemove, onRemove }) {
  const learned = word.lv > 0;
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 14,
      background: 'rgba(255,255,255,0.03)', border: '0.8px solid rgba(255,255,255,0.07)',
    }}>
      <WordPicture word={word} size={56} />
      <button
        onClick={() => speak(word.word)}
        aria-label={`Nghe phát âm ${word.word}`}
        style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 15,
          background: 'rgba(94,234,212,0.1)', border: '0.8px solid rgba(94,234,212,0.2)', color: '#5eead4',
        }}
      >
        🔊
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 10px' }}>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: '#f4f6f7' }}>{word.word}</span>
          {word.phonetic && <span style={{ fontSize: 13, color: '#a2acb3' }}>{word.phonetic}</span>}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 6, color: '#5eead4',
            background: 'rgba(20,184,166,0.12)',
          }}>
            {posLabelVi(word.word_type)}
          </span>
        </div>
        <div style={{ marginTop: 4, fontSize: 14.5, color: '#dde2e5' }}>{word.meaning}</div>
        {word.example && (
          <div style={{ marginTop: 6, fontSize: 13, color: '#a2acb3', fontStyle: 'italic' }}>
            “{word.example}”
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 9999, whiteSpace: 'nowrap',
          color: learned ? '#bcd08c' : '#a2acb3',
          background: learned ? 'rgba(134,162,77,0.12)' : 'rgba(255,255,255,0.05)',
        }}>
          {SRS_LABELS[word.lv] || SRS_LABELS[0]}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(word)}
            aria-label={`Xóa ${word.word} khỏi folder`}
            style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(248,113,113,0.08)', border: '0.8px solid rgba(248,113,113,0.25)', color: '#f87171',
            }}
          >
            ✕ Xóa
          </button>
        )}
      </div>
    </div>
  );
}

export default function FolderWordsPage({ folderId, onBack, onStart }) {
  const [filters, setFilters] = useState({ pos: 'all', status: 'all' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');                 // đã debounce
  const [page, setPage] = useState(1);
  const [nonce, setNonce] = useState(0);                    // đổi để buộc tải lại (nút "Thử lại")
  const [data, setData] = useState({ key: null, folder: null, words: [], total: 0, hasMore: false });
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);           // { total_words, learned_words, progress }
  const sentinelRef = useRef(null);

  // Debounce ô tìm kiếm: gõ xong 300ms mới gọi API (không gọi mỗi phím)
  const lastSearch = useRef('');
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchInput.trim();
      if (next === lastSearch.current) return;
      lastSearch.current = next;
      setSearch(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // "Đang tải" suy ra từ việc dữ liệu đã về cho đúng yêu cầu hiện tại chưa
  const reqKey = `${folderId}|${search}|${filters.pos}|${filters.status}|${page}|${nonce}`;
  const loading = data.key !== reqKey && !error;

  useEffect(() => {
    let cancelled = false;
    const params = { page, limit: PAGE_SIZE };
    if (search) params.search = search;
    if (filters.pos !== 'all') params.word_type = filters.pos;
    if (filters.status !== 'all') params.status = filters.status;

    foldersApi.words(folderId, params)
      .then((res) => {
        if (cancelled) return;
        const incoming = (res.words || []).map(toUiWord);
        setData((prev) => ({
          key: reqKey,
          folder: res.folder,
          total: res.pagination?.total ?? incoming.length,
          hasMore: !!res.pagination?.has_more,
          // trang 1 thay thế, trang sau nối thêm (khử trùng theo id phòng khi dữ liệu đổi giữa chừng)
          words: page === 1
            ? incoming
            : [...prev.words, ...incoming.filter((w) => !prev.words.some((p) => p.id === w.id))],
        }));
        setError('');
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Không tải được danh sách từ.'); });
    return () => { cancelled = true; };
  }, [folderId, search, filters.pos, filters.status, page, reqKey]);

  // Tiến độ folder (để biết còn từ mới để học không) - 1 request nhẹ, tải 1 lần
  useEffect(() => {
    let cancelled = false;
    foldersApi.progress(folderId)
      .then((p) => { if (!cancelled) setProgress(p); })
      .catch(() => { /* không bắt buộc: thiếu thì vẫn cho bấm Bắt đầu học */ });
    return () => { cancelled = true; };
  }, [folderId]);

  // Cuộn gần cuối danh sách -> tự tải thêm 20 từ
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !data.hasMore || loading) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPage((p) => p + 1);
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [data.hasMore, loading, data.words.length]);

  const changeFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const retry = () => { setError(''); setNonce((n) => n + 1); };

  const removeWord = useCallback(async (word) => {
    try {
      await foldersApi.removeWord(folderId, word.id);
      setData((d) => ({ ...d, words: d.words.filter((w) => w.id !== word.id), total: Math.max(0, d.total - 1) }));
    } catch (err) {
      setError(err.message || 'Không xóa được từ.');
    }
  }, [folderId]);

  const folder = data.folder;
  const isPersonal = folder?.type === 'personal';
  const allLearned = progress && progress.total_words > 0 && progress.learned_words >= progress.total_words;
  const empty = !loading && !error && data.words.length === 0;
  const filtered = search || filters.pos !== 'all' || filters.status !== 'all';

  return (
    <div style={{ paddingBottom: 96 }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
          fontSize: 13, fontWeight: 600, marginBottom: 18, color: '#e9edef', fontFamily: 'Inter, sans-serif',
          background: 'rgba(255,255,255,0.06)', border: '0.8px solid rgba(255,255,255,0.12)',
        }}
      >
        ← Thư viện chủ đề
      </button>

      {/* Tiêu đề + tiến độ */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: '#f4f6f7' }}>
          {folder ? `${folder.icon || '📂'} ${folder.name}` : 'Đang tải...'}
        </h1>
        {progress && (
          <div style={{ marginTop: 12, maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#a2acb3', marginBottom: 6 }}>
              <span>{progress.learned_words}/{progress.total_words} từ đã học</span>
              <span>{progress.progress}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${progress.progress}%`, height: '100%', background: 'linear-gradient(90deg,#0f766e,#0e8077)', transition: 'width .5s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Tìm kiếm + bộ lọc */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="🔍 Tìm trong folder (từ hoặc nghĩa)..."
          aria-label="Tìm từ trong folder"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '11px 16px', borderRadius: 12, fontSize: 14, outline: 'none',
            background: 'rgba(255,255,255,0.05)', border: '0.8px solid rgba(255,255,255,0.12)', color: '#dde2e5',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUS_OPTIONS.map(([v, label]) => (
            <button key={v} onClick={() => changeFilter('status', v)} style={chip(filters.status === v)}>{label}</button>
          ))}
          <span style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          {POS_OPTIONS.map(([v, label]) => (
            <button key={v} onClick={() => changeFilter('pos', v)} style={chip(filters.pos === v)}>{label}</button>
          ))}
        </div>
        {!error && data.key !== null && (
          <span style={{ fontSize: 12.5, color: '#a2acb3' }}>
            {filtered ? `${data.total} từ khớp bộ lọc` : `${data.total} từ trong folder`}
          </span>
        )}
      </div>

      {error && (
        <div role="alert" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16,
          padding: '10px 16px', borderRadius: 12, fontSize: 13, color: '#fecaca',
          background: 'rgba(127,29,29,0.35)', border: '0.8px solid rgba(248,113,113,0.35)',
        }}>
          <span>⚠️ {error}</span>
          <button onClick={retry} style={{ padding: '4px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, background: '#f87171', color: '#450a0a' }}>
            Thử lại
          </button>
        </div>
      )}

      {/* Danh sách */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.words.map((w) => (
          <WordRow key={w.id} word={w} canRemove={isPersonal} onRemove={removeWord} />
        ))}
      </div>

      {loading && (
        <p style={{ textAlign: 'center', color: '#a2acb3', fontSize: 13, padding: '24px 0' }}>Đang tải...</p>
      )}
      {empty && (
        <div style={{
          textAlign: 'center', padding: '48px 20px', color: '#a2acb3', borderRadius: 14,
          border: '0.8px dashed rgba(255,255,255,0.12)',
        }}>
          {filtered ? 'Không có từ nào khớp bộ lọc.' : isPersonal ? 'Folder này chưa có từ nào. Hãy lưu từ từ tab "Từ điển".' : 'Folder này chưa có từ nào.'}
        </div>
      )}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {/* Nút bắt đầu học - luôn hiện ở cuối màn hình */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, padding: '14px 16px',
        background: 'linear-gradient(to top, rgba(17,19,20,0.98) 60%, rgba(17,19,20,0))',
        display: 'flex', justifyContent: 'center',
      }}>
        {allLearned ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: 13.5, color: '#bcd08c', fontWeight: 600 }}>
              📚 Bạn đã học hết từ mới trong folder này!
            </p>
            <button onClick={onBack} style={{
              padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: '#ffffff',
              border: 'none', background: 'linear-gradient(135deg,#0f766e,#0e8077)',
            }}>
              📂 Chọn folder khác
            </button>
          </div>
        ) : (
          <button
            onClick={() => onStart(folderId)}
            disabled={!folder || (data.total === 0 && !filtered)}
            style={{
              width: '100%', maxWidth: 420, padding: '14px 28px', borderRadius: 14, fontSize: 16, fontWeight: 800,
              cursor: 'pointer', color: '#ffffff', border: 'none', fontFamily: 'Outfit, sans-serif',
              background: 'linear-gradient(135deg,#0f766e,#0e8077)', boxShadow: '0 8px 30px rgba(20,184,166,0.4)',
              opacity: !folder || (data.total === 0 && !filtered) ? 0.5 : 1,
            }}
          >
            ▶ Bắt đầu học
          </button>
        )}
      </div>
    </div>
  );
}
