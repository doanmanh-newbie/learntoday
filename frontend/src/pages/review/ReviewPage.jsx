// src/pages/review/ReviewPage.jsx
import { useState, useEffect } from "react";
import { whenOutboxIdle } from "../../api/outbox";
import {reviewApi } from "../../api/client";
import { toUiWord } from "../../api/adapters";
import { LearningSession } from "../../features/learning/LearningSession";
import {
  SRS_SECONDS,
  SRS_INTERVAL_LABEL,
  SRS_TRANSITION,
  LV_COLORS,
  formatNextReview
} from '../../constants/srs';

function LoadingState() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "16px" }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        border: "3px solid rgba(239,68,68,0.2)", borderTopColor: "#ef4444",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{ color: "#a2acb3", fontSize: "14px" }}>Đang tải...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NoReviewScreen({ onNavigateHome, onGoLearn }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '24px'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 800,
        color: '#e9edef', marginBottom: '8px' }}>Chúc mừng!</h2>
      <p style={{ fontSize: '16px', color: '#a2acb3', marginBottom: '24px' }}>
        Hôm nay bạn không có từ nào cần ôn tập!
      </p>
      <p style={{ fontSize: '14px', color: '#a2acb3', marginBottom: '32px' }}>
        Hãy học từ mới để duy trì đà nhé!
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onGoLearn} style={{
          padding: '12px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
          fontFamily: 'Outfit, sans-serif', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#0f766e,#0e8077)', color: '#ffffff',
          boxShadow: '0 0 24px rgba(20,184,166,0.4)'
        }}>📖 Học từ mới</button>
        <button onClick={onNavigateHome} style={{
          padding: '12px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
          fontFamily: 'Outfit, sans-serif', border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer', background: 'transparent', color: '#a2acb3'
        }}>🏠 Về trang chính</button>
      </div>
    </div>
  );
}

// Khai báo NGOÀI component (khai báo trong render làm component bị tạo lại - mất state - mỗi lần render)
function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "6px",
      padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 600,
      background: "rgba(255,255,255,0.06)", color: "#e9edef",
      border: "0.8px solid rgba(255,255,255,0.12)",
      cursor: "pointer", fontFamily: "Inter, sans-serif", marginBottom: "16px",
    }}>← Về trang chính</button>
  );
}

