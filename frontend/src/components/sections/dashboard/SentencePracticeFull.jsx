import { useState, useMemo } from "react";

// ── Config ────────────────────────────────────────────────────────────────────

const LEVEL_CFG = {
  A1:    { color: "#10b981", bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.3)",  glow: "rgba(16,185,129,0.2)",  desc: "Cơ bản" },
  B1:    { color: "#34d399", bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.3)",  glow: "rgba(52,211,153,0.2)",  desc: "Trung cấp" },
  B2:    { color: "#a5b4fc", bg: "rgba(165,180,252,0.15)", border: "rgba(165,180,252,0.3)", glow: "rgba(165,180,252,0.2)", desc: "Trên trung cấp" },
  C1:    { color: "#8b5cf6", bg: "rgba(139,92,246,0.15)",  border: "rgba(139,92,246,0.3)",  glow: "rgba(139,92,246,0.2)",  desc: "Nâng cao" },
  IELTS: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.3)",  glow: "rgba(245,158,11,0.2)",  desc: "Học thuật" },
};

const LV_CFG = {
  Lv1: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
  Lv2: { color: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.3)" },
  Lv3: { color: "#a5b4fc", bg: "rgba(165,180,252,0.15)", border: "rgba(165,180,252,0.3)" },
  Lv4: { color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)" },
  Lv5: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
  Lv6: { color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.3)" },
};

// ── Mode 1: sentences from learned vocab ──────────────────────────────────────

const VOCAB_SENTENCES = [
  { id: 101, word: "accomplish", folder: "Công việc", lv: "Lv3",
    en: "She managed to accomplish all her goals despite the obstacles.",
    vi: "Cô ấy đã hoàn thành tất cả mục tiêu dù gặp nhiều trở ngại.",
    tip: "\"Manage to do\": xoay sở làm được (sau khi vượt khó). \"Despite + N/V-ing\" = mặc dù." },
  { id: 102, word: "accomplish", folder: "Công việc", lv: "Lv3",
    en: "What did you accomplish at work today?",
    vi: "Hôm nay bạn đã hoàn thành được gì ở chỗ làm?",
    tip: "\"Accomplish\" thường đi với mục tiêu cụ thể: accomplish a goal / task / mission." },
  { id: 103, word: "significant", folder: "Học thuật", lv: "Lv4",
    en: "The research showed a significant improvement in test scores.",
    vi: "Nghiên cứu cho thấy sự cải thiện đáng kể trong điểm kiểm tra.",
    tip: "\"Significant\" (đáng kể) thường đi với improvement, change, difference, impact trong văn học thuật." },
  { id: 104, word: "significant", folder: "Học thuật", lv: "Lv4",
    en: "Climate change has a significant impact on global food supply.",
    vi: "Biến đổi khí hậu có tác động đáng kể đến nguồn cung thực phẩm toàn cầu.",
    tip: "\"Have a significant impact on\": cấu trúc hay gặp trong IELTS và văn phong học thuật." },
  { id: 105, word: "milestone", folder: "Công việc", lv: "Lv3",
    en: "Launching our first product was a major milestone for the company.",
    vi: "Ra mắt sản phẩm đầu tiên là một cột mốc lớn của công ty.",
    tip: "\"Milestone\" (cột mốc) luôn đi với số ít sau \"a\" và số nhiều \"milestones\" khi không có mạo từ." },
  { id: 106, word: "perseverance", folder: "Phẩm chất", lv: "Lv5",
    en: "Perseverance is the key to success in any long-term goal.",
    vi: "Sự kiên trì là chìa khóa dẫn đến thành công trong bất kỳ mục tiêu dài hạn nào.",
    tip: "\"Perseverance\" là danh từ không đếm được, không dùng \"a perseverance\". Đồng nghĩa: persistence, determination." },
  { id: 107, word: "collaborate", folder: "Công việc", lv: "Lv3",
    en: "Our team needs to collaborate more effectively to meet the deadline.",
    vi: "Nhóm của chúng tôi cần hợp tác hiệu quả hơn để kịp deadline.",
    tip: "\"Collaborate with\" (ai) hoặc \"collaborate on\" (dự án). Không dùng \"collaborate to someone\"." },
  { id: 108, word: "resilient", folder: "Phẩm chất", lv: "Lv4",
    en: "Children who grow up in supportive environments tend to be more resilient.",
    vi: "Trẻ em lớn lên trong môi trường hỗ trợ thường có xu hướng kiên cường hơn.",
    tip: "\"Resilient\" (adj) → \"resilience\" (n). \"Tend to be\" = có xu hướng, nhẹ hơn \"always are\"." },
  { id: 109, word: "innovative", folder: "Công nghệ", lv: "Lv4",
    en: "The startup introduced an innovative solution to reduce food waste.",
    vi: "Công ty khởi nghiệp đã giới thiệu một giải pháp sáng tạo để giảm lãng phí thực phẩm.",
    tip: "\"Innovative\" đứng trước danh từ (innovative solution/approach/design). Không nói \"very innovative\" — dùng \"highly innovative\"." },
  { id: 110, word: "eloquent", folder: "Giao tiếp", lv: "Lv5",
    en: "The professor gave an eloquent speech that captivated the entire audience.",
    vi: "Giáo sư đã có một bài phát biểu hùng hồn thu hút toàn bộ khán giả.",
    tip: "\"Eloquent\" (hùng hồn, lưu loát) thường đi với: speech, speaker, argument, defense. Danh từ: eloquence." },
  { id: 111, word: "dedicate", folder: "Phẩm chất", lv: "Lv2",
    en: "She dedicated her life to helping people in need.",
    vi: "Cô ấy đã cống hiến cả cuộc đời để giúp đỡ những người cần.",
    tip: "\"Dedicate + O + to + V-ing/N\": dedicate one's life/time/effort to something." },
  { id: 112, word: "analyze", folder: "Học thuật", lv: "Lv3",
    en: "Researchers must carefully analyze the data before drawing conclusions.",
    vi: "Các nhà nghiên cứu phải phân tích dữ liệu cẩn thận trước khi đưa ra kết luận.",
    tip: "\"Analyze\" (Mỹ) = \"analyse\" (Anh). Cả hai đều đúng nhưng nên nhất quán trong bài viết." },
];

