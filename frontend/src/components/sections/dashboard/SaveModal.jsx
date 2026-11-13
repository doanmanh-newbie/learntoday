// src/components/sections/dashboard/SaveModal.jsx
import { useState, useEffect, useRef } from "react";

const FOLDER_COLORS = [
  "#14b8a6", "#86a24d", "#ef4444", "#2dd4bf",
  "#14b8a6", "#ef4444", "#f87171", "#a3bd6a",
];

export default function SaveModal({ wordOrText, folders, onSave, onClose, onCreate }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const handleSave = async (folderId) => {
    setSaving(true);
    setError("");
    try {
      await onSave(folderId, wordOrText);
      setSaved(folderId);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err.message || "Không lưu được từ vào folder.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const created = await onCreate(newName.trim(), newColor);
      const id = typeof created === "object" ? created.id : created;
      await onSave(id, wordOrText);
      setSaved(id);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err.message || "Không tạo/lưu được folder.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(17,19,20,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "overlayIn 0.18s ease",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(420px, 92vw)", background: "#161a1d",
        border: "0.8px solid rgba(255,255,255,0.1)",
        borderRadius: "20px", padding: "28px",
        animation: "modalIn 0.22s ease",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <p style={{ fontFamily: "Outfit,sans-serif", fontSize: "18px", fontWeight: 700, color: "#f4f6f7", margin: 0 }}>
            💾 Lưu vào thư mục
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#a2acb3", fontSize: "20px", lineHeight: 1, padding: "2px 6px" }}>✕</button>
        </div>

        <p style={{ fontSize: "12px", color: "#848f97", marginBottom: "12px", fontFamily: "Inter,sans-serif" }}>
          Lưu: <span style={{ color: "#5eead4", fontStyle: "italic" }}>"{wordOrText}"</span>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
          {folders.map((f) => (
            <button key={f.id} onClick={() => handleSave(f.id)} disabled={saved !== null || saving} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px",
              background: saved === f.id ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.03)",
              border: saved === f.id ? "0.8px solid #14b8a6" : "0.8px solid rgba(255,255,255,0.07)",
              borderRadius: "12px", cursor: saved !== null ? "default" : "pointer",
              transition: "all 0.15s",
            }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: f.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#dde2e5", textAlign: "left" }}>{f.name}</span>
              <span style={{ fontSize: "12px", color: "#6b747c" }}>{f.words.length} từ</span>
              {saved === f.id && <span style={{ fontSize: "16px" }}>✅</span>}
            </button>
          ))}
        </div>

        {error && <p role="alert" style={{ color: "#f87171", fontSize: 12, marginTop: 10 }}>{error}</p>}

        <button onClick={() => setCreating((p) => !p)} disabled={saving} style={{
          marginTop: "14px", width: "100%", padding: "10px 16px",
          background: "rgba(20,184,166,0.08)",
          border: "0.8px dashed rgba(20,184,166,0.4)",
          borderRadius: "12px", cursor: "pointer",
          fontFamily: "Inter,sans-serif", fontSize: "13px", color: "#5eead4",
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
                padding: "10px 14px", color: "#f4f6f7", fontSize: "14px",
                fontFamily: "Inter,sans-serif", outline: "none",
                boxSizing: "border-box", marginBottom: "12px",
              }} />
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {FOLDER_COLORS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)} style={{
                  width: "26px", height: "26px", borderRadius: "50%",
                  background: c, border: newColor === c ? "2.5px solid #ffffff" : "2.5px solid transparent",
                  cursor: "pointer", flexShrink: 0, padding: 0,
                  transition: "transform 0.12s",
                  transform: newColor === c ? "scale(1.15)" : "scale(1)",
                }} />
              ))}
            </div>
            <button onClick={handleCreate} style={{
              width: "100%", padding: "10px",
              background: "linear-gradient(135deg,#0f766e,#0e8077)",
              border: "none", borderRadius: "10px",
              color: "#ffffff", fontSize: "14px", fontWeight: 600,
              fontFamily: "Outfit,sans-serif", cursor: "pointer",
            }}>{saving ? "Đang lưu..." : "Tạo &amp; lưu"}</button>
          </div>
        )}
      </div>
    </div>
  );
}