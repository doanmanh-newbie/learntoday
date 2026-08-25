// src/features/learning/LearningSession.jsx
// STT 6.5 - Module Quy trình học từ vựng (CỐT LÕI)
// Được gọi bởi LearnPage (STT 6, loại="learn") và ReviewPage (STT 5, loại="review")

import { useState, useRef } from 'react';
import { speak } from '../../utils/tts';
import { shuffle, pickRandom } from '../../utils/helpers';
import { LV_CFG, getNextReview, getNextLevel, SRS_SECONDS } from '../../constants/srs';
import SuggestionDialog from '../../components/learning/SuggestionDialog';
import { POS_MAP } from '../../data/vocabulary';

// ── SessionTopBar ──────────────────────────────────────────────────────────────
function SessionTopBar({ phase, exType, queueLen, qIdx, roundNum, wordsLearned, dailyGoal, onBack, folder }) {
  const pct = Math.min((wordsLearned / dailyGoal) * 100, 100);
  const isPhase1 = phase === 1;
  const phaseColor = isPhase1 ? "#6366f1" : "#10b981";
  const isRetry = roundNum > 1;
  const exLabels = { 1: "Trắc nghiệm", 2: "Điền từ", 3: "Ghép cặp · Tất cả 5 từ" };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 24px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <button onClick={onBack} style={{
          padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
          background: "rgba(255,255,255,0.05)", color: "#c7d2fe",
          border: "0.8px solid rgba(255,255,255,0.1)", cursor: "pointer",
        }}>← {folder.name}</button>

        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{
            fontSize: "11px", fontWeight: 800, padding: "4px 12px", borderRadius: "9999px",
            background: isPhase1 ? "rgba(99,102,241,0.2)" : "rgba(16,185,129,0.15)",
            color: phaseColor, border: `1px solid ${phaseColor}55`, fontFamily: "Outfit, sans-serif",
          }}>
            {isPhase1 ? "GIAI ĐOẠN 1 · Chính tả" : `GIAI ĐOẠN 2 · ${exLabels[exType] || ""}`}
          </span>
          {isRetry && (
            <span style={{
              fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "9999px",
              background: "rgba(251,191,36,0.15)", color: "#fbbf24",
              border: "1px solid rgba(251,191,36,0.3)", fontFamily: "Outfit, sans-serif",
            }}>↺ Ôn lại vòng {roundNum}</span>
          )}
        </div>

        <span style={{ fontSize: "12px", fontWeight: 700, color: "#a5b4fc", fontFamily: "Outfit, sans-serif" }}>
          {wordsLearned}/{dailyGoal} từ
        </span>
      </div>

      <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", marginBottom: "14px" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: "9999px",
          background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
          boxShadow: "0 0 8px rgba(139,92,246,0.5)", transition: "width 0.5s ease",
        }} />
      </div>

      {exType !== 3 && queueLen > 0 && (
        <div style={{ display: "flex", gap: "7px", marginBottom: "20px" }}>
          {Array.from({ length: queueLen }).map((_, i) => {
            const done = i < qIdx;
            const cur = i === qIdx;
            return (
              <div key={i} style={{
                flex: 1, height: "6px", borderRadius: "9999px",
                background: done ? phaseColor : cur ? phaseColor : "rgba(255,255,255,0.1)",
                opacity: done ? 0.55 : cur ? 1 : 0.28,
                boxShadow: cur ? `0 0 8px ${phaseColor}aa` : "none",
                transition: "all 0.3s",
              }} />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Phase 1: Spelling ──────────────────────────────────────────────────────────
function Phase1Spelling({ word, onPass, onFail }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const exRef = useRef(word.examples[Math.floor(Math.random() * word.examples.length)]);
  const ex = exRef.current;
  const parts = ex.en.split("___");

  const check = () => {
    if (!input.trim() || result) return;
    const ok = input.trim().toLowerCase() === word.word.toLowerCase();
    speak(word.word);
    setResult(ok ? "correct" : "wrong");
    if (ok) setTimeout(onPass, 1000);
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.28s ease" }}>
      <div style={{
        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: "14px", padding: "20px 24px", marginBottom: "16px", textAlign: "center",
      }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#a5b4fc",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Nghĩa tiếng Việt</p>
        <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "28px",
          color: "#ffffff", lineHeight: 1.2, marginBottom: "6px" }}>{word.meaning}</p>
        <span style={{
          fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px",
          background: "rgba(165,180,252,0.15)", color: "#c7d2fe",
          border: "0.8px solid rgba(165,180,252,0.25)",
        }}>{POS_MAP[word.pos] || word.pos}</span>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px", padding: "16px 20px", marginBottom: "18px",
      }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#8892b0",
          textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>Ví dụ — điền từ còn thiếu</p>
        <p style={{ fontSize: "17px", color: "#e8eaf6", lineHeight: 1.9, fontFamily: "Inter, sans-serif" }}>
          {parts[0]}
          <span style={{
            display: "inline-block", minWidth: "90px", height: "24px",
            borderBottom: `2px solid ${result === "correct" ? "#10b981" : result === "wrong" ? "#f87171" : "#6366f1"}`,
            verticalAlign: "bottom", margin: "0 4px",
            color: result === "correct" ? "#10b981" : result === "wrong" ? "#f87171" : "#a5b4fc",
            fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "17px",
            textAlign: "center", lineHeight: "24px",
          }}>{result ? word.word : ""}</span>
          {parts[1]}
        </p>
        <p style={{ fontSize: "13px", color: "#8892b0", marginTop: "8px", fontStyle: "italic" }}>{ex.vi}</p>
      </div>

      {!result && (
        <>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") check(); }}
            placeholder="Nhập từ tiếng Anh vào đây…"
            style={{
              width: "100%", padding: "15px 18px", borderRadius: "12px",
              fontSize: "20px", fontFamily: "Outfit, sans-serif", fontWeight: 700,
              textAlign: "center", background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(99,102,241,0.4)", color: "#ffffff",
              outline: "none", boxSizing: "border-box", marginBottom: "12px",
            }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={check} disabled={!input.trim()} style={{
              flex: 3, padding: "14px", borderRadius: "12px", fontSize: "15px", fontWeight: 800,
              fontFamily: "Outfit, sans-serif", border: "none",
              cursor: input.trim() ? "pointer" : "not-allowed",
              background: input.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.08)",
              color: input.trim() ? "#fff" : "#5a6a8a",
              boxShadow: input.trim() ? "0 0 20px rgba(99,102,241,0.45)" : "none",
            }}>Kiểm tra ↵</button>
            <button onClick={() => speak(word.word)} style={{
              flex: 1, padding: "14px", borderRadius: "12px", fontSize: "13px",
              background: "rgba(16,185,129,0.12)", color: "#10b981",
              border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer",
            }}>🔊</button>
          </div>
        </>
      )}

      {result === "correct" && (
        <div style={{
          padding: "18px", borderRadius: "12px", textAlign: "center",
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.4)",
          animation: "fadeSlideIn 0.25s ease",
        }}>
          <p style={{ fontSize: "22px", marginBottom: "4px" }}>✅</p>
          <p style={{ fontSize: "16px", fontWeight: 800, color: "#10b981", fontFamily: "Outfit, sans-serif" }}>Chính xác!</p>
          <p style={{ fontSize: "13px", color: "#6ee7b7", marginTop: "4px" }}>Chuyển từ tiếp theo…</p>
        </div>
      )}

      {result === "wrong" && (
        <div style={{
          padding: "18px 20px", borderRadius: "12px",
          background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.4)",
          animation: "fadeSlideIn 0.25s ease",
        }}>
          <p style={{ fontSize: "14px", fontWeight: 800, color: "#f87171",
            fontFamily: "Outfit, sans-serif", marginBottom: "4px" }}>❌ Chưa đúng</p>
          <p style={{ fontSize: "15px", color: "#fca5a5", marginBottom: "14px" }}>
            Đáp án: <strong style={{ color: "#ffffff", fontFamily: "Outfit, sans-serif" }}>{word.word}</strong>
          </p>
          <p style={{ fontSize: "12px", color: "#f87171", marginBottom: "12px", fontStyle: "italic" }}>
            Từ này sẽ được ôn lại ở vòng tiếp theo.
          </p>
          <button onClick={onFail} style={{
            width: "100%", padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
            background: "rgba(255,255,255,0.08)", color: "#c7d2fe",
            border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontFamily: "Outfit, sans-serif",
          }}>Từ tiếp theo →</button>
        </div>
      )}
    </div>
  );
}

// ── Phase Transition ───────────────────────────────────────────────────────────
function PhaseTransition({ batch, p1FirstRound, onStartPhase2 }) {
  const correct = Object.values(p1FirstRound).filter(Boolean).length;
  return (
    <div style={{
      maxWidth: "640px", margin: "0 auto", padding: "48px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      animation: "fadeSlideIn 0.35s ease",
    }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "50%", fontSize: "32px",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px",
        background: "rgba(99,102,241,0.15)", border: "1.5px solid rgba(99,102,241,0.4)",
        boxShadow: "0 0 30px rgba(99,102,241,0.3)",
      }}>🏁</div>
      <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "24px",
        color: "#ffffff", marginBottom: "6px" }}>Giai đoạn 1 hoàn thành!</h2>
      <p style={{ fontSize: "15px", color: "#a5b4fc", marginBottom: "24px" }}>
        Đúng ngay lần đầu: {correct}/{batch.length} từ
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "28px" }}>
        {batch.map(w => {
          const ok = p1FirstRound[w.id];
          return (
            <span key={w.id} style={{
              padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: 700,
              fontFamily: "Outfit, sans-serif",
              background: ok ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.12)",
              color: ok ? "#10b981" : "#f87171",
              border: `1px solid ${ok ? "rgba(16,185,129,0.4)" : "rgba(248,113,113,0.35)"}`,
            }}>{ok ? "✓" : "✗"} {w.word}</span>
          );
        })}
      </div>
      <div style={{
        padding: "16px 24px", borderRadius: "14px", marginBottom: "28px", width: "100%",
        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
      }}>
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#10b981", marginBottom: "4px" }}>
          Tiếp theo: Giai đoạn 2 – Bài tập
        </p>
        <p style={{ fontSize: "13px", color: "#6ee7b7" }}>
          Dạng 1 (Trắc nghiệm) → Dạng 2 (Điền từ) → Dạng 3 (Ghép cặp tất cả 5 từ)
        </p>
      </div>
      <button onClick={onStartPhase2} style={{
        padding: "15px 48px", borderRadius: "13px", fontSize: "16px", fontWeight: 800,
        fontFamily: "Outfit, sans-serif", border: "none", cursor: "pointer",
        background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff",
        boxShadow: "0 0 28px rgba(16,185,129,0.45)",
      }}>Bắt đầu Giai đoạn 2 →</button>
    </div>
  );
}

