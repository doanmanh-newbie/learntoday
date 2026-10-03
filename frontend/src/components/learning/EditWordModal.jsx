// src/components/learning/EditWordModal.jsx
// Module sửa từ — user sửa thông tin từ cho riêng mình

import { useState, useRef, useEffect } from 'react';
import { speak } from '../../utils/tts';

const POS_OPTIONS = [
  { value: 'n', label: 'Danh từ (noun)' },
  { value: 'v', label: 'Động từ (verb)' },
  { value: 'adj', label: 'Tính từ (adj)' },
  { value: 'adv', label: 'Trạng từ (adv)' },
  { value: 'prep', label: 'Giới từ (prep)' },
  { value: 'conj', label: 'Liên từ (conj)' },
  { value: 'pron', label: 'Đại từ (pron)' },
  { value: 'phrasal verb', label: 'Cụm động từ (phrasal verb)' },
  { value: 'phrase', label: 'Cụm từ (phrase)' },
];

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'IELTS'];

// ── Highlight từ vựng trong ví dụ (tô đậm + màu, hoặc ẩn) ────────────────
function HighlightExample({ text, word, hideWord = true }) {
  if (!text || !word) return <span>{text}</span>;
  
  const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <span>
      {parts.map((part, i) => {
        const isWord = part.toLowerCase() === word.toLowerCase();
        if (!isWord) return <span key={i}>{part}</span>;
        
        if (hideWord) {
          // Ẩn từ — thay bằng ___
          return (
            <span key={i} style={{
              display: 'inline-block',
              minWidth: 60,
              height: 20,
              borderBottom: '2px solid #fbbf24',
              verticalAlign: 'bottom',
              margin: '0 4px',
            }} />
          );
        }
        // Tô đậm + màu
        return (
          <span key={i} style={{
            color: '#fbbf24',
            fontWeight: 700,
            background: 'rgba(251,191,36,0.15)',
            padding: '0 4px',
            borderRadius: 4,
          }}>{part}</span>
        );
      })}
    </span>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────
export default function EditWordModal({ word, folders = [], onClose, onSave }) {
  const [form, setForm] = useState({
    word: word.word || '',
    folder_id: word.folder_id || (folders[0]?.id ?? ''),
    level: word.level || word.lv || 'A2',
    pos: word.pos || word.word_type || 'n',
    meaning: word.meaning || '',
    example_en: word.examples?.[0]?.en || word.example || '',
    example_vi: word.examples?.[0]?.vi || word.example_meaning || '',
    image_url: word.image_url || null,
  });

  const [meaningSuggestions, setMeaningSuggestions] = useState([]);
  const [exampleSuggestions, setExampleSuggestions] = useState([]);
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const fileInput = useRef(null);

  // Load ảnh từ localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('word_images') || '{}');
    if (saved[word.id]) {
      setForm(f => ({ ...f, image_url: saved[word.id] }));
    }
  }, [word.id]);

  // Khi đổi POS → fetch suggestions
  useEffect(() => {
    if (!form.word || !form.pos) return;
    let cancelled = false;
    setLoadingSuggestions(true);
    
    // TODO: Gọi API thật để lấy suggestions
    // Tạm mock data
    setTimeout(() => {
      if (cancelled) return;
      
      // Mock meanings theo POS
      const mockMeanings = {
        v: ['cất cánh', 'rời đi', 'khởi hành', 'bắt đầu'],
        n: ['sự cất cánh', 'chuyến bay', 'hành trình'],
        adj: ['đang cất cánh', 'khởi hành'],
        'phrasal verb': ['cất cánh', 'cởi ra', 'bắt chước'],
      };
      const meanings = mockMeanings[form.pos] || ['nghĩa 1', 'nghĩa 2', 'nghĩa 3'];
      setMeaningSuggestions(meanings.map(m => ({ pos: form.pos, meaning: m })));
      
      // Mock examples
      setExampleSuggestions([
        { en: `The plane ${form.word} at 8am.`, vi: `Máy bay ${form.word} vào 8h.` },
        { en: `We need to ${form.word} early.`, vi: `Chúng ta cần ${form.word} sớm.` },
      ]);
      
      // Mock images (dùng placeholder)
      setImageSuggestions([
        'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=300&h=200&fit=crop',
      ]);
      
      setLoadingSuggestions(false);
    }, 300);
    
    return () => { cancelled = true; };
  }, [form.word, form.pos]);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Chọn file ảnh!'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Ảnh tối đa 5MB!'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, image_url: ev.target.result }));
      // Lưu vào localStorage
      const saved = JSON.parse(localStorage.getItem('word_images') || '{}');
      saved[word.id] = ev.target.result;
      localStorage.setItem('word_images', JSON.stringify(saved));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // Validate
    if (!form.word.trim()) { alert('Vui lòng nhập từ vựng!'); return; }
    if (!form.meaning.trim()) { alert('Vui lòng nhập nghĩa!'); return; }

    // Lưu vào localStorage (thay vì API, vì chỉ user thấy)
    const edits = JSON.parse(localStorage.getItem('word_edits') || '{}');
    edits[word.id] = {
      ...form,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('word_edits', JSON.stringify(edits));

    onSave?.(form);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
      animation: 'fadeSlideUp 0.25s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 560, maxHeight: '90vh',
        background: '#13162a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>✏️</span>
            <div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: '#e8eaf6' }}>
                Sửa từ
              </div>
              <div style={{ fontSize: 12, color: '#8892b0' }}>{word.word}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#8892b0', cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>

          {/* Từ vựng */}
          <Field label="📝 Từ vựng">
            <input
              value={form.word}
              onChange={(e) => handleChange('word', e.target.value)}
              style={sInput}
            />
          </Field>

          {/* Thư mục */}
          <Field label="📁 Thư mục">
            <select
              value={form.folder_id}
              onChange={(e) => handleChange('folder_id', e.target.value)}
              style={sInput}
            >
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </Field>

          {/* Level + POS (2 cột) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <Field label="🎓 Cấp độ">
              <select value={form.level} onChange={(e) => handleChange('level', e.target.value)} style={sInput}>
                {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="🔤 Loại từ">
              <select value={form.pos} onChange={(e) => handleChange('pos', e.target.value)} style={sInput}>
                {POS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Nghĩa */}
          <Field label="💡 Nghĩa">
            <input
              value={form.meaning}
              onChange={(e) => handleChange('meaning', e.target.value)}
              placeholder="Nhập nghĩa..."
              style={sInput}
            />
          </Field>

          {/* Đề xuất nghĩa */}
          <div style={{ marginBottom: 20 }}>
            <div style={sLabel}>Đề xuất nghĩa (theo loại từ)</div>
            {loadingSuggestions ? (
              <div style={sHint}>Đang tải đề xuất...</div>
            ) : meaningSuggestions.length === 0 ? (
              <div style={sHint}>Không có đề xuất</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {meaningSuggestions.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleChange('meaning', m.meaning)}
                    style={sSuggestionRow}
                  >
                    <span style={sSuggestionTag}>({m.pos})</span>
                    <span style={{ flex: 1, textAlign: 'left', color: '#e8eaf6' }}>{m.meaning}</span>
                    <span style={sSuggestionAction}>Chọn</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ví dụ */}
          <Field label="📖 Ví dụ">
            <input
              value={form.example_en}
              onChange={(e) => handleChange('example_en', e.target.value)}
              placeholder="Nhập câu ví dụ tiếng Anh..."
              style={{ ...sInput, marginBottom: 8 }}
            />
            <input
              value={form.example_vi}
              onChange={(e) => handleChange('example_vi', e.target.value)}
              placeholder="Nhập nghĩa tiếng Việt..."
              style={sInput}
            />
          </Field>

          {/* Đề xuất ví dụ */}
          <div style={{ marginBottom: 20 }}>
            <div style={sLabel}>Đề xuất ví dụ</div>
            {exampleSuggestions.length === 0 ? (
              <div style={sHint}>Không có đề xuất</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {exampleSuggestions.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      handleChange('example_en', ex.en);
                      handleChange('example_vi', ex.vi);
                    }}
                    style={sExampleCard}
                  >
                    <div style={{ fontSize: 13.5, color: '#fbbf24', fontStyle: 'italic', marginBottom: 4 }}>
                      <HighlightExample text={ex.en} word={form.word} hideWord />
                    </div>
                    <div style={{ fontSize: 12.5, color: '#8892b0' }}>🇻🇳 {ex.vi}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ảnh */}
          <div style={{ marginBottom: 8 }}>
            <div style={sLabel}>🖼️ Ảnh</div>
            
            {/* Ảnh hiện tại */}
            {form.image_url && (
              <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden' }}>
                <img src={form.image_url} alt="word" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
              </div>
            )}

            {/* Đề xuất ảnh */}
            {imageSuggestions.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                {imageSuggestions.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleChange('image_url', url)}
                    style={{
                      padding: 0, border: form.image_url === url ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none',
                      aspectRatio: '1',
                    }}
                  >
                    <img src={url} alt={`suggestion-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Upload */}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              style={sUploadBtn}
            >📷 Upload ảnh mới</button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 22px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button type="button" onClick={onClose} style={sBtnGhost}>Hủy</button>
          <button type="button" onClick={handleSave} style={sBtnPrimary}>💾 Lưu thay đổi</button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={sLabel}>{label}</div>
      {children}
    </div>
  );
}

const sLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: '#8892b0',
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  marginBottom: 6,
};

const sInput = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e8eaf6',
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};

const sHint = {
  fontSize: 12.5,
  color: '#5a6a8a',
  fontStyle: 'italic',
  padding: '8px 0',
};

const sSuggestionRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 10,
  background: 'rgba(99,102,241,0.06)',
  border: '1px solid rgba(99,102,241,0.15)',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  transition: 'all 0.15s ease',
};

const sSuggestionTag = {
  fontSize: 10,
  fontWeight: 700,
  padding: '3px 7px',
  borderRadius: 5,
  background: 'rgba(165,180,252,0.15)',
  color: '#a5b4fc',
  fontStyle: 'italic',
};

const sSuggestionAction = {
  fontSize: 11,
  fontWeight: 700,
  color: '#6366f1',
  padding: '4px 10px',
  borderRadius: 6,
  background: 'rgba(99,102,241,0.12)',
};

const sExampleCard = {
  display: 'block',
  textAlign: 'left',
  padding: '12px 14px',
  borderRadius: 10,
  background: 'rgba(251,191,36,0.05)',
  border: '1px solid rgba(251,191,36,0.15)',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  transition: 'all 0.15s ease',
};

const sUploadBtn = {
  width: '100%',
  padding: '11px',
  borderRadius: 10,
  background: 'rgba(99,102,241,0.06)',
  border: '1.5px dashed rgba(99,102,241,0.3)',
  color: '#a5b4fc',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
};

const sBtnGhost = {
  padding: '11px 20px',
  borderRadius: 10,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#8892b0',
  fontSize: 13.5,
  fontWeight: 600,
  fontFamily: 'Outfit, sans-serif',
  cursor: 'pointer',
};

const sBtnPrimary = {
  padding: '11px 20px',
  borderRadius: 10,
  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
  border: 'none',
  color: '#fff',
  fontSize: 13.5,
  fontWeight: 700,
  fontFamily: 'Outfit, sans-serif',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
};