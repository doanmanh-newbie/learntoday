import { useSyncStatus } from '../hooks/useSyncStatus';
import { dismissRejected, flushOutbox } from '../api/outbox';

/** Thanh nhỏ báo tiến độ học chưa lưu được (mất mạng / server bận) hoặc bị server từ chối. Tự ẩn khi không còn gì cần báo. */
export default function SyncBanner() {
  const { pending, flushing, stalled, lastError, rejected, lastRejected } = useSyncStatus();
  if (pending === 0 && !rejected) return null;

  if (pending === 0) {                       // chỉ còn thông báo mục bị từ chối (hàng đợi đã rỗng)
    return (
      <div
        role="alert"
        style={{
          position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 9999, maxWidth: 'min(92vw, 560px)',
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 12,
          fontSize: 13, fontWeight: 600, color: '#fecaca', background: 'rgba(108,27,27,0.92)',
          border: '1px solid rgba(239,68,68,0.4)', backdropFilter: 'blur(10px)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}
      >
        <span>⚠️ {rejected} mục tiến độ không được lưu vì máy chủ từ chối{lastRejected ? ` (${lastRejected})` : ''}. Từ đó có thể xuất hiện lại.</span>
        <button
          onClick={dismissRejected}
          style={{ padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, background: '#f87171', color: '#450a0a' }}
        >
          Đã hiểu
        </button>
      </div>
    );
  }

  const warn = stalled || (!!lastError && !flushing);
  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 12,
        fontSize: 13, fontWeight: 600, color: warn ? '#fecaca' : '#99f6e4',
        background: warn ? 'rgba(108,27,27,0.92)' : 'rgba(27,75,69,0.92)',
        border: `1px solid ${warn ? 'rgba(239,68,68,0.4)' : 'rgba(20,184,166,0.4)'}`,
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
                   background: '#f87171', color: '#450a0a' }}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