// ── Phase 2 Helpers ────────────────────────────────────────────────────────────
const EX_COLORS = { 1: "#a5b4fc", 2: "#fbbf24", 3: "#34d399" };
const EX_BGS = { 1: "rgba(99,102,241,0.15)", 2: "rgba(245,158,11,0.12)", 3: "rgba(52,211,153,0.12)" };
const EX_ICONS = { 1: "🔤", 2: "📝", 3: "🔗" };
const EX_NAMES = { 1: "Trắc nghiệm", 2: "Điền từ", 3: "Ghép cặp" };
const EX_DESCS = {
  1: "Chọn từ tiếng Anh đúng với nghĩa bên dưới",
  2: "Chọn từ đúng để hoàn thành câu",
  3: "Ghép tất cả 5 từ với nghĩa tương ứng",
};

function ExBadge({ type }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "5px 14px", borderRadius: "9999px", fontSize: "12px", fontWeight: 800,
        fontFamily: "Outfit, sans-serif", background: EX_BGS[type], color: EX_COLORS[type],
        border: `1px solid ${EX_COLORS[type]}55`,
      }}>{EX_ICONS[type]} Dạng {type} · {EX_NAMES[type]}</span>
      <span style={{ fontSize: "12px", color: "#8892b0" }}>{EX_DESCS[type]}</span>
    </div>
  );
}

