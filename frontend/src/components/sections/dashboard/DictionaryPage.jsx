import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";


import SaveModal from "./SaveModal";
import { speak } from "../../../utils/tts";   // modal dùng chung (DictionaryPage + WordDetailPage) - trước đây thiếu import -> crash khi bấm Lưu
import { dictionaryApi, foldersApi, searchApi } from "../../../api/client";


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

// speak() dùng chung ở utils/tts.js (đọc theo giọng đã chọn trong Cài đặt)

// ─── Loading Dots ───

function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", padding: "8px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: "#0f766e", display: "inline-block",
          animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Tab 1: Tra từ ───

function TraTuTab({ initialQuery = "" }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState({ q: "", list: [] });
  const [searchError, setSearchError] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularWords, setPopularWords] = useState([]);

  // Lịch sử tra + "từ được lưu nhiều nhất" (STT 10) đều lấy từ database
  useEffect(() => {
    Promise.allSettled([searchApi.history(), searchApi.popular()]).then(([historyResult, popularResult]) => {
      if (historyResult.status === "fulfilled") {
        const seen = new Set();
        setRecentSearches((historyResult.value.history || []).map((item) => item.query)
          .filter((q) => q && !seen.has(q) && seen.add(q)).slice(0, 8));
      }
      if (popularResult.status === "fulfilled") {
        setPopularWords((popularResult.value.words || []).map((item) => item.word).filter(Boolean).slice(0, 8));
      }
    });
  }, []);

  // Tra từ: kiểm tra đầu vào rồi chuyển sang trang chi tiết (trang đó gọi từ điển thật, kho DB)
  const doSearch = (q) => {
    const key = q.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key) return;
    if (!/^[a-z][a-z'\- ]{0,59}$/.test(key)) {
      setSearchError("Chỉ nhập chữ cái tiếng Anh (tối đa 60 ký tự), ví dụ: accomplish.");
      return;
    }
    setSearchError("");
    setSuggestions({ q: "", list: [] });
    navigate(`/app/dictionary/${encodeURIComponent(key)}`);
  };

  useEffect(() => {
    if (initialQuery?.trim()) {
      // Delay nhỏ để đảm bảo navigation sau khi mount (và không setState đồng bộ trong effect)
      const t = setTimeout(() => { setQuery(initialQuery); doSearch(initialQuery); }, 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lại khi initialQuery đổi; doSearch tạo mới mỗi lần render
  }, [initialQuery]);

  // Gợi ý khi gõ: gọi API sau 250ms ngừng gõ (kho database + nguồn gợi ý trực tuyến), không gọi mỗi phím
  useEffect(() => {
    const q = query.trim();
    if (!q) return undefined;
    let cancelled = false;
    const t = setTimeout(() => {
      dictionaryApi.suggest(q)
        .then((res) => { if (!cancelled) setSuggestions({ q, list: res.suggestions || [] }); })
        .catch(() => { /* gợi ý là phụ: lỗi thì bỏ qua, vẫn tra được bằng Enter */ });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);
  const shownSuggestions = suggestions.q === query.trim() ? suggestions.list : [];

  return (
    <div>
      {/* Search box (giữ nguyên style) */}
      <div style={{ maxWidth: "700px", margin: "0 auto 24px", position: "relative" }}>
        <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", border: "0.8px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "8px 10px", alignItems: "center" }}>
          <span style={{ fontSize: "20px", marginLeft: "10px" }}>🔍</span>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") doSearch(query); }}
            placeholder="Nhập từ tiếng Anh để tra cứu..."
            style={{
              flex: 1, border: "none", background: "transparent", outline: "none",
              fontSize: "18px", color: "#f4f6f7", fontFamily: "Inter, sans-serif",
            }}
          />
          <button
            onClick={() => doSearch(query)}
            style={{
              background: "linear-gradient(135deg,#0f766e,#0e8077)", border: "none",
              borderRadius: "12px", padding: "10px 24px", color: "#ffffff",
              fontSize: "15px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Tra cứu
          </button>
        </div>

        {/* Dropdown gợi ý */}
        {shownSuggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "110%", left: 0, right: 0,
            background: "#161a1d", border: "0.8px solid rgba(255,255,255,0.1)",
            borderRadius: "16px", boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            zIndex: 10, overflow: "hidden",
          }}>
            {shownSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setQuery(s); doSearch(s); }}
                style={{
                  display: "block", width: "100%", padding: "12px 18px",
                  background: "transparent", border: "none", textAlign: "left",
                  color: "#5eead4", fontSize: "15px", cursor: "pointer", fontFamily: "Outfit, sans-serif",
                  borderBottom: "0.8px solid rgba(255,255,255,0.04)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(20,184,166,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {searchError && (
        <p role="alert" style={{ maxWidth: "700px", margin: "-10px auto 16px", color: "#fca5a5", fontSize: "13.5px" }}>⚠️ {searchError}</p>
      )}

      {/* Gợi ý nhanh */}
      <div style={{ marginBottom: "22px" }}>
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: "12px", color: "#6b747c", marginBottom: "10px" }}>
          Từ được lưu nhiều nhất:
        </p>
        {popularWords.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {popularWords.map((w) => (
            <button
              key={w}
              onClick={() => { setQuery(w); doSearch(w); }}
              style={{
                background: "rgba(20,184,166,0.08)", border: "0.8px solid rgba(20,184,166,0.2)",
                borderRadius: "20px", padding: "6px 14px",
                color: "#5eead4", fontSize: "13px", fontFamily: "Inter,sans-serif",
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(20,184,166,0.18)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(20,184,166,0.08)"; }}
            >
              {w}
            </button>
          ))}
        </div>}
        {recentSearches.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontFamily: "Inter,sans-serif", fontSize: 12, color: "#6b747c", marginBottom: 8 }}>Tìm gần đây:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {recentSearches.map((item, index) => (
                <button key={`${item}-${index}`} onClick={() => { setQuery(item); doSearch(item); }}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 12px", color: "#a2acb3", cursor: "pointer" }}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Kết quả hiển thị ở trang chi tiết từ (/app/dictionary/<từ>) */}
    </div>
  );
}

// ─── Tab 2: Thư mục (xem/xóa từ đã lưu) ───

function ThuMucTab({ folders, onRemoveWord }) {
  const navigate = useNavigate();
  const [openFolderId, setOpenFolderId] = useState(folders[0]?.id ?? null);
  const openFolder = folders.find((f) => f.id === openFolderId) || null;

  if (folders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#848f97" }}>
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
              background: openFolderId === f.id ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.025)",
              border: openFolderId === f.id ? "0.8px solid rgba(20,184,166,0.35)" : "0.8px solid rgba(255,255,255,0.07)",
              fontFamily: "Outfit,sans-serif",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#dde2e5", fontSize: "13.5px", fontWeight: 600 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: f.color, display: "inline-block", flexShrink: 0 }} />
              {f.name}
            </span>
            <span style={{ fontSize: "12px", color: "#848f97" }}>{f.words.length}</span>
          </button>
        ))}
      </div>

      {/* Danh sách từ trong thư mục đang chọn */}
      <div style={{ flex: "1 1 320px", minWidth: 0 }}>
        {!openFolder || openFolder.words.length === 0 ? (
          <div style={{
            padding: "40px 20px", textAlign: "center", color: "#848f97",
            background: "rgba(255,255,255,0.02)", border: "0.8px dashed rgba(255,255,255,0.1)",
            borderRadius: "14px",
          }}>
            Thư mục này chưa có từ nào được lưu.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {openFolder.words.map((w) => {
              const phonetic = openFolder.phonetics?.[w];
              return (
                <div key={w} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
                  padding: "12px 16px", borderRadius: "12px",
                  background: "rgba(255,255,255,0.025)", border: "0.8px solid rgba(255,255,255,0.07)",
                }}>
                  <button
                    onClick={() => navigate(`/app/dictionary/${encodeURIComponent(w)}`)}
                    style={{
                      background: "none", border: "none", textAlign: "left", padding: 0,
                      cursor: "pointer", flex: 1, minWidth: 0,
                    }}
                  >
                    <p style={{ margin: 0, color: "#f4f6f7", fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "15px" }}>
                      {w}
                    </p>
                    {phonetic && (
                      <p style={{ margin: "2px 0 0", color: "#a2acb3", fontSize: "12.5px", fontFamily: "Inter,sans-serif" }}>
                        {phonetic}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={() => speak(w)}
                    style={{
                      background: "rgba(94,234,212,0.1)", border: "0.8px solid rgba(94,234,212,0.2)",
                      borderRadius: "9px", padding: "6px 10px", color: "#5eead4", fontSize: "13px", cursor: "pointer",
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
  const [folders, setFolders] = useState([]);
  const [foldersError, setFoldersError] = useState("");
  const [externalQuery, setExternalQuery] = useState(initialQuery);

  useEffect(() => { injectStyles(); }, []);

  const reloadFolders = useCallback(async () => {
    const result = await foldersApi.list();
    const personal = result.personal_folders || [];
    const mapped = await Promise.all(personal.map(async folder => {
      const data = await foldersApi.words(folder.id, { limit: 100 });
      const rows = data.words || [];
      return {
        id: folder.id,
        name: folder.name,
        color: folder.color || "#14b8a6",
        words: rows.map(row => row.word),
        phonetics: Object.fromEntries(rows.map(row => [row.word, row.pronunciation])),
        wordIds: Object.fromEntries(rows.map(row => [row.word, row.id])),
      };
    }));
    setFolders(mapped);
    setFoldersError("");
  }, []);

  // Lỗi tải thư mục được HIỂN THỊ (trước đây `.catch(() => {})` nuốt mất -> DB lỗi thì tab Thư mục chỉ trống trơn)
  const loadFolders = useCallback(
    () => reloadFolders().catch((err) => setFoldersError(err.message || "Không tải được thư mục.")),
    [reloadFolders]
  );
  useEffect(() => { Promise.resolve().then(loadFolders); }, [loadFolders]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      Promise.resolve().then(() => {
        setExternalQuery(initialQuery);
        setActiveTab(0);
        if (onQueryUsed) onQueryUsed();
      });
    }
  }, [initialQuery, onQueryUsed]);

  const handleRemoveWord = async (folderId, word) => {
    const folder = folders.find(item => item.id === folderId);
    const wordId = folder?.wordIds?.[word];
    if (!wordId) return;
    try {
      await foldersApi.removeWord(folderId, wordId);
      await reloadFolders();
    } catch (err) {
      alert(err.message || "Không gỡ được từ khỏi folder.");
    }
  };

  const tabs = [
    { label: "🔍 Tra từ", component: <TraTuTab initialQuery={externalQuery} /> },
    { label: "📁 Thư mục", component: <ThuMucTab folders={folders} onRemoveWord={handleRemoveWord} /> },
  ];
    return (
    <div
      className="dict-page"
      style={{
        minHeight: "100vh", background: "#0f1214",
        padding: "0 0 60px", position: "relative", overflow: "hidden",
      }}
    >
      {/* Glow blobs */}
      <div style={{
        position: "fixed", top: "-160px", left: "-160px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(20,184,166,0.13) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-120px", right: "-120px",
        width: "420px", height: "420px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(45,212,191,0.1) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "36px 20px 0" }}>
        {/* Page title */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "Outfit,sans-serif", fontSize: "32px", fontWeight: 900,
            color: "#f4f6f7", margin: "0 0 6px",
            background: "linear-gradient(135deg,#5eead4,#2dd4bf)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Từ điển &amp; Dịch thuật
          </h1>
          <p style={{ fontFamily: "Inter,sans-serif", fontSize: "14px", color: "#6b747c", margin: 0 }}>
            Tra cứu từ và quản lý từ vựng đã lưu của bạn
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
                  ? "linear-gradient(135deg,rgba(20,184,166,0.25),rgba(20,184,166,0.18))"
                  : "transparent",
                border: activeTab === i
                  ? "0.8px solid rgba(20,184,166,0.35)"
                  : "0.8px solid transparent",
                borderRadius: "10px", cursor: "pointer",
                fontFamily: "Outfit,sans-serif", fontSize: "13.5px", fontWeight: activeTab === i ? 700 : 500,
                color: activeTab === i ? "#5eead4" : "#848f97",
                transition: "all 0.18s", whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {foldersError && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px",
                        padding: "10px 16px", borderRadius: "12px", fontSize: "13px", color: "#fecaca",
                        background: "rgba(127,29,29,0.35)", border: "0.8px solid rgba(248,113,113,0.35)" }}>
            <span>⚠️ {foldersError}</span>
            <button onClick={loadFolders} style={{ padding: "4px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                                                   fontWeight: 700, background: "#f87171", color: "#450a0a" }}>
              Thử lại
            </button>
          </div>
        )}

        {/* Tab content */}
        <div key={activeTab} style={{ animation: "fadeSlideIn 0.28s ease" }}>
          {tabs[activeTab].component}
        </div>
      </div>
    </div>
  );
}


