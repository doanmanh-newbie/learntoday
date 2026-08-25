import { useState, useRef, useEffect, useCallback } from "react";

// ─── Dữ liệu mẫu (Giữ nguyên từ file gốc) ───

const DICTIONARY = {
  accomplish: { /* ... giữ nguyên ... */ },
  significant: { /* ... giữ nguyên ... */ },
  perseverance: { /* ... giữ nguyên ... */ },
  resilient: { /* ... giữ nguyên ... */ },
  innovative: { /* ... giữ nguyên ... */ },
  collaborate: { /* ... giữ nguyên ... */ },
  eloquent: { /* ... giữ nguyên ... */ },
  milestone: { /* ... giữ nguyên ... */ },
  dedicate: { /* ... giữ nguyên ... */ },
  analyze: { /* ... giữ nguyên ... */ },
};

const MOCK_TRANS = {
  "hello": "Xin chào",
  "thank you": "Cảm ơn bạn",
  "good morning": "Chào buổi sáng",
  "how are you?": "Bạn có khỏe không?",
  "i love you": "Tôi yêu bạn",
  "she managed to accomplish all her goals despite the obstacles.":
    "Cô ấy đã hoàn thành tất cả mục tiêu dù gặp nhiều trở ngại.",
  "the research showed a significant improvement in test scores.":
    "Nghiên cứu cho thấy sự cải thiện đáng kể trong điểm kiểm tra.",
  "perseverance is the key to success.":
    "Sự kiên trì là chìa khóa dẫn đến thành công.",
  "xin chào": "Hello",
  "cảm ơn": "Thank you",
};

// ─── Các biến cấu hình màu ───

const LEVEL_COLORS = {
  B1: "#a5b4fc",
  B2: "#818cf8",
  C1: "#8b5cf6",
  C2: "#f43f5e",
};

const FOLDER_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#f43f5e", "#fb923c", "#34d399",
];

const INITIAL_FOLDERS = [
  { id: 1, name: "Công việc", color: "#6366f1", words: [] },
  { id: 2, name: "Học thuật", color: "#10b981", words: [] },
  { id: 3, name: "Phẩm chất", color: "#f59e0b", words: [] },
  { id: 4, name: "Công nghệ", color: "#8b5cf6", words: [] },
  { id: 5, name: "Giao tiếp", color: "#06b6d4", words: [] },
];

// ─── Inject CSS Animations ───