function P2ResultFooter({ word, result, onPass, onFail }) {
  if (!result) return null;
  const ok = result === "correct";
  const accent = ok ? "#10b981" : "#f87171";
  const accentBg = ok ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)";
  const accentBorder = ok ? "rgba(16,185,129,0.35)" : "rgba(248,113,113,0.35)";

  return (
    <div style={{
      marginTop: "12px", padding: "14px 16px", borderRadius: "12px",
      background: accentBg, border: `1px solid ${accentBorder}`,
      animation: "fadeSlideIn 0.2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "20px", color: "#ffffff" }}>
            {word.word}
          </span>
          <span style={{ fontSize: "13px", color: "#8892b0" }}>{word.phonetic}</span>
          <span style={{
            fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px",
            background: "rgba(165,180,252,0.12)", color: "#a5b4fc",
            border: "0.8px solid rgba(165,180,252,0.25)",
          }}>({word.pos})</span>
        </div>
        <button onClick={() => speak(word.word)} style={{
          padding: "7px 13px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
          background: `${accentBg}`, color: accent,
          border: `1px solid ${accentBorder}`, cursor: "pointer", flexShrink: 0,
        }}>🔊 Nghe lại</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 700, color: accent, flex: 1 }}>
          {ok ? "✅ Chính xác!" : `❌ Sai — đáp án: ${word.word}`}
          {!ok && <span style={{ fontSize: "11px", color: "#f87171", marginLeft: "8px", fontStyle: "italic" }}>ôn lại vòng sau</span>}
        </span>
        <button onClick={ok ? onPass : onFail} style={{
          padding: "9px 20px", borderRadius: "9px", fontSize: "14px", fontWeight: 700,
          background: ok ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.08)",
          color: ok ? "#fff" : "#c7d2fe",
          border: ok ? "none" : "1px solid rgba(255,255,255,0.15)",
          cursor: "pointer", fontFamily: "Outfit, sans-serif",
          boxShadow: ok ? "0 0 16px rgba(16,185,129,0.35)" : "none",
        }}>Tiếp theo →</button>
      </div>
    </div>
  );
}

