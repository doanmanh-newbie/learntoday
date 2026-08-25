// src/components/sections/dashboard/DashboardHome.jsx
import { useState } from "react";

const DAILY_QUOTES = [
  { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein", vi: "Giới hạn ngôn ngữ của tôi chính là giới hạn thế giới của tôi." },
  { text: "To learn a language is to have one more window from which to look at the world.", author: "Chinese Proverb", vi: "Học thêm một ngôn ngữ là có thêm một cửa sổ để nhìn ra thế giới." },
];

const DAILY_PHRASES = [
  [
    { phrase: "bear in mind", meaning: "ghi nhớ, lưu ý", example: "Bear in mind that practice makes perfect." },
    { phrase: "break the ice", meaning: "phá vỡ ngại ngùng", example: "He told a joke to break the ice." },
    { phrase: "get the hang of", meaning: "quen với, nắm được", example: "You'll get the hang of it soon." },
  ],
];

const MINI_SENTENCES = [
  { en: "She managed to accomplish all her goals despite the obstacles.", vi: "Cô ấy đã hoàn thành tất cả mục tiêu dù gặp nhiều trở ngại.", word: "accomplish" },
];

function MiniPractice({ onNavigate }) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const sentence = MINI_SENTENCES[idx];

  function handleSubmit() { if (answer.trim()) setSubmitted(true); }
  function handleNext() {
    setIdx((idx + 1) % MINI_SENTENCES.length);
    setAnswer("");
    setSubmitted(false);
  }

  const isGood = submitted && answer.length > 8;

  return (
    <div style={{ borderRadius: "18px", overflow: "hidden", marginBottom: "16px", border: "0.8px solid rgba(139,92,246,0.22)", background: "rgba(139,92,246,0.04)", boxShadow: "0 0 28px rgba(139,92,246,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "0.8px solid rgba(255,255,255,0.06)", background: "rgba(139,92,246,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px" }}>✍️</span>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "14px", color: "#e8eaf6" }}>Luyện đặt câu nhanh</p>
        </div>
        <button onClick={() => onNavigate("practice")} style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, fontFamily: "Outfit, sans-serif", background: "rgba(139,92,246,0.18)", color: "#c4b5fd", border: "0.8px solid rgba(139,92,246,0.3)", cursor: "pointer" }}>Xem tất cả →</button>
      </div>

      <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ padding: "16px 20px", borderRadius: "13px", background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(139,92,246,0.2)" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#8b5cf6", letterSpacing: "0.07em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>🇬🇧 Dịch sang tiếng Việt</span>
          <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "17px", fontWeight: 700, color: "#f1f5f9", lineHeight: 1.6 }}>
            {sentence.en.split(new RegExp(`(${sentence.word})`, "i")).map((part, i) =>
              part.toLowerCase() === sentence.word.toLowerCase()
                ? <span key={i} style={{ color: "#c4b5fd", borderBottom: "2px solid #8b5cf6" }}>{part}</span>
                : <span key={i}>{part}</span>
            )}
          </p>
        </div>

        <div style={{ borderRadius: "12px", overflow: "hidden", background: "rgba(255,255,255,0.025)", border: submitted ? (isGood ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(248,113,113,0.3)") : "1px solid rgba(255,255,255,0.09)", transition: "border-color 0.3s ease" }}>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if (e.ctrlKey && e.key === "Enter") handleSubmit(); }}
            disabled={submitted}
            placeholder="Nhập bản dịch tiếng Việt của bạn…"
            rows={2}
            style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", outline: "none", resize: "none", fontSize: "15px", color: "#e8eaf6", fontFamily: "Inter, sans-serif", lineHeight: 1.65, boxSizing: "border-box", opacity: submitted ? 0.7 : 1 }}
          />
          {!submitted && (
            <div style={{ padding: "8px 14px", borderTop: "0.8px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#3d4a66", flex: 1 }}>Ctrl+Enter để gửi</span>
              <button onClick={handleSubmit} disabled={!answer.trim()} style={{ padding: "7px 18px", borderRadius: "9px", fontSize: "12px", fontWeight: 700, fontFamily: "Outfit, sans-serif", border: "none", cursor: answer.trim() ? "pointer" : "not-allowed", background: answer.trim() ? "linear-gradient(135deg,#8b5cf6,#6366f1)" : "rgba(255,255,255,0.06)", color: answer.trim() ? "#fff" : "#5a6a8a", boxShadow: answer.trim() ? "0 0 14px rgba(139,92,246,0.4)" : "none" }}>✦ Nộp</button>
            </div>
          )}
        </div>

        {submitted && (
          <div style={{ padding: "14px 18px", borderRadius: "12px", background: isGood ? "rgba(16,185,129,0.06)" : "rgba(248,113,113,0.06)", border: isGood ? "0.8px solid rgba(16,185,129,0.2)" : "0.8px solid rgba(248,113,113,0.2)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: isGood ? "#10b981" : "#f87171" }}>{isGood ? "✅ Tốt lắm!" : "⚠️ Cần cải thiện"}</span>
              <button onClick={() => onNavigate("practice")} style={{ fontSize: "11px", fontWeight: 600, color: "#a5b4fc", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Luyện thêm →</button>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#5a6a8a", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "5px" }}>💡 Đáp án tham khảo</p>
              <p style={{ fontSize: "13px", color: isGood ? "#6ee7b7" : "#c7d2fe", fontStyle: "italic", lineHeight: 1.65 }}>"{sentence.vi}"</p>
            </div>
            <button onClick={handleNext} style={{ alignSelf: "flex-start", padding: "7px 18px", borderRadius: "9px", fontSize: "12px", fontWeight: 700, fontFamily: "Outfit, sans-serif", background: "rgba(255,255,255,0.07)", color: "#e8eaf6", border: "0.8px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>Câu tiếp →</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardHome({ 
  username = "Bạn", dueCount = 0, onReview, onGoLearn,
  wordsLearnedToday = 0, learnTarget = 10, stats = { totalLearned: 0, streak: 0, accuracy: 0 }, onNavigate
}) {
  const todayDate = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  const pct = Math.min((wordsLearnedToday / learnTarget) * 100, 100);
  const dayIdx = new Date().getDay();
  const quote = DAILY_QUOTES[dayIdx % DAILY_QUOTES.length];
  const phrases = DAILY_PHRASES[dayIdx % DAILY_PHRASES.length];
  const [expandedPhrase, setExpandedPhrase] = useState(null);

  const handleNavigate = (target) => {
    if (target === "review") onReview?.();
    else if (target === "learn") onGoLearn?.();
    else if (target === "practice") onNavigate?.("practice");
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "36px 28px 40px", fontFamily: "Inter, sans-serif" }}>
      {/* Greeting */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontFamily: "Outfit, sans-serif", fontSize: "28px", fontWeight: 800, color: "#e8eaf6", marginBottom: "5px" }}>Chào {username}! 👋</h1>
          <p style={{ fontSize: "14px", color: "#5a6a8a" }}>Hãy duy trì ngọn lửa học tập ngày hôm nay nhé.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(255,255,255,0.08)", fontSize: "13px", color: "#8892b0" }}>
          <span>📅</span>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, color: "#c7d2fe" }}>{todayDate}</span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px 24px", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "13px", color: "#8892b0" }}>Tiến độ hôm nay</span>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "14px", color: "#a5b4fc" }}>{wordsLearnedToday} / {learnTarget} từ</span>
        </div>
        <div style={{ height: "6px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", marginBottom: "14px" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: "9999px", background: "linear-gradient(90deg,#6366f1,#10b981)", boxShadow: "0 0 10px rgba(99,102,241,0.4)", transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", gap: "28px" }}>
          {[
            { icon: "📗", label: "Từ đã học", value: wordsLearnedToday, color: "#10b981" },
            { icon: "🔥", label: "Chuỗi ngày", value: stats.streak, color: "#f97316" },
            { icon: "🎯", label: "Độ chính xác", value: `${stats.accuracy}%`, color: "#a5b4fc" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{s.icon}</span>
              <div>
                <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "17px", color: s.color, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "11px", color: "#5a6a8a", marginTop: "2px" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2 Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>🔁 Ôn tập hàng ngày</p>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "52px", color: "#e8eaf6", lineHeight: 1, marginBottom: "4px" }}>{dueCount}</p>
          <p style={{ fontSize: "13px", color: "#5a6a8a", marginBottom: "20px" }}>từ cần ôn hôm nay để không bị quên</p>
          <button onClick={() => handleNavigate("review")} style={{ width: "100%", padding: "12px", borderRadius: "11px", fontSize: "14px", fontWeight: 700, fontFamily: "Outfit, sans-serif", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", boxShadow: "0 0 18px rgba(16,185,129,0.35)" }}>Ôn tập ngay →</button>
        </div>

        <div style={{ background: "rgba(99,102,241,0.06)", border: "0.8px solid rgba(99,102,241,0.15)", borderRadius: "16px", padding: "24px", boxShadow: "0 0 30px rgba(99,102,241,0.1)" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>🌟 Mục tiêu hôm nay</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "52px", color: "#e8eaf6", lineHeight: 1 }}>{wordsLearnedToday}</p>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "22px", color: "#5a6a8a" }}>/{learnTarget} từ</p>
          </div>
          <p style={{ fontSize: "13px", color: "#5a6a8a", marginBottom: "20px" }}>mục tiêu học từ mới hàng ngày của bạn</p>
          <button onClick={() => handleNavigate("learn")} style={{ width: "100%", padding: "12px", borderRadius: "11px", fontSize: "14px", fontWeight: 700, fontFamily: "Outfit, sans-serif", cursor: "pointer", background: "rgba(255,255,255,0.07)", color: "#e8eaf6", border: "0.8px solid rgba(255,255,255,0.12)" }}>Học từ mới →</button>
        </div>
      </div>

      {/* Quote + Phrases */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
        <div style={{ position: "relative", borderRadius: "18px", overflow: "hidden", background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)", border: "0.8px solid rgba(99,102,241,0.18)" }}>
          <div style={{ position: "absolute", top: "-10px", left: "14px", fontFamily: "Outfit, sans-serif", fontSize: "100px", fontWeight: 900, lineHeight: 1, color: "rgba(99,102,241,0.08)", pointerEvents: "none", userSelect: "none" }}>"</div>
          <div style={{ padding: "20px 22px", position: "relative" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "6px", letterSpacing: "0.07em", display: "inline-block", marginBottom: "12px", background: "rgba(99,102,241,0.18)", color: "#a5b4fc", border: "0.8px solid rgba(99,102,241,0.3)" }}>✦ QUOTE HÔM NAY</span>
            <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "15px", color: "#e8eaf6", lineHeight: 1.55, marginBottom: "8px", fontStyle: "italic" }}>"{quote.text}"</p>
            <p style={{ fontSize: "12px", color: "#8892b0", marginBottom: "10px", fontStyle: "italic" }}>{quote.vi}</p>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#6366f1" }}>— {quote.author}</p>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)", borderRadius: "18px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "0.8px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "14px", color: "#e8eaf6" }}>💬 Cụm từ hay hôm nay</p>
              <p style={{ fontSize: "11px", color: "#5a6a8a", marginTop: "2px" }}>Bấm để xem ví dụ</p>
            </div>
            <button onClick={() => handleNavigate("practice")} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, fontFamily: "Outfit, sans-serif", background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 0 12px rgba(139,92,246,0.3)" }}>✨ Luyện →</button>
          </div>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {phrases.map((p, i) => {
              const isOpen = expandedPhrase === i;
              const colors = ["#a5b4fc", "#34d399", "#fbbf24"];
              const bgs = ["rgba(99,102,241,0.1)", "rgba(52,211,153,0.08)", "rgba(245,158,11,0.08)"];
              const borders = ["rgba(99,102,241,0.25)", "rgba(52,211,153,0.2)", "rgba(245,158,11,0.2)"];
              return (
                <div key={i} onClick={() => setExpandedPhrase(isOpen ? null : i)} style={{ padding: "11px 14px", borderRadius: "11px", cursor: "pointer", background: isOpen ? bgs[i] : "rgba(255,255,255,0.03)", border: `0.8px solid ${isOpen ? borders[i] : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "14px", color: isOpen ? colors[i] : "#e8eaf6" }}>{p.phrase}</span>
                      <span style={{ fontSize: "12px", color: "#8892b0", marginLeft: "8px" }}>— {p.meaning}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: isOpen ? colors[i] : "#5a6a8a", display: "inline-block", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                  </div>
                  {isOpen && <p style={{ marginTop: "8px", paddingTop: "8px", borderTop: `0.8px solid ${borders[i]}`, fontSize: "12px", color: "#c7d2fe", fontStyle: "italic", lineHeight: 1.6 }}>"{p.example}"</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <MiniPractice onNavigate={handleNavigate} />
    </div>
  );
}