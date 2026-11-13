import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { foldersApi, FOLDERS_CACHE_KEY } from '../../api/client';
import { swr } from '../../api/cache';
import { STAGES, GUIDE_STEPS, stageFor, nextFolder, guideSeen, markGuideSeen } from './learningPath';

const card = { borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

/** Hướng dẫn 4 bước cho người mới (hiện lần đầu, đóng được, mở lại bằng nút "Cách học"). */
export function GuideCard({ onClose }) {
  return (
    <section style={{ ...card, padding: 20, border: '1px solid rgba(45,212,191,0.3)' }} aria-label="Hướng dẫn học">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 17, color: '#f1f5f9' }}>👋 Cách học ở Learn Today</h2>
        <button type="button" onClick={onClose} style={{ padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#99f6e4', background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.3)' }}>Đã hiểu</button>
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))' }}>
        {GUIDE_STEPS.map((s, i) => (
          <li key={s.title} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 22 }}>{s.icon} <span style={{ fontSize: 12, color: '#a2acb3', fontWeight: 700 }}>Bước {i + 1}</span></div>
            <div style={{ fontWeight: 700, color: '#f1f5f9', margin: '4px 0 2px', fontFamily: 'Outfit, sans-serif' }}>{s.title}</div>
            <div style={{ fontSize: 13, color: '#a2acb3', lineHeight: 1.5 }}>{s.text}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Lộ trình 5 giai đoạn + gợi ý folder học tiếp. */
export default function LearningPath({ totalLearned }) {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [showGuide, setShowGuide] = useState(() => !guideSeen());

  useEffect(() => {
    let alive = true;
    swr(FOLDERS_CACHE_KEY, () => foldersApi.list(), () => {})
      .then((d) => { if (alive) setFolders([...(d.system_folders || []), ...(d.personal_folders || [])]); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const cur = stageFor(totalLearned);
  const suggestion = nextFolder(totalLearned, folders);
  const closeGuide = () => { markGuideSeen(); setShowGuide(false); };

  return (
    <>
      {showGuide && <GuideCard onClose={closeGuide} />}
      <section style={{ ...card, padding: 20 }} aria-label="Lộ trình học">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 16, color: '#f1f5f9' }}>🗺️ Lộ trình của bạn</h2>
          {!showGuide && <button type="button" onClick={() => setShowGuide(true)} style={{ padding: '5px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#a2acb3', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>ℹ️ Cách học</button>}
        </div>
        <ol style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'flex', gap: 6, overflowX: 'auto' }}>
          {STAGES.map((s, i) => {
            const state = i < cur.index ? 'done' : i === cur.index ? 'now' : 'todo';
            return (
              <li key={s.id} aria-current={state === 'now' ? 'step' : undefined} style={{ flex: '1 0 90px', padding: '8px 10px', borderRadius: 12, textAlign: 'center', fontSize: 12.5, fontWeight: 700,
                color: state === 'todo' ? '#6b7780' : '#99f6e4',
                background: state === 'now' ? 'rgba(45,212,191,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${state === 'now' ? 'rgba(45,212,191,0.5)' : 'rgba(255,255,255,0.08)'}` }}>
                {state === 'done' ? '✅' : s.id} {s.name}
              </li>
            );
          })}
        </ol>
        <p style={{ margin: '0 0 4px', color: '#e9edef', fontSize: 14 }}>
          Giai đoạn {cur.stage.id}/{STAGES.length}: <b>{cur.stage.name}</b> — {cur.stage.goal}.
        </p>
        <div role="progressbar" aria-valuenow={cur.percent} aria-valuemin={0} aria-valuemax={100} style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }}>
          <div style={{ width: `${cur.percent}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#0f766e,#0e8077)' }} />
        </div>
        {cur.remaining > 0 && <p style={{ margin: 0, fontSize: 13, color: '#a2acb3' }}>Còn {cur.remaining} từ nữa để lên giai đoạn tiếp theo.</p>}
        {suggestion && (
          <button type="button" onClick={() => navigate(`/app/thuvien/${suggestion.folder.id}`)}
            style={{ marginTop: 12, padding: '10px 18px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: '#fff', border: 'none', background: 'linear-gradient(135deg,#0f766e,#0e8077)' }}>
            Gợi ý học tiếp: {suggestion.folder.name} →
          </button>
        )}
      </section>
    </>
  );
}
