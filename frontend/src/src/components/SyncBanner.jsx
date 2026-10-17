import { useSyncStatus } from '../hooks/useSyncStatus';
import { flushOutbox } from '../api/outbox';

/** Thanh nhỏ báo tiến độ học chưa lưu được (mất mạng / server bận). Tự ẩn khi đã đồng bộ hết. */
export default function SyncBanner() {
  const { pending, flushing, stalled, lastError } = useSyncStatus();
  if (pending === 0) return null;

  const warn = stalled || (!!lastError && !flushing);
  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 12,
        fontSize: 13, fontWeight: 600, color: warn ? '#fde68a' : '#c7d2fe',
        background: warn ? 'rgba(120,53,15,0.92)' : 'rgba(30,27,75,0.92)',
        border: `1px solid ${warn ? 'rgba(251,191,36,0.4)' : 'rgba(99,102,241,0.4)'}`,
        backdropFilter: 'blur(10px)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      }}
    >
      <span>
        {warn
          ? `⚠️ Chưa lưu được ${pending} mục tiến độ học${lastError ? ` (${lastError})` : ''}`
          : `⏳ Đang lưu ${pending} mục tiến độ học...`}
      </span>
      {warn && (
        <button
          onClick={flushOutbox}
          style={{ padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
                   background: '#fbbf24', color: '#451a03' }}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