// ── Phase 2: Multiple Choice ───────────────────────────────────────────────────
function P2MultipleChoice({ word, batch, onPass, onFail }) {
  const others = batch.filter(w => w.id !== word.id);
  const options = useRef(shuffle([word, ...pickRandom(others, Math.min(3, others.length))]));
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const pick = (opt) => {
    if (result) return;
    setSelected(opt.id);
    const ok = opt.id === word.id;
    speak(word.word);
    setResult(ok ? "correct" : "wrong");
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.25s ease" }}>
      <ExBadge type={1} />
      <div style={{
        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: "12px", padding: "18px 20px", marginBottom: "16px",
      }}>
        <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "24px",
          color: "#ffffff", textAlign: "center" }}>"{word.meaning}"</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {options.current.map(opt => {
          const isSel = selected === opt.id;
          const isOk = opt.id === word.id;
          return (
            <button key={opt.id} onClick={() => pick(opt)} style={{
              padding: "14px 20px", borderRadius: "11px", textAlign: "left",
              cursor: result ? "default" : "pointer",
              fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "17px",
              background: !result ? (isSel ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)")
                : isOk ? "rgba(16,185,129,0.18)" : isSel ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.03)",
              border: !result ? (isSel ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.12)")
                : isOk ? "1.5px solid rgba(16,185,129,0.5)" : isSel ? "1.5px solid rgba(248,113,113,0.5)" : "1px solid rgba(255,255,255,0.06)",
              color: !result ? "#ffffff" : isOk ? "#10b981" : isSel ? "#f87171" : "#5a6a8a",
              transition: "all 0.18s",
            }}>{opt.word}</button>
          );
        })}
      </div>
      <P2ResultFooter word={word} result={result} onPass={onPass} onFail={onFail} />
    </div>
  );
}

