// src/components/learning/SuggestionDialog.jsx

import { SRS_LABELS, getNextReview } from '../../constants/srs';

export default function SuggestionDialog({ word, onChoose }) {
  const currentLevel = word.lv || 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        animation: 'fadeSlideIn 0.3s ease',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#1a1d2e',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
          <div>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#f87171',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              Sai 4 lần với từ này!
            </p>
            <p style={{ fontSize: '13px', color: '#8892b0' }}>Bạn muốn làm gì với từ này?</p>
          </div>
        </div>

        {/* Word info */}
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '0.8px solid rgba(255,255,255,0.06)'
          }}
        >
          <p
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#e8eaf6',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            {word.word}
          </p>
          <p style={{ color: '#8892b0', fontSize: '14px' }}>{word.meaning}</p>
          <p
            style={{
              color: '#fbbf24',
              fontSize: '13px',
              marginTop: '4px',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            Level hiện tại: {SRS_LABELS[currentLevel]}
          </p>
          <p style={{ color: '#f87171', fontSize: '12px', marginTop: '2px' }}>Đã sai: 4 lần</p>
        </div>

        {/* 3 Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Option 1: Reset về LV1 */}
          <button
            onClick={() => onChoose('reset')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.2)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(248,113,113,0.12)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '20px' }}>🔄</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '2px' }}>Quay về LV1</p>
              <p style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}>
                Học lại từ đầu · Ôn lại sau 20 phút
              </p>
            </div>
          </button>

          {/* Option 2: Demote 1 level */}
          <button
            onClick={() => onChoose('demote')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#fbbf24',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(245,158,11,0.2)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(245,158,11,0.12)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '20px' }}>⬇️</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '2px' }}>Lùi 1 cấp độ</p>
              <p style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}>
                {SRS_LABELS[currentLevel]} → {SRS_LABELS[Math.max(currentLevel - 1, 1)]}
              </p>
            </div>
          </button>

          {/* Option 3: Skip */}
          <button
            onClick={() => onChoose('skip')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8892b0',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '20px' }}>⏭️</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '2px' }}>Bỏ qua</p>
              <p style={{ fontSize: '12px', fontWeight: 400, opacity: 0.7 }}>
                Giữ nguyên {SRS_LABELS[currentLevel]}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}