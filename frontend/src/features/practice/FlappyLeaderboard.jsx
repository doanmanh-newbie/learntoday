import { useEffect, useState } from 'react';
import { gameApi } from '../../api/client';
import { SECONDARY_BTN } from './modeStyles';
import { mergeMe } from './flappyLeaderboardLogic.js';

const TABS = [['week', 'Tuần này'], ['all', 'Mọi thời gian']];
const tab = (on) => ({ ...SECONDARY_BTN, flex: 1, padding: '9px 12px', ...(on ? { background: 'rgba(45,212,191,0.18)', border: '1px solid #2dd4bf' } : {}) });

export default function FlappyLeaderboard() {
  const [period, setPeriod] = useState('week');
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let stale = false;
    setState({ loading: true });
    gameApi.leaderboard(period)
      .then((r) => { if (!stale) setState({ rows: mergeMe(r.rows || [], r.me) }); })
      .catch((e) => { if (!stale) setState({ error: e?.message || 'Không tải được bảng xếp hạng.' }); });
    return () => { stale = true; };
  }, [period]);

  return (
    <div style={{ color: '#e9edef', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {TABS.map(([p, label]) => <button key={p} type="button" style={tab(period === p)} onClick={() => setPeriod(p)}>{label}</button>)}
      </div>
      {state.loading && <p style={{ fontSize: 14, opacity: 0.85 }}>Đang tải…</p>}
      {state.error && <p role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>{state.error}</p>}
      {state.rows && state.rows.length === 0 && <p style={{ fontSize: 14, opacity: 0.85 }}>{period === 'week' ? 'Chưa có ván nào tuần này' : 'Chưa có ván nào'}</p>}
      {state.rows && state.rows.length > 0 && (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {state.rows.map((r, i) => (
            <li key={`${i}-${r.username}`}>
              {r.outside && <div aria-hidden="true" style={{ textAlign: 'center', color: '#848f97', lineHeight: 1, marginBottom: 6 }}>…</div>}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px', borderRadius: 10,
                background: r.is_me ? 'rgba(45,212,191,0.16)' : 'rgba(255,255,255,0.04)', border: `1px solid ${r.is_me ? '#2dd4bf' : 'rgba(255,255,255,0.08)'}` }}>
                <span style={{ minWidth: 34, fontWeight: 800, color: '#99f6e4' }}>#{r.rank}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.username}</span>
                <strong style={{ whiteSpace: 'nowrap' }}>{r.score} đ</strong>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
