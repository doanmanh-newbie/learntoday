// src/pages/learn/LearnPage.jsx
// STT 6 - Học từ vựng mới. Phần chọn Folder + xem danh sách từ trước khi
// học; phần "học 1 từ" thật sự nằm ở features/learning/LearningSession.jsx.
import { useState } from "react";
import { FOLDER_DATA, POS_MAP } from "../../data/vocabulary";
import { LearningSession } from "../../features/learning/LearningSession";

function FolderCard({ folder, onSelect, mode = "learn" }) {
  const [hovered, setHovered] = useState(false);
  const lv0        = folder.words.filter(w => w.lv === 0).length;
  const reviewable = folder.words.filter(w => w.lv > 0).length;
  const done = lv0 === 0;
  const pct  = Math.round(((folder.words.length - lv0) / folder.words.length) * 100);
  if (mode === "review" && reviewable === 0) return null;

  return (
    <div
      onClick={() => onSelect(folder)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "16px", overflow: "hidden", cursor: "pointer",
        border: "0.8px solid rgba(255,255,255,0.09)",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${folder.color}22` : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        position: "relative",
      }}
    >
      {/* Image */}
      <div style={{ height: "160px", overflow: "hidden", position: "relative" }}>
        <img
          src={folder.image}
          alt={folder.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
        />
        {/* gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,9,26,0.1) 0%, rgba(7,9,26,0.75) 100%)",
        }} />
        {/* tag badge */}
        <span style={{
          position: "absolute", top: "12px", left: "12px",
          fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px",
          background: `${folder.color}33`, color: folder.color,
          border: `0.8px solid ${folder.color}55`, letterSpacing: "0.05em",
        }}>{folder.tag}</span>
        {/* done badge */}
        {done && (
          <span style={{
            position: "absolute", top: "12px", right: "12px",
            fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px",
            background: "rgba(16,185,129,0.25)", color: "#10b981",
            border: "0.8px solid rgba(16,185,129,0.4)",
          }}>✓ Hoàn thành</span>
        )}
        {/* folder name */}
        <div style={{ position: "absolute", bottom: "12px", left: "14px" }}>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px", color: "#e8eaf6" }}>
            {folder.name}
          </p>
        </div>
      </div>

      {/* Bottom info */}
      <div style={{ padding: "14px 16px", background: "rgba(7,9,26,0.92)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", color: "#5a6a8a" }}>{folder.words.length} từ tổng</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: mode === "review" ? "#fbbf24" : lv0 > 0 ? "#a5b4fc" : "#10b981" }}>
            {mode === "review" ? `${reviewable} từ ôn` : lv0 > 0 ? `${lv0} từ mới` : "Đã học xong"}
          </span>
        </div>
        {/* progress bar */}
        <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", marginBottom: "12px" }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: "9999px",
            background: `linear-gradient(90deg,${folder.color},${folder.color}bb)`,
            transition: "width 0.5s ease",
          }} />
        </div>
        <button style={{
          width: "100%", padding: "9px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
          fontFamily: "Outfit, sans-serif", cursor: "pointer",
          background: mode === "review" ? "rgba(245,158,11,0.1)" : done ? "rgba(16,185,129,0.1)" : `${folder.color}22`,
          color: mode === "review" ? "#fbbf24" : done ? "#10b981" : folder.color,
          border: mode === "review" ? "0.8px solid rgba(245,158,11,0.3)" : done ? "0.8px solid rgba(16,185,129,0.25)" : `0.8px solid ${folder.color}44`,
        }}>
          {mode === "review" ? "🔁 Ôn tập →" : done ? "📖 Ôn lại" : "Xem danh sách từ →"}
        </button>
      </div>
    </div>
  );
}

function FolderListScreen({ onSelectFolder, mode = "learn" }) {
  const isReview = mode === "review";
  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px 80px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "Outfit, sans-serif", fontSize: "26px", fontWeight: 800, marginBottom: "4px",
          background: isReview
            ? "linear-gradient(120deg,#e8eaf6 0%,#fbbf24 40%,#e8eaf6 60%)"
            : "linear-gradient(120deg,#e8eaf6 0%,#a5b4fc 40%,#e8eaf6 60%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>{isReview ? "🔁 Ôn tập từ vựng" : "📖 Học từ mới"}</h1>
        <p style={{ color: "#5a6a8a", fontSize: "14px" }}>
          {isReview ? "Chọn folder để ôn lại các từ đã học" : "Chọn folder để xem danh sách từ và bắt đầu học"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {FOLDER_DATA.map(folder => (
          <FolderCard key={folder.id} folder={folder} onSelect={onSelectFolder} mode={mode} />
        ))}
      </div>
    </div>
  );
}

// ── Screen: Word List Preview ─────────────────────────────────────────────────

function WordListScreen({ folder, onBack, onStartLearning, mode = "learn" }) {
  const isReview  = mode === "review";
  const lv0Words  = folder.words.filter(w => w.lv === 0);
  const doneWords = folder.words.filter(w => w.lv > 0);
  const activeWords = isReview ? doneWords : lv0Words;
  const pct = Math.round((doneWords.length / folder.words.length) * 100);

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 24px 80px" }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px",
        padding: "7px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 500,
        background: "rgba(255,255,255,0.04)", color: "#8892b0",
        border: "0.8px solid rgba(255,255,255,0.08)", cursor: "pointer",
        fontFamily: "Inter, sans-serif",
      }}>← Quay lại</button>

      {/* Folder hero */}
      <div style={{ borderRadius: "18px", overflow: "hidden", marginBottom: "24px",
        border: "0.8px solid rgba(255,255,255,0.09)", position: "relative", height: "180px" }}>
        <img src={folder.image} alt={folder.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(7,9,26,0.85) 0%, rgba(7,9,26,0.3) 100%)",
          display: "flex", alignItems: "center", padding: "28px 32px",
        }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: folder.color,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>{folder.tag}</p>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "28px",
              color: "#e8eaf6", marginBottom: "10px" }}>{folder.name}</h2>
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                { label: "Tổng từ", value: folder.words.length },
                isReview
                  ? { label: "Cần ôn", value: doneWords.length, accent: true }
                  : { label: "Chưa học", value: lv0Words.length, accent: true },
                { label: isReview ? "Chưa học" : "Đã học", value: isReview ? lv0Words.length : doneWords.length },
                { label: "Tiến độ", value: `${pct}%` },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "20px",
                    color: s.accent ? "#a5b4fc" : "#e8eaf6" }}>{s.value}</p>
                  <p style={{ fontSize: "11px", color: "#5a6a8a" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Word list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
        {isReview ? (
          <>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
              textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px 2px" }}>
              Từ cần ôn ({doneWords.length})
            </p>
            {doneWords.map(word => <WordRow key={word.id} word={word} />)}
            {lv0Words.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
                  textTransform: "uppercase", letterSpacing: "0.07em", margin: "14px 0 8px 2px" }}>
                  Chưa học ({lv0Words.length})
                </p>
                {lv0Words.map(word => <WordRow key={word.id} word={word} dimmed />)}
              </>
            )}
          </>
        ) : (
          <>
            {lv0Words.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
                  textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px 2px" }}>
                  Từ chưa học ({lv0Words.length})
                </p>
                {lv0Words.map(word => <WordRow key={word.id} word={word} />)}
              </>
            )}
            {doneWords.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
                  textTransform: "uppercase", letterSpacing: "0.07em", margin: "14px 0 8px 2px" }}>
                  Đã học ({doneWords.length})
                </p>
                {doneWords.map(word => <WordRow key={word.id} word={word} dimmed />)}
              </>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      {activeWords.length > 0 ? (
        <button onClick={onStartLearning} style={{
          width: "100%", padding: "15px", borderRadius: "13px", fontSize: "16px", fontWeight: 800,
          fontFamily: "Outfit, sans-serif", border: "none", cursor: "pointer",
          background: isReview ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
          color: "#fff",
          boxShadow: isReview ? "0 0 28px rgba(245,158,11,0.4)" : "0 0 28px rgba(99,102,241,0.45)",
        }}>
          {isReview ? `🔁 Bắt đầu ôn ${Math.min(activeWords.length, 5)} từ` : `🚀 Bắt đầu học ${Math.min(activeWords.length, 5)} từ đầu tiên`}
        </button>
      ) : (
        <div style={{ padding: "18px", borderRadius: "13px", textAlign: "center",
          background: "rgba(16,185,129,0.08)", border: "0.8px solid rgba(16,185,129,0.2)" }}>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#10b981" }}>
            {isReview ? "✅ Folder này chưa có từ đã học!" : "✅ Bạn đã học hết tất cả từ trong folder này!"}
          </p>
          <p style={{ fontSize: "13px", color: "#5a6a8a", marginTop: "4px" }}>
            {isReview ? "Hãy học từ mới trước." : "Hãy ôn tập để duy trì kiến thức."}
          </p>
        </div>
      )}
    </div>
  );
}

function WordRow({ word, dimmed }) {
  const cfg = LV_CFG[word.lv] || LV_CFG[0];
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderRadius: "10px",
      background: dimmed ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
      border: "0.8px solid rgba(255,255,255,0.07)",
      opacity: dimmed ? 0.65 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "15px", color: "#e8eaf6" }}>
              {word.word}
            </p>
            <span style={{ fontSize: "11px", color: "#5a6a8a" }}>{word.phonetic}</span>
            <span style={{
              fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px",
              background: "rgba(255,255,255,0.07)", color: "#8892b0",
            }}>{POS_MAP[word.pos] || word.pos}</span>
          </div>
          <p style={{ fontSize: "13px", color: "#8892b0", marginTop: "2px" }}>{word.meaning}</p>
        </div>
      </div>
      <span style={{
        fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px",
        background: cfg.bg, color: cfg.color, flexShrink: 0,
      }}>{cfg.label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION COMPONENTS (Phase 1 → Transition → Phase 2 Dạng 1→2→3)
// Queue-loop: each round goes through all current words.
// Wrong → recorded as failed, move on. After full round: retry failed words.
// Only when round clears with 0 failures → advance to next phase / exercise type.
// ─────────────────────────────────────────────────────────────────────────────

// ── Session header bar ────────────────────────────────────────────────────────

function CompletionScreen({ wordsLearned, dailyGoal, onHome }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "24px" }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(99,102,241,0.25)",
        borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%",
        textAlign: "center", boxShadow: "0 0 60px rgba(99,102,241,0.2)",
        animation: "fadeSlideIn 0.4s ease",
      }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🎉</div>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "22px",
          color: "#e8eaf6", marginBottom: "8px" }}>CHÚC MỪNG!</h2>
        <p style={{ color: "#a5b4fc", fontSize: "14px", marginBottom: "24px", fontFamily: "Outfit, sans-serif" }}>
          Bạn đã hoàn thành mục tiêu hôm nay!
        </p>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", margin: "0 0 28px",
          padding: "18px", background: "rgba(99,102,241,0.08)", borderRadius: "12px",
          border: "0.8px solid rgba(99,102,241,0.15)" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "30px",
              background: "linear-gradient(135deg,#a5b4fc,#8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{wordsLearned}</p>
            <p style={{ fontSize: "12px", color: "#8892b0" }}>từ đã học hôm nay</p>
          </div>
          <div style={{ width: "0.8px", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "30px", color: "#f97316" }}>🔥</p>
            <p style={{ fontSize: "12px", color: "#8892b0" }}>streak tiếp tục</p>
          </div>
        </div>
        <button onClick={onHome} style={{
          width: "100%", padding: "13px", borderRadius: "11px", fontSize: "14px", fontWeight: 700,
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
          border: "none", cursor: "pointer", fontFamily: "Outfit, sans-serif",
          boxShadow: "0 0 18px rgba(99,102,241,0.4)",
        }}>🏠 Về trang chủ</button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function LearnPage({ onNavigateHome, mode = "learn" }) {
  const [screen,       setScreen]       = useState("folders");
  const [folder,       setFolder]       = useState(null);
  const [wordsLearned, setWordsLearned] = useState(0);
  const DAILY_GOAL = 10;

  function selectFolder(f) { setFolder(f); setScreen("wordlist"); }
  function startSession()  { setScreen("session"); }

  function onWordComplete() {
    const next = wordsLearned + 1;
    setWordsLearned(next);
    if (next >= DAILY_GOAL) setScreen("complete");
  }

  const glowColor = mode === "review" ? "rgba(245,158,11,0.08)" : "rgba(99,102,241,0.08)";

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#07091a", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "fixed", left: "-100px", top: "0", width: "500px", height: "500px",
        borderRadius: "50%", background: `radial-gradient(circle,${glowColor} 0%,transparent 70%)`,
        filter: "blur(80px)", pointerEvents: "none" }} />

      {screen === "folders" && <FolderListScreen onSelectFolder={selectFolder} mode={mode} />}

      {screen === "wordlist" && folder && (
        <WordListScreen folder={folder} mode={mode}
          onBack={() => setScreen("folders")}
          onStartLearning={startSession} />
      )}

      {screen === "session" && folder && (
        <LearningSession
          folder={folder} mode={mode}
          dailyGoal={DAILY_GOAL}
          wordsLearned={wordsLearned}
          onWordComplete={onWordComplete}
          onBack={() => setScreen("wordlist")}
        />
      )}

      {screen === "complete" && (
        <CompletionScreen wordsLearned={wordsLearned} dailyGoal={DAILY_GOAL}
          onHome={() => { onNavigateHome?.(); setScreen("folders"); setWordsLearned(0); }} />
      )}

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color:#3d4a66; }
      `}</style>
    </div>
  );
}