// ── Phase 2: Fill Blank ────────────────────────────────────────────────────────
function P2FillBlank({ word, batch, onPass, onFail }) {
  const others = batch.filter(w => w.id !== word.id);
  const exRef = useRef(word.examples[Math.floor(Math.random() * word.examples.length)]);
  const options = useRef(shuffle([word, ...pickRandom(others, Math.min(3, others.length))]));
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const ex = exRef.current;
  const parts = ex.en.split("___");

  const pick = (opt) => {
    if (result) return;
    setSelected(opt.id);
    const ok = opt.id === word.id;
    speak(word.word);
    setResult(ok ? "correct" : "wrong");
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.25s ease" }}>
      <ExBadge type={2} />
      <div style={{
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "12px", padding: "16px 20px", marginBottom: "16px",
      }}>
        <p style={{ fontSize: "17px", color: "#e8eaf6", lineHeight: 1.9, fontFamily: "Inter, sans-serif" }}>
          {parts[0]}
          <span style={{
            display: "inline-block", minWidth: "80px", height: "22px",
            borderBottom: `2.5px solid ${result === "correct" ? "#10b981" : result === "wrong" ? "#f87171" : "#fbbf24"}`,
            verticalAlign: "bottom", margin: "0 4px",
            color: result === "correct" ? "#10b981" : result === "wrong" ? "#f87171" : "#fbbf24",
            fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "17px",
            textAlign: "center", lineHeight: "22px",
          }}>{result ? word.word : ""}</span>
          {parts[1]}
        </p>
        <p style={{ fontSize: "13px", color: "#8892b0", marginTop: "8px", fontStyle: "italic" }}>{ex.vi}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {options.current.map(opt => {
          const isSel = selected === opt.id;
          const isOk = opt.id === word.id;
          return (
            <button key={opt.id} onClick={() => pick(opt)} style={{
              padding: "14px", borderRadius: "11px", cursor: result ? "default" : "pointer",
              fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "16px",
              background: !result ? (isSel ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)")
                : isOk ? "rgba(16,185,129,0.18)" : isSel ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.03)",
              border: !result ? (isSel ? "1.5px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.12)")
                : isOk ? "1.5px solid rgba(16,185,129,0.5)" : isSel ? "1.5px solid rgba(248,113,113,0.5)" : "1px solid rgba(255,255,255,0.06)",
              color: !result ? "#ffffff" : isOk ? "#10b981" : isSel ? "#f87171" : "#5a6a8a",
              transition: "all 0.18s",
            }}>{opt.word}</button>
          );
        })}
      </div>
      <P2ResultFooter word={word} result={result} onPass={onPass} onFail={onFail} />
    </div>
  );
}

