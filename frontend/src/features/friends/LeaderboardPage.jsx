// Bảng xếp hạng bạn bè theo tuần: điểm = từ mới x10 + lượt ôn x5, reset mỗi thứ Hai 00:00 (giờ VN).
import { useCallback, useEffect, useState } from 'react';
import { friendsApi } from '../../api/client';

const card = { padding: 20, borderRadius: 16, marginBottom: 16, background: 'rgba(255,255,255,0.03)', border: '0.8px solid rgba(255,255,255,0.08)' };
const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const [data, setData] = useState({ loading: true, rows: [], error: '' });
  const [name, setName] = useState('');
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    friendsApi.leaderboard()
      .then((r) => setData({ loading: false, rows: r.rows || [], error: '' }))
      .catch((e) => setData({ loading: false, rows: [], error: e.message || 'Không tải được bảng xếp hạng.' }));
  }, []);
  useEffect(load, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const r = await friendsApi.add(name.trim());
      setMsg({ ok: true, text: `Đã thêm ${r.friend.username}.` });
      setName('');
      load();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
  };
  const remove = async (row) => {
    try { await friendsApi.remove(row.id); load(); } catch (err) { setMsg({ ok: false, text: err.message }); }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 6px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 26, color: '#f4f6f7' }}>🏅 Bảng xếp hạng tuần</h1>
      <p style={{ color: '#a2acb3', marginTop: 0 }}>Mỗi từ mới học xong +10 điểm, mỗi lượt ôn +5 điểm. Bảng làm mới vào thứ Hai hằng tuần.</p>

      <section style={card}>
        {data.loading ? <p style={{ color: '#a2acb3', margin: 0 }}>Đang tải…</p> : data.error ? <p style={{ color: '#fca5a5', margin: 0 }}>⚠️ {data.error}</p> : (
          <>
            {data.rows.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px', borderBottom: '0.8px solid rgba(255,255,255,0.06)',
                background: r.is_me ? 'rgba(20,184,166,0.08)' : 'transparent', borderRadius: 10 }}>
                <span style={{ width: 34, textAlign: 'center', fontWeight: 800, color: '#a2acb3' }}>{MEDAL[r.rank] || r.rank}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ color: '#f1f5f9' }}>{r.username}{r.is_me ? ' (bạn)' : ''}</b>
                  <span style={{ display: 'block', fontSize: 12.5, color: '#a2acb3' }}>{r.learned} từ mới · {r.reviewed} lượt ôn · 🔥 {r.streak} ngày</span>
                </span>
                <b style={{ color: '#5eead4', fontFamily: 'Outfit, sans-serif', fontSize: 18 }}>{r.points}</b>
                {!r.is_me && <button onClick={() => remove(r)} aria-label={`Xóa ${r.username}`} title="Xóa bạn"
                  style={{ border: 'none', background: 'transparent', color: '#848f97', cursor: 'pointer', fontSize: 16 }}>✕</button>}
              </div>
            ))}
            {data.rows.length <= 1 && <p style={{ color: '#a2acb3', fontSize: 14, margin: '12px 0 0' }}>Chưa có bạn bè nào. Thêm bạn bằng tên người dùng ở bên dưới để cùng thi đua.</p>}
          </>
        )}
      </section>

      <section style={card}>
        <form onSubmit={add} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={name} onChange={(e) => { setName(e.target.value); setMsg(null); }} maxLength={50} placeholder="Tên người dùng của bạn bè" aria-label="Tên người dùng"
            style={{ flex: 1, minWidth: 180, padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.05)', border: '0.8px solid rgba(255,255,255,0.12)', color: '#dde2e5' }} />
          <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0f766e,#0e8077)' }}>+ Kết bạn</button>
        </form>
        {msg && <p style={{ margin: '10px 0 0', color: msg.ok ? '#86efac' : '#fca5a5', fontSize: 14 }}>{msg.text}</p>}
      </section>
    </div>
  );
}
