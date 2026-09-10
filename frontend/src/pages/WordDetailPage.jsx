// src/pages/WordDetailPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { DICTIONARY } from "../data/dictionary";
import SaveModal from "../components/sections/dashboard/SaveModal";

function speak(text, lang = "en-US") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  window.speechSynthesis.speak(utt);
}

const INITIAL_FOLDERS = [
  { id: 1, name: "Công việc", color: "#6366f1", words: [] },
  { id: 2, name: "Học thuật", color: "#10b981", words: [] },
  { id: 3, name: "Phẩm chất", color: "#f59e0b", words: [] },
  { id: 4, name: "Công nghệ", color: "#8b5cf6", words: [] },
  { id: 5, name: "Giao tiếp", color: "#06b6d4", words: [] },
];

export default function WordDetailPage({ word }) {
  const entry = DICTIONARY[word];

  const [activeTab, setActiveTab] = useState("anh-viet");
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [showSave, setShowSave] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (folderId, w) => {
    setFolders(prev => prev.map(f =>
      f.id === folderId && !f.words.includes(w)
        ? { ...f, words: [...f.words, w] } : f
    ));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleCreate = (name, color) => {
    const id = Date.now();
    setFolders(prev => [...prev, { id, name, color, words: [] }]);
    return id;
  };

  if (!entry) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
        <h2>Không tìm thấy từ "{word}"</h2>
        <Link to="/app" style={{ color: "#a5b4fc" }}>Quay về trang chủ</Link>
      </div>
    );
  }

  const tabs = [
    { id: "anh-viet", label: "ANH - VIỆT" },
    { id: "ngu-phap", label: "NGỮ PHÁP" },
    { id: "anh-anh", label: "ANH - ANH" },
    { id: "chuyen-nganh", label: "CHUYÊN NGÀNH" },
  ];

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>

      {/* Nút quay lại */}
      <div style={{ marginBottom: "16px" }}>
        <Link to="/app/dictionary" style={{ color: "#a5b4fc", textDecoration: "none", fontSize: "14px" }}>
          ← Quay lại từ điển
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid rgba(255,255,255,0.1)", overflowX: "auto" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === t.id ? "3px solid #6366f1" : "3px solid transparent",
              color: activeTab === t.id ? "#fff" : "#64748b",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chips từ loại */}
      <div style={{ padding: "16px 0 8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {entry.pos.map((block, i) => (
          <span key={i} style={{ padding: "6px 14px", borderRadius: "20px", border: "1.5px solid #6366f1", color: "#6366f1", fontSize: "14px", fontWeight: 600 }}>
            {block.type}
          </span>
        ))}
      </div>

      {/* Header từ */}
      <div style={{ padding: "8px 0 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
          <h2 style={{ color: "#fff", fontSize: "36px", fontWeight: 900, margin: 0 }}>{entry.word}</h2>
          <span style={{ color: "#94a3b8", fontSize: "18px" }}>{entry.phonetic}</span>

          <button onClick={() => speak(entry.word, "en-GB")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", color: "#94a3b8" }}>🔊</button>
          <button onClick={() => speak(entry.word, "en-US")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", color: "#94a3b8" }}>🔊</button>

          {/* ✅ NÚT LƯU VÀO THƯ MỤC */}
          <button
            onClick={() => setShowSave(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "10px",
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.35)",
              color: "#a5b4fc", fontSize: "14px", fontWeight: 600,
              fontFamily: "'Inter',sans-serif", cursor: "pointer",
              marginLeft: "auto",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}
          >
            💾 Lưu vào thư mục
          </button>
        </div>
      </div>

      {/* Nội dung theo tab */}
      <div>
        {activeTab === "anh-viet" && (
          <>
            {entry.pos.map((block, bi) => (
              <div key={bi} style={{ marginBottom: "24px" }}>
                <p style={{ color: "#fff", fontSize: "20px", fontWeight: 800, margin: "0 0 12px" }}>{block.type}</p>
                {block.defs.map((d, di) => (
                  <div key={di} style={{ marginBottom: "12px" }}>
                    <p style={{ color: "#a855f7", fontSize: "15px", margin: "0 0 4px", fontStyle: "italic" }}>✧ {d.vi}</p>
                    {d.example && (
                      <div style={{ marginLeft: "20px" }}>
                        <p style={{ color: "#3b82f6", fontSize: "14px", margin: "0 0 2px", fontWeight: 500 }}>{d.example}</p>
                        <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0" }}>{d.example_vi || ""}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {entry.collocations?.length > 0 && (
              <div>
                <p style={{ color: "#fbbf24", fontSize: "18px", fontWeight: 800, margin: "0 0 12px" }}>Thành ngữ / Cụm từ</p>
                {entry.collocations.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ color: "#fbbf24" }}>▸</span>
                    <span style={{ color: "#e8eaf6" }}>{c}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "anh-anh" && (
          <>
            {entry.pos.map((block, bi) => (
              <div key={bi} style={{ marginBottom: "20px" }}>
                <p style={{ color: "#fff", fontSize: "18px", fontWeight: 800, margin: "0 0 8px" }}>{block.type}</p>
                {block.defs.map((d, di) => (
                  <p key={di} style={{ color: "#e8eaf6", fontSize: "15px", margin: "0 0 8px", lineHeight: 1.6 }}>{di + 1}. {d.def}</p>
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {/* ✅ SaveModal */}
      {showSave && (
        <SaveModal
          wordOrText={entry.word}
          folders={folders}
          onSave={handleSave}
          onClose={() => setShowSave(false)}
          onCreate={handleCreate}
        />
      )}

      {/* ✅ Toast thành công */}
      {savedToast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          padding: "12px 24px", borderRadius: "12px",
          background: "rgba(16,185,129,0.15)",
          border: "1px solid rgba(16,185,129,0.4)",
          color: "#10b981", fontSize: "14px", fontWeight: 600,
          fontFamily: "'Outfit',sans-serif",
          boxShadow: "0 8px 24px rgba(16,185,129,0.25)",
          animation: "fadeSlideIn 0.3s ease",
          zIndex: 2000,
        }}>
          ✅ Đã lưu "{entry.word}" vào thư mục
        </div>
      )}

      <style>{`
        @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
        @keyframes modalIn { from { opacity:0; transform: scale(0.93) translateY(20px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes fadeSlideIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}