// ── Phase 2: Matching All ──────────────────────────────────────────────────────
function P2MatchingAll({ batch, onComplete }) {
  const left = useRef(shuffle(batch));
  const right = useRef(shuffle(batch));
  const [selLeft, setSelLeft] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrongPair, setWrongPair] = useState(null);
  const [allDone, setAllDone] = useState(false);

  const pickLeft = (id) => {
    if (matched[id]) return;
    setSelLeft(id);
    setWrongPair(null);
  };

  const pickRight = (rw) => {
    if (!selLeft || matched[rw.id]) return;
    const ok = selLeft === rw.id;
    if (ok) {
      const next = { ...matched, [rw.id]: true };
      setMatched(next);
      setSelLeft(null);
      if (Object.keys(next).length === batch.length) {
        setAllDone(true);
        setTimeout(onComplete, 1000);
      }
    } else {
      setWrongPair({ l: selLeft, r: rw.id });
      setSelLeft(null);
      setTimeout(() => setWrongPair(null), 700);
    }
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.25s ease" }}>
      <ExBadge type={3} />
      <p style={{ fontSize: "13px", color: "#8892b0", marginBottom: "16px" }}>
        Chọn từ tiếng Anh → chọn nghĩa tiếng Việt tương ứng. Ghép đúng tất cả {batch.length} từ.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Từ tiếng Anh</p>
          {left.current.map(w => {
            const done = matched[w.id];
            const isSel = selLeft === w.id;
            const isWrong = wrongPair?.l === w.id;
            return (
              <button key={w.id} onClick={() => pickLeft(w.id)} style={{
                padding: "12px 14px", borderRadius: "11px",
                fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "14px",
                background: done ? "rgba(16,185,129,0.15)" : isWrong ? "rgba(248,113,113,0.15)" : isSel ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)",
                border: done ? "1.5px solid rgba(16,185,129,0.45)" : isWrong ? "1.5px solid rgba(248,113,113,0.5)" : isSel ? "1.5px solid rgba(52,211,153,0.55)" : "1px solid rgba(255,255,255,0.12)",
                color: done ? "#10b981" : isWrong ? "#f87171" : isSel ? "#34d399" : "#ffffff",
                cursor: done ? "default" : "pointer",
                transition: "all 0.18s",
                opacity: done ? 0.65 : 1,
              }}>{done ? "✓ " : ""}{w.word}</button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#5a6a8a",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Nghĩa tiếng Việt</p>
          {right.current.map(w => {
            const done = matched[w.id];
            const isWrong = wrongPair?.r === w.id;
            return (
              <button key={w.id} onClick={() => pickRight(w)} style={{
                padding: "12px 14px", borderRadius: "11px", fontSize: "12px",
                fontFamily: "Inter, sans-serif", fontWeight: 600,
                background: done ? "rgba(16,185,129,0.15)" : isWrong ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.06)",
                border: done ? "1.5px solid rgba(16,185,129,0.45)" : isWrong ? "1.5px solid rgba(248,113,113,0.5)" : "1px solid rgba(255,255,255,0.12)",
                color: done ? "#10b981" : isWrong ? "#f87171" : "#e8eaf6",
                cursor: done ? "default" : "pointer",
                transition: "all 0.18s",
                opacity: done ? 0.65 : 1,
                lineHeight: 1.4,
              }}>{w.meaning}</button>
            );
          })}
        </div>
      </div>
      {wrongPair && (
        <div style={{ marginTop: "10px", padding: "10px 14px", borderRadius: "9px",
          background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
          animation: "fadeSlideIn 0.2s ease" }}>
          <p style={{ fontSize: "13px", color: "#f87171", fontWeight: 600 }}>❌ Ghép sai — thử cặp khác</p>
        </div>
      )}
      {allDone && (
        <div style={{ marginTop: "14px", padding: "16px", borderRadius: "12px", textAlign: "center",
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.4)",
          animation: "fadeSlideIn 0.25s ease" }}>
          <p style={{ fontSize: "22px", marginBottom: "4px" }}>🎉</p>
          <p style={{ fontSize: "16px", fontWeight: 800, color: "#10b981", fontFamily: "Outfit, sans-serif" }}>
            Ghép đúng tất cả {batch.length} từ!
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main LearningSession ───────────────────────────────────────────────────────
function LearningSession({ folder, dailyGoal, wordsLearned, onWordComplete, onBack, mode = "learn" }) {
  const isReview = mode === "review";
  const srcWords = isReview
    ? folder.words.filter(w => w.lv > 0)
    : folder.words.filter(w => w.lv === 0);
  const batch = useRef(shuffle(srcWords).slice(0, Math.min(5, srcWords.length)));

  const [phase, setPhase] = useState(1);
  const [exType, setExType] = useState(1);
  const [queue, setQueue] = useState(() => [...batch.current]);
  const [qIdx, setQIdx] = useState(0);
  const [failedIds, setFailedIds] = useState([]);
  const [roundNum, setRoundNum] = useState(1);
  const [p1FirstRound, setP1FirstRound] = useState({});
  const [errorCounts, setErrorCounts] = useState({});
  const [showSuggestion, setShowSuggestion] = useState(null);

  const currentWord = queue[Math.min(qIdx, queue.length - 1)];

  // ── Hoàn thành 1 từ ──
  const completeWord = (wordId, isCorrect) => {
    const wId = wordId || queue[qIdx]?.id;
    if (!wId) return;

    // Review mode: tracking errors
    if (mode === 'review' && !isCorrect) {
      const newCount = (errorCounts[wId] || 0) + 1;
      setErrorCounts(prev => ({ ...prev, [wId]: newCount }));

      if (newCount >= 4) {
        const word = batch.current.find(w => w.id === wId);
        if (word) {
          setShowSuggestion({ word, wordId: wId });
          return;
        }
      }
    }

    const newFailed = isCorrect ? failedIds : [...failedIds, wId];

    if (phase === 1 && roundNum === 1) {
      setP1FirstRound(prev => ({ ...prev, [wId]: isCorrect }));
    }

    const nextIdx = qIdx + 1;
    if (nextIdx < queue.length) {
      setQIdx(nextIdx);
      setFailedIds(newFailed);
    } else {
      if (newFailed.length > 0) {
        const retryQueue = batch.current.filter(w => newFailed.includes(w.id));
        setQueue(retryQueue);
        setQIdx(0);
        setFailedIds([]);
        setRoundNum(r => r + 1);
      } else {
        finishCurrentRound();
      }
    }
  };

  // ── Xử lý Suggestion ──
  const handleSuggestion = (wordId, action) => {
    const word = batch.current.find(w => w.id === wordId);
    if (!word) {
      setShowSuggestion(null);
      return;
    }

    switch (action) {
      case 'reset':
        word.lv = 1;
        word.next_review = Date.now() + 20 * 60 * 1000;
        break;
      case 'demote':
        word.lv = Math.max(word.lv - 1, 1);
        // ✅ FIX: Sử dụng SRS_SECONDS để lấy đúng số giây
        const seconds = SRS_SECONDS[word.lv] || 0;
        word.next_review = Date.now() + seconds * 1000;
        break;
      case 'skip':
        // Giữ nguyên
        break;
      default:
        break;
    }

    // ✅ FIX: Gọi onWordComplete để cập nhật tiến độ
    if (onWordComplete) {
      onWordComplete();
    }

    setShowSuggestion(null);
    setErrorCounts(prev => ({ ...prev, [wordId]: 0 }));

    const newFailed = failedIds.filter(id => id !== wordId);
    const nextIdx = qIdx + 1;

    if (nextIdx < queue.length) {
      setQIdx(nextIdx);
      setFailedIds(newFailed);
    } else {
      if (newFailed.length > 0) {
        const retryQueue = batch.current.filter(w => newFailed.includes(w.id));
        setQueue(retryQueue);
        setQIdx(0);
        setFailedIds([]);
        setRoundNum(r => r + 1);
      } else {
        finishCurrentRound();
      }
    }
  };

  const finishCurrentRound = () => {
    if (phase === 1) {
      setPhase("transition");
    } else if (exType === 1) {
      setExType(2);
      resetQueue();
    } else if (exType === 2) {
      setExType(3);
      // Matching all sẽ handle riêng
    }
  };

  const resetQueue = () => {
    setQueue([...batch.current]);
    setQIdx(0);
    setFailedIds([]);
    setRoundNum(1);
    setErrorCounts({});
  };

  const startPhase2 = () => {
    setPhase(2);
    setExType(1);
    resetQueue();
  };

  const onMatchingComplete = () => {
    // ✅ FIX: Gọi onWordComplete cho mỗi từ trong batch
    batch.current.forEach(() => {
      if (onWordComplete) onWordComplete();
    });
    onBack();
  };

  const showTopBar = phase !== "transition";
  const cardShadow = phase === 1
    ? "0 0 40px rgba(99,102,241,0.18)"
    : exType === 1 ? "0 0 40px rgba(99,102,241,0.15)"
    : exType === 2 ? "0 0 40px rgba(245,158,11,0.12)"
    : "0 0 40px rgba(52,211,153,0.15)";

  return (
    <div style={{ minHeight: "100vh" }}>
      {showTopBar && (
        <SessionTopBar
          phase={phase}
          exType={exType}
          queueLen={queue.length}
          qIdx={qIdx}
          roundNum={roundNum}
          wordsLearned={wordsLearned}
          dailyGoal={dailyGoal}
          onBack={onBack}
          folder={folder}
        />
      )}

      {phase === "transition" && (
        <PhaseTransition
          batch={batch.current}
          p1FirstRound={p1FirstRound}
          onStartPhase2={startPhase2}
        />
      )}

      {phase !== "transition" && (
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 80px" }}>
          {phase === 2 && exType === 3 && (
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#34d399",
              fontFamily: "Outfit, sans-serif", marginBottom: "16px" }}>
              Dạng 3 — Ghép tất cả {batch.current.length} từ với nghĩa
            </p>
          )}

          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "26px 28px",
            boxShadow: `${cardShadow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}>
            {phase === 1 && currentWord && (
              <Phase1Spelling
                key={`p1-${currentWord.id}-r${roundNum}`}
                word={currentWord}
                onPass={() => completeWord(currentWord.id, true)}
                onFail={() => completeWord(currentWord.id, false)}
              />
            )}
            {phase === 2 && exType === 1 && currentWord && (
              <P2MultipleChoice
                key={`mc-${currentWord.id}-r${roundNum}`}
                word={currentWord}
                batch={batch.current}
                onPass={() => completeWord(currentWord.id, true)}
                onFail={() => completeWord(currentWord.id, false)}
              />
            )}
            {phase === 2 && exType === 2 && currentWord && (
              <P2FillBlank
                key={`fb-${currentWord.id}-r${roundNum}`}
                word={currentWord}
                batch={batch.current}
                onPass={() => completeWord(currentWord.id, true)}
                onFail={() => completeWord(currentWord.id, false)}
              />
            )}
            {phase === 2 && exType === 3 && (
              <P2MatchingAll
                key="matching-all"
                batch={batch.current}
                onComplete={onMatchingComplete}
              />
            )}
          </div>
        </div>
      )}

      {showSuggestion && (
        <SuggestionDialog
          word={showSuggestion.word}
          onChoose={(action) => handleSuggestion(showSuggestion.wordId, action)}
        />
      )}
    </div>
  );
}

export { LearningSession };