const STYLES = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%            { transform: translateY(-10px); }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.93) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .dict-page *::-webkit-scrollbar { width: 0; height: 0; }
`;

function injectStyles() {
  if (document.getElementById("dict-page-styles")) return;
  const el = document.createElement("style");
  el.id = "dict-page-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ─── Utility Functions ───

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  window.speechSynthesis.speak(utt);
}

function mockTranslate(text, srcLang) {
  const key = text.trim().toLowerCase();
  if (MOCK_TRANS[key]) return MOCK_TRANS[key];
  return srcLang === "en"
    ? `[Bản dịch VI: "${text.trim()}"]`
    : `[EN translation: "${text.trim()}"]`;
}

// ─── SaveModal (đã nâng cấp) ───

function SaveModal({ wordOrText, folders, onSave, onClose, onCreate }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);
  const [saved, setSaved] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const handleSave = (folderId) => {
    onSave(folderId, wordOrText);
    setSaved(folderId);
    setTimeout(onClose, 900);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = onCreate(newName.trim(), newColor);
    onSave(id, wordOrText);
    setSaved(id);
    setTimeout(onClose, 900);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(7,9,26,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "overlayIn 0.18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(420px, 92vw)",
          background: "#0e1130",
          border: "0.8px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          padding: "28px",
          animation: "modalIn 0.22s ease",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <p style={{ fontFamily: "Outfit,sans-serif", fontSize: "18px", fontWeight: 700, color: "#f8faff", margin: 0 }}>
            💾 Lưu vào thư mục
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "20px", lineHeight: 1, padding: "2px 6px" }}>✕</button>
        </div>

        <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px", fontFamily: "Inter,sans-serif" }}>
          Lưu: <span style={{ color: "#a5b4fc", fontStyle: "italic" }}>"{wordOrText}"</span>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSave(f.id)}
              disabled={saved !== null}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px",
                background: saved === f.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                border: saved === f.id ? "0.8px solid #6366f1" : "0.8px solid rgba(255,255,255,0.07)",
                borderRadius: "12px", cursor: saved !== null ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: f.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#e2e8f0", textAlign: "left" }}>{f.name}</span>
              <span style={{ fontSize: "12px", color: "#475569" }}>{f.words.length} từ</span>
              {saved === f.id && <span style={{ fontSize: "16px" }}>✅</span>}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCreating((p) => !p)}
          style={{
            marginTop: "14px", width: "100%", padding: "10px 16px",
            background: "rgba(99,102,241,0.08)",
            border: "0.8px dashed rgba(99,102,241,0.4)",
            borderRadius: "12px", cursor: "pointer",
            fontFamily: "Inter,sans-serif", fontSize: "13px", color: "#a5b4fc",
            transition: "all 0.15s",
          }}
        >
          {creating ? "▾ Ẩn" : "＋ Tạo thư mục mới"}
        </button>

        {creating && (
          <div style={{ marginTop: "12px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "0.8px solid rgba(255,255,255,0.07)" }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder="Tên thư mục..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: "0.8px solid rgba(255,255,255,0.1)", borderRadius: "10px",
                padding: "10px 14px", color: "#f8faff", fontSize: "14px",
                fontFamily: "Inter,sans-serif", outline: "none", boxSizing: "border-box",
                marginBottom: "12px",
              }}
            />
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: c, border: newColor === c ? "2.5px solid #fff" : "2.5px solid transparent",
                    cursor: "pointer", flexShrink: 0, padding: 0,
                    transition: "transform 0.12s",
                    transform: newColor === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleCreate}
              style={{
                width: "100%", padding: "10px",
                background: "linear-gradient(135deg,#6366f1,#818cf8)",
                border: "none", borderRadius: "10px",
                color: "#fff", fontSize: "14px", fontWeight: 600,
                fontFamily: "Outfit,sans-serif", cursor: "pointer",
              }}
            >
              Tạo &amp; lưu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DictCard (nâng cấp thêm nút nghe, family và collocations chi tiết hơn) ───

function DictCard({ entry, onOpenSave }) {
  const lvlColor = LEVEL_COLORS[entry.level] || "#a5b4fc";

  return (
    <div style={{ animation: "fadeSlideIn 0.35s ease" }}>
      {/* Header */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "rgba(255,255,255,0.028)",
        border: "0.8px solid rgba(255,255,255,0.08)",
        borderRadius: "20px", padding: "28px 28px 22px",
        marginBottom: "12px",
      }}>
        <span style={{
          position: "absolute", right: "16px", top: "8px",
          fontFamily: "Outfit,sans-serif", fontSize: "140px", fontWeight: 900,
          color: "rgba(99,102,241,0.06)", lineHeight: 1, userSelect: "none",
          pointerEvents: "none",
        }}>
          {entry.word[0].toUpperCase()}
        </span>

        <button
          onClick={onOpenSave}
          style={{
            position: "absolute", top: "20px", right: "20px",
            background: "rgba(99,102,241,0.12)",
            border: "0.8px solid rgba(99,102,241,0.3)",
            borderRadius: "10px", padding: "7px 14px",
            color: "#a5b4fc", fontSize: "13px", fontWeight: 600,
            fontFamily: "Inter,sans-serif", cursor: "pointer",
          }}
        >
          💾 Lưu vào thư mục
        </button>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", flexWrap: "wrap", marginBottom: "10px" }}>
          <span style={{ fontFamily: "Outfit,sans-serif", fontSize: "42px", fontWeight: 900, color: "#f8faff", lineHeight: 1.1 }}>
            {entry.word}
          </span>
          <span style={{ fontFamily: "Inter,sans-serif", fontSize: "16px", color: "#94a3b8", marginBottom: "4px" }}>
            {entry.phonetic}
          </span>
          <span style={{
            background: `${lvlColor}22`, color: lvlColor,
            borderRadius: "8px", padding: "3px 10px",
            fontFamily: "Outfit,sans-serif", fontSize: "13px", fontWeight: 700,
            border: `0.8px solid ${lvlColor}44`, marginBottom: "4px",
          }}>
            {entry.level}
          </span>
          <button
            onClick={() => speak(entry.word)}
            style={{
              background: "rgba(165,180,252,0.1)", border: "0.8px solid rgba(165,180,252,0.2)",
              borderRadius: "10px", padding: "6px 14px",
              color: "#a5b4fc", fontSize: "13px", cursor: "pointer",
              fontFamily: "Inter,sans-serif", marginBottom: "4px",
            }}
          >
            🔊 Nghe
          </button>
        </div>

        {/* Word family */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
          {entry.family.map((f, i) => (
            <span key={i} style={{
              background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(255,255,255,0.09)",
              borderRadius: "8px", padding: "4px 12px",
              fontFamily: "Inter,sans-serif", fontSize: "13px", color: "#cbd5e1",
            }}>
              {f.word} <span style={{ color: "#64748b", fontSize: "11px" }}>({f.pos})</span>
            </span>
          ))}
        </div>
      </div>

      {/* POS blocks */}
      {entry.pos.map((block, bi) => (
        <div key={bi} style={{
          background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "22px 24px", marginBottom: "12px",
        }}>
          <span style={{
            display: "inline-block",
            background: "rgba(165,180,252,0.12)", color: "#a5b4fc",
            fontStyle: "italic", fontSize: "13px", fontWeight: 600,
            fontFamily: "Inter,sans-serif",
            borderRadius: "8px", padding: "3px 12px", marginBottom: "16px",
          }}>
            {block.type}
          </span>

          {block.defs.map((d, di) => (
            <div key={di} style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "6px" }}>
                <span style={{ color: "#6366f1", fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "15px", marginTop: "1px", flexShrink: 0 }}>
                  {di + 1}.
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "Inter,sans-serif", fontSize: "14.5px", color: "#e2e8f0", margin: "0 0 4px" }}>
                    {d.def}
                  </p>
                  <p style={{ fontFamily: "Inter,sans-serif", fontSize: "13.5px", color: "#34d399", fontStyle: "italic", margin: "0 0 10px" }}>
                    ▸ {d.vi}
                  </p>
                  <div style={{
                    background: "rgba(99,102,241,0.07)", border: "0.8px solid rgba(99,102,241,0.15)",
                    borderLeft: "3px solid #6366f1", borderRadius: "10px", padding: "10px 14px",
                  }}>
                    <p style={{ fontFamily: "Inter,sans-serif", fontSize: "13.5px", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                      "{d.example}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(block.synonyms?.length > 0 || block.antonyms?.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
              {block.synonyms?.map((s, i) => (
                <span key={i} style={{
                  background: "rgba(16,185,129,0.1)", color: "#34d399",
                  border: "0.8px solid rgba(52,211,153,0.2)",
                  borderRadius: "8px", padding: "4px 11px", fontSize: "12.5px",
                  fontFamily: "Inter,sans-serif",
                }}>
                  ↑ {s}
                </span>
              ))}
              {block.antonyms?.map((a, i) => (
                <span key={i} style={{
                  background: "rgba(248,113,113,0.1)", color: "#f87171",
                  border: "0.8px solid rgba(248,113,113,0.2)",
                  borderRadius: "8px", padding: "4px 11px", fontSize: "12.5px",
                  fontFamily: "Inter,sans-serif",
                }}>
                  ↓ {a}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Collocations */}
      {entry.collocations?.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "18px 22px",
        }}>
          <p style={{ fontFamily: "Outfit,sans-serif", fontSize: "13px", fontWeight: 700, color: "#fbbf24", margin: "0 0 12px", letterSpacing: "0.5px" }}>
            COLLOCATIONS
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {entry.collocations.map((c, i) => (
              <span key={i} style={{
                background: "rgba(245,158,11,0.08)", color: "#fbbf24",
                border: "0.8px solid rgba(251,191,36,0.2)",
                borderRadius: "8px", padding: "5px 13px", fontSize: "13px",
                fontFamily: "Inter,sans-serif",
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading Dots ───

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", padding: "8px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#6366f1", display: "inline-block",
          animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Tab 1: Tra từ ───

function TraTuTab({ folders, onSaveFolders, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const inputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const allKeys = Object.keys(DICTIONARY);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
      doSearch(initialQuery);
    }
  }, [initialQuery]);

const doSearch = (q) => {
    const key = q.trim().toLowerCase();
    if (!key) return;
    setSuggestions([]);
    const entry = DICTIONARY[key];
    if (entry) {
      setResult(entry);
      setNotFound(false);
    } else {
      setResult(null);
      setNotFound(true);
    }
  };

  const handleInputChange = (value) => {
    setQuery(value);
    if (value.trim()) {
      const matches = allKeys.filter((w) => w.startsWith(value.trim().toLowerCase()));
      setSuggestions(matches.slice(0, 8)); // Hiện tối đa 8 gợi ý
    } else {
      setSuggestions([]);
    }
  };

  const handleSave = (folderId, word) => {
    onSaveFolders((prev) =>
      prev.map((f) =>
        f.id === folderId && !f.words.includes(word)
          ? { ...f, words: [...f.words, word] }
          : f
      )
    );
  };

  const handleCreate = (name, color) => {
    const id = Date.now();
    onSaveFolders((prev) => [...prev, { id, name, color, words: [] }]);
    return id;
  };

  return (
    <div>
            {/* Hero search box - To, giữa, Autocomplete */}
      <div style={{ maxWidth: "700px", margin: "0 auto 24px", position: "relative" }}>
        <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "8px 10px", alignItems: "center" }}>
          <span style={{ fontSize: "20px", marginLeft: "10px" }}>🔍</span>
          <input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doSearch(query); }}
            placeholder="Nhập từ tiếng Anh để tra cứu..."
            style={{
              flex: 1, border: "none", background: "transparent", outline: "none",
              fontSize: "18px", color: "#f8faff", fontFamily: "Inter, sans-serif",
            }}
          />
          <button
            onClick={() => doSearch(query)}
            style={{
              background: "linear-gradient(135deg,#6366f1,#818cf8)", border: "none",
              borderRadius: "12px", padding: "10px 24px", color: "#fff",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Tra cứu
          </button>
        </div>

        {/* Dropdown gợi ý */}
        {suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "110%", left: 0, right: 0,
            background: "#0e1130", border: "0.8px solid rgba(255,255,255,0.1)",
            borderRadius: "16px", boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            zIndex: 10, overflow: "hidden",
          }}>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); doSearch(s); }}
                style={{
                  display: "block", width: "100%", padding: "12px 18px",
                  background: "transparent", border: "none", textAlign: "left",
                  color: "#a5b4fc", fontSize: "15px", cursor: "pointer", fontFamily: "Outfit, sans-serif",
                  borderBottom: "0.8px solid rgba(255,255,255,0.04)",
                }}
                onMouseEnter={(e) => { e.target.style.background = "rgba(99,102,241,0.1)"; }}
                onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "22px" }}>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: "12px", color: "#475569", marginBottom: "10px" }}>
          Tra nhanh:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.keys(DICTIONARY).map((w) => (
            <button
              key={w}
              onClick={() => { setQuery(w); doSearch(w); }}
              style={{
                background: "rgba(99,102,241,0.08)", border: "0.8px solid rgba(99,102,241,0.2)",
                borderRadius: "20px", padding: "6px 14px",
                color: "#a5b4fc", fontSize: "13px", fontFamily: "Inter,sans-serif",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.target.style.background = "rgba(99,102,241,0.18)"; }}
              onMouseLeave={(e) => { e.target.style.background = "rgba(99,102,241,0.08)"; }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <DictCard
          entry={result}
          onOpenSave={() => setSaveModal(true)}
        />
      )}

      {notFound && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          animation: "fadeSlideIn 0.3s ease",
        }}>
          <p style={{ fontSize: "48px", marginBottom: "12px" }}>🔎</p>
          <p style={{ fontFamily: "Outfit,sans-serif", fontSize: "20px", fontWeight: 700, color: "#e2e8f0", marginBottom: "8px" }}>
            Không tìm thấy từ này
          </p>
          <p style={{ fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
            Hãy thử tra một trong các từ gợi ý bên dưới
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
            {Object.keys(DICTIONARY).slice(0, 5).map((w) => (
              <button
                key={w}
                onClick={() => { setQuery(w); doSearch(w); }}
                style={{
                  background: "rgba(99,102,241,0.1)", border: "0.8px solid rgba(99,102,241,0.25)",
                  borderRadius: "20px", padding: "7px 16px",
                  color: "#a5b4fc", fontSize: "13.5px", fontFamily: "Inter,sans-serif",
                  cursor: "pointer",
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {saveModal && result && (
        <SaveModal
          wordOrText={result.word}
          folders={folders}
          onSave={handleSave}
          onClose={() => setSaveModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ─── Tab 2: Dịch văn bản ───

function DichTab({ folders, onSaveFolders }) {
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("vi");
  const [srcText, setSrcText] = useState("");
  const [tgtText, setTgtText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveModal, setSaveModal] = useState(null); // "src" | "tgt" | null
  const timerRef = useRef(null);

  const translate = useCallback((text, lang) => {
    if (!text.trim()) { setTgtText(""); setLoading(false); return; }
    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const res = mockTranslate(text, lang);
      setTgtText(res);
      setLoading(false);
    }, 600);
  }, []);

  const handleSrcChange = (val) => {
    setSrcText(val);
    translate(val, srcLang);
  };

  const handleSwap = () => {
    const newSrc = tgtLang;
    const newTgt = srcLang;
    const newSrcText = tgtText;
    const newTgtText = srcText;
    setSrcLang(newSrc);
    setTgtLang(newTgt);
    setSrcText(newSrcText);
    setTgtText(newTgtText);
    translate(newSrcText, newSrc);
  };

  const handleSave = (folderId, word) => {
    onSaveFolders((prev) =>
      prev.map((f) =>
        f.id === folderId && !f.words.includes(word)
          ? { ...f, words: [...f.words, word] }
          : f
      )
    );
  };

  const handleCreate = (name, color) => {
    const id = Date.now();
    onSaveFolders((prev) => [...prev, { id, name, color, words: [] }]);
    return id;
  };

  const langLabel = { en: "🇺🇸 EN", vi: "🇻🇳 VI" };

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
        borderRadius: "14px", padding: "12px 18px", marginBottom: "16px",
      }}>
        {["en", "vi"].map((l) => (
          <button
            key={l}
            onClick={() => { if (srcLang !== l) { setSrcLang(l); translate(srcText, l); } }}
            style={{
              background: srcLang === l ? "rgba(99,102,241,0.2)" : "transparent",
              border: srcLang === l ? "0.8px solid rgba(99,102,241,0.5)" : "0.8px solid transparent",
              borderRadius: "10px", padding: "7px 16px",
              color: srcLang === l ? "#a5b4fc" : "#64748b",
              fontFamily: "Outfit,sans-serif", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {langLabel[l]}
          </button>
        ))}

        <button
          onClick={handleSwap}
          style={{
            background: "rgba(255,255,255,0.05)", border: "0.8px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "7px 14px", cursor: "pointer",
            color: "#94a3b8", fontSize: "16px", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#a5b4fc")}
          onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
        >
          ⇄
        </button>

        {["en", "vi"].map((l) => (
          <button
            key={l}
            onClick={() => { if (tgtLang !== l) setTgtLang(l); }}
            style={{
              background: tgtLang === l ? "rgba(16,185,129,0.15)" : "transparent",
              border: tgtLang === l ? "0.8px solid rgba(16,185,129,0.4)" : "0.8px solid transparent",
              borderRadius: "10px", padding: "7px 16px",
              color: tgtLang === l ? "#34d399" : "#64748b",
              fontFamily: "Outfit,sans-serif", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {langLabel[l]}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "18px", display: "flex", flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontFamily: "Outfit,sans-serif", fontSize: "12px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.5px" }}>
              {langLabel[srcLang]}
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {srcText && (
                <>
                  <button
                    onClick={() => setSaveModal("src")}
                    style={{
                      background: "rgba(99,102,241,0.1)", border: "0.8px solid rgba(99,102,241,0.25)",
                      borderRadius: "8px", padding: "3px 10px",
                      color: "#a5b4fc", fontSize: "12px", cursor: "pointer",
                      fontFamily: "Inter,sans-serif",
                    }}
                  >💾 Lưu</button>
                  <button
                    onClick={() => { setSrcText(""); setTgtText(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: "14px" }}
                  >✕</button>
                </>
              )}
              <button
                onClick={() => speak(srcText)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "14px" }}
              >🔊</button>
            </div>
          </div>
          <textarea
            value={srcText}
            onChange={(e) => handleSrcChange(e.target.value)}
            placeholder="Nhập văn bản cần dịch..."
            style={{
              flex: 1, minHeight: "160px", resize: "none",
              background: "transparent", border: "none", outline: "none",
              fontFamily: "Inter,sans-serif", fontSize: "15px", color: "#e2e8f0",
              lineHeight: 1.6,
            }}
          />
          <div style={{ textAlign: "right", fontFamily: "Inter,sans-serif", fontSize: "11px", color: "#334155", marginTop: "8px" }}>
            {srcText.length} ký tự
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "18px", display: "flex", flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontFamily: "Outfit,sans-serif", fontSize: "12px", fontWeight: 700, color: "#34d399", letterSpacing: "0.5px" }}>
              {langLabel[tgtLang]}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {tgtText && (
                <button
                  onClick={() => setSaveModal("tgt")}
                  style={{
                    background: "rgba(99,102,241,0.1)", border: "0.8px solid rgba(99,102,241,0.25)",
                    borderRadius: "8px", padding: "3px 10px",
                    color: "#a5b4fc", fontSize: "12px", cursor: "pointer",
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  💾 Lưu
                </button>
              )}
              <button
                onClick={() => speak(tgtText)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "14px" }}
              >🔊</button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: "160px" }}>
            {loading ? (
              <LoadingDots />
            ) : tgtText ? (
              <p style={{
                fontFamily: "Inter,sans-serif", fontSize: "15px", color: "#e2e8f0",
                lineHeight: 1.6, margin: 0, animation: "fadeSlideIn 0.25s ease",
              }}>
                {tgtText}
              </p>
            ) : (
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#334155", fontStyle: "italic" }}>
                Bản dịch sẽ hiện ở đây...
              </p>
            )}
          </div>
        </div>
      </div>

      {saveModal === "src" && srcText && (
        <SaveModal
          wordOrText={srcText.slice(0, 60) + (srcText.length > 60 ? "…" : "")}
          folders={folders}
          onSave={handleSave}
          onClose={() => setSaveModal(null)}
          onCreate={handleCreate}
        />
      )}
      {saveModal === "tgt" && tgtText && (
        <SaveModal
          wordOrText={tgtText.slice(0, 60) + (tgtText.length > 60 ? "…" : "")}
          folders={folders}
          onSave={handleSave}
          onClose={() => setSaveModal(null)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ─── Tab 3: Thư mục (thêm nút xóa từ) ───


// ─── Main DictionaryPage ───

export default function DictionaryPage({ initialQuery = "", onQueryUsed }) {
  const [activeTab, setActiveTab] = useState(0);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [externalQuery, setExternalQuery] = useState(initialQuery);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setExternalQuery(initialQuery);
      setActiveTab(0);
      if (onQueryUsed) onQueryUsed();
    }
  }, [initialQuery]);

  const handleRemoveWord = (folderId, word) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, words: f.words.filter((w) => w !== word) }
          : f
      )
    );
  };

  const tabs = [
    { label: "🔍 Tra từ", component: <TraTuTab folders={folders} onSaveFolders={setFolders} initialQuery={externalQuery} /> },
    { label: "🌐 Dịch văn bản", component: <DichTab folders={folders} onSaveFolders={setFolders} /> },
  ];
    return (
    <div
      className="dict-page"
      style={{
        minHeight: "100vh", background: "#07091a",
        padding: "0 0 60px", position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow blobs */}
      <div style={{
        position: "fixed", top: "-160px", left: "-160px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-120px", right: "-120px",
        width: "420px", height: "420px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "36px 20px 0" }}>
        {/* Page title */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "Outfit,sans-serif", fontSize: "32px", fontWeight: 900,
            color: "#f8faff", margin: "0 0 6px",
            background: "linear-gradient(135deg,#a5b4fc,#818cf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Từ điển &amp; Dịch thuật
          </h1>
          <p style={{ fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#475569", margin: 0 }}>
            Tra cứu, dịch văn bản và quản lý từ vựng của bạn
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: "6px",
          background: "rgba(255,255,255,0.025)",
          border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "14px", padding: "5px",
          marginBottom: "24px",
        }}>
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                flex: 1, padding: "10px 8px",
                background: activeTab === i
                  ? "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(129,140,248,0.18))"
                  : "transparent",
                border: activeTab === i
                  ? "0.8px solid rgba(99,102,241,0.35)"
                  : "0.8px solid transparent",
                borderRadius: "10px", cursor: "pointer",
                fontFamily: "Outfit,sans-serif", fontSize: "13.5px", fontWeight: activeTab === i ? 700 : 500,
                color: activeTab === i ? "#a5b4fc" : "#64748b",
                transition: "all 0.18s", whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div key={activeTab} style={{ animation: "fadeSlideIn 0.28s ease" }}>
          {tabs[activeTab].component}
        </div>
      </div>
    </div>
  );
}