export default function ReviewPage({ onNavigateHome, onGoLearn }) {
  const [screen, setScreen] = useState("overview");
  const [reviewed, setReviewed] = useState(0);
  const [now] = useState(() => Date.now());
  const [dueWords, setDueWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  let cancelled = false;
  whenOutboxIdle()
    .then(() => reviewApi.dueWords(undefined, { withTicket: true }))
    .then((data) => {
      if (cancelled) return;
      // Backend trả: { words: [...], has_due_words: true }
      const list = (data.words || []).map(toUiWord);
      setDueWords(list);
    })
    .catch((err) => {
      if (!cancelled) setError(err.message || "Không tải được danh sách từ cần ôn");
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });
  return () => { cancelled = true; };
}, []);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "24px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
        <p style={{ color: "#f87171", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>Có lỗi xảy ra</p>
        <p style={{ color: "#a2acb3", fontSize: "14px", marginBottom: "24px" }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{
          padding: "10px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
          background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#ffffff",
          border: "none", cursor: "pointer", fontFamily: "Outfit, sans-serif",
        }}>Thử lại</button>
      </div>
    );
  }

  if (dueWords.length === 0) {
    return <NoReviewScreen onNavigateHome={onNavigateHome} onGoLearn={onGoLearn} />;
  }

  const virtualFolder = {
    id: 0,
    name: "Ôn tập",
    color: "#ef4444",
    image: "",
    words: dueWords
  };

  const byLevel = {};
  dueWords.forEach(w => {
    const lv = w.lv || w.level || 1;
    if (!byLevel[lv]) byLevel[lv] = [];
    byLevel[lv].push(w);
  });

  const schedule = Object.entries(byLevel)
    .map(([lv, words]) => {
      const lvNum = Number(lv);
      return { lv: lvNum, count: words.length, nextMs: now + SRS_SECONDS[lvNum] * 1000 };
    })
    .sort((a, b) => a.nextMs - b.nextMs);

  if (screen === "session") {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "#0f1214" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "16px 24px 0" }}>
          <BackButton onClick={onNavigateHome} />
        </div>
        <LearningSession
          key="review-session"
          folder={virtualFolder}
          mode="review"
          dailyGoal={dueWords.length}
          onWordComplete={() => setReviewed(r => r + 1)}
          onBack={() => setScreen("overview")}
        />
        <style>{`
          @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          input::placeholder { color:#4a545b; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0f1214", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "fixed", right: "-80px", top: "60px", width: "480px", height: "480px",
        borderRadius: "50%", background: "radial-gradient(circle,rgba(239,68,68,0.06) 0%,transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px 80px" }}>
        <BackButton onClick={onNavigateHome} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{
              fontFamily: "Outfit, sans-serif", fontSize: "26px", fontWeight: 800, marginBottom: "6px",
              background: "linear-gradient(120deg,#e9edef 0%,#f87171 50%,#e9edef 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>🔁 Ôn tập hôm nay</h1>
            <p style={{ fontSize: "14px", color: "#a2acb3" }}>Ôn lại từ đã học để củng cố và tăng cấp độ ghi nhớ</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "48px",
                color: "#f87171", lineHeight: 1, marginBottom: "2px" }}>{dueWords.length}</p>
              <p style={{ fontSize: "12px", color: "#a2acb3" }}>từ cần ôn</p>
            </div>
            <button onClick={() => setScreen("session")} style={{
              padding: "13px 28px", borderRadius: "12px", fontSize: "15px", fontWeight: 800,
              fontFamily: "Outfit, sans-serif", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#dc2626,#b91c1c)",
              color: "#ffffff", boxShadow: "0 0 24px rgba(239,68,68,0.4)",
            }}>Bắt đầu ôn →</button>
          </div>
        </div>

        {reviewed > 0 && (
          <div style={{ marginBottom: "24px", padding: "16px 20px", borderRadius: "14px",
            background: "rgba(239,68,68,0.06)", border: "0.8px solid rgba(239,68,68,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#a2acb3" }}>Tiến độ hôm nay</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#f87171" }}>{reviewed} / {dueWords.length}</span>
            </div>
            <div style={{ height: "5px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)" }}>
              <div style={{
                width: `${Math.min((reviewed / dueWords.length) * 100, 100)}%`,
                height: "100%", borderRadius: "9999px",
                background: "linear-gradient(90deg,#ef4444,#86a24d)", transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#a2acb3",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
              Danh sách từ ({dueWords.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px",
              maxHeight: "560px", overflowY: "auto", paddingRight: "4px" }}>
              {dueWords.map(w => {
                const lv = w.lv || w.level || 1;
                return (
                  <div key={w.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)",
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "7px", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700,
                          fontSize: "15px", color: "#e9edef" }}>{w.word}</span>
                        <span style={{ fontSize: "11px", color: "#a2acb3" }}>{w.pronunciation || w.phonetic}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#a2acb3", marginTop: "2px" }}>{w.meaning}</p>
                    </div>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px", flexShrink: 0, marginLeft: "10px",
                      background: `${LV_COLORS[lv]}22`, color: LV_COLORS[lv],
                      border: `0.8px solid ${LV_COLORS[lv]}44`,
                    }}>LV{lv}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#a2acb3",
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "12px" }}>
              Lịch ôn tập sắp tới
            </p>

            <div style={{
              padding: "16px 18px", borderRadius: "14px", marginBottom: "10px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#f87171",
                  fontFamily: "Outfit, sans-serif" }}>⏰ Cần ôn ngay</span>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#f87171",
                  fontFamily: "Outfit, sans-serif" }}>{dueWords.length}</span>
              </div>
              <p style={{ fontSize: "11px", color: "#7f1d1d" }}>Tất cả các level đã đến hạn</p>
            </div>

            <p style={{ fontSize: "11px", color: "#a2acb3", marginBottom: "8px" }}>
              Sau khi ôn xong hôm nay:
            </p>

            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", left: "12px", top: "8px", bottom: "8px",
                width: "1px", background: "rgba(255,255,255,0.07)",
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
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#e9edef",
                          fontFamily: "Outfit, sans-serif" }}>{SRS_TRANSITION[lv]}</span>
                        <span style={{
                          fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px",
                          background: `${LV_COLORS[lv]}20`, color: LV_COLORS[lv],
                          border: `0.8px solid ${LV_COLORS[lv]}44`,
                        }}>{count} từ</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#a2acb3" }}>+{SRS_INTERVAL_LABEL[lv]}</span>
                        <span style={{ fontSize: "10px", color: "#4a545b" }}>·</span>
                        <span style={{ fontSize: "11px", color: "#a2acb3" }}>{formatNextReview(nextMs)}</span>
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
        input::placeholder { color:#4a545b; }
      `}</style>
    </div>
  );
}