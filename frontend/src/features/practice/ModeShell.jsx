import { useEffect } from 'react';
import { speak } from '../../utils/tts';
import { gradeLabel } from './practiceLogic';

import { PRIMARY_BTN, SECONDARY_BTN } from './modeStyles.js';

export function ModeShell({ title, icon, progress, onExit, children }) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onExit} style={{ ...SECONDARY_BTN, padding: '8px 14px', fontSize: 13 }}>← Quay lại</button>
        <h2 style={{ flex: 1, margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 18, color: '#f1f5f9' }}>{icon} {title}</h2>
        {progress != null && <span style={{ fontSize: 13, color: '#a2acb3' }}>{progress}</span>}
      </div>
      <div style={{ borderRadius: 18, padding: 'clamp(16px,4vw,28px)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {children}
      </div>
    </div>
  );
}

export function SpeakButton({ text, label = 'Nghe', autoPlay = false }) {
  useEffect(() => { if (autoPlay) speak(text); }, [autoPlay, text]);
  return (
    <button type="button" onClick={() => speak(text)} aria-label={`${label}: ${text}`}
      style={{ ...SECONDARY_BTN, padding: '8px 14px', fontSize: 13 }}>🔊 {label}</button>
  );
}

export function RoundSummary({ correct, total, extra, record, onAgain, onExit }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: 44 }}>{correct / Math.max(total, 1) >= 0.7 ? '🎉' : '💪'}</div>
      <h3 style={{ margin: '8px 0 4px', fontFamily: 'Outfit, sans-serif', fontSize: 24, color: '#f1f5f9' }}>{correct}/{total}</h3>
      <p style={{ color: '#99f6e4', margin: 0, fontWeight: 600 }}>{gradeLabel(correct, total)}</p>
      {extra && <p style={{ color: '#a2acb3', fontSize: 14 }}>{extra}</p>}
      {record && <p style={{ color: '#99f6e4', fontSize: 14, fontWeight: 700 }}>🏅 Kỷ lục mới!</p>}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
        <button style={PRIMARY_BTN} onClick={onAgain}>Chơi lại</button>
        <button style={SECONDARY_BTN} onClick={onExit}>Chọn trò khác</button>
      </div>
    </div>
  );
}
