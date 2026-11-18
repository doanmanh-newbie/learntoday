// Màn tổng kết cuối phiên: số từ, độ chính xác, từ sai nhiều, lời nhắc ngày mai, chuỗi ngày + băng giữ chuỗi.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { historyApi } from '../../api/client';
import { whenOutboxIdle } from '../../api/outbox';
import { summarizeSession } from './sessionSummary';

const box = { padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '0.8px solid rgba(255,255,255,0.08)' };
const label = { fontSize: 12, color: '#a2acb3' };
const big = { fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 24, color: '#f4f6f7' };

export default function SessionSummary({ mode, words, wrongCounts, answered, correct, onBack }) {
  const navigate = useNavigate();
  const [extra, setExtra] = useState({ dueTomorrow: undefined, streak: null, freezes: null });
  useEffect(() => {
    let alive = true;
    // đợi tiến độ vừa học được gửi xong thì số từ đến hạn/chuỗi ngày mới đúng
    whenOutboxIdle().then(() => Promise.allSettled([historyApi.tomorrow(), historyApi.stats()])).then(([t, st]) => {
      if (!alive) return;
      setExtra({
        dueTomorrow: t.status === 'fulfilled' ? t.value.due_tomorrow : undefined,
        streak: st.status === 'fulfilled' ? st.value.streak : null,
        freezes: st.status === 'fulfilled' ? st.value.streak_freezes : null,
      });
    });
    return () => { alive = false; };
  }, []);
  const sum = useMemo(() => summarizeSession({ words, wrongCounts, answered, correct, dueTomorrow: extra.dueTomorrow }),
    [words, wrongCounts, answered, correct, extra.dueTomorrow]);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px', animation: 'scaleIn 0.5s ease' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#e9edef', margin: '8px 0 4px' }}>Tổng kết phiên {mode === 'learn' ? 'học' : 'ôn'}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, margin: '20px 0' }}>
        <div style={box}><div style={label}>{mode === 'learn' ? '📚 Từ đã học' : '🔁 Từ đã ôn'}</div><div style={big}>{sum.count}</div></div>
        <div style={box}><div style={label}>🎯 Độ chính xác</div><div style={big}>{sum.accuracy == null ? '—' : `${sum.accuracy}%`}</div></div>
        <div style={box}><div style={label}>🔥 Chuỗi ngày</div><div style={big}>{extra.streak ?? '—'}</div></div>
      </div>

      {sum.hardest.length > 0 && (
        <div style={{ ...box, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: '#f4f6f7', marginBottom: 8 }}>❗ Từ sai nhiều nhất</div>
          {sum.hardest.map((h) => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', color: '#dde2e5', fontSize: 14 }}>
              <span><b>{h.word}</b>{h.meaning ? <span style={{ color: '#a2acb3' }}> · {h.meaning}</span> : null}</span>
              <span style={{ color: '#fca5a5' }}>sai {h.wrong} lần</span>
            </div>
          ))}
          <button type="button" onClick={() => navigate('/app/luyen-tap/hard')}
            style={{ marginTop: 8, padding: '8px 14px', borderRadius: 10, border: '0.8px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)', color: '#fca5a5', fontWeight: 700, cursor: 'pointer' }}>
            Luyện thêm từ hay sai →
          </button>
        </div>
      )}

      <div style={{ ...box, marginBottom: 12, borderColor: 'rgba(20,184,166,0.35)' }}>
        <div style={{ fontWeight: 700, color: '#5eead4', marginBottom: 4 }}>⏰ Lời nhắc cho ngày mai</div>
        <div style={{ color: '#dde2e5', fontSize: 14 }}>{sum.reminder}</div>
      </div>
      <div style={{ ...box, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, color: '#bae6fd', marginBottom: 4 }}>❄️ Băng giữ chuỗi: {extra.freezes ?? 0}/2</div>
        <div style={{ color: '#a2acb3', fontSize: 13 }}>Học liên tục đủ 7 ngày được 1 băng (giữ tối đa 2). Lỡ một ngày, băng tự dùng để chuỗi không bị mất.</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <button type="button" onClick={onBack}
          style={{ padding: '14px 36px', fontSize: 15, borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#0f766e,#0e8077)' }}>
          🏠 Về trang chủ
        </button>
      </div>
    </div>
  );
}