// ── Mode 2: random sentences by level ────────────────────────────────────────

const RANDOM_SENTENCES = {
  A1: [
    { id: 1, en: "I go to school every day.",           vi: "Tôi đi học mỗi ngày.",                       word: "every day",  tip: "\"Every day\" (hai chữ) là trạng từ chỉ thói quen; \"everyday\" (một chữ) là tính từ." },
    { id: 2, en: "She likes to eat rice for lunch.",    vi: "Cô ấy thích ăn cơm vào bữa trưa.",           word: "likes",     tip: "Động từ thêm -s/-es với chủ ngữ ngôi ba số ít ở hiện tại đơn." },
    { id: 3, en: "They are happy today.",               vi: "Họ vui vẻ hôm nay.",                         word: "happy",     tip: "\"Happy\" là tính từ, đứng sau \"to be\". Không nói \"They are happily\"." },
    { id: 4, en: "My dog runs fast in the park.",       vi: "Con chó của tôi chạy nhanh trong công viên.", word: "fast",      tip: "\"Fast\" vừa là tính từ vừa là trạng từ, không cần thêm -ly." },
    { id: 5, en: "We drink water every morning.",       vi: "Chúng tôi uống nước mỗi buổi sáng.",         word: "drink",     tip: "Thì hiện tại đơn với \"we\": không thêm -s cho động từ." },
  ],
  B1: [
    { id: 6,  en: "She has been studying English for three years.", vi: "Cô ấy đã học tiếng Anh được ba năm.", word: "has been studying", tip: "Hiện tại hoàn thành tiếp diễn: hành động bắt đầu quá khứ, còn tiếp tục. Dùng \"for\" + khoảng thời gian." },
    { id: 7,  en: "If I have time, I will visit my grandparents.", vi: "Nếu tôi có thời gian, tôi sẽ thăm ông bà.", word: "If… will", tip: "Câu điều kiện loại 1: If + hiện tại đơn, will + V. Khả năng có thể xảy ra." },
    { id: 8,  en: "He decided to dedicate his weekend to volunteering.", vi: "Anh ấy quyết định dành cả cuối tuần để tình nguyện.", word: "dedicate", tip: "\"Dedicate + O + to + V-ing\": cống hiến cái gì đó cho mục đích nào đó." },
    { id: 9,  en: "They analyzed the data before making a decision.", vi: "Họ phân tích dữ liệu trước khi đưa ra quyết định.", word: "analyzed", tip: "\"Before + V-ing\" nối hai hành động theo thứ tự." },
    { id: 10, en: "You should collaborate with your team more often.", vi: "Bạn nên hợp tác với nhóm thường xuyên hơn.", word: "collaborate", tip: "\"Collaborate with\" (ai) hoặc \"collaborate on\" (dự án)." },
  ],
  B2: [
    { id: 11, en: "The innovative design significantly reduced production costs.", vi: "Thiết kế sáng tạo đã giảm đáng kể chi phí sản xuất.", word: "significantly", tip: "\"Significantly\" đặt trước tính từ/động từ chính. Tương đương: considerably, substantially." },
    { id: 12, en: "Perseverance is what distinguishes successful people from others.", vi: "Sự kiên trì là thứ phân biệt người thành công với những người khác.", word: "perseverance", tip: "\"What\" mở đầu mệnh đề danh từ làm chủ ngữ — cấu trúc nhấn mạnh phổ biến B2+." },
    { id: 13, en: "She managed to accomplish all her goals despite the obstacles.", vi: "Cô ấy đã hoàn thành tất cả mục tiêu dù gặp trở ngại.", word: "accomplish", tip: "\"Manage to do\": xoay sở làm được (sau khi vượt khó)." },
    { id: 14, en: "Resilient communities recover faster after natural disasters.", vi: "Cộng đồng kiên cường phục hồi nhanh hơn sau thiên tai.", word: "resilient", tip: "\"Resilient\" (adj) → \"resilience\" (n). Hay gặp trong bài IELTS về xã hội." },
    { id: 15, en: "The report highlighted several significant milestones.", vi: "Báo cáo đã nhấn mạnh một số cột mốc quan trọng.", word: "milestones", tip: "\"Milestones\" số nhiều — không dùng \"a significant milestones\" (lỗi số/mạo từ)." },
  ],
  C1: [
    { id: 16, en: "The eloquent speaker captivated the audience with nuanced arguments.", vi: "Diễn giả hùng hồn đã thu hút khán giả bằng những lập luận tinh tế.", word: "eloquent", tip: "\"Nuanced\" (tinh tế, nhiều sắc thái) — từ C1 rất được ưa trong văn học thuật." },
    { id: 17, en: "His innovative approach to problem-solving has yielded remarkable outcomes.", vi: "Cách tiếp cận sáng tạo của anh ấy đã mang lại kết quả đáng chú ý.", word: "yielded", tip: "\"Yield outcomes/results\" — động từ C1 trang trọng, dùng trong báo cáo học thuật." },
    { id: 18, en: "Policymakers must acknowledge the far-reaching implications of climate change.", vi: "Các nhà hoạch định chính sách phải thừa nhận hệ quả sâu rộng của biến đổi khí hậu.", word: "implications", tip: "\"Implication\" thường dùng số nhiều. \"Far-reaching\" = có ảnh hưởng rộng lớn." },
    { id: 19, en: "The collaborative effort between researchers fostered groundbreaking discoveries.", vi: "Nỗ lực hợp tác giữa các nhà nghiên cứu đã thúc đẩy những khám phá đột phá.", word: "fostered", tip: "\"Foster\" (thúc đẩy, nuôi dưỡng) — gần nghĩa: cultivate, nurture, encourage." },
    { id: 20, en: "She demonstrated unwavering perseverance in the face of adversity.", vi: "Cô ấy thể hiện sự kiên trì không lay chuyển trước nghịch cảnh.", word: "unwavering", tip: "\"Unwavering + N trừu tượng\" là cấu trúc C1 hay. \"In the face of\" = trước, đối mặt với." },
  ],
  IELTS: [
    { id: 21, en: "It is widely acknowledged that sustainable development requires a multifaceted approach.", vi: "Người ta thừa nhận rộng rãi rằng phát triển bền vững đòi hỏi cách tiếp cận đa chiều.", word: "multifaceted", tip: "\"It is + past participle + that\" — cấu trúc phổ biến Task 2 thay cho chủ ngữ \"I\"." },
    { id: 22, en: "The proliferation of digital technologies has fundamentally transformed contemporary society.", vi: "Sự phổ biến của công nghệ số đã thay đổi căn bản xã hội đương đại.", word: "proliferation", tip: "\"Fundamentally transformed\" — cặp trạng từ + động từ mạnh, ghi điểm Lexical Resource." },
    { id: 23, en: "Governments should implement evidence-based policies to address socioeconomic inequality.", vi: "Chính phủ nên thực hiện các chính sách dựa trên bằng chứng để giải quyết bất bình đẳng kinh tế-xã hội.", word: "evidence-based", tip: "Tính từ ghép \"evidence-based\" thường xuất hiện trong IELTS Task 2 về chính sách công." },
    { id: 24, en: "While urbanisation offers economic opportunities, it simultaneously exacerbates environmental degradation.", vi: "Mặc dù đô thị hóa mang lại cơ hội kinh tế, nó đồng thời làm trầm trọng thêm suy thoái môi trường.", word: "exacerbates", tip: "\"Exacerbate\" (làm trầm trọng hơn) — band 7+. \"Simultaneously\" = cùng lúc." },
    { id: 25, en: "The data unequivocally demonstrates a correlation between education levels and income inequality.", vi: "Dữ liệu cho thấy rõ ràng mối tương quan giữa trình độ học vấn và bất bình đẳng thu nhập.", word: "unequivocally", tip: "\"Unequivocally\" — band 8+. Dùng \"demonstrates\" thay \"shows\" để tăng Lexical Resource." },
  ],
};

