// src/pages/app/SettingsPage.jsx
// STT 14 - Trang cá nhân / Cài đặt: mục tiêu học mỗi ngày, số từ ôn mỗi lần, trình độ,
// giọng đọc (STT 15), nhắc nhở email (STT 13). Trước đây KHÔNG có trang này nên các giá trị bị cứng trong code.
import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { profileApi, historyApi } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { speak } from '../../utils/tts';
import { TTS_VOICES } from '../../utils/prefs';
import ReminderSection from './ReminderSection.jsx';

const StatisticsPage = lazy(() => import('../../components/sections/dashboard/StatisticsPage.jsx'));   // biểu đồ nặng: chỉ tải khi mở Trang cá nhân

const GOALS = [5, 10, 15, 20, 30];
const LEVEL_LABEL = { A1: 'A1 · Sơ cấp', B1: 'B1 · Trung cấp', B2: 'B2 · Trung cấp cao', C1: 'C1 · Cao cấp', IELTS: 'IELTS 8.0+' };
const REMINDER_HOURS = [8, 12, 20];

const card = {
  padding: 22, borderRadius: 16, marginBottom: 16,
  background: 'rgba(255,255,255,0.03)', border: '0.8px solid rgba(255,255,255,0.08)',
};
const h2 = { margin: '0 0 4px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: '#f4f6f7' };
const hint = { margin: '0 0 14px', fontSize: 13, color: '#a2acb3' };
const pill = (active, disabled) => ({
  padding: '8px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'Inter, sans-serif', opacity: disabled ? 0.45 : 1,
  background: active ? 'rgba(20,184,166,0.22)' : 'rgba(255,255,255,0.05)',
  color: active ? '#99f6e4' : '#a8b1b8',
  border: active ? '0.8px solid rgba(20,184,166,0.5)' : '0.8px solid rgba(255,255,255,0.1)',
});

/** "08:00:00" | "08:00" | null -> giờ (số) để chọn 8/12/20 */
const hourOf = (t) => (t ? parseInt(String(t).split(':')[0], 10) : 20);

function fromUser(u) {
  return {
    username: u.username || '',
    daily_goal: u.daily_goal ?? 10,
    review_limit: u.review_limit ?? 10,
    level: u.level || 'B1',
    tts_voice: u.tts_voice || 'en-US',
    email_reminder: u.email_reminder ?? true,
    reminder_hour: hourOf(u.reminder_time),
  };
}

export const PROFILE_PATH = '/app/cai-dat/ho-so';
export const SETTINGS_PATH = '/app/cai-dat';

function Tabs({ active, onChange }) {
  const tab = (id, label) => (
    <button key={id} role="tab" aria-selected={active === id} onClick={() => onChange(id)}
      style={{ ...pill(active === id), padding: '9px 22px' }}>{label}</button>
  );
  return <div role="tablist" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>{tab('profile', '👤 Trang cá nhân')}{tab('settings', '⚙️ Cài đặt học tập')}</div>;
}

function StatRow({ stats }) {
  const items = [['🔥 Chuỗi ngày', `${stats.streak ?? 0} ngày`], ['❄️ Băng giữ chuỗi', `${stats.streak_freezes ?? 0}/2`], ['📚 Đã học', `${stats.total_words_learned ?? 0} từ`], ['🎯 Chính xác', `${stats.accuracy ?? 0}%`]];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginTop: 6 }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 12, color: '#a2acb3' }}>{k}</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#f4f6f7', fontFamily: 'Outfit, sans-serif' }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const tab = location.pathname.startsWith(PROFILE_PATH) ? 'profile' : 'settings';
  const [stats, setStats] = useState(null);
  useEffect(() => { historyApi.stats().then(setStats).catch(() => setStats(null)); }, []);
  const [form, setForm] = useState(() => (user ? fromUser(user) : null));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);        // { type: 'ok' | 'error', text }

  // Dữ liệu mới nhất từ server (user trong context có thể cũ) - chỉ nạp 1 lần khi mở trang
  useEffect(() => {
    let cancelled = false;
    profileApi.get()
      .then((res) => { if (!cancelled) setForm(fromUser(res.user)); })
      .catch((err) => { if (!cancelled && !form) setMessage({ type: 'error', text: err.message }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ nạp lúc mở trang
  }, []);

  if (!form) {
    return <p style={{ color: '#a2acb3', textAlign: 'center', padding: 40 }}>{message?.text || 'Đang tải cài đặt...'}</p>;
  }

  const set = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setMessage(null); };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await profileApi.update({
        username: form.username.trim(),
        daily_goal: form.daily_goal,
        review_limit: form.review_limit,
        tts_voice: form.tts_voice,
        email_reminder: form.email_reminder,
        reminder_time: form.reminder_hour,
      });
      updateUser(res.user);
      setForm(fromUser(res.user));
      setMessage({ type: 'ok', text: 'Đã lưu cài đặt!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không lưu được, vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 20px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 28, color: '#f4f6f7' }}>
        {tab === 'profile' ? '👤 Trang cá nhân' : '⚙️ Cài đặt'}
      </h1>
      <Tabs active={tab} onChange={(t) => navigate(t === 'profile' ? PROFILE_PATH : SETTINGS_PATH)} />

      {tab === 'profile' && (
      <>
      <section style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div aria-hidden style={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 800,
            color: '#99f6e4', background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)' }}>
            {(form.username || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#f4f6f7', fontFamily: 'Outfit, sans-serif' }}>{form.username || 'Chưa đặt tên'}</div>
            <div style={{ fontSize: 13, color: '#a2acb3' }}>{user?.email}</div>
          </div>
        </div>
        {stats && <StatRow stats={stats} />}
      </section>

      <section style={card}>
        <h2 style={h2}>Trình độ</h2>
        {user?.level_tested_at ? (
          <p style={hint}>Theo bài test ngày {new Date(user.level_tested_at).toLocaleDateString('vi-VN')}.</p>
        ) : (
          <p style={hint}>Chưa làm bài test trình độ. Làm khoảng 3 phút để app ghi trình độ và gợi ý giai đoạn bắt đầu.</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ ...pill(true), cursor: 'default' }}>{user?.level_tested_at ? (LEVEL_LABEL[form.level] || form.level) : 'Chưa xác định'}</span>
          <button onClick={() => navigate('/app/kiem-tra-trinh-do')} style={pill(false)}>
            🧭 {user?.level_tested_at ? 'Làm lại bài test' : 'Làm bài test trình độ'}
          </button>
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Tên hiển thị</h2>
        <p style={hint}>Email đăng nhập: {user?.email}</p>
        <input
          value={form.username}
          onChange={(e) => set('username', e.target.value)}
          maxLength={50}
          aria-label="Tên hiển thị"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none',
            background: 'rgba(255,255,255,0.05)', border: '0.8px solid rgba(255,255,255,0.12)', color: '#dde2e5',
          }}
        />
      </section>
      </>
      )}

      {tab === 'settings' && (
      <>
      <section style={card}>
        <h2 style={h2}>Mục tiêu học mỗi ngày</h2>
        <p style={hint}>Số từ MỚI bạn muốn học mỗi ngày.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GOALS.map((g) => (
            <button key={g} onClick={() => set('daily_goal', g)} style={pill(form.daily_goal === g)}>{g} từ</button>
          ))}
        </div>

        <h2 style={{ ...h2, marginTop: 20 }}>Số từ ôn tập mỗi lần</h2>
        <p style={hint}>Mỗi lần bấm "Ôn tập ngay", hệ thống lấy tối đa chừng này từ đến hạn (ưu tiên từ đến hạn sớm nhất).</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GOALS.map((g) => (
            <button key={g} onClick={() => set('review_limit', g)} style={pill(form.review_limit === g)}>{g} từ</button>
          ))}
        </div>

      </section>

      <section style={card}>
        <h2 style={h2}>Giọng đọc</h2>
        <p style={hint}>Áp dụng cho mọi nút 🔊 và phát âm tự động.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(TTS_VOICES).map(([v, label]) => (
            <button
              key={v}
              onClick={() => { set('tts_voice', v); speak('Hello, welcome to Learn Today', v); }}
              style={pill(form.tts_voice === v)}
            >
              🔊 {label}
            </button>
          ))}
        </div>
      </section>

      <section style={card}>
        <h2 style={h2}>Nhắc nhở qua email</h2>
        <p style={hint}>Nhận email khi có từ đến lịch ôn tập.</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#dde2e5', fontSize: 14, marginBottom: 14 }}>
          <input
            type="checkbox"
            checked={form.email_reminder}
            onChange={(e) => set('email_reminder', e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#14b8a6' }}
          />
          Bật email nhắc nhở
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13.5, color: '#a2acb3' }}>Giờ nhận:</span>
          {REMINDER_HOURS.map((h) => (
            <button
              key={h}
              disabled={!form.email_reminder}
              onClick={() => set('reminder_hour', h)}
              style={pill(form.reminder_hour === h, !form.email_reminder)}
            >
              {h}h
            </button>
          ))}
        </div>
      </section>

      <ReminderSection defaultHour={form.reminder_hour} />
      </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', bottom: 16 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
            color: '#ffffff', border: 'none', fontFamily: 'Outfit, sans-serif', opacity: saving ? 0.7 : 1,
            background: 'linear-gradient(135deg,#0f766e,#0e8077)',
          }}
        >
          {saving ? 'Đang lưu...' : tab === 'profile' ? 'Lưu hồ sơ' : 'Lưu cài đặt'}
        </button>
        {message && (
          <span role="status" style={{ fontSize: 14, fontWeight: 600, color: message.type === 'ok' ? '#bcd08c' : '#fca5a5' }}>
            {message.type === 'ok' ? '✓ ' : '⚠️ '}{message.text}
          </span>
        )}
      </div>
    </div>
    {tab === 'profile' && <Suspense fallback={null}><StatisticsPage /></Suspense>}
    </>
  );
}
