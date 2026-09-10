// src/components/sections/dashboard/SaveModal.jsx
import { useState, useEffect, useRef } from "react";

const FOLDER_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#f43f5e", "#fb923c", "#34d399",
];

export default function SaveModal({ wordOrText, folders, onSave, onClose, onCreate }) {
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
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(7,9,26,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "overlayIn 0.18s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(420px, 92vw)", background: "#0e1130",
        border: "0.8px solid rgba(255,255,255,0.1)",
        borderRadius: "20px", padding: "28px",
        animation: "modalIn 0.22s ease",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}>
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
            <button key={f.id} onClick={() => handleSave(f.id)} disabled={saved !== null} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px",
              background: saved === f.id ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
              border: saved === f.id ? "0.8px solid #6366f1" : "0.8px solid rgba(255,255,255,0.07)",
              borderRadius: "12px", cursor: saved !== null ? "default" : "pointer",
              transition: "all 0.15s",
            }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: f.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#e2e8f0", textAlign: "left" }}>{f.name}</span>
              <span style={{ fontSize: "12px", color: "#475569" }}>{f.words.length} từ</span>
              {saved === f.id && <span style={{ fontSize: "16px" }}>✅</span>}
            </button>
          ))}
        </div>

        <button onClick={() => setCreating((p) => !p)} style={{
          marginTop: "14px", width: "100%", padding: "10px 16px",
          background: "rgba(99,102,241,0.08)",
          border: "0.8px dashed rgba(99,102,241,0.4)",
          borderRadius: "12px", cursor: "pointer",
          fontFamily: "Inter,sans-serif", fontSize: "13px", color: "#a5b4fc",
        }}>
          {creating ? "▾ Ẩn" : "＋ Tạo thư mục mới"}
        </button>

        {creating && (
          <div style={{ marginTop: "12px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "0.8px solid rgba(255,255,255,0.07)" }}>
            <input ref={inputRef} value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder="Tên thư mục..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.06)",
                border: "0.8px solid rgba(255,255,255,0.1)", borderRadius: "10px",
                padding: "10px 14px", color: "#f8faff", fontSize: "14px",
                fontFamily: "Inter,sans-serif", outline: "none",
                boxSizing: "border-box", marginBottom: "12px",
              }} />
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {FOLDER_COLORS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)} style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: c, border: newColor === c ? "2.5px solid #fff" : "2.5px solid transparent",
                  cursor: "pointer", flexShrink: 0, padding: 0,
                  transition: "transform 0.12s",
                  transform: newColor === c ? "scale(1.15)" : "scale(1)",
                }} />
              ))}
            </div>
            <button onClick={handleCreate} style={{
              width: "100%", padding: "10px",
              background: "linear-gradient(135deg,#6366f1,#818cf8)",
              border: "none", borderRadius: "10px",
              color: "#fff", fontSize: "14px", fontWeight: 600,
              fontFamily: "Outfit,sans-serif", cursor: "pointer",
            }}>Tạo &amp; lưu</button>
          </div>
        )}
      </div>
    </div>
  );
}