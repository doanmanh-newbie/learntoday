// src/pages/dictionary/WordDetailPage.jsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DICTIONARY } from "../data/dictionary";

function speak(text, lang = "en-US") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  window.speechSynthesis.speak(utt);
}

export default function WordDetailPage() {
  const { word } = useParams(); // Lấy từ khóa từ URL
  const entry = DICTIONARY[word]; // Tìm dữ liệu từ

  const [activeTab, setActiveTab] = useState("anh-viet");

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
          <button onClick={() => speak(entry.word, "en-GB")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", color: "#94a3b8" }}>🔊 UK</button>
          <button onClick={() => speak(entry.word, "en-US")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", color: "#94a3b8" }}>🔊 US</button>
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
    </div>
  );
}