const ALL_FOLDERS = [...new Set(VOCAB_SENTENCES.map(s => s.folder))];
const ALL_LVS     = [...new Set(VOCAB_SENTENCES.map(s => s.lv))].sort();

// ── Helper components ─────────────────────────────────────────────────────────

function HighlightWord({ text, word }) {
  if (!word) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(word.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{
        background: "rgba(165,180,252,0.18)", color: "#a5b4fc",
        borderBottom: "2px solid #a5b4fc", borderRadius: "3px",
        padding: "0 2px", fontWeight: 700,
      }}>
        {text.slice(idx, idx + word.length)}
      </span>
      {text.slice(idx + word.length)}
    </>
  );
}

function ScoreDot({ label, score }) {
  const color = score >= 8 ? "#10b981" : score >= 6 ? "#a5b4fc" : "#f87171";
  const r = 18, circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
      <div style={{ position: "relative", width: "50px", height: "50px" }}>
        <svg width="50" height="50" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
          <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 10)}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "13px", color }}>
          {score}
        </span>
      </div>
      <span style={{ fontSize: "10px", color: "#8892b0", fontFamily: "Inter, sans-serif" }}>{label}</span>
    </div>
  );
}

function TabBtn({ active, onClick, children, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 20px", borderRadius: "9px", fontSize: "13px", fontWeight: 600,
      fontFamily: "Inter, sans-serif", cursor: "pointer", border: "none", transition: "all 0.22s ease",
      background: active ? (color || "linear-gradient(135deg,#6366f1,#8b5cf6)") : "transparent",
      color: active ? "#fff" : "#8892b0",
      boxShadow: active ? "0 0 14px rgba(99,102,241,0.35)" : "none",
    }}>
      {children}
    </button>
  );
}

