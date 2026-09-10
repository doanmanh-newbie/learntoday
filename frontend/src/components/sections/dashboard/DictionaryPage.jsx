import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Dữ liệu mẫu (Giữ nguyên từ file gốc) ───

const DICTIONARY = {
  accomplish: {
    word: "accomplish", phonetic: "/əˈkʌmplɪʃ/", level: "B1",
    family: ["accomplishment (n)", "accomplished (adj)"],
    collocations: ["accomplish a goal", "accomplish a task", "accomplish a mission"],
    pos: [{
      type: "verb", synonyms: ["achieve", "complete"], antonyms: ["fail", "abandon"],
      defs: [{
        def: "To succeed in doing or finishing something, especially after making an effort.",
        vi: "Hoàn thành hoặc đạt được điều gì đó, đặc biệt là sau khi nỗ lực.",
        example: "She managed to accomplish all her goals despite the obstacles.",
        example_vi: "Cô ấy đã hoàn thành tất cả mục tiêu dù gặp nhiều trở ngại.",
      }],
    }],
  },
  significant: {
    word: "significant", phonetic: "/sɪɡˈnɪfɪkənt/", level: "B2",
    family: ["significance (n)", "significantly (adv)"],
    collocations: ["significant improvement", "significant impact", "statistically significant"],
    pos: [{
      type: "adjective", synonyms: ["notable", "considerable"], antonyms: ["minor", "negligible"],
      defs: [{
        def: "Important or large enough to be noticed or to have an effect.",
        vi: "Quan trọng hoặc đủ lớn để được chú ý hay có tác động.",
        example: "The research showed a significant improvement in test scores.",
        example_vi: "Nghiên cứu cho thấy sự cải thiện đáng kể trong điểm kiểm tra.",
      }],
    }],
  },
  perseverance: {
    word: "perseverance", phonetic: "/ˌpɜːsəˈvɪərəns/", level: "C1",
    family: ["persevere (v)", "persevering (adj)"],
    collocations: ["show perseverance", "the key to perseverance"],
    pos: [{
      type: "noun", synonyms: ["persistence", "determination"], antonyms: ["giving up"],
      defs: [{
        def: "Continued effort to do or achieve something despite difficulties.",
        vi: "Sự kiên trì tiếp tục cố gắng để làm hoặc đạt được điều gì đó dù gặp khó khăn.",
        example: "Perseverance is the key to success.",
        example_vi: "Sự kiên trì là chìa khóa dẫn đến thành công.",
      }],
    }],
  },
  resilient: {
    word: "resilient", phonetic: "/rɪˈzɪliənt/", level: "B2",
    family: ["resilience (n)", "resiliently (adv)"],
    collocations: ["remain resilient", "a resilient economy"],
    pos: [{
      type: "adjective", synonyms: ["tough", "adaptable"], antonyms: ["fragile", "vulnerable"],
      defs: [{
        def: "Able to recover quickly from difficulties or setbacks.",
        vi: "Có khả năng phục hồi nhanh chóng sau khó khăn hoặc thất bại.",
        example: "Children are often more resilient than we expect.",
        example_vi: "Trẻ em thường có khả năng phục hồi tốt hơn chúng ta nghĩ.",
      }],
    }],
  },
  innovative: {
    word: "innovative", phonetic: "/ˈɪnəveɪtɪv/", level: "B2",
    family: ["innovation (n)", "innovate (v)", "innovator (n)"],
    collocations: ["an innovative solution", "innovative technology"],
    pos: [{
      type: "adjective", synonyms: ["inventive", "original"], antonyms: ["conventional"],
      defs: [{
        def: "Introducing new ideas or methods; original and creative in thinking.",
        vi: "Đưa ra những ý tưởng hoặc phương pháp mới; sáng tạo và độc đáo.",
        example: "The company is known for its innovative approach to design.",
        example_vi: "Công ty này nổi tiếng với cách tiếp cận thiết kế sáng tạo.",
      }],
    }],
  },
  collaborate: {
    word: "collaborate", phonetic: "/kəˈlæbəreɪt/", level: "B1",
    family: ["collaboration (n)", "collaborative (adj)", "collaborator (n)"],
    collocations: ["collaborate with someone", "collaborate on a project"],
    pos: [{
      type: "verb", synonyms: ["cooperate", "team up"], antonyms: ["compete"],
      defs: [{
        def: "To work jointly with others on an activity or project.",
        vi: "Cùng làm việc với người khác trong một hoạt động hoặc dự án.",
        example: "Our team collaborated with designers from three countries.",
        example_vi: "Nhóm của chúng tôi đã hợp tác với các nhà thiết kế từ ba quốc gia.",
      }],
    }],
  },
  eloquent: {
    word: "eloquent", phonetic: "/ˈeləkwənt/", level: "C1",
    family: ["eloquence (n)", "eloquently (adv)"],
    collocations: ["an eloquent speaker", "eloquent argument"],
    pos: [{
      type: "adjective", synonyms: ["articulate", "persuasive"], antonyms: ["inarticulate"],
      defs: [{
        def: "Fluent and persuasive in speaking or writing.",
        vi: "Nói hoặc viết trôi chảy và có sức thuyết phục.",
        example: "She gave an eloquent speech at the graduation ceremony.",
        example_vi: "Cô ấy đã có một bài phát biểu hùng hồn tại lễ tốt nghiệp.",
      }],
    }],
  },
  milestone: {
    word: "milestone", phonetic: "/ˈmaɪlstəʊn/", level: "B1",
    family: ["milestones (pl)"],
    collocations: ["reach a milestone", "an important milestone"],
    pos: [{
      type: "noun", synonyms: ["landmark", "turning point"], antonyms: [],
      defs: [{
        def: "An important event or stage in the development of something.",
        vi: "Một sự kiện hoặc cột mốc quan trọng trong quá trình phát triển của điều gì đó.",
        example: "Graduating from university was a major milestone in her life.",
        example_vi: "Tốt nghiệp đại học là một cột mốc quan trọng trong đời cô ấy.",
      }],
    }],
  },
  dedicate: {
    word: "dedicate", phonetic: "/ˈdedɪkeɪt/", level: "B1",
    family: ["dedication (n)", "dedicated (adj)"],
    collocations: ["dedicate time to", "dedicate yourself to"],
    pos: [{
      type: "verb", synonyms: ["devote", "commit"], antonyms: ["neglect"],
      defs: [{
        def: "To give a large amount of time or effort to a particular activity or purpose.",
        vi: "Dành nhiều thời gian hoặc công sức cho một hoạt động hay mục đích cụ thể.",
        example: "He dedicated his life to helping others learn English.",
        example_vi: "Anh ấy đã dành cả cuộc đời để giúp người khác học tiếng Anh.",
      }],
    }],
  },
  analyze: {
    word: "analyze", phonetic: "/ˈænəlaɪz/", level: "B1",
    family: ["analysis (n)", "analytical (adj)", "analyst (n)"],
    collocations: ["analyze the data", "analyze the results"],
    pos: [{
      type: "verb", synonyms: ["examine", "study"], antonyms: ["ignore"],
      defs: [{
        def: "To examine something in detail in order to understand it better.",
        vi: "Xem xét điều gì đó một cách chi tiết để hiểu rõ hơn.",
        example: "Researchers analyzed the survey results carefully.",
        example_vi: "Các nhà nghiên cứu đã phân tích kết quả khảo sát một cách cẩn thận.",
      }],
    }],
  },
};

