// Cài app lên màn hình chính (PWA) + nhắc học bằng thông báo trên điện thoại/máy tính.
import { useEffect, useState } from 'react';
import { canInstall, onInstallAvailable, promptInstall, isStandalone, readReminder, saveReminder, enableNotifications, scheduleReminder } from '../../utils/pwa';

const HOURS = [7, 12, 19, 20, 21];
const card = { padding: 22, borderRadius: 16, marginBottom: 16, background: 'rgba(255,255,255,0.03)', border: '0.8px solid rgba(255,255,255,0.08)' };
const pill = (active) => ({
  padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  background: active ? 'rgba(20,184,166,0.22)' : 'rgba(255,255,255,0.05)', color: active ? '#99f6e4' : '#a8b1b8',
  border: active ? '0.8px solid rgba(20,184,166,0.5)' : '0.8px solid rgba(255,255,255,0.1)',
});
const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

export default function ReminderSection({ defaultHour = 20 }) {
  const [installable, setInstallable] = useState(canInstall());
  const [installed, setInstalled] = useState(isStandalone());
  const [rem, setRem] = useState(() => ({ ...readReminder(), hour: readReminder().hour ?? defaultHour }));
  const [note, setNote] = useState('');
  useEffect(() => onInstallAvailable(setInstallable), []);

  const update = (next) => { setRem(next); saveReminder(next); scheduleReminder(); };
  const toggle = async () => {
    if (rem.enabled) { update({ ...rem, enabled: false }); setNote(''); return; }
    const perm = await enableNotifications();
    if (perm === 'granted') { update({ ...rem, enabled: true }); setNote(`Sẽ nhắc lúc ${rem.hour}h nếu hôm đó bạn chưa học.`); }
    else if (perm === 'unsupported') setNote('Trình duyệt này không hỗ trợ thông báo. Trên iPhone, hãy cài app lên màn hình chính trước (iOS 16.4 trở lên).');
    else setNote('Bạn đã chặn thông báo. Mở cài đặt trang web của trình duyệt để cho phép lại.');
  };

  return (
    <section style={card}>
      <h2 style={{ margin: '0 0 4px', fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: '#f4f6f7' }}>📱 Cài app & nhắc học trên điện thoại</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#a2acb3' }}>Cài Learn Today lên màn hình chính để mở nhanh như một app, và bật thông báo nhắc học đúng giờ.</p>

      {installed ? <p style={{ color: '#86efac', fontSize: 14, margin: '0 0 14px' }}>✓ Đang chạy dạng app đã cài.</p>
        : installable ? <button style={{ ...pill(true), marginBottom: 14 }} onClick={async () => { const r = await promptInstall(); if (r === 'accepted') setInstalled(true); }}>⬇️ Cài lên màn hình chính</button>
        : <p style={{ color: '#a2acb3', fontSize: 13.5, margin: '0 0 14px' }}>
            {isIos() ? 'Trên iPhone/iPad: mở bằng Safari, bấm nút Chia sẻ rồi chọn "Thêm vào MH chính".' : 'Trên Android/máy tính: mở menu trình duyệt (⋮) rồi chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".'}
          </p>}

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#dde2e5', fontSize: 14, marginBottom: 12 }}>
        <input type="checkbox" checked={rem.enabled} onChange={toggle} style={{ width: 18, height: 18, accentColor: '#14b8a6' }} />
        Bật thông báo nhắc học
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', opacity: rem.enabled ? 1 : 0.5 }}>
        <span style={{ fontSize: 13.5, color: '#a2acb3' }}>Giờ nhắc:</span>
        {HOURS.map((h) => <button key={h} disabled={!rem.enabled} onClick={() => update({ ...rem, hour: h })} style={pill(rem.hour === h)}>{h}h</button>)}
      </div>
      {note && <p style={{ color: '#99f6e4', fontSize: 13.5, margin: '12px 0 0' }}>{note}</p>}
      <p style={{ margin: '12px 0 0', fontSize: 12.5, color: '#848f97' }}>
        Thông báo được hẹn trên thiết bị này khi app đang mở hoặc chạy nền. Nếu đã đóng hẳn app thì email nhắc ở trên vẫn gửi theo giờ đã chọn.
      </p>
    </section>
  );
}