// ── Sentence Queue Sidebar ────────────────────────────────────────────────────

function SentenceQueue({ sentences, currentIdx, doneIds, onSelect, accentColor }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)",
      borderRadius: "14px", overflow: "hidden",
    }}>
      <div style={{ padding: "14px 16px", borderBottom: "0.8px solid rgba(255,255,255,0.06)" }}>
        <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "13px", color: "#e8eaf6" }}>
          Phiên luyện
        </p>
        <p style={{ fontSize: "11px", color: "#5a6a8a", marginTop: "2px" }}>
          {doneIds.filter(id => sentences.find(s => s.id === id)).length}/{sentences.length} câu
        </p>
        <div style={{ marginTop: "8px", height: "3px", borderRadius: "9999px",
          background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{
            width: `${(doneIds.filter(id => sentences.find(s => s.id === id)).length / sentences.length) * 100}%`,
            height: "100%", background: accentColor, borderRadius: "9999px", transition: "width 0.5s ease",
          }} />
        </div>
      </div>
      {sentences.map((s, idx) => {
        const done   = doneIds.includes(s.id);
        const active = idx === currentIdx;
        return (
          <div key={s.id} onClick={() => onSelect(idx)}
            style={{
              padding: "11px 14px", cursor: "pointer", transition: "background 0.2s ease",
              borderBottom: idx < sentences.length - 1 ? "0.8px solid rgba(255,255,255,0.04)" : "none",
              background: active ? "rgba(99,102,241,0.09)" : "transparent",
              borderLeft: `2px solid ${active ? accentColor : "transparent"}`,
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(99,102,241,0.09)" : "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600,
                color: done ? "#10b981" : active ? accentColor : "#5a6a8a" }}>
                {done ? "✓" : active ? "▶" : `${idx + 1}`}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px",
                background: "rgba(99,102,241,0.1)", color: "#a5b4fc" }}>
                {s.word?.split(" ")[0] || "—"}
              </span>
            </div>
            <p style={{ fontSize: "11px", color: active ? "#c7d2fe" : "#5a6a8a",
              lineHeight: 1.5, fontFamily: "Inter, sans-serif",
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {s.en}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SentencePracticePage() {
  // Mode: "vocab" = từ đã học | "random" = câu ngẫu nhiên
  const [mode, setMode] = useState("vocab");

  // Mode vocab sub-filters
  const [vocabFilter, setVocabFilter] = useState("folder"); // "folder" | "lv"
  const [activeFolder, setActiveFolder] = useState(ALL_FOLDERS[0]);
  const [activeLv,     setActiveLv]     = useState("Lv3");

  // Mode random
  const [randomLevel, setRandomLevel] = useState("B1");

  // Shared
  const [direction,  setDirection]  = useState("en-vi");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [doneIds,    setDoneIds]    = useState([]);
  const [showTip,    setShowTip]    = useState(false);

  // Resolve active sentence list
  const sentences = useMemo(() => {
    if (mode === "random") return RANDOM_SENTENCES[randomLevel];
    if (vocabFilter === "folder") return VOCAB_SENTENCES.filter(s => s.folder === activeFolder);
    return VOCAB_SENTENCES.filter(s => s.lv === activeLv);
  }, [mode, vocabFilter, activeFolder, activeLv, randomLevel]);

  const safeIdx   = Math.min(currentIdx, sentences.length - 1);
  const current   = sentences[safeIdx];

  // accent color for current mode
  const accentColor = mode === "random"
    ? LEVEL_CFG[randomLevel].color
    : vocabFilter === "lv" ? LV_CFG[activeLv]?.color : "#6366f1";

  const accentGlow = mode === "random" ? LEVEL_CFG[randomLevel].glow : "rgba(99,102,241,0.2)";

  // simulated AI scores
  const scores = submitted ? {
    grammar: userAnswer.length > 8 ? Math.floor(7 + Math.random() * 3) : 5,
    vocab:   userAnswer.length > 8 ? Math.floor(7 + Math.random() * 3) : 4,
    natural: userAnswer.length > 8 ? Math.floor(6 + Math.random() * 4) : 4,
  } : null;
  const isCorrect = submitted && scores && (scores.grammar + scores.vocab + scores.natural) >= 24;

  const sourceText  = direction === "en-vi" ? current.en : current.vi;
  const modelAnswer = direction === "en-vi" ? current.vi : current.en;

  function resetWorkspace() { setUserAnswer(""); setSubmitted(false); setShowTip(false); }

  function handleSubmit() { if (userAnswer.trim()) setSubmitted(true); }

  function handleNext() {
    setDoneIds(p => [...p, current.id]);
    setCurrentIdx((safeIdx + 1) % sentences.length);
    resetWorkspace();
  }

  function handleSkip() {
    setCurrentIdx((safeIdx + 1) % sentences.length);
    resetWorkspace();
  }

  function switchFilter(f) {
    setVocabFilter(f);
    setCurrentIdx(0);
    resetWorkspace();
  }

  function switchFolder(f) {
    setActiveFolder(f);
    setCurrentIdx(0);
    resetWorkspace();
  }

  function switchLv(lv) {
    setActiveLv(lv);
    setCurrentIdx(0);
    resetWorkspace();
  }

  function switchRandomLevel(lv) {
    setRandomLevel(lv);
    setCurrentIdx(0);
    resetWorkspace();
  }

  if (!current) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", color: "#5a6a8a", fontSize: "14px" }}>
      Không có câu nào. Hãy chọn bộ lọc khác.
    </div>
  );

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#07091a", fontFamily: "Inter, sans-serif" }}>
      {/* Glows */}
      <div style={{ position: "fixed", left: "-100px", top: "80px", width: "500px", height: "500px",
        borderRadius: "50%", background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
        filter: "blur(80px)", pointerEvents: "none", transition: "background 0.5s ease" }} />
      <div style={{ position: "fixed", right: "-80px", bottom: "60px", width: "400px", height: "400px",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px 80px", position: "relative" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{
            fontFamily: "Outfit, sans-serif", fontSize: "28px", fontWeight: 800, marginBottom: "4px",
            background: "linear-gradient(120deg,#e8eaf6 0%,#a5b4fc 40%,#e8eaf6 60%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>✍️ Đặt câu · Dịch câu</h1>
          <p style={{ color: "#8892b0", fontSize: "14px" }}>Luyện dịch câu và nhận phản hồi từ AI</p>
        </div>

        {/* ── Mode switcher + direction ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)",
            border: "0.8px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "4px", gap: "3px" }}>
            <TabBtn active={mode === "vocab"} onClick={() => { setMode("vocab"); setCurrentIdx(0); resetWorkspace(); }}>
              📚 Từ đã học
            </TabBtn>
            <TabBtn active={mode === "random"} onClick={() => { setMode("random"); setCurrentIdx(0); resetWorkspace(); }}>
              🎲 Câu ngẫu nhiên
            </TabBtn>
          </div>

          <div style={{ flex: 1 }} />

          {/* Direction toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)",
            border: "0.8px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "3px", gap: "3px" }}>
            {[["en-vi","🇬🇧 EN → VI"],["vi-en","🇻🇳 VI → EN"]].map(([v, label]) => (
              <button key={v} onClick={() => { setDirection(v); resetWorkspace(); }}
                style={{
                  padding: "7px 16px", borderRadius: "7px", fontSize: "12px", fontWeight: 600,
                  fontFamily: "Inter, sans-serif", cursor: "pointer", border: "none", transition: "all 0.2s ease",
                  background: direction === v ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
                  color:      direction === v ? "#fff" : "#8892b0",
                  boxShadow:  direction === v ? "0 0 12px rgba(99,102,241,0.4)" : "none",
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* ── Mode-specific filters ── */}
        {mode === "vocab" ? (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)",
            borderRadius: "14px", padding: "16px 20px", marginBottom: "20px",
          }}>
            {/* Sub-mode: folder vs lv */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {[["folder","📁 Theo chủ đề"],["lv","🎓 Theo cấp độ từ"]].map(([v, label]) => (
                <button key={v} onClick={() => switchFilter(v)}
                  style={{
                    padding: "6px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 600,
                    fontFamily: "Inter, sans-serif", cursor: "pointer", border: "none", transition: "all 0.2s ease",
                    background: vocabFilter === v ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                    color:      vocabFilter === v ? "#a5b4fc" : "#5a6a8a",
                    outline:    vocabFilter === v ? "0.8px solid rgba(99,102,241,0.4)" : "0.8px solid rgba(255,255,255,0.07)",
                  }}
                >{label}</button>
              ))}
              <span style={{ fontSize: "12px", color: "#5a6a8a", alignSelf: "center", marginLeft: "4px" }}>
                {sentences.length} câu
              </span>
            </div>

            {/* Folder chips */}
            {vocabFilter === "folder" && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {ALL_FOLDERS.map(f => {
                  const count = VOCAB_SENTENCES.filter(s => s.folder === f).length;
                  const active = activeFolder === f;
                  return (
                    <button key={f} onClick={() => switchFolder(f)} style={{
                      padding: "6px 14px", borderRadius: "9999px", fontSize: "12px", fontWeight: 500,
                      fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
                      background: active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                      color:      active ? "#a5b4fc" : "#8892b0",
                      border:     active ? "0.8px solid rgba(99,102,241,0.4)" : "0.8px solid rgba(255,255,255,0.07)",
                    }}>
                      {f} <span style={{ opacity: 0.6, fontSize: "10px" }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Lv chips */}
            {vocabFilter === "lv" && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {ALL_LVS.map(lv => {
                  const cfg    = LV_CFG[lv];
                  const active = activeLv === lv;
                  const count  = VOCAB_SENTENCES.filter(s => s.lv === lv).length;
                  return (
                    <button key={lv} onClick={() => switchLv(lv)} style={{
                      padding: "6px 14px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600,
                      fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
                      background: active ? cfg.bg : "rgba(255,255,255,0.05)",
                      color:      active ? cfg.color : "#8892b0",
                      border:     active ? `0.8px solid ${cfg.border}` : "0.8px solid rgba(255,255,255,0.07)",
                      boxShadow:  active ? `0 0 8px ${cfg.border}` : "none",
                    }}>
                      {lv} <span style={{ opacity: 0.6, fontSize: "10px" }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Random level tabs */
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)",
              border: "0.8px solid rgba(255,255,255,0.08)", borderRadius: "12px",
              padding: "4px", gap: "3px", display: "inline-flex" }}>
              {Object.keys(RANDOM_SENTENCES).map(lv => {
                const cfg    = LEVEL_CFG[lv];
                const active = randomLevel === lv;
                return (
                  <button key={lv} onClick={() => switchRandomLevel(lv)} style={{
                    padding: "7px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                    fontFamily: "Inter, sans-serif", cursor: "pointer", border: "none", transition: "all 0.22s ease",
                    background: active ? cfg.bg : "transparent",
                    color:      active ? cfg.color : "#5a6a8a",
                    outline:    active ? `0.8px solid ${cfg.border}` : "none",
                    boxShadow:  active ? `0 0 12px ${cfg.glow}` : "none",
                  }}>
                    {lv}
                    {active && <span style={{ marginLeft: "5px", fontSize: "10px", opacity: 0.7 }}>— {cfg.desc}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Main layout ── */}
        <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: "16px", alignItems: "start" }}>

          {/* Sidebar */}
          <SentenceQueue
            sentences={sentences}
            currentIdx={safeIdx}
            doneIds={doneIds}
            onSelect={i => { setCurrentIdx(i); resetWorkspace(); }}
            accentColor={accentColor}
          />

          {/* Workspace */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#5a6a8a",
                textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {direction === "en-vi" ? "Tiếng Anh → Tiếng Việt" : "Tiếng Việt → Tiếng Anh"}
              </span>
              <div style={{ flex: 1, height: "0.8px", background: "rgba(255,255,255,0.06)" }} />
              {/* badge: lv or level */}
              {mode === "vocab" && current.lv && (() => {
                const cfg = LV_CFG[current.lv];
                return (
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "9999px",
                    background: cfg.bg, color: cfg.color, border: `0.8px solid ${cfg.border}` }}>
                    {current.lv}
                  </span>
                );
              })()}
              {mode === "random" && (() => {
                const cfg = LEVEL_CFG[randomLevel];
                return (
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "9999px",
                    background: cfg.bg, color: cfg.color, border: `0.8px solid ${cfg.border}` }}>
                    {randomLevel}
                  </span>
                );
              })()}
            </div>

            {/* Source sentence card */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(255,255,255,0.09)",
              borderRadius: "16px", padding: "24px",
              boxShadow: `0 0 40px ${accentGlow}`,
            }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#5a6a8a",
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "14px" }}>
                {direction === "en-vi" ? "🇬🇧 Câu tiếng Anh" : "🇻🇳 Câu tiếng Việt"}
              </p>
              <p style={{
                fontFamily: direction === "en-vi" ? "Outfit, sans-serif" : "Inter, sans-serif",
                fontSize: "20px", fontWeight: 700, color: "#e8eaf6", lineHeight: 1.65, marginBottom: "16px",
              }}>
                <HighlightWord text={sourceText} word={direction === "en-vi" ? current.word : ""} />
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#5a6a8a" }}>Từ khóa:</span>
                <span style={{
                  fontSize: "12px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px",
                  background: "rgba(165,180,252,0.12)", color: "#a5b4fc",
                  border: "0.8px solid rgba(165,180,252,0.25)", fontFamily: "Outfit, sans-serif",
                }}>{current.word}</span>
                {mode === "vocab" && (
                  <span style={{
                    fontSize: "11px", fontWeight: 500, padding: "3px 8px", borderRadius: "6px",
                    background: "rgba(99,102,241,0.1)", color: "#8892b0",
                    border: "0.8px solid rgba(99,102,241,0.15)",
                  }}>{current.folder}</span>
                )}
              </div>
            </div>

            {/* Answer textarea */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: submitted
                ? isCorrect ? "0.8px solid rgba(16,185,129,0.35)" : "0.8px solid rgba(248,113,113,0.3)"
                : "0.8px solid rgba(255,255,255,0.08)",
              borderRadius: "14px", overflow: "hidden", transition: "border-color 0.3s ease",
            }}>
              <div style={{ padding: "12px 16px 0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#5a6a8a",
                  textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {direction === "en-vi" ? "🇻🇳 Bản dịch của bạn" : "🇬🇧 Bản dịch của bạn"}
                </span>
                <span style={{ fontSize: "11px", color: "#5a6a8a" }}>{userAnswer.length} ký tự</span>
              </div>
              <textarea
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                disabled={submitted}
                placeholder={`Nhập bản dịch ${direction === "en-vi" ? "tiếng Việt" : "tiếng Anh"} của bạn…`}
                rows={3}
                style={{
                  width: "100%", padding: "12px 16px", background: "transparent",
                  border: "none", outline: "none", resize: "none",
                  fontSize: "15px", color: "#e8eaf6", fontFamily: "Inter, sans-serif",
                  lineHeight: 1.65, boxSizing: "border-box",
                  opacity: submitted ? 0.75 : 1,
                }}
              />
              {!submitted && (
                <div style={{ padding: "10px 16px", borderTop: "0.8px solid rgba(255,255,255,0.05)",
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button onClick={handleSkip} style={{
                    fontSize: "12px", color: "#5a6a8a", background: "none",
                    border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}>Bỏ qua →</button>
                  <button onClick={handleSubmit} disabled={!userAnswer.trim()}
                    style={{
                      padding: "8px 20px", borderRadius: "9px", fontSize: "13px", fontWeight: 600,
                      fontFamily: "Inter, sans-serif", border: "none", transition: "all 0.2s ease",
                      cursor: userAnswer.trim() ? "pointer" : "not-allowed",
                      background: userAnswer.trim()
                        ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                        : "rgba(255,255,255,0.07)",
                      color: userAnswer.trim() ? "#fff" : "#5a6a8a",
                      boxShadow: userAnswer.trim() ? "0 0 16px rgba(99,102,241,0.4)" : "none",
                    }}
                  >Gửi AI chấm ✦</button>
                </div>
              )}
            </div>

            {/* AI Feedback */}
            {submitted && (
              <div style={{
                background: isCorrect ? "rgba(16,185,129,0.04)" : "rgba(248,113,113,0.03)",
                border: isCorrect ? "0.8px solid rgba(16,185,129,0.2)" : "0.8px solid rgba(248,113,113,0.18)",
                borderRadius: "14px", overflow: "hidden",
                animation: "fadeSlideIn 0.35s ease",
              }}>
                {/* Header + scores */}
                <div style={{
                  padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: "0.8px solid rgba(255,255,255,0.06)",
                  background: isCorrect ? "rgba(16,185,129,0.06)" : "rgba(248,113,113,0.04)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "20px" }}>{isCorrect ? "✅" : "⚠️"}</span>
                    <div>
                      <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "14px",
                        color: isCorrect ? "#10b981" : "#f87171" }}>
                        {isCorrect ? "Tốt lắm! Bản dịch chính xác." : "Gần đúng rồi — xem gợi ý bên dưới."}
                      </p>
                      <p style={{ fontSize: "11px", color: "#8892b0", marginTop: "2px" }}>Phản hồi AI · Learn Today</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <ScoreDot label="Ngữ pháp" score={scores.grammar} />
                    <ScoreDot label="Từ vựng"  score={scores.vocab} />
                    <ScoreDot label="Tự nhiên" score={scores.natural} />
                  </div>
                </div>

                {/* Model answer */}
                <div style={{ padding: "16px 20px", borderBottom: "0.8px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#5a6a8a",
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                    💡 Đáp án tham khảo
                  </p>
                  <p style={{ fontSize: "15px", fontStyle: "italic", lineHeight: 1.7,
                    color: isCorrect ? "#6ee7b7" : "#c7d2fe", fontFamily: "Inter, sans-serif" }}>
                    "{modelAnswer}"
                  </p>
                </div>

                {/* Grammar tip toggle */}
                <div style={{ padding: "12px 20px" }}>
                  <button onClick={() => setShowTip(!showTip)} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    fontSize: "12px", fontWeight: 600, color: "#a5b4fc",
                    background: "none", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}>
                    <span style={{ display: "inline-block", transition: "transform 0.25s",
                      transform: showTip ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    Mẹo ngữ pháp · "{current.word}"
                  </button>
                  {showTip && (
                    <div style={{ marginTop: "10px", padding: "12px 14px", borderRadius: "10px",
                      background: "rgba(165,180,252,0.07)", border: "0.8px solid rgba(165,180,252,0.18)" }}>
                      <p style={{ fontSize: "13px", color: "#c7d2fe", lineHeight: 1.7, fontFamily: "Inter, sans-serif" }}>
                        {current.tip}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ padding: "0 20px 16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button onClick={handleSkip} style={{
                    padding: "8px 16px", borderRadius: "9px", fontSize: "12px", fontWeight: 500,
                    background: "rgba(255,255,255,0.06)", color: "#8892b0",
                    border: "0.8px solid rgba(255,255,255,0.09)", cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}>Bỏ qua</button>
                  <button onClick={handleNext} style={{
                    padding: "8px 20px", borderRadius: "9px", fontSize: "13px", fontWeight: 600,
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
                    border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
                    boxShadow: "0 0 16px rgba(99,102,241,0.4)",
                  }}>Câu tiếp theo →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        textarea::placeholder { color: #3d4a66; }
        textarea:disabled { cursor: default; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
}
