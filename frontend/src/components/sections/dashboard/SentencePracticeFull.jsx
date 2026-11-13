// src/components/sections/dashboard/SentencePracticeFull.jsx
// STT 17 - Đặt câu + Sửa lỗi AI. AI THẬT (Gemini/Claude) ra đề và chấm: điểm ngữ pháp / từ vựng / tự nhiên,
// danh sách lỗi kèm giải thích, câu đã sửa. Khi AI chưa bật hoặc đang lỗi, trang nói rõ và chỉ so khớp đáp án
// mẫu - KHÔNG hiển thị điểm bịa (bản cũ tính điểm từ đúng/sai hoặc độ dài câu).
import { useState, useEffect, useCallback, useRef } from "react";
import { swr } from "../../../api/cache";
import { aiPracticeApi, foldersApi, FOLDERS_CACHE_KEY } from "../../../api/client";

const LEVEL_CFG = {   // 5 cấp độ phân biệt bằng họ màu + độ sáng: xám → rêu → ngọc nhạt → ngọc → đỏ
  A1:    { color: "#a2acb3", glow: "rgba(162,172,179,0.16)", desc: "Cơ bản" },
  B1:    { color: "#a3bd6a", glow: "rgba(163,189,106,0.18)", desc: "Trung cấp" },
  B2:    { color: "#5eead4", glow: "rgba(94,234,212,0.18)",  desc: "Trên trung cấp" },
  C1:    { color: "#14b8a6", glow: "rgba(20,184,166,0.2)",   desc: "Nâng cao" },
  IELTS: { color: "#f87171", glow: "rgba(248,113,113,0.18)", desc: "Học thuật" },
};

const ERROR_TYPE_VI = {
  grammar: "Ngữ pháp", vocabulary: "Từ vựng", spelling: "Chính tả", word_order: "Trật tự từ",
  punctuation: "Dấu câu", naturalness: "Độ tự nhiên", meaning: "Sai nghĩa",
};

const AI_NOTICE = {
  AI_NOT_CONFIGURED: "Chưa bật AI nên chưa chấm điểm chi tiết được. Đang dùng câu mẫu cố định và chỉ so khớp đáp án.",
  AI_MISCONFIGURED: "Cấu hình AI chưa đúng. Đang dùng câu mẫu cố định.",
  AI_BUSY: "Dịch vụ AI đang quá tải. Đang dùng câu mẫu cố định, thử lại sau ít phút.",
  AI_UNAVAILABLE: "Không kết nối được AI. Đang dùng câu mẫu cố định.",
};

function HighlightWord({ text, word }) {
  if (!word) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(word.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: "rgba(94,234,212,0.18)", color: "#5eead4", borderBottom: "2px solid #5eead4", borderRadius: 3, padding: "0 2px", fontWeight: 700 }}>
        {text.slice(idx, idx + word.length)}
      </span>
      {text.slice(idx + word.length)}
    </>
  );
}

function ScoreDot({ label, score }) {
  const color = score >= 8 ? "#86a24d" : score >= 6 ? "#5eead4" : "#f87171";
  const r = 18, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div style={{ position: "relative", width: 50, height: 50 }}>
        <svg width="50" height="50" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
          <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={circ}
            strokeDashoffset={circ * (1 - score / 10)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 13, color }}>{score}</span>
      </div>
      <span style={{ fontSize: 11, color: "#a2acb3" }}>{label}</span>
    </div>
  );
}

function TabBtn({ active, onClick, children, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .2s",
      background: active ? (color || "linear-gradient(135deg,#0f766e,#0e8077)") : "transparent",
      color: active ? "#ffffff" : "#a2acb3", boxShadow: active ? "0 0 14px rgba(20,184,166,0.35)" : "none",
    }}>
      {children}
    </button>
  );
}

