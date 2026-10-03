// src/features/learning/LearningSession.jsx
// STT 6.5 - Module cốt lõi. UI cải tiến: animation mượt, feedback đầy đủ,
// thêm nút quay lại, ô ảnh, chức năng sửa từ.

import { useEffect, useMemo, useRef, useState } from 'react';
import { wordsApi } from '../../api/client';
import { speak } from '../../utils/tts';
import { shuffle, pickRandom } from '../../utils/helpers';
import { initMachine, stepMachine } from './sessionMachine';
import EditWordModal from '../../components/learning/EditWordModal';

const BATCH_SIZE = 5;
const TYPE_CFG = {
  1: { name: 'Nhập chính tả', icon: '⌨️', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  2: { name: 'Trắc nghiệm', icon: '🎯', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)' },
  3: { name: 'Dịch từ vựng', icon: '🔤', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  4: { name: 'Nghe', icon: '🎧', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
};

const LEVEL_CFG = {
  0: { label: 'Mới', bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  1: { label: 'Lv1', bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  2: { label: 'Lv2', bg: 'rgba(6,182,212,0.15)', color: '#06b6d4' },
  3: { label: 'Lv3', bg: 'rgba(165,180,252,0.15)', color: '#a5b4fc' },
  4: { label: 'Lv4', bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  5: { label: 'Lv5', bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  6: { label: 'Lv6', bg: 'rgba(244,63,94,0.15)', color: '#f43f5e' },
};

const POS_MAP = {
  n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'trạng từ',
  prep: 'giới từ', conj: 'liên từ', pron: 'đại từ',
  'phrasal verb': 'cụm động từ', phrase: 'cụm từ',
};

const REMIND_DAYS = [1, 3, 7];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const ANIM = `
  @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
  @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 40px rgba(99,102,241,0.6); } }
`;

// ── Image uploader ──────────────────────────────────────────────────────
function WordImageUploader({ word, onImageAdded }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(word.image_url || null);
  const fileInput = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh không được vượt quá 5MB!');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 để preview
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);

      // TODO: Gọi API upload ảnh (sẽ bàn sau)
      // const formData = new FormData();
      // formData.append('image', file);
      // const res = await wordsApi.uploadImage(word.id, formData);
      // setPreview(res.image_url);
      // onImageAdded?.(res.image_url);

      // Tạm thời lưu base64 vào localStorage
      const saved = JSON.parse(localStorage.getItem('word_images') || '{}');
      const reader2 = new FileReader();
      reader2.onload = (ev) => {
        saved[word.id] = ev.target.result;
        localStorage.setItem('word_images', JSON.stringify(saved));
        onImageAdded?.(ev.target.result);
      };
      reader2.readAsDataURL(file);
    } catch (err) {
      console.error('Upload ảnh lỗi:', err);
      alert('Không thể upload ảnh. Vui lòng thử lại!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      {preview ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
          <img
            src={preview}
            alt={word.word}
            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            style={{
              position: 'absolute', top: 8, right: 8,
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(0,0,0,0.6)', color: '#fff',
              border: 'none', fontSize: 12, cursor: 'pointer',
            }}
          >🔄 Đổi ảnh</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 12,
            background: 'rgba(99,102,241,0.06)',
            border: '1.5px dashed rgba(99,102,241,0.3)',
            color: '#a5b4fc',
            fontSize: 13,
            fontWeight: 600,
            cursor: uploading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
        >
          {uploading ? '⏳ Đang tải...' : '📷 Thêm ảnh để dễ nhớ'}
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// ── Word Info Panel ─────────────────────────────────────────────────────
function WordInfoPanel({ word, variant = 'default', onEdit, showImage = true }) {
  const lvCfg = LEVEL_CFG[word.lv || word.level || 0] || LEVEL_CFG[0];
  const posLabel = POS_MAP[word.pos] || word.pos;
  const [imageUrl, setImageUrl] = useState(word.image_url || null);

  // Load ảnh từ localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('word_images') || '{}');
    if (saved[word.id]) setImageUrl(saved[word.id]);
  }, [word.id]);

  return (
    <div style={{
      padding: 16,
      borderRadius: 14,
      background: variant === 'correct'
        ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))'
        : variant === 'wrong'
        ? 'linear-gradient(135deg, rgba(244,63,94,0.1), rgba(244,63,94,0.04))'
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${
        variant === 'correct' ? 'rgba(16,185,129,0.25)'
        : variant === 'wrong' ? 'rgba(244,63,94,0.25)'
        : 'rgba(255,255,255,0.08)'
      }`,
    }}>
      {/* Word + Level + Edit button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22,
          color: variant === 'correct' ? '#10b981' : variant === 'wrong' ? '#f43f5e' : '#e8eaf6',
        }}>{word.word}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          background: lvCfg.bg, color: lvCfg.color,
        }}>{lvCfg.label}</span>
        {posLabel && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6,
            background: 'rgba(165,180,252,0.12)', color: '#a5b4fc',
            border: '1px solid rgba(165,180,252,0.25)', fontStyle: 'italic',
          }}>({posLabel})</span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {/* ✅ Nút sửa từ */}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(word)}
              title="Sửa từ này"
              style={{
                padding: '6px 10px', borderRadius: 8,
                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)',
                color: '#fbbf24', fontSize: 13, cursor: 'pointer',
              }}
            >✏️</button>
          )}
          <button
            type="button"
            onClick={() => speak(word.word)}
            style={{
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              color: '#c7d2fe', fontSize: 13, cursor: 'pointer',
            }}
          >🔊</button>
        </div>
      </div>

      {/* Pronunciation */}
      {word.phonetic && (
        <div style={{ fontSize: 13, color: '#8892b0', fontFamily: 'monospace', marginBottom: 8 }}>
          {word.phonetic}
        </div>
      )}

      {/* Meaning */}
      <div style={{ fontSize: 14.5, color: '#e8eaf6', marginBottom: 8, lineHeight: 1.5 }}>
        {word.meaning}
      </div>

      {/* Example */}
      {word.examples?.[0] && (
        <div style={{
          padding: 10, borderRadius: 8, marginBottom: 10,
          background: 'rgba(255,255,255,0.03)',
          borderLeft: '3px solid rgba(251,191,36,0.5)',
        }}>
          <div style={{ fontSize: 13, color: '#fbbf24', fontStyle: 'italic', marginBottom: 3 }}>
            {word.examples[0].en.replace('___', word.word)}
          </div>
          <div style={{ fontSize: 12, color: '#8892b0' }}>🇻🇳 {word.examples[0].vi}</div>
        </div>
      )}

      {/* ✅ Ô thêm ảnh */}
      {showImage && (
        <WordImageUploader word={word} onImageAdded={(url) => setImageUrl(url)} />
      )}
    </div>
  );
}

// ── Header với nút Quay lại ─────────────────────────────────────────────
function SessionHeader({ onBack, label, progress }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          style={{
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#8892b0', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >← Quay lại</button>

        {label && (
          <span style={{ fontSize: 12, color: '#8892b0', fontWeight: 600 }}>{label}</span>
        )}

        {progress && (
          <span style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 700 }}>{progress}</span>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          animation: 'fadeSlideUp 0.25s ease',
        }}>
          <div style={{
            maxWidth: 380, width: '100%',
            background: '#1a1d2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 18, padding: 28,
          }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <h3 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18,
              color: '#e8eaf6', textAlign: 'center', marginBottom: 8,
            }}>Ngưng học?</h3>
            <p style={{ fontSize: 13.5, color: '#8892b0', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              Tiến độ đã học sẽ được lưu lại. Bạn có thể tiếp tục sau.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#8892b0', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >Ở lại</button>
              <button
                type="button"
                onClick={onBack}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
                  border: 'none', color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >Ngưng học</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Browse Card ─────────────────────────────────────────────────────────
function BrowseCard({ word, onSkip, onKnown, onLearn }) {
  const [playing, setPlaying] = useState(false);
  const lvCfg = LEVEL_CFG[word.lv || word.level || 0] || LEVEL_CFG[0];
  const posLabel = POS_MAP[word.pos] || word.pos;

  const handleSpeak = (accent) => {
    setPlaying(true);
    speak(word.word, accent);
    setTimeout(() => setPlaying(false), 800);
  };

  return (
    <div style={{
      ...s.card,
      animation: 'fadeSlideUp 0.4s ease',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
      border: '1px solid rgba(99,102,241,0.2)',
      boxShadow: '0 0 60px rgba(99,102,241,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 32,
              color: '#e8eaf6', margin: 0, letterSpacing: '-0.5px',
            }}>{word.word}</h2>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: lvCfg.bg, color: lvCfg.color }}>
              {lvCfg.label}
            </span>
          </div>
          {posLabel && (
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
              background: 'rgba(165,180,252,0.12)', color: '#a5b4fc',
              border: '1px solid rgba(165,180,252,0.25)', fontStyle: 'italic',
            }}>{posLabel}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => handleSpeak('en-GB')} style={{ ...s.speakBtn, animation: playing ? 'pulse 0.5s' : 'none' }}>🇬🇧</button>
          <button type="button" onClick={() => handleSpeak('en-US')} style={{ ...s.speakBtn, animation: playing ? 'pulse 0.5s' : 'none' }}>🇺🇸</button>
        </div>
      </div>

      {word.phonetic && (
        <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: 16 }}>
          <span style={{ fontSize: 15, color: '#c7d2fe', fontFamily: 'monospace' }}>{word.phonetic}</span>
        </div>
      )}

      <div style={{ padding: 16, borderRadius: 12, marginBottom: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Nghĩa</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#e8eaf6' }}>{word.meaning}</div>
      </div>

      {word.examples?.length > 0 && (
        <div style={{ padding: 16, borderRadius: 12, marginBottom: 20, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Ví dụ</div>
          {word.examples.slice(0, 2).map((ex, i) => (
            <div key={i} style={{ marginBottom: i === 0 && word.examples.length > 1 ? 12 : 0 }}>
              <div style={{ fontSize: 14.5, color: '#fbbf24', fontStyle: 'italic', marginBottom: 4, lineHeight: 1.5 }}>{ex.en.replace('___', word.word)}</div>
              <div style={{ fontSize: 13, color: '#8892b0' }}>🇻🇳 {ex.vi}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" onClick={onSkip} style={{ ...s.btn, ...s.btnGhost }}>⏭️ Bỏ qua</button>
        <button type="button" onClick={onKnown} style={{ ...s.btn, ...s.btnSuccess }}>✓ Đã biết</button>
        <button type="button" onClick={onLearn} style={{ ...s.btn, ...s.btnPrimary, flex: 2 }}>📖 Học từ này</button>
      </div>
    </div>
  );
}

// ── Exercise Header ─────────────────────────────────────────────────────
function ExerciseHeader({ type }) {
  const cfg = TYPE_CFG[type] || TYPE_CFG[1];
  return (
    <div style={{ marginBottom: 20, animation: 'fadeSlideDown 0.3s ease' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', borderRadius: 9999,
        background: `${cfg.color}18`, border: `1px solid ${cfg.color}50`,
        marginBottom: 14,
      }}>
        <span style={{ fontSize: 16 }}>{cfg.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: 0.8, textTransform: 'uppercase' }}>{cfg.name}</span>
      </div>
    </div>
  );
}

// ── Feedback (đúng + sai đều hiện info) ────────────────────────────────
function AnswerFeedback({ correct, word, onContinue, onRemindLater, onSkipForever, onEdit }) {
  const [showInfo, setShowInfo] = useState(false);
  const [pickingDays, setPickingDays] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowInfo(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ animation: 'scaleIn 0.3s ease', textAlign: 'center' }}>
      {/* Icon + Status */}
      <div style={{ marginBottom: 20, animation: correct ? 'pulse 0.6s ease' : 'shake 0.5s ease' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 72, height: 72, borderRadius: '50%',
          background: correct ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
          border: `2px solid ${correct ? '#10b981' : '#f43f5e'}`,
          fontSize: 36,
          boxShadow: `0 0 40px ${correct ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'}`,
        }}>{correct ? '✓' : '✗'}</div>
        <div style={{
          marginTop: 14,
          fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20,
          color: correct ? '#10b981' : '#f43f5e',
        }}>{correct ? 'Chính xác!' : 'Chưa đúng'}</div>
        {!correct && (
          <div style={{ marginTop: 4, fontSize: 13, color: '#8892b0' }}>Từ này sẽ được ôn lại</div>
        )}
      </div>

      {/* Word Info */}
      {showInfo && (
        <div style={{ marginBottom: 16, animation: 'fadeSlideUp 0.4s ease', textAlign: 'left' }}>
          <WordInfoPanel
            word={word}
            variant={correct ? 'correct' : 'wrong'}
            onEdit={onEdit}
            showImage={true}
          />
        </div>
      )}

      {/* ✅ Nút hành động */}
      {showInfo && (
        <>
          {correct ? (
            // Trả lời đúng → hiện 3 nút: Nhắc lại / Bỏ qua / Tiếp tục
            !pickingDays ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', animation: 'fadeSlideUp 0.5s ease' }}>
                <button type="button" onClick={() => setPickingDays(true)} style={{ ...s.btn, ...s.btnGhost, fontSize: 12.5 }}>
                  🔔 Nhắc lại sau
                </button>
                <button type="button" onClick={onSkipForever} style={{ ...s.btn, ...s.btnDanger, fontSize: 12.5 }}>
                  ⏭️ Bỏ qua
                </button>
                <button type="button" onClick={onContinue} style={{ ...s.btn, ...s.btnPrimary, flex: 1, minWidth: 100 }}>
                  Tiếp tục →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, animation: 'fadeSlideUp 0.3s ease' }}>
                {REMIND_DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => onRemindLater(d)} style={{ ...s.btn, ...s.btnPrimary, flex: 1 }}>
                    {d} ngày
                  </button>
                ))}
              </div>
            )
          ) : (
            // Trả lời sai → chỉ hiện nút Tiếp tục
            <button
              type="button"
              onClick={onContinue}
              style={{ ...s.btn, ...s.btnPrimary, width: '100%', padding: '14px', fontSize: 15, animation: 'fadeSlideUp 0.5s ease' }}
            >
              Tiếp tục →
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── 4 dạng bài tập ─────────────────────────────────────────────────────
// (Giữ nguyên logic, chỉ update props cho AnswerFeedback)

function Type1Spelling({ word, onAnswer, onRemindLater, onSkipForever, onEdit }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const ex = useMemo(() => pickRandom(word.examples || [{ en: '___', vi: '' }], 1)[0], [word.id]);

  const submit = () => {
    if (result) return;
    const ok = value.trim().toLowerCase() === word.word.toLowerCase();
    setResult(ok ? 'correct' : 'wrong');
    speak(word.word);
  };

  if (result) {
    return (
      <AnswerFeedback
        correct={result === 'correct'}
        word={word}
        onContinue={() => onAnswer(result === 'correct')}
        onRemindLater={onRemindLater}
        onSkipForever={onSkipForever}
        onEdit={onEdit}
      />
    );
  }

  return (
    <div style={{ animation: 'fadeSlideUp 0.35s ease' }}>
      <ExerciseHeader type={1} />
      <div style={{ padding: 20, borderRadius: 14, marginBottom: 18, background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Nghĩa tiếng Việt</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e8eaf6', fontFamily: 'Outfit, sans-serif', marginBottom: 12 }}>{word.meaning}</div>
        {ex && (
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid rgba(251,191,36,0.5)' }}>
            <div style={{ fontSize: 14, color: '#fbbf24', fontStyle: 'italic', marginBottom: 4 }}>{ex.en}</div>
            <div style={{ fontSize: 13, color: '#8892b0' }}>🇻🇳 {ex.vi}</div>
          </div>
        )}
      </div>
      <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Nhập từ tiếng Anh..." style={s.input} />
      <button type="button" onClick={submit} disabled={!value.trim()} style={{ ...s.btn, ...s.btnPrimary, width: '100%', padding: '14px', opacity: value.trim() ? 1 : 0.5 }}>Kiểm tra ↵</button>
    </div>
  );
}

function Type2ChooseMeaning({ word, pool, onAnswer, onRemindLater, onSkipForever, onEdit }) {
  const [picked, setPicked] = useState(null);
  const options = useMemo(() => {
    const distractors = pickRandom(pool.filter((w) => w.id !== word.id && w.meaning), 3).map((w) => w.meaning);
    return shuffle([word.meaning, ...distractors]);
  }, [word.id]);

  const pick = (opt) => {
    if (picked) return;
    setPicked(opt);
    speak(word.word);
  };

  if (picked) {
    return (
      <AnswerFeedback
        correct={picked === word.meaning}
        word={word}
        onContinue={() => onAnswer(picked === word.meaning)}
        onRemindLater={onRemindLater}
        onSkipForever={onSkipForever}
        onEdit={onEdit}
      />
    );
  }

  return (
    <div style={{ animation: 'fadeSlideUp 0.35s ease' }}>
      <ExerciseHeader type={2} />
      <div style={{ textAlign: 'center', padding: 28, borderRadius: 16, marginBottom: 22, background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 36, color: '#e8eaf6', letterSpacing: '-0.5px' }}>{word.word}</div>
        {word.phonetic && <div style={{ marginTop: 8, fontSize: 15, color: '#8892b0', fontFamily: 'monospace' }}>{word.phonetic}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => (
          <button key={`${opt}-${i}`} type="button" onClick={() => pick(opt)} style={optStyle()}>
            <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Type3ChooseWord({ word, pool, onAnswer, onRemindLater, onSkipForever, onEdit }) {
  const [picked, setPicked] = useState(null);
  const options = useMemo(() => {
    const distractors = pickRandom(pool.filter((w) => w.id !== word.id), 3).map((w) => w.word);
    return shuffle([word.word, ...distractors]);
  }, [word.id]);

  const pick = (opt) => {
    if (picked) return;
    setPicked(opt);
    speak(word.word);
  };

  if (picked) {
    return (
      <AnswerFeedback
        correct={picked === word.word}
        word={word}
        onContinue={() => onAnswer(picked === word.word)}
        onRemindLater={onRemindLater}
        onSkipForever={onSkipForever}
        onEdit={onEdit}
      />
    );
  }

  return (
    <div style={{ animation: 'fadeSlideUp 0.35s ease' }}>
      <ExerciseHeader type={3} />
      <div style={{ textAlign: 'center', padding: 24, borderRadius: 16, marginBottom: 22, background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.02))', border: '1px solid rgba(251,191,36,0.2)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Chọn từ tiếng Anh đúng</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#e8eaf6', fontFamily: 'Outfit, sans-serif' }}>{word.meaning}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt, i) => (
          <button key={`${opt}-${i}`} type="button" onClick={() => pick(opt)} style={optStyle()}>
            <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Type4Listening({ word, onAnswer, onRemindLater, onSkipForever, onEdit }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [playCount, setPlayCount] = useState(0);
  const played = useRef(false);

  useEffect(() => {
    if (!played.current) { speak(word.word); played.current = true; setPlayCount(1); }
  }, [word.id]);

  const submit = () => {
    if (result) return;
    const ok = value.trim().toLowerCase() === word.word.toLowerCase();
    setResult(ok ? 'correct' : 'wrong');
  };

  if (result) {
    return (
      <AnswerFeedback
        correct={result === 'correct'}
        word={word}
        onContinue={() => onAnswer(result === 'correct')}
        onRemindLater={onRemindLater}
        onSkipForever={onSkipForever}
        onEdit={onEdit}
      />
    );
  }

  return (
    <div style={{ animation: 'fadeSlideUp 0.35s ease' }}>
      <ExerciseHeader type={4} />
      <button
        type="button"
        onClick={() => { speak(word.word); setPlayCount(c => c + 1); }}
        style={{
          width: '100%', padding: '40px 0', borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))',
          border: '2px solid rgba(139,92,246,0.4)', color: '#c7d2fe',
          fontSize: 48, cursor: 'pointer', marginBottom: 20,
          transition: 'all 0.25s ease',
        }}
      >
        🔊
        <div style={{ fontSize: 12, marginTop: 10, opacity: 0.7, letterSpacing: 0.5 }}>
          {playCount === 1 ? 'Bấm để nghe lại' : `Đã nghe ${playCount} lần`}
        </div>
      </button>
      <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Nghe và gõ lại từ..." style={s.input} />
      <button type="button" onClick={submit} disabled={!value.trim()} style={{ ...s.btn, ...s.btnPrimary, width: '100%', padding: '14px', opacity: value.trim() ? 1 : 0.5 }}>Kiểm tra ↵</button>
    </div>
  );
}

// ── Component chính ─────────────────────────────────────────────────────
export function LearningSession({ folder, mode, dailyGoal, wordsLearned, onWordComplete, onBack }) {
  const sessionWords = useRef(folder.words.slice(0, dailyGoal || folder.words.length)).current;
  const batches = useRef(chunk(sessionWords, BATCH_SIZE)).current;
  const pool = folder.words;

  const [batchIdx, setBatchIdx] = useState(0);
  const [phase, setPhase] = useState(mode === 'learn' ? 'browse' : 'exercise');
  const [browseIdx, setBrowseIdx] = useState(0);
  const [workingBatch, setWorkingBatch] = useState(() => (mode === 'learn' ? [] : batches[0] || []));
  const [machine, setMachine] = useState(() => (mode === 'review' ? initMachine(batches[0] || []) : null));
  const [currentWordId, setCurrentWordId] = useState(null);
  const [editingWord, setEditingWord] = useState(null); // ✅ State cho sửa từ
  const [transitionKey, setTransitionKey] = useState(0);
  const wrongCounts = useRef({});

  const currentBatch = batches[batchIdx] || [];

  const bumpWrong = (id) => { wrongCounts.current[id] = (wrongCounts.current[id] || 0) + 1; };

  const finishWord = (word, opts = {}) => {
    if (mode === 'learn') {
      wordsApi.completeLearn(word.id).catch(console.error);
    } else {
      wordsApi.completeReview(word.id, { wrong_count: wrongCounts.current[word.id] || 0, choice: opts.choice }).catch(console.error);
    }
    onWordComplete?.();
  };

  const startExerciseBatch = (words) => {
    if (words.length === 0) { goNextBatch(); return; }
    setWorkingBatch(words);
    setMachine(initMachine(words));
    setCurrentWordId(words[0]?.id);
    setPhase('exercise');
    setTransitionKey(k => k + 1);
  };

  const goNextBatch = () => {
    const next = batchIdx + 1;
    if (next >= batches.length) { setPhase('sessionDone'); return; }
    setBatchIdx(next);
    setBrowseIdx(0);
    if (mode === 'learn') { setWorkingBatch([]); setPhase('browse'); }
    else { startExerciseBatch(batches[next] || []); }
    setTransitionKey(k => k + 1);
  };

  const handleBrowseAction = (action) => {
    const word = currentBatch[browseIdx];
    let nextWorkingBatch = workingBatch;
    if (action === 'skip') { wordsApi.skip(word.id).catch(console.error); }
    else if (action === 'known') { wordsApi.markKnown(word.id).catch(console.error); }
    else if (action === 'learn') { nextWorkingBatch = [...workingBatch, word]; setWorkingBatch(nextWorkingBatch); }

    const nextIdx = browseIdx + 1;
    if (nextIdx < currentBatch.length) { setBrowseIdx(nextIdx); setTransitionKey(k => k + 1); }
    else { startExerciseBatch(nextWorkingBatch); }
  };

  const handleAnswer = (correct) => {
    const word = workingBatch.find((w) => w.id === currentWordId);
    if (!word) return;
    if (!correct) bumpWrong(word.id);
    advanceMachine(word.id, correct, false);
  };

  const handleRemindLater = (days) => {
    const word = workingBatch.find((w) => w.id === currentWordId);
    if (!word) return;
    wordsApi.snooze(word.id, days).catch(console.error);
    advanceMachine(word.id, true, false);
  };

  const handleSkipForever = () => {
    const word = workingBatch.find((w) => w.id === currentWordId);
    if (!word) return;
    advanceMachine(word.id, true, true, 'bo_qua');
  };

  const advanceMachine = (wordId, correct, removed, choice) => {
    let batchNow = workingBatch;
    if (removed) {
      const w = workingBatch.find((x) => x.id === wordId);
      if (w) finishWord(w, { choice });
      batchNow = workingBatch.filter((w) => w.id !== wordId);
    }
    const res = stepMachine(machine, { wordId, correct, removed, batch: batchNow });
    setWorkingBatch(batchNow);
    if (res.done) {
      batchNow.forEach((w) => finishWord(w));
      goNextBatch();
    } else {
      setMachine(res.state);
      setCurrentWordId(res.state.remaining[0]?.id);
      setTransitionKey(k => k + 1);
    }
  };

  // ✅ Handler sửa từ
  const handleEditWord = (word) => {
    setEditingWord(word);
    // TODO: Mở modal sửa từ (bàn sau)
    console.log('Sửa từ:', word);
  };

  const currentWord = workingBatch.find((w) => w.id === currentWordId);

  if (phase === 'sessionDone' || sessionWords.length === 0) {
    return (
      <div style={{ ...s.wrap, textAlign: 'center', paddingTop: 60, animation: 'scaleIn 0.5s ease' }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#e8eaf6', marginBottom: 8 }}>Hoàn thành!</h2>
        <p style={{ color: '#8892b0', fontSize: 15, marginBottom: 28 }}>Bạn đã học {sessionWords.length} từ</p>
        <button type="button" onClick={onBack} style={{ ...s.btn, ...s.btnPrimary, padding: '14px 36px', fontSize: 15 }}>🏠 Về trang chủ</button>
      </div>
    );
  }

  if (phase === 'browse') {
    const word = currentBatch[browseIdx];
    if (!word) { goNextBatch(); return null; }
    return (
      <div style={s.wrap}>
        <style>{ANIM}</style>
        <SessionHeader
          onBack={onBack}
          label={`Xem từ ${browseIdx + 1}/${currentBatch.length}`}
          progress={`${browseIdx + batchIdx * BATCH_SIZE}/${sessionWords.length}`}
        />
        <ProgressBar done={browseIdx + (batchIdx * BATCH_SIZE)} total={sessionWords.length} label="" />
        <div key={`${batchIdx}-${browseIdx}`} style={{ animation: 'slideInRight 0.35s ease' }}>
          <BrowseCard
            word={word}
            onSkip={() => handleBrowseAction('skip')}
            onKnown={() => handleBrowseAction('known')}
            onLearn={() => handleBrowseAction('learn')}
          />
        </div>
      </div>
    );
  }

  if (phase === 'exercise' && currentWord) {
    const commonProps = {
      key: `${currentWord.id}-${machine.level}-${machine.seq}`,
      word: currentWord,
      pool,
      onAnswer: handleAnswer,
      onRemindLater: handleRemindLater,
      onSkipForever: handleSkipForever,
      onEdit: handleEditWord,
    };
    return (
      <div style={s.wrap}>
        <style>{ANIM}</style>
        <SessionHeader
          onBack={onBack}
          label={TYPE_CFG[machine.level]?.name}
          progress={`${wordsLearned}/${dailyGoal}`}
        />
        <ProgressBar done={wordsLearned} total={dailyGoal} label="" />
        <div key={transitionKey} style={{ animation: 'fadeSlideUp 0.35s ease' }}>
          {machine.level === 1 && <Type1Spelling {...commonProps} />}
          {machine.level === 2 && <Type2ChooseMeaning {...commonProps} />}
          {machine.level === 3 && <Type3ChooseWord {...commonProps} />}
          {machine.level === 4 && <Type4Listening {...commonProps} />}
        </div>

        {/* ✅ TODO: Modal sửa từ (bàn sau) */}
        {editingWord && (
  <EditWordModal
    word={editingWord}
    folders={folder ? [folder] : []}
    onClose={() => setEditingWord(null)}
    onSave={(updated) => {
      // Cập nhật workingBatch + sessionWords
      const updatedWord = { ...editingWord, ...updated };
      setWorkingBatch(prev => prev.map(w => w.id === editingWord.id ? updatedWord : w));
      setEditingWord(null);
    }}
  />
)}
      </div>
    );
  }

  return null;
}

function ProgressBar({ done, total, label }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div style={{ maxWidth: 520, margin: '0 auto 20px' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8892b0', marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span>{done}/{total} · {pct}%</span>
        </div>
      )}
      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 999,
          background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
          boxShadow: '0 0 12px rgba(139,92,246,0.5)',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}

function optStyle() {
  return {
    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
    padding: '16px 20px', borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1.5px solid rgba(255,255,255,0.08)',
    color: '#e8eaf6', fontSize: 15,
    fontFamily: 'Outfit, sans-serif', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s ease',
  };
}

const s = {
  wrap: { width: '100%', maxWidth: 520, margin: '0 auto', padding: '24px 16px' },
  card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' },
  speakBtn: { width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#c7d2fe', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  input: { width: '100%', padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(99,102,241,0.3)', color: '#e8eaf6', fontSize: 17, fontFamily: 'Outfit, sans-serif', fontWeight: 600, outline: 'none', marginBottom: 14, boxSizing: 'border-box', transition: 'all 0.2s' },
  btn: { padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif', cursor: 'pointer', transition: 'all 0.2s', border: 'none' },
  btnPrimary: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' },
  btnGhost: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#8892b0' },
  btnSuccess: { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' },
  btnDanger: { background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e' },
};