const MOCK_TRANS = {
  "hello": "Xin chào",
  "thank you": "Cảm ơn bạn",
  "good morning": "Chào buổi sáng",
  "how are you?": "Bạn có khỏe không?",
  "i love you": "Tôi yêu bạn",
  "she managed to accomplish all her goals despite the obstacles.":
    "Cô ấy đã hoàn thành tất cả mục tiêu dù gặp nhiều trở ngại.",
  "the research showed a significant improvement in test scores.":
    "Nghiên cứu cho thấy sự cải thiện đáng kể trong điểm kiểm tra.",
  "perseverance is the key to success.":
    "Sự kiên trì là chìa khóa dẫn đến thành công.",
  "xin chào": "Hello",
  "cảm ơn": "Thank you",
};

// ─── Các biến cấu hình màu ───

const LEVEL_COLORS = {
  B1: "#a5b4fc",
  B2: "#818cf8",
  C1: "#8b5cf6",
  C2: "#f43f5e",
};


const INITIAL_FOLDERS = [
  { id: 1, name: "Công việc", color: "#6366f1", words: [] },
  { id: 2, name: "Học thuật", color: "#10b981", words: [] },
  { id: 3, name: "Phẩm chất", color: "#f59e0b", words: [] },
  { id: 4, name: "Công nghệ", color: "#8b5cf6", words: [] },
  { id: 5, name: "Giao tiếp", color: "#06b6d4", words: [] },
];