const panel = { background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 22 };
const tabsWrap = { display: "flex", background: "rgba(255,255,255,0.05)", border: "0.8px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 4, gap: 3 };

export default function SentencePracticePageFull() {
  const [mode, setMode] = useState("random");            // "random" = câu theo trình độ | "vocab" = theo từ trong folder của bạn
  const [level, setLevel] = useState("B1");
  const [direction, setDirection] = useState("en-vi");   // en-vi: đề tiếng Anh, viết tiếng Việt | vi-en: ngược lại
  const [folders, setFolders] = useState([]);
  const [folderId, setFolderId] = useState("");

  const [question, setQuestion] = useState(null);        // { token, prompt, hint, word, source, ai_available, ai_error }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [history, setHistory] = useState([]);
  const requestId = useRef(0);                           // bỏ qua phản hồi cũ khi người dùng đổi bộ lọc liên tục

  const apiMode = direction === "en-vi" ? "en_vi" : "vi_en";
  const accent = LEVEL_CFG[level].color;

  // Danh sách folder của người dùng (cho chế độ luyện theo từ)
  useEffect(() => {
    let cancelled = false;
    swr(FOLDERS_CACHE_KEY, () => foldersApi.list(), () => {}).then((data) => {
      if (cancelled) return;
      const all = [...(data.system_folders || []), ...(data.personal_folders || [])].filter((f) => (f.total_words ?? f.word_count ?? 0) > 0);
      setFolders(all);
      setFolderId((current) => current || all[0]?.id || "");
    }).catch(() => { /* chế độ theo từ sẽ báo "chưa có folder" */ });
    return () => { cancelled = true; };
  }, []);

  // Câu kế tiếp được tải sẵn ở nền: bấm "Câu tiếp" là có ngay, không phải chờ AI/server thêm vài giây.
  const prefetched = useRef({ key: "", promise: null });
  const fetchQuestion = useCallback(
    () => aiPracticeApi.sentence(level, apiMode, mode === "vocab" ? { folderId } : {}),
    [level, apiMode, mode, folderId]
  );

  const loadQuestion = useCallback(async () => {
    const id = ++requestId.current;
    const key = `${level}|${apiMode}|${mode}|${folderId}`;
    setLoading(true);
    setLoadError("");
    try {
      const ready = prefetched.current.key === key ? prefetched.current.promise : null;
      prefetched.current = { key: "", promise: null };
      const q = await (ready ? ready.catch(() => fetchQuestion()) : fetchQuestion());
      if (id !== requestId.current) return;
      prefetched.current = { key, promise: fetchQuestion() };
      prefetched.current.promise.catch(() => {});
      setQuestion(q);
      setAnswer("");
      setResult(null);
      setCheckError("");
      setShowHint(false);
    } catch (err) {
      if (id !== requestId.current) return;
      setQuestion(null);
      setLoadError(err.message || "Không tải được câu luyện tập.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [level, apiMode, mode, folderId, fetchQuestion]);

  // Tải câu mới khi đổi chế độ / trình độ / chiều dịch / folder. (vocab cần có folder trước)
  useEffect(() => {
    if (mode === "vocab" && !folderId) return;
    Promise.resolve().then(loadQuestion);
  }, [loadQuestion, mode, folderId]);

  async function handleSubmit() {
    if (!answer.trim() || checking || !question) return;
    setChecking(true);
    setCheckError("");
    try {
      const res = await aiPracticeApi.check({ token: question.token, answer: answer.trim() });
      setResult(res);
      setHistory((prev) => [{ prompt: question.prompt, answer: answer.trim(), res }, ...prev].slice(0, 20));
    } catch (err) {
      if (err.code === "INVALID_TOKEN") {
        setCheckError("Câu hỏi đã hết hạn, đang lấy câu mới...");
        loadQuestion();
      } else {
        setCheckError(err.message || "Không chấm được câu trả lời, vui lòng thử lại.");
      }
    } finally {
      setChecking(false);
    }
  }

  const needsFolder = mode === "vocab" && folders.length === 0;
  const aiNotice = question?.ai_error ? (AI_NOTICE[question.ai_error.code] || question.ai_error.message) : "";
  const promptIsEnglish = direction === "en-vi";

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0f1214", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "fixed", left: -100, top: 80, width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${LEVEL_CFG[level].glow} 0%, transparent 70%)`, filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 20px 80px", position: "relative" }}>
        <h1 style={{
          fontFamily: "Outfit, sans-serif", fontSize: 28, fontWeight: 800, margin: "0 0 4px",
          background: "linear-gradient(120deg,#e9edef 0%,#5eead4 40%,#e9edef 60%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>✍️ Đặt câu · Dịch câu</h1>
        <p style={{ color: "#a2acb3", fontSize: 14, margin: "0 0 22px" }}>AI ra đề, chấm điểm và sửa lỗi câu dịch của bạn</p>

        {/* Bộ chọn */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <div style={tabsWrap}>
            <TabBtn active={mode === "random"} onClick={() => setMode("random")}>🎲 Theo trình độ</TabBtn>
            <TabBtn active={mode === "vocab"} onClick={() => setMode("vocab")}>📚 Theo từ của bạn</TabBtn>
          </div>
          <div style={tabsWrap}>
            <TabBtn active={direction === "en-vi"} onClick={() => setDirection("en-vi")}>🇬🇧 → 🇻🇳</TabBtn>
            <TabBtn active={direction === "vi-en"} onClick={() => setDirection("vi-en")}>🇻🇳 → 🇬🇧</TabBtn>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: mode === "vocab" ? 12 : 20, flexWrap: "wrap" }}>
          {Object.entries(LEVEL_CFG).map(([lv, cfg]) => (
            <button key={lv} onClick={() => setLevel(lv)} title={cfg.desc} style={{
              padding: "6px 16px", borderRadius: 9999, fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: level === lv ? `${cfg.color}26` : "rgba(255,255,255,0.05)", color: level === lv ? cfg.color : "#a2acb3",
              border: `0.8px solid ${level === lv ? cfg.color : "rgba(255,255,255,0.08)"}`,
            }}>{lv}</button>
          ))}
        </div>

        {mode === "vocab" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {needsFolder
              ? <span style={{ color: "#a2acb3", fontSize: 13 }}>Bạn chưa có folder nào có từ. Hãy lưu từ vào thư mục hoặc học một folder trước.</span>
              : folders.map((f) => (
                <button key={f.id} onClick={() => setFolderId(f.id)} style={{
                  padding: "6px 14px", borderRadius: 9999, fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                  background: folderId === f.id ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.05)", color: folderId === f.id ? "#99f6e4" : "#a2acb3",
                  border: `0.8px solid ${folderId === f.id ? "rgba(20,184,166,0.5)" : "rgba(255,255,255,0.08)"}`,
                }}>{f.name}</button>
              ))}
          </div>
        )}

        {aiNotice && (
          <div role="status" style={{ margin: "0 0 16px", padding: "10px 14px", borderRadius: 10, fontSize: 13, color: "#fecaca",
            background: "rgba(108,27,27,0.35)", border: "0.8px solid rgba(239,68,68,0.3)" }}>
            ⚠️ {aiNotice}
          </div>
        )}

        {/* Câu hỏi */}
        <div style={panel}>
          {loading && <p style={{ color: "#a2acb3", margin: 0 }}>AI đang soạn câu...</p>}

          {!loading && loadError && (
            <div role="alert" style={{ color: "#fecaca" }}>
              <p style={{ margin: "0 0 12px" }}>⚠️ {loadError}</p>
              <button onClick={loadQuestion} style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, background: "#f87171", color: "#450a0a" }}>Thử lại</button>
            </div>
          )}

          {!loading && question && (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#a2acb3" }}>{promptIsEnglish ? "Dịch sang tiếng Việt:" : "Dịch sang tiếng Anh:"}</span>
                {question.source === "ai" && <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 6, background: "rgba(20,184,166,0.15)", color: "#5eead4" }}>AI soạn</span>}
              </div>
              <p style={{ fontFamily: "Outfit, sans-serif", fontSize: 22, fontWeight: 700, color: "#f4f6f7", lineHeight: 1.5, margin: "0 0 12px" }}>
                {promptIsEnglish ? <HighlightWord text={question.prompt} word={question.word} /> : question.prompt}
              </p>
              {!promptIsEnglish && question.word && (
                <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "#5eead4" }}>💡 Hãy dùng từ: <b>{question.word}</b></p>
              )}
              {question.hint && question.hint !== question.word && (
                <button onClick={() => setShowHint((v) => !v)} style={{ background: "none", border: "none", color: "#a2acb3", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 10 }}>
                  {showHint ? `💡 ${question.hint}` : "💡 Xem gợi ý"}
                </button>
              )}

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit(); }}
                disabled={!!result}
                maxLength={500}
                rows={3}
                aria-label="Câu trả lời của bạn"
                placeholder={promptIsEnglish ? "Nhập bản dịch tiếng Việt..." : "Type your English translation..."}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, fontSize: 15, outline: "none", resize: "vertical",
                  background: "rgba(255,255,255,0.05)", border: `0.8px solid ${accent}55`, color: "#e9edef", fontFamily: "Inter, sans-serif",
                }}
              />
              {checkError && <p role="alert" style={{ color: "#fca5a5", fontSize: 13, margin: "8px 0 0" }}>⚠️ {checkError}</p>}

              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                {!result ? (
                  <>
                    <button onClick={handleSubmit} disabled={!answer.trim() || checking} style={{
                      padding: "10px 26px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", color: "#ffffff",
                      cursor: !answer.trim() || checking ? "not-allowed" : "pointer", opacity: !answer.trim() || checking ? 0.55 : 1,
                      background: "linear-gradient(135deg,#0f766e,#0e8077)",
                    }}>{checking ? "AI đang chấm..." : "Chấm bài  (Ctrl+Enter)"}</button>
                    <button onClick={loadQuestion} disabled={checking} style={{ padding: "10px 20px", borderRadius: 10, fontSize: 14, cursor: "pointer", background: "transparent", color: "#a2acb3", border: "0.8px solid rgba(255,255,255,0.12)" }}>
                      Bỏ qua →
                    </button>
                  </>
                ) : (
                  <button onClick={loadQuestion} style={{ padding: "10px 26px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", color: "#ffffff", cursor: "pointer", background: "linear-gradient(135deg,#0f766e,#0e8077)" }}>
                    Câu tiếp theo →
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Kết quả */}
        {result && (
          <div style={{ ...panel, marginTop: 16, borderColor: result.correct ? "rgba(134,162,77,0.35)" : "rgba(248,113,113,0.3)" }}>
            <p style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 800, fontFamily: "Outfit, sans-serif", color: result.correct ? "#a3bd6a" : "#fca5a5" }}>
              {result.correct ? "✅ Bản dịch đạt" : "✏️ Cần sửa lại"}
              {result.graded_by === "ai" && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "rgba(20,184,166,0.15)", color: "#5eead4" }}>AI chấm</span>}
            </p>

            {result.scores && (
              <div style={{ display: "flex", gap: 22, marginBottom: 16 }}>
                <ScoreDot label="Ngữ pháp" score={result.scores.grammar} />
                <ScoreDot label="Từ vựng" score={result.scores.vocabulary} />
                <ScoreDot label="Tự nhiên" score={result.scores.naturalness} />
              </div>
            )}

            {result.feedback && <p style={{ color: "#dde2e5", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 14px" }}>{result.feedback}</p>}

            {result.corrected && result.corrected !== answer.trim() && (
              <div style={{ margin: "0 0 14px", padding: "10px 14px", borderRadius: 10, background: "rgba(134,162,77,0.08)", border: "0.8px solid rgba(134,162,77,0.25)" }}>
                <span style={{ fontSize: 12, color: "#bcd08c", fontWeight: 700 }}>Câu đã sửa</span>
                <p style={{ margin: "4px 0 0", color: "#f4f6f7", fontSize: 15 }}>{result.corrected}</p>
              </div>
            )}

            {result.errors?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700 }}>Lỗi cần sửa</span>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ marginTop: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 8px", borderRadius: 6, background: "rgba(248,113,113,0.12)", color: "#fca5a5" }}>{ERROR_TYPE_VI[e.type] || e.type}</span>
                      {e.original && <span style={{ color: "#f87171", textDecoration: "line-through", fontSize: 14 }}>{e.original}</span>}
                      {e.fix && <><span style={{ color: "#a2acb3" }}>→</span><span style={{ color: "#a3bd6a", fontWeight: 600, fontSize: 14 }}>{e.fix}</span></>}
                    </div>
                    {e.explanation_vi && <p style={{ margin: "6px 0 0", color: "#a8b1b8", fontSize: 13.5, lineHeight: 1.5 }}>{e.explanation_vi}</p>}
                  </div>
                ))}
              </div>
            )}

            {result.alternatives?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: "#5eead4", fontWeight: 700 }}>Cách dịch khác</span>
                {result.alternatives.map((a, i) => <p key={i} style={{ margin: "4px 0 0", color: "#99f6e4", fontSize: 14 }}>• {a}</p>)}
              </div>
            )}

            {result.expected_answer && (
              <div>
                <span style={{ fontSize: 12, color: "#a2acb3", fontWeight: 700 }}>Đáp án gợi ý</span>
                <p style={{ margin: "4px 0 0", color: "#dde2e5", fontSize: 14.5 }}>{result.expected_answer}</p>
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <p style={{ color: "#a2acb3", fontSize: 13, fontWeight: 700, margin: "0 0 10px" }}>Lịch sử buổi luyện ({history.length})</p>
            {history.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", marginBottom: 8, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 16 }}>{h.res.correct ? "✅" : "✏️"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, color: "#dde2e5", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.prompt}</p>
                  <p style={{ margin: "2px 0 0", color: "#a2acb3", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.answer}</p>
                </div>
                {h.res.scores && (
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#5eead4", whiteSpace: "nowrap" }}>
                    {Math.round((h.res.scores.grammar + h.res.scores.vocabulary + h.res.scores.naturalness) / 3)}/10
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
