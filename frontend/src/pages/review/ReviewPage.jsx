// src/pages/review/ReviewPage.jsx

import { useState } from "react";
import { FOLDER_DATA } from "../../data/vocabulary";
import { LearningSession } from "../../features/learning/LearningSession";
import { 
  SRS_SECONDS, 
  SRS_INTERVAL_LABEL, 
  SRS_TRANSITION, 
  LV_COLORS,
  formatNextReview 
} from '../../constants/srs';

function NoReviewScreen({ onNavigateHome, onGoLearn }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '24px'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
      <h2 style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: '28px',
        fontWeight: 800,
        color: '#e8eaf6',
        marginBottom: '8px'
      }}>
        Chúc mừng!
      </h2>
      <p style={{
        fontSize: '16px',
        color: '#8892b0',
        marginBottom: '24px'
      }}>
        Hôm nay bạn không có từ nào cần ôn tập!
      </p>
      <p style={{
        fontSize: '14px',
        color: '#5a6a8a',
        marginBottom: '32px'
      }}>
        Hãy học từ mới để duy trì đà nhé!
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onGoLearn}
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'Outfit, sans-serif',
            border: 'none',
            cursor: 'pointer',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: '#fff',
            boxShadow: '0 0 24px rgba(99,102,241,0.4)'
          }}
        >
          📖 Học từ mới
        </button>
        <button
          onClick={onNavigateHome}
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: 'Outfit, sans-serif',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            background: 'transparent',
            color: '#8892b0'
          }}
        >
          🏠 Về trang chính
        </button>
      </div>
    </div>
  );
}

export default function ReviewPage({ onNavigateHome, onGoLearn }) {
  const [screen, setScreen] = useState("overview");
  const [reviewed, setReviewed] = useState(0);

  const allDueWords = FOLDER_DATA.flatMap(f => 
    f.words.filter(w => w.lv > 0 && w.next_review <= Date.now())
  );
  
  // Nếu không có từ cần ôn
  if (allDueWords.length === 0) {
    return <NoReviewScreen onNavigateHome={onNavigateHome} onGoLearn={onGoLearn} />;
  }

  const virtualFolder = { 
    id: 0, 
    name: "Ôn tập", 
    color: "#f59e0b", 
    image: "", 
    words: allDueWords 
  };

  // Group by level for schedule
  const byLevel = {};
  allDueWords.forEach(w => {
    if (!byLevel[w.lv]) byLevel[w.lv] = [];
    byLevel[w.lv].push(w);
  });

  const now = Date.now();
  const schedule = Object.entries(byLevel)
    .map(([lv, words]) => {
      const lvNum = Number(lv);
      return { lv: lvNum, count: words.length, nextMs: now + SRS_SECONDS[lvNum] * 1000 };
    })
    .sort((a, b) => a.nextMs - b.nextMs);

  if (screen === "session") {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "#07091a" }}>
        <LearningSession
          folder={virtualFolder} 
          mode="review"
          dailyGoal={allDueWords.length}
          wordsLearned={reviewed}
          onWordComplete={() => setReviewed(r => r + 1)}
          onBack={() => setScreen("overview")}
        />
        <style>{`
          @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          input::placeholder { color:#3d4a66; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#07091a", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "fixed", right: "-80px", top: "60px", width: "480px", height: "480px",
        borderRadius: "50%", background: "radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontSize: "26px", fontWeight: 800, marginBottom: "6px",
              background: "linear-gradient(120deg,#e8eaf6 0%,#fbbf24 50%,#e8eaf6 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>🔁 Ôn tập hôm nay</h1>
            <p style={{ fontSize: "14px", color: "#5a6a8a" }}>Ôn lại từ đã học để củng cố và tăng cấp độ ghi nhớ</p>
          </div>

          {/* Big count + CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "48px",
                color: "#fbbf24", lineHeight: 1, marginBottom: "2px" }}>{allDueWords.length}</p>
              <p style={{ fontSize: "12px", color: "#8892b0" }}>từ cần ôn</p>
            </div>
            <button
              onClick={() => setScreen("session")}
              disabled={allDueWords.length === 0}
              style={{
                padding: "13px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: 800,
                fontFamily: "Outfit, sans-serif", border: "none",
                cursor: allDueWords.length > 0 ? "pointer" : "not-allowed",
                background: allDueWords.length > 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(255,255,255,0.06)",
                color: allDueWords.length > 0 ? "#fff" : "#5a6a8a",
                boxShadow: allDueWords.length > 0 ? "0 0 24px rgba(245,158,11,0.4)" : "none",
              }}>Bắt đầu ôn →</button>
          </div>
        </div>

        {/* Progress (if mid-session) */}
        {reviewed > 0 && (
          <div style={{ marginBottom: "24px", padding: "16px 20px", borderRadius: "14px",
            background: "rgba(245,158,11,0.06)", border: "0.8px solid rgba(245,158,11,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#8892b0" }}>Tiến độ hôm nay</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fbbf24" }}>{reviewed} / {allDueWords.length}</span>
            </div>
            <div style={{ height: "5px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)" }}>
              <div style={{
                width: `${Math.min((reviewed / allDueWords.length) * 100, 100)}%`,
                height: "100%", borderRadius: "9999px",
                background: "linear-gradient(90deg,#f59e0b,#10b981)", transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        )}

        {/* ── Two-column body ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>

          {/* Word list */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
              Danh sách từ ({allDueWords.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px",
              maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
              {allDueWords.map(w => (
                <div key={w.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)",
                }}>
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

            {/* Due now card */}
            <div style={{
              padding: "16px 18px", borderRadius: "14px", marginBottom: "10px",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#fbbf24",
                  fontFamily: "Outfit, sans-serif" }}>⏰ Cần ôn ngay</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#fbbf24",
                  fontFamily: "Outfit, sans-serif" }}>{allDueWords.length}</span>
              </div>
              <p style={{ fontSize: "11px", color: "#92400e" }}>Tất cả các level đã đến hạn</p>
            </div>

            <p style={{ fontSize: "11px", color: "#5a6a8a", marginBottom: "8px" }}>
              Sau khi ôn xong hôm nay:
            </p>

            {/* Timeline */}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color:#3d4a66; }
      `}</style>
    </div>
  );
}