// src/components/sections/dashboard/ReviewLanding.jsx
import { useNavigate } from "react-router-dom";

const SRS_SECONDS = { 1: 20 * 60, 2: 10 * 3600, 3: 86400, 4: 3 * 86400, 5: 7 * 86400, 6: 5 * 86400 };
const SRS_INTERVAL_LABEL = { 1: "20 phút", 2: "10 giờ", 3: "1 ngày", 4: "3 ngày", 5: "7 ngày", 6: "5 ngày" };
const SRS_TRANSITION = { 1: "LV1 → LV2", 2: "LV2 → LV3", 3: "LV3 → LV4", 4: "LV4 → LV5", 5: "LV5 → LV6", 6: "LV6 ✓" };
const LV_COLORS = { 1: "#10b981", 2: "#06b6d4", 3: "#a5b4fc", 4: "#fbbf24", 5: "#f97316", 6: "#f43f5e" };

function formatNextReview(ms) {
  const d = new Date(ms);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.floor(diffMs / 86400000);
  const timeStr = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  if (diffDays === 0) return `${timeStr} hôm nay`;
  if (diffDays === 1) return `${timeStr} ngày mai`;
  return `${timeStr}, ${dateStr}`;
}

export default function ReviewLanding({ dueWords = [], onReview, onGoLearn }) {
  const navigate = useNavigate();

  // Group by level for schedule
  const byLevel = {};
  dueWords.forEach(w => {
    const lv = w.lv || 1;
    if (!byLevel[lv]) byLevel[lv] = [];
    byLevel[lv].push(w);
  });

  const now = Date.now();
  const schedule = Object.entries(byLevel)
    .map(([lv, words]) => {
      const lvNum = Number(lv);
      return { lv: lvNum, count: words.length, nextMs: now + SRS_SECONDS[lvNum] * 1000 };
    })
    .sort((a, b) => a.nextMs - b.nextMs);

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#07091a", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "fixed", right: "-80px", top: "60px", width: "480px", height: "480px",
        borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontSize: "26px", fontWeight: 800, marginBottom: "6px",
              background: "linear-gradient(120deg,#e8eaf6 0%,#fbbf24 50%,#e8eaf6 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>🔁 Ôn tập hôm nay</h1>
            <p style={{ fontSize: "14px", color: "#5a6a8a" }}>Ôn lại từ đã học để củng cố và tăng cấp độ ghi nhớ</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "48px",
                color: "#fbbf24", lineHeight: 1, marginBottom: "2px" }}>{dueWords.length}</p>
              <p style={{ fontSize: "12px", color: "#8892b0" }}>từ cần ôn</p>
            </div>
            <button
              onClick={onReview}
              disabled={dueWords.length === 0}
              style={{
                padding: "13px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: 800,
                fontFamily: "Outfit, sans-serif", border: "none",
                cursor: dueWords.length > 0 ? "pointer" : "not-allowed",
                background: dueWords.length > 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(255,255,255,0.06)",
                color: dueWords.length > 0 ? "#fff" : "#5a6a8a",
                boxShadow: dueWords.length > 0 ? "0 0 24px rgba(245,158,11,0.4)" : "none",
              }}>Bắt đầu ôn →</button>
          </div>
        </div>

        {/* Two-column body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>

          {/* Word list */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
              Danh sách từ ({dueWords.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px",
              maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
              {dueWords.length === 0 && (
                <div style={{ padding: "24px", borderRadius: "12px", textAlign: "center",
                  background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontSize: "14px", color: "#5a6a8a" }}>Chưa có từ nào cần ôn.</p>
                  <p style={{ fontSize: "12px", color: "#3d4a66", marginTop: "4px" }}>Học từ mới trước nhé!</p>
                  {onGoLearn && (
                    <button onClick={onGoLearn} style={{
                      marginTop: "12px", padding: "8px 20px", borderRadius: "9px",
                      fontSize: "13px", fontWeight: 700,
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
                      border: "none", cursor: "pointer", fontFamily: "Outfit, sans-serif",
                    }}>📖 Học từ mới</button>
                  )}
                </div>
              )}
              {dueWords.map(w => (
                <div 
                  key={w.id} 
                  onClick={() => navigate(`/app/dictionary/${encodeURIComponent(w.word)}`)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: "10px",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.03)", 
                    border: "0.8px solid rgba(255,255,255,0.07)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.background = "rgba(99,102,241,0.08)"; 
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; 
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)"; 
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; 
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "7px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700,
                        fontSize: "15px", color: "#e8eaf6" }}>{w.word}</span>
                      <span style={{ fontSize: "11px", color: "#5a6a8a" }}>{w.phonetic}</span>
                      <span style={{ fontSize: "10px", color: "#8892b0", padding: "1px 5px", borderRadius: "4px",
                        background: "rgba(255,255,255,0.05)" }}>({w.pos})</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#8892b0", marginTop: "2px" }}>{w.meaning}</p>
                  </div>
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px", flexShrink: 0, marginLeft: "10px",
                    background: `${LV_COLORS[w.lv]}22`, color: LV_COLORS[w.lv],
                    border: `0.8px solid ${LV_COLORS[w.lv]}44`,
                  }}>LV{w.lv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SRS Schedule */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
              Lịch ôn tập sắp tới
            </p>

            <div style={{
              padding: "16px 18px", borderRadius: "14px", marginBottom: "10px",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#fbbf24",
                  fontFamily: "Outfit, sans-serif" }}>⏰ Cần ôn ngay</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#fbbf24",
                  fontFamily: "Outfit, sans-serif" }}>{dueWords.length}</span>
              </div>
              <p style={{ fontSize: "11px", color: "#92400e" }}>Tất cả các level đã đến hạn</p>
            </div>

            <p style={{ fontSize: "11px", color: "#5a6a8a", marginBottom: "8px" }}>
              Sau khi ôn xong hôm nay:
            </p>

            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: "12px", top: "8px",
                bottom: "8px", width: "1px",
                background: "rgba(255,255,255,0.07)",
              }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {schedule.map(({ lv, count, nextMs }) => (
                  <div key={lv} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{
                      width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0, marginTop: "14px",
                      background: LV_COLORS[lv], boxShadow: `0 0 8px ${LV_COLORS[lv]}88`,
                      position: "relative", zIndex: 1,
                    }} />
                    <div style={{
                      flex: 1, padding: "11px 14px", borderRadius: "11px",
                      background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#e8eaf6",
                          fontFamily: "Outfit, sans-serif" }}>{SRS_TRANSITION[lv]}</span>
                        <span style={{
                          fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px",
                          background: `${LV_COLORS[lv]}20`, color: LV_COLORS[lv],
                          border: `0.8px solid ${LV_COLORS[lv]}44`,
                        }}>{count} từ</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#5a6a8a" }}>+{SRS_INTERVAL_LABEL[lv]}</span>
                        <span style={{ fontSize: "10px", color: "#3d4a66" }}>·</span>
                        <span style={{ fontSize: "11px", color: "#8892b0" }}>{formatNextReview(nextMs)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {schedule.length === 0 && (
                  <p style={{ fontSize: "13px", color: "#3d4a66", padding: "12px 0" }}>
                    Chưa có lịch ôn tập.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}