// ─── Inject CSS Animations ───

const STYLES = `
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%            { transform: translateY(-10px); }
  }
  @keyframes overlayIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.93) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .dict-page *::-webkit-scrollbar { width: 0; height: 0; }
`;

function injectStyles() {
  if (document.getElementById("dict-page-styles")) return;
  const el = document.createElement("style");
  el.id = "dict-page-styles";
  el.textContent = STYLES;
  document.head.appendChild(el);
}

// ─── Utility Functions ───

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  window.speechSynthesis.speak(utt);
}

function mockTranslate(text, srcLang) {
  const key = text.trim().toLowerCase();
  if (MOCK_TRANS[key]) return MOCK_TRANS[key];
  return srcLang === "en"
    ? `[Bản dịch VI: "${text.trim()}"]`
    : `[EN translation: "${text.trim()}"]`;
}


// ─── Loading Dots ───

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", padding: "8px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#6366f1", display: "inline-block",
          animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Tab 1: Tra từ ───

function TraTuTab({ folders, onSaveFolders, initialQuery = "" }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const allKeys = Object.keys(DICTIONARY);

  // ✅ Search → navigate sang WordDetailPage
  const doSearch = (q) => {
    const key = q.trim().toLowerCase();
    if (!key) return;
    const entry = DICTIONARY[key];
    if (entry) {
      navigate(`/app/dictionary/${entry.word}`);
    } else {
      // Không tìm thấy → có thể show alert hoặc navigate tới not-found page
      alert(`Không tìm thấy từ "${q}"`);
    }
  };

  useEffect(() => {
    if (initialQuery?.trim()) {
      setQuery(initialQuery);
      // Delay nhỏ để đảm bảo navigation sau khi mount
      const t = setTimeout(() => doSearch(initialQuery), 0);
      return () => clearTimeout(t);
    }
  }, [initialQuery]);

  const handleInputChange = (value) => {
    setQuery(value);
    if (value.trim()) {
      const matches = allKeys.filter((w) => w.startsWith(value.trim().toLowerCase()));
      setSuggestions(matches.slice(0, 8));
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div>
      {/* Search box (giữ nguyên style) */}
      <div style={{ maxWidth: "700px", margin: "0 auto 24px", position: "relative" }}>
        <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "8px 10px", alignItems: "center" }}>
          <span style={{ fontSize: "20px", marginLeft: "10px" }}>🔍</span>
          <input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doSearch(query); }}
            placeholder="Nhập từ tiếng Anh để tra cứu..."
            style={{
              flex: 1, border: "none", background: "transparent", outline: "none",
              fontSize: "18px", color: "#f8faff", fontFamily: "Inter, sans-serif",
            }}
          />
          <button
            onClick={() => doSearch(query)}
            style={{
              background: "linear-gradient(135deg,#6366f1,#818cf8)", border: "none",
              borderRadius: "12px", padding: "10px 24px", color: "#fff",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Tra cứu
          </button>
        </div>

        {/* Dropdown gợi ý */}
        {suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "110%", left: 0, right: 0,
            background: "#0e1130", border: "0.8px solid rgba(255,255,255,0.1)",
            borderRadius: "16px", boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            zIndex: 10, overflow: "hidden",
          }}>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); doSearch(s); }}
                style={{
                  display: "block", width: "100%", padding: "12px 18px",
                  background: "transparent", border: "none", textAlign: "left",
                  color: "#a5b4fc", fontSize: "15px", cursor: "pointer", fontFamily: "Outfit, sans-serif",
                  borderBottom: "0.8px solid rgba(255,255,255,0.04)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tra nhanh */}
      <div style={{ marginBottom: "22px" }}>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: "12px", color: "#475569", marginBottom: "10px" }}>
          Tra nhanh:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {allKeys.map((w) => (
            <button
              key={w}
              onClick={() => { setQuery(w); doSearch(w); }}
              style={{
                background: "rgba(99,102,241,0.08)", border: "0.8px solid rgba(99,102,241,0.2)",
                borderRadius: "20px", padding: "6px 14px",
                color: "#a5b4fc", fontSize: "13px", fontFamily: "Inter,sans-serif",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ KHÔNG render DictCard nữa. Chỉ navigate. */}
    </div>
  );
}

// ─── Tab 2: Dịch văn bản ───

function DichTab({ folders, onSaveFolders }) {
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("vi");
  const [srcText, setSrcText] = useState("");
  const [tgtText, setTgtText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveModal, setSaveModal] = useState(null); // "src" | "tgt" | null
  const timerRef = useRef(null);

  const translate = useCallback((text, lang) => {
    if (!text.trim()) { setTgtText(""); setLoading(false); return; }
    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const res = mockTranslate(text, lang);
      setTgtText(res);
      setLoading(false);
    }, 600);
  }, []);

  const handleSrcChange = (val) => {
    setSrcText(val);
    translate(val, srcLang);
  };

  const handleSwap = () => {
    const newSrc = tgtLang;
    const newTgt = srcLang;
    const newSrcText = tgtText;
    const newTgtText = srcText;
    setSrcLang(newSrc);
    setTgtLang(newTgt);
    setSrcText(newSrcText);
    setTgtText(newTgtText);
    translate(newSrcText, newSrc);
  };

  const handleSave = (folderId, word) => {
    onSaveFolders((prev) =>
      prev.map((f) =>
        f.id === folderId && !f.words.includes(word)
          ? { ...f, words: [...f.words, word] }
          : f
      )
    );
  };

  const handleCreate = (name, color) => {
    const id = Date.now();
    onSaveFolders((prev) => [...prev, { id, name, color, words: [] }]);
    return id;
  };

  const langLabel = { en: "🇺🇸 EN", vi: "🇻🇳 VI" };

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
        borderRadius: "14px", padding: "12px 18px", marginBottom: "16px",
      }}>
        {["en", "vi"].map((l) => (
          <button
            key={l}
            onClick={() => { if (srcLang !== l) { setSrcLang(l); translate(srcText, l); } }}
            style={{
              background: srcLang === l ? "rgba(99,102,241,0.2)" : "transparent",
              border: srcLang === l ? "0.8px solid rgba(99,102,241,0.5)" : "0.8px solid transparent",
              borderRadius: "10px", padding: "7px 16px",
              color: srcLang === l ? "#a5b4fc" : "#64748b",
              fontFamily: "Outfit,sans-serif", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {langLabel[l]}
          </button>
        ))}

        <button
          onClick={handleSwap}
          style={{
            background: "rgba(255,255,255,0.05)", border: "0.8px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", padding: "7px 14px", cursor: "pointer",
            color: "#94a3b8", fontSize: "16px", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#a5b4fc")}
          onMouseLeave={(e) => (e.target.style.color = "#94a3b8")}
        >
          ⇄
        </button>

        {["en", "vi"].map((l) => (
          <button
            key={l}
            onClick={() => { if (tgtLang !== l) setTgtLang(l); }}
            style={{
              background: tgtLang === l ? "rgba(16,185,129,0.15)" : "transparent",
              border: tgtLang === l ? "0.8px solid rgba(16,185,129,0.4)" : "0.8px solid transparent",
              borderRadius: "10px", padding: "7px 16px",
              color: tgtLang === l ? "#34d399" : "#64748b",
              fontFamily: "Outfit,sans-serif", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {langLabel[l]}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "18px", display: "flex", flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontFamily: "Outfit,sans-serif", fontSize: "12px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.5px" }}>
              {langLabel[srcLang]}
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {srcText && (
                <>
                  <button
                    onClick={() => setSaveModal("src")}
                    style={{
                      background: "rgba(99,102,241,0.1)", border: "0.8px solid rgba(99,102,241,0.25)",
                      borderRadius: "8px", padding: "3px 10px",
                      color: "#a5b4fc", fontSize: "12px", cursor: "pointer",
                      fontFamily: "Inter,sans-serif",
                    }}
                  >💾 Lưu</button>
                  <button
                    onClick={() => { setSrcText(""); setTgtText(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: "14px" }}
                  >✕</button>
                </>
              )}
              <button
                onClick={() => speak(srcText)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "14px" }}
              >🔊</button>
            </div>
          </div>
          <textarea
            value={srcText}
            onChange={(e) => handleSrcChange(e.target.value)}
            placeholder="Nhập văn bản cần dịch..."
            style={{
              flex: 1, minHeight: "160px", resize: "none",
              background: "transparent", border: "none", outline: "none",
              fontFamily: "Inter,sans-serif", fontSize: "15px", color: "#e2e8f0",
              lineHeight: 1.6,
            }}
          />
          <div style={{ textAlign: "right", fontFamily: "Inter,sans-serif", fontSize: "11px", color: "#334155", marginTop: "8px" }}>
            {srcText.length} ký tự
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "18px", padding: "18px", display: "flex", flexDirection: "column",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontFamily: "Outfit,sans-serif", fontSize: "12px", fontWeight: 700, color: "#34d399", letterSpacing: "0.5px" }}>
              {langLabel[tgtLang]}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {tgtText && (
                <button
                  onClick={() => setSaveModal("tgt")}
                  style={{
                    background: "rgba(99,102,241,0.1)", border: "0.8px solid rgba(99,102,241,0.25)",
                    borderRadius: "8px", padding: "3px 10px",
                    color: "#a5b4fc", fontSize: "12px", cursor: "pointer",
                    fontFamily: "Inter,sans-serif",
                  }}
                >
                  💾 Lưu
                </button>
              )}
              <button
                onClick={() => speak(tgtText)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "14px" }}
              >🔊</button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: "160px" }}>
            {loading ? (
              <LoadingDots />
            ) : tgtText ? (
              <p style={{
                fontFamily: "Inter,sans-serif", fontSize: "15px", color: "#e2e8f0",
                lineHeight: 1.6, margin: 0, animation: "fadeSlideIn 0.25s ease",
              }}>
                {tgtText}
              </p>
            ) : (
              <p style={{ fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#334155", fontStyle: "italic" }}>
                Bản dịch sẽ hiện ở đây...
              </p>
            )}
          </div>
        </div>
      </div>

      {saveModal === "src" && srcText && (
        <SaveModal
          wordOrText={srcText.slice(0, 60) + (srcText.length > 60 ? "…" : "")}
          folders={folders}
          onSave={handleSave}
          onClose={() => setSaveModal(null)}
          onCreate={handleCreate}
        />
      )}
      {saveModal === "tgt" && tgtText && (
        <SaveModal
          wordOrText={tgtText.slice(0, 60) + (tgtText.length > 60 ? "…" : "")}
          folders={folders}
          onSave={handleSave}
          onClose={() => setSaveModal(null)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ─── Tab 3: Thư mục (xem/xóa từ đã lưu) ───

function ThuMucTab({ folders, onRemoveWord }) {
  const navigate = useNavigate();
  const [openFolderId, setOpenFolderId] = useState(folders[0]?.id ?? null);
  const openFolder = folders.find((f) => f.id === openFolderId) || null;

  if (folders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
        Chưa có thư mục nào. Hãy lưu 1 từ ở tab "Tra từ" để tạo thư mục mới.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {/* Danh sách thư mục */}
      <div style={{ flex: "0 0 220px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setOpenFolderId(f.id)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px",
              padding: "11px 14px", borderRadius: "12px", textAlign: "left", cursor: "pointer",
              background: openFolderId === f.id ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.025)",
              border: openFolderId === f.id ? "0.8px solid rgba(99,102,241,0.35)" : "0.8px solid rgba(255,255,255,0.07)",
              fontFamily: "Outfit,sans-serif",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e2e8f0", fontSize: "13.5px", fontWeight: 600 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: f.color, display: "inline-block", flexShrink: 0 }} />
              {f.name}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{f.words.length}</span>
          </button>
        ))}
      </div>

      {/* Danh sách từ trong thư mục đang chọn */}
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        {!openFolder || openFolder.words.length === 0 ? (
          <div style={{
            padding: "40px 20px", textAlign: "center", color: "#64748b",
            background: "rgba(255,255,255,0.02)", border: "0.8px dashed rgba(255,255,255,0.1)",
            borderRadius: "14px",
          }}>
            Thư mục này chưa có từ nào được lưu.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {openFolder.words.map((w) => {
              const entry = DICTIONARY[w];
              return (
                <div key={w} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
                  padding: "12px 16px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
                }}>
                  <button
                    onClick={() => entry && navigate(`/app/dictionary/${w}`)}
                    disabled={!entry}
                    style={{
                      background: "none", border: "none", textAlign: "left", padding: 0,
                      cursor: entry ? "pointer" : "default", flex: 1, minWidth: 0,
                    }}
                  >
                    <p style={{ margin: 0, color: "#f8faff", fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "15px" }}>
                      {w}
                    </p>
                    {entry?.phonetic && (
                      <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "12.5px", fontFamily: "Inter,sans-serif" }}>
                        {entry.phonetic}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={() => speak(w)}
                    style={{
                      background: "rgba(165,180,252,0.1)", border: "0.8px solid rgba(165,180,252,0.2)",
                      borderRadius: "9px", padding: "6px 10px", color: "#a5b4fc", fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => onRemoveWord(openFolder.id, w)}
                    style={{
                      background: "rgba(248,113,113,0.08)", border: "0.8px solid rgba(248,113,113,0.2)",
                      borderRadius: "9px", padding: "6px 10px", color: "#f87171", fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main DictionaryPage ───

export default function DictionaryPage({ initialQuery = "", onQueryUsed }) {
  const [activeTab, setActiveTab] = useState(0);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [externalQuery, setExternalQuery] = useState(initialQuery);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      Promise.resolve().then(() => {
        setExternalQuery(initialQuery);
        setActiveTab(0);
        if (onQueryUsed) onQueryUsed();
      });
    }
  }, [initialQuery, onQueryUsed]);

  const handleRemoveWord = (folderId, word) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, words: f.words.filter((w) => w !== word) }
          : f
      )
    );
  };

  const tabs = [
    { label: "🔍 Tra từ", component: <TraTuTab folders={folders} onSaveFolders={setFolders} initialQuery={externalQuery} /> },
    { label: "🌐 Dịch văn bản", component: <DichTab folders={folders} onSaveFolders={setFolders} /> },
    { label: "📁 Thư mục", component: <ThuMucTab folders={folders} onRemoveWord={handleRemoveWord} /> },
  ];
    return (
    <div
      className="dict-page"
      style={{
        minHeight: "100vh", background: "#07091a",
        padding: "0 0 60px", position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow blobs */}
      <div style={{
        position: "fixed", top: "-160px", left: "-160px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(99,102,241,0.13) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-120px", right: "-120px",
        width: "420px", height: "420px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "36px 20px 0" }}>
        {/* Page title */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "Outfit,sans-serif", fontSize: "32px", fontWeight: 900,
            color: "#f8faff", margin: "0 0 6px",
            background: "linear-gradient(135deg,#a5b4fc,#818cf8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Từ điển &amp; Dịch thuật
          </h1>
          <p style={{ fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#475569", margin: 0 }}>
            Tra cứu, dịch văn bản và quản lý từ vựng của bạn
          </p>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: "6px",
          background: "rgba(255,255,255,0.025)",
          border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "14px", padding: "5px",
          marginBottom: "24px",
        }}>
          {tabs.map((t, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                flex: 1, padding: "10px 8px",
                background: activeTab === i
                  ? "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(129,140,248,0.18))"
                  : "transparent",
                border: activeTab === i
                  ? "0.8px solid rgba(99,102,241,0.35)"
                  : "0.8px solid transparent",
                borderRadius: "10px", cursor: "pointer",
                fontFamily: "Outfit,sans-serif", fontSize: "13.5px", fontWeight: activeTab === i ? 700 : 500,
                color: activeTab === i ? "#a5b4fc" : "#64748b",
                transition: "all 0.18s", whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div key={activeTab} style={{ animation: "fadeSlideIn 0.28s ease" }}>
          {tabs[activeTab].component}
        </div>
      </div>
    </div>
  );
}


