// src/pages/learn/LearnPage.jsx
// STT 6 - Học từ vựng mới. Dùng API thật từ backend.
import { useState, useEffect, useRef } from "react";
import { foldersApi } from "../../api/client";
import { LearningSession } from "../../features/learning/LearningSession";
import { LV_CFG } from "../../constants/srs";

// ── Helpers: Chuẩn hóa dữ liệu từ backend ────────────────────────────────────
function normalizeFolder(f) {
  return {
    id: f.id,
    name: f.name,
    type: f.type,
    user_id: f.user_id,
    // Backend dùng 'icon', FE cũ dùng 'image' — map về cùng tên
    image: f.image || f.icon || null,
    icon: f.icon || null,
    color: f.color || (f.type === 'system' ? '#6366f1' : '#10b981'),
    tag: f.tag || (f.type === 'system' ? 'Hệ thống' : 'Cá nhân'),
    description: f.description,
    word_count: f.word_count || 0,
    // Backend không trả lv0_count → FE tự tính sau khi load words
    lv0_count: f.lv0_count || 0,
    reviewable_count: f.reviewable_count || 0,
  };
}

function normalizeWord(w) {
  return {
    id: w.id,
    word: w.word,
    // Backend dùng 'pronunciation', FE cũ dùng 'phonetic'
    phonetic: w.pronunciation || w.phonetic || '',
    pronunciation: w.pronunciation || w.phonetic || '',
    // Backend dùng 'word_type', FE cũ dùng 'pos'
    pos: w.word_type || w.pos || 'n',
    word_type: w.word_type || w.pos || 'n',
    meaning: w.meaning,
    // Backend trả 2 field riêng, FE cần array 'examples'
    example: w.example,
    example_meaning: w.example_meaning,
    examples: w.examples || (w.example ? [{
      en: w.example,
      vi: w.example_meaning || '',
    }] : []),
    // Backend dùng 'level', FE cũ dùng 'lv'
    lv: w.level ?? w.lv ?? 0,
    level: w.level ?? w.lv ?? 0,
    next_review: w.next_review,
    difficulty: w.difficulty,
    category: w.category,
    audio_url: w.audio_url,
  };
}

// ── Loading & Error ────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "16px" }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        border: "3px solid rgba(99,102,241,0.2)",
        borderTopColor: "#6366f1",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{ color: "#8892b0", fontSize: "14px" }}>Đang tải...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "24px" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
      <p style={{ color: "#f87171", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>Có lỗi xảy ra</p>
      <p style={{ color: "#8892b0", fontSize: "14px", marginBottom: "24px" }}>{message}</p>
      <button onClick={onRetry} style={{
        padding: "10px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
        border: "none", cursor: "pointer", fontFamily: "Outfit, sans-serif",
      }}>Thử lại</button>
    </div>
  );
}

// ── Folder Card ────────────────────────────────────────────────────────────
function FolderCard({ folder, onSelect, mode = "learn" }) {
  const [hovered, setHovered] = useState(false);
  const totalWords = folder.word_count || 0;
  const lv0 = folder.lv0_count || 0;
  const reviewable = folder.reviewable_count || (totalWords - lv0);
  const done = lv0 === 0 && totalWords > 0;
  const pct = totalWords > 0 ? Math.round(((totalWords - lv0) / totalWords) * 100) : 0;
  if (mode === "review" && reviewable === 0) return null;

  const color = folder.color || "#6366f1";

  return (
    <div
      onClick={() => onSelect(folder)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "16px", overflow: "hidden", cursor: "pointer",
        border: "0.8px solid rgba(255,255,255,0.09)",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${color}22` : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        position: "relative",
      }}
    >
      <div style={{ height: "160px", overflow: "hidden", position: "relative",
        background: `linear-gradient(135deg, ${color}40, ${color}10)`,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {folder.image ? (
          <img
            src={folder.image}
            alt={folder.name}
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: hovered ? "scale(1.06)" : "scale(1)",
              transition: "transform 0.4s ease",
            }}
          />
        ) : (
          <span style={{ fontSize: "64px" }}>{folder.icon || "📁"}</span>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,9,26,0.1) 0%, rgba(7,9,26,0.75) 100%)",
        }} />
        <span style={{
          position: "absolute", top: "12px", left: "12px",
          fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px",
          background: `${color}33`, color: color,
          border: `0.8px solid ${color}55`, letterSpacing: "0.05em",
        }}>{folder.tag}</span>
        {done && (
          <span style={{
            position: "absolute", top: "12px", right: "12px",
            fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px",
            background: "rgba(16,185,129,0.25)", color: "#10b981",
            border: "0.8px solid rgba(16,185,129,0.4)",
          }}>✓ Hoàn thành</span>
        )}
        <div style={{ position: "absolute", bottom: "12px", left: "14px" }}>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px", color: "#e8eaf6" }}>
            {folder.name}
          </p>
        </div>
      </div>

      <div style={{ padding: "14px 16px", background: "rgba(7,9,26,0.92)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", color: "#5a6a8a" }}>{totalWords} từ tổng</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: mode === "review" ? "#fbbf24" : lv0 > 0 ? "#a5b4fc" : "#10b981" }}>
            {mode === "review" ? `${reviewable} từ ôn` : lv0 > 0 ? `${lv0} từ mới` : "Đã học xong"}
          </span>
        </div>
        <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", marginBottom: "12px" }}>
          <div style={{
            width: `${pct}%`, height: "100%", borderRadius: "9999px",
            background: `linear-gradient(90deg,${color},${color}bb)`,
            transition: "width 0.5s ease",
          }} />
        </div>
        <button style={{
          width: "100%", padding: "9px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
          fontFamily: "Outfit, sans-serif", cursor: "pointer",
          background: mode === "review" ? "rgba(245,158,11,0.1)" : done ? "rgba(16,185,129,0.1)" : `${color}22`,
          color: mode === "review" ? "#fbbf24" : done ? "#10b981" : color,
          border: mode === "review" ? "0.8px solid rgba(245,158,11,0.3)" : done ? "0.8px solid rgba(16,185,129,0.25)" : `0.8px solid ${color}44`,
        }}>
          {mode === "review" ? "🔁 Ôn tập →" : done ? "📖 Ôn lại" : "Xem danh sách từ →"}
        </button>
      </div>
    </div>
  );
}

// ── Folder List Screen ─────────────────────────────────────────────────────
function FolderListScreen({ folders, loading, error, onRetry, onSelectFolder, onBack, mode = "learn" }) {
  const isReview = mode === "review";

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px 80px" }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px",
            padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 600,
            background: "rgba(255,255,255,0.06)", color: "#e8eaf6",
            border: "0.8px solid rgba(255,255,255,0.12)",
            cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}
        >
          ← Về trang chính
        </button>
      )}
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

      {folders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", color: "#5a6a8a" }}>
          <p style={{ fontSize: "48px", marginBottom: "12px" }}>📭</p>
          <p style={{ fontSize: "15px" }}>Chưa có folder nào. Hãy tạo folder mới!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {folders.map(folder => (
            <FolderCard key={folder.id} folder={folder} onSelect={onSelectFolder} mode={mode} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Word List Screen ───────────────────────────────────────────────────────
function WordListScreen({ folder, words, loading, error, onRetry, onBack, onStartLearning, mode = "learn" }) {
  const isReview = mode === "review";
  const lv0Words = words.filter(w => (w.lv || 0) === 0);
  const doneWords = words.filter(w => (w.lv || 0) > 0);
  const activeWords = isReview ? doneWords : lv0Words;
  const pct = words.length > 0 ? Math.round((doneWords.length / words.length) * 100) : 0;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  const color = folder.color || "#6366f1";

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 24px 80px" }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px",
        padding: "7px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 500,
        background: "rgba(255,255,255,0.04)", color: "#8892b0",
        border: "0.8px solid rgba(255,255,255,0.08)", cursor: "pointer",
        fontFamily: "Inter, sans-serif",
      }}>← Quay lại</button>

      <div style={{ borderRadius: "18px", overflow: "hidden", marginBottom: "24px",
        border: "0.8px solid rgba(255,255,255,0.09)", position: "relative", height: "180px",
        background: `linear-gradient(135deg, ${color}40, ${color}10)`,
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        {folder.image ? (
          <img src={folder.image} alt={folder.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "80px" }}>{folder.icon || "📁"}</span>
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(7,9,26,0.85) 0%, rgba(7,9,26,0.3) 100%)",
          display: "flex", alignItems: "center", padding: "28px 32px",
        }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: color,
              textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
              {folder.tag}
            </p>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "28px",
              color: "#e8eaf6", marginBottom: "10px" }}>{folder.name}</h2>
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                { label: "Tổng từ", value: words.length },
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

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
        {isReview ? (
          <>
            {doneWords.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
                  textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px 2px" }}>
                  Từ cần ôn ({doneWords.length})
                </p>
                {doneWords.map(word => <WordRow key={word.id} word={word} />)}
              </>
            )}
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
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "15px", color: "#e8eaf6" }}>
            {word.word}
          </p>
          <span style={{ fontSize: "11px", color: "#5a6a8a" }}>{word.phonetic}</span>
          <span style={{
            fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px",
            background: "rgba(255,255,255,0.07)", color: "#8892b0",
          }}>{word.pos}</span>
        </div>
        <p style={{ fontSize: "13px", color: "#8892b0", marginTop: "2px" }}>{word.meaning}</p>
      </div>
      <span style={{
        fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px",
        background: cfg.bg, color: cfg.color, flexShrink: 0,
      }}>{cfg.label}</span>
    </div>
  );
}

// ── Completion Screen ──────────────────────────────────────────────────────
function CompletionScreen({ wordsLearned, onHome }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "24px" }}>
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(99,102,241,0.25)",
        borderRadius: "20px", padding: "48px 40px", maxWidth: "440px", width: "100%",
        textAlign: "center", boxShadow: "0 0 60px rgba(99,102,241,0.2)",
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

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LearnPage({ onNavigateHome, mode = "learn", folderId = null }) {
  const [screen, setScreen] = useState("folders");
  const [folders, setFolders] = useState([]);
  const [folder, setFolder] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wordsLearned, setWordsLearned] = useState(0);
  const DAILY_GOAL = 10;
  const completeRef = useRef(false);

  // Load folders
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    foldersApi.list()
      .then((data) => {
        if (cancelled) return;
        // Backend trả: { system_folders: [...], personal_folders: [...] }
        const systemFolders = (data.system_folders || []).map(normalizeFolder);
        const personalFolders = (data.personal_folders || []).map(normalizeFolder);
        const all = [...systemFolders, ...personalFolders];
        setFolders(all);
        // Nếu có folderId, tự động vào folder đó
        if (folderId) {
          const found = all.find(f => String(f.id) === String(folderId));
          if (found) {
            setFolder(found);
            setScreen("wordlist");
          } else {
            setError("Không tìm thấy folder");
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không tải được danh sách folder");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [folderId]);

  // Load words khi folder thay đổi
  useEffect(() => {
    if (!folder) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    foldersApi.words(folder.id)
      .then((data) => {
        if (cancelled) return;
        // Backend trả: { folder, words, pagination }
        const list = (data.words || []).map(normalizeWord);
        setWords(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không tải được danh sách từ");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [folder]);

  const selectFolder = (f) => {
    setFolder(f);
    setScreen("wordlist");
  };

  const startSession = () => setScreen("session");

  const onWordComplete = () => {
    const next = wordsLearned + 1;
    setWordsLearned(next);
    if (next >= DAILY_GOAL) {
      completeRef.current = true;
      setScreen("complete");
    }
  };

  const handleBack = () => {
    if (!completeRef.current) {
      if (folderId && screen === "wordlist") {
        onNavigateHome?.();
      } else {
        setScreen("folders");
        setFolder(null);
      }
    }
  };

  const handleWordListBack = () => {
    if (folderId) {
      onNavigateHome?.();
    } else {
      setScreen("folders");
      setFolder(null);
    }
  };

  const glowColor = mode === "review" ? "rgba(245,158,11,0.08)" : "rgba(99,102,241,0.08)";

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#07091a", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "fixed", left: "-100px", top: "0", width: "500px", height: "500px",
        borderRadius: "50%", background: `radial-gradient(circle,${glowColor} 0%,transparent 70%)`,
        filter: "blur(80px)", pointerEvents: "none" }} />

      {screen === "folders" && (
        <FolderListScreen
          folders={folders}
          loading={loading}
          error={error}
          onRetry={() => {
            setLoading(true); setError("");
            foldersApi.list()
              .then(d => {
                const sys = (d.system_folders || []).map(normalizeFolder);
                const per = (d.personal_folders || []).map(normalizeFolder);
                setFolders([...sys, ...per]);
                setLoading(false);
              })
              .catch(e => { setError(e.message); setLoading(false); });
          }}
          onSelectFolder={selectFolder}
          onBack={onNavigateHome}
          mode={mode}
        />
      )}

      {screen === "wordlist" && folder && (
        <WordListScreen
          folder={folder}
          words={words}
          loading={loading}
          error={error}
          onRetry={() => {
            setLoading(true); setError("");
            foldersApi.words(folder.id)
              .then(d => { setWords((d.words || []).map(normalizeWord)); setLoading(false); })
              .catch(e => { setError(e.message); setLoading(false); });
          }}
          onBack={handleWordListBack}
          onStartLearning={startSession}
          mode={mode}
        />
      )}

      {screen === "session" && folder && (
        <LearningSession
          key={folder.id}
          folder={{ ...folder, words }}
          mode={mode}
          dailyGoal={DAILY_GOAL}
          wordsLearned={wordsLearned}
          onWordComplete={onWordComplete}
          onBack={handleBack}
        />
      )}

      {screen === "complete" && (
        <CompletionScreen wordsLearned={wordsLearned}
          onHome={() => { onNavigateHome?.(); setScreen("folders"); setWordsLearned(0); completeRef.current = false; }} />
      )}

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder { color:#3d4a66; }
      `}</style>
    </div>
  );
}