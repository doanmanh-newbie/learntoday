// src/components/sections/dashboard/TopicLibrary.jsx
import { useState, useEffect, useCallback } from "react";
import { foldersApi, FOLDERS_CACHE_KEY } from "../../../api/client";
import { swr, peek } from "../../../api/cache";
import { useNavigate } from "react-router-dom";
import { PHRASE_GROUPS, PHRASE_ALL_ID } from "../../../features/phrases/phrasesData";

// ── Map ảnh theo tên folder (backend chưa có field image) ─────────────
const FOLDER_IMAGES = {
  'Công nghệ': 'https://images.unsplash.com/photo-1683813479742-4730f91fa3ec?w=600&h=400&fit=crop&auto=format',
  'Du lịch': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop&auto=format',
  'Kinh doanh': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=400&fit=crop&auto=format',
  'Khoa học': 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=600&h=400&fit=crop&auto=format',
  'Ẩm thực': 'https://images.unsplash.com/photo-1636647511729-6703539ba71f?w=600&h=400&fit=crop&auto=format',
  'IELTS': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop&auto=format',
  'Thể thao': 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&h=400&fit=crop&auto=format',
  'Thiên nhiên': 'https://images.unsplash.com/photo-1595104615356-cbe9c4364513?w=600&h=400&fit=crop&auto=format',
  'Nghệ thuật': 'https://images.unsplash.com/photo-1606819717115-9159c900370b?w=600&h=400&fit=crop&auto=format',
  'Y tế': 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&h=400&fit=crop&auto=format',
  'Gia đình': 'https://images.unsplash.com/photo-1511895426328-dc8714191011?w=600&h=400&fit=crop&auto=format',
};

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop&auto=format';

// ── Folder cụm từ: dữ liệu thật ở features/phrases/phrasesData.js ───────────
const hexToRgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const PHRASE_FOLDERS = PHRASE_GROUPS.map((g) => ({
  id: g.id, name: g.name, desc: g.desc, count: g.phrases.length, color: g.color,
  glow: hexToRgba(g.color, 0.25), border: hexToRgba(g.color, 0.2), bg: hexToRgba(g.color, 0.06),
  phrases: g.phrases.slice(0, 4).map((p) => p.phrase),
}));

// Trạng thái hiển thị theo % tiến độ THẬT của folder. KHÔNG hiển thị "Level" ở cấp folder:
// SRS Level chỉ có nghĩa với TỪNG TỪ (STT 8) - 1 folder có từ ở nhiều level khác nhau.
// (Badge 'Lv3' cứng này đã tái phát nhiều lần qua các bản src.zip.)
const STATUS_CFG = {
  done:    { label: "✓ Hoàn thành", color: "#86a24d", bg: "rgba(134,162,77,0.15)", border: "rgba(134,162,77,0.3)" },
  started: { label: "▶ Đang học",   color: "#5eead4", bg: "rgba(94,234,212,0.15)", border: "rgba(94,234,212,0.3)" },
  new:     { label: "Chưa học",     color: "#a2acb3", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" },
};

// ── Loading ────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, background: '#0f1214' }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(20,184,166,0.2)',
        borderTopColor: '#14b8a6',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ color: '#a2acb3', fontSize: 14 }}>Đang tải chủ đề...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#0f1214', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <p style={{ color: '#f87171', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Không tải được chủ đề</p>
      <p style={{ color: '#a2acb3', fontSize: 14, marginBottom: 24 }}>{message}</p>
      <button onClick={onRetry} style={{
        padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
        background: 'linear-gradient(135deg,#0f766e,#0e8077)', color: '#ffffff',
        border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
      }}>Thử lại</button>
    </div>
  );
}

// ── Topic Card ─────────────────────────────────────────────────────────
function TopicCard({ topic, big = false, onSelectFolder }) {
  const [hovered, setHovered] = useState(false);
  const done = topic.progress === 100;
  const started = topic.progress > 0 && !done;
  const status = done ? STATUS_CFG.done : started ? STATUS_CFG.started : STATUS_CFG.new;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelectFolder?.(topic.id)}
      style={{
        position: "relative", borderRadius: "16px", overflow: "hidden", cursor: "pointer",
        height: big ? "260px" : "200px",
        border: hovered ? "0.8px solid rgba(255,255,255,0.18)" : "0.8px solid rgba(255,255,255,0.08)",
        boxShadow: hovered ? "0 16px 40px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "all 0.35s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        background: "#161a1d",
      }}
    >
      <img
        src={topic.img}
        alt={topic.name}
        loading="lazy"
        decoding="async"
        onError={(e) => { e.target.src = DEFAULT_IMG; }}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.5s ease",
          opacity: hovered ? 0.55 : 0.4,
        }}
      />

      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(17,19,20,0.97) 0%, rgba(17,19,20,0.55) 55%, rgba(17,19,20,0.2) 100%)",
      }} />

      <div style={{
        position: "absolute", top: "12px", right: "12px",
        padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700,
        background: status.bg, color: status.color, border: `0.8px solid ${status.border}`,
        backdropFilter: "blur(8px)",
      }}>
        {status.label}
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px" }}>
        <p style={{
          fontFamily: "Outfit, sans-serif", fontWeight: 800,
          fontSize: big ? "22px" : "17px", color: "#e9edef", marginBottom: "2px",
          lineHeight: 1.2,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}>
          {topic.name}
        </p>
        <p style={{ fontSize: "11px", color: "#a2acb3", marginBottom: "10px", fontFamily: "Inter, sans-serif" }}>
          {topic.totalWords} từ
        </p>

        {topic.progress > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", color: "#a2acb3", fontFamily: "Inter, sans-serif" }}>
                {topic.learnedWords}/{topic.totalWords} từ đã học
              </span>
              <span style={{ fontSize: "10px", fontWeight: 600, color: done ? "#86a24d" : "#5eead4", fontFamily: "Inter, sans-serif" }}>
                {topic.progress}%
              </span>
            </div>
            <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{
                width: `${topic.progress}%`, height: "100%", borderRadius: "9999px",
                background: done
                  ? "linear-gradient(90deg,#6b8a3a,#556f2d)"
                  : "linear-gradient(90deg,#0f766e,#0e8077)",
                boxShadow: done ? "0 0 6px rgba(134,162,77,0.5)" : "0 0 6px rgba(45,212,191,0.5)",
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        )}

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          background: hovered
            ? done ? "rgba(134,162,77,0.25)" : "rgba(20,184,166,0.3)"
            : "rgba(255,255,255,0.1)",
          color: done ? "#86a24d" : "#5eead4",
          border: hovered
            ? done ? "0.8px solid rgba(134,162,77,0.4)" : "0.8px solid rgba(20,184,166,0.4)"
            : "0.8px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          transition: "all 0.25s ease",
        }}>
          {done ? "✓ Ôn lại" : started ? "▶ Tiếp tục" : "▶ Bắt đầu học"}
        </div>
      </div>
    </div>
  );
}

// ── Phrase Folder Card ─────────────────────────────────────────────────
function PhraseFolderCard({ folder }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const open = () => navigate(`/app/thuvien/phrase-${folder.id}`);
  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Mở ${folder.name}`}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "14px", padding: "20px",
        background: hovered ? folder.bg.replace("0.06", "0.1") : folder.bg,
        border: `0.8px solid ${hovered ? folder.color + "55" : folder.border}`,
        boxShadow: hovered ? `0 8px 28px ${folder.glow}` : "none",
        cursor: "pointer", transition: "all 0.3s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "15px", color: "#e9edef", marginBottom: "4px" }}>
            {folder.name}
          </p>
          <p style={{ fontSize: "11px", color: "#a2acb3", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
            {folder.desc}
          </p>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600,
          background: folder.bg, color: folder.color,
          border: `0.8px solid ${folder.border}`,
          whiteSpace: "nowrap", marginLeft: "12px", flexShrink: 0,
        }}>
          {folder.count} cụm
        </span>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
        {folder.phrases.map(p => (
          <span key={p} style={{
            fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "6px",
            fontFamily: "Inter, sans-serif", fontStyle: "italic",
            background: "rgba(255,255,255,0.06)", color: folder.color,
            border: `0.8px solid ${folder.border}`,
          }}>
            "{p}"
          </span>
        ))}
        <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "6px", color: "#a2acb3" }}>
          +{Math.max(0, folder.count - 4)} nữa…
        </span>
      </div>

      <div style={{
        marginTop: "14px", paddingTop: "12px",
        borderTop: `0.8px solid ${folder.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "11px", color: "#a2acb3", fontFamily: "Inter, sans-serif" }}>
          Học qua thẻ nhanh · Trắc nghiệm
        </span>
        <span style={{
          fontSize: "12px", fontWeight: 600, color: folder.color,
          fontFamily: "Inter, sans-serif",
          opacity: hovered ? 1 : 0.7,
        }}>
          Xem tất cả →
        </span>
      </div>
    </div>
  );
}

// ── Personal Folder Card ───────────────────────────────────────────────
function PersonalFolderCard({ folder, onSelectFolder }) {
  const [hovered, setHovered] = useState(false);
  const percent = folder.totalWords > 0 ? Math.round((folder.learnedWords / folder.totalWords) * 100) : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelectFolder?.(folder.id)}
      style={{
        borderRadius: "14px", padding: "18px",
        background: hovered ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.03)",
        border: hovered ? "0.8px solid rgba(20,184,166,0.3)" : "0.8px solid rgba(255,255,255,0.08)",
        cursor: "pointer", transition: "all 0.25s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{ fontSize: "20px" }}>{folder.icon || "📁"}</span>
        <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "14px", color: "#e9edef" }}>
          {folder.name}
        </span>
      </div>
      <div style={{ fontSize: "11px", color: "#a2acb3", marginBottom: "8px", fontFamily: "Inter, sans-serif" }}>
        {folder.learnedWords}/{folder.totalWords} từ đã học
      </div>
      <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{
          width: `${percent}%`, height: "100%", borderRadius: "9999px",
          background: percent === 100 ? "linear-gradient(90deg,#6b8a3a,#556f2d)" : "linear-gradient(90deg,#0f766e,#0e8077)",
        }} />
      </div>
    </div>
  );
}

function CreateFolderCard({ onCreate }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      style={{
        borderRadius: "14px", padding: "18px",
        background: "transparent",
        border: "1.5px dashed rgba(255,255,255,0.15)",
        cursor: "pointer", color: "#a2acb3",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "6px", minHeight: "88px", width: "100%",
        fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 600,
      }}
    >
      <span style={{ fontSize: "20px" }}>＋</span>
      Tạo folder mới
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function TopicLibraryPage({ onSelectFolder }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [progressFilter, setProgressFilter] = useState("all");

  const [systemFolders, setSystemFolders] = useState([]);
  const [personalFolders, setPersonalFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyData = useCallback((data) => {
    // Backend đã trả sẵn total_words / learned_words / progress cho từng folder trong CÙNG response.
    const mapFolder = (f) => ({
      id: f.id,
      name: f.name,
      nameEn: f.description || f.name,
      img: f.image || FOLDER_IMAGES[f.name] || DEFAULT_IMG,
      totalWords: f.total_words ?? f.word_count ?? 0,
      learnedWords: f.learned_words ?? 0,
      featured: false,
      progress: f.progress ?? 0,
    });
    const system = (data.system_folders || []).map(mapFolder);
    const personal = (data.personal_folders || []).map((f) => ({ ...mapFolder(f), icon: f.icon || '📁' }));
    system.slice(0, 3).forEach((f, i) => { system[i].featured = true; });
    setSystemFolders(system);
    setPersonalFolders(personal);
    setLoading(false);
  }, []);

  // Có dữ liệu cũ trong cache -> hiện NGAY (không màn hình chờ), rồi làm tươi ở nền.
  const loadFolders = useCallback(async () => {
    setError("");
    if (!peek(FOLDERS_CACHE_KEY)) setLoading(true);
    try {
      await swr(FOLDERS_CACHE_KEY, () => foldersApi.list(), (data) => applyData(data));
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra");
      setLoading(false);
    }
  }, [applyData]);

  useEffect(() => { Promise.resolve().then(loadFolders); }, [loadFolders]);

  const createFolder = async () => {
    const name = window.prompt("Tên folder mới:");
    if (!name?.trim()) return;
    try {
      await foldersApi.create(name.trim());
      await loadFolders();
    } catch (err) {
      setError(err.message || "Không tạo được folder");
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadFolders} />;

  const filtered = systemFolders.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchProg =
      progressFilter === "all" ? true :
      progressFilter === "done" ? t.progress === 100 :
      progressFilter === "inprogress" ? t.progress > 0 && t.progress < 100 :
      progressFilter === "notstarted" ? t.progress === 0 : true;
    return matchSearch && matchProg;
  });

  const featured = systemFolders.filter(t => t.featured);

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0f1214", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "fixed", right: "-80px", top: "100px", width: "500px", height: "500px",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", left: "-100px", bottom: "100px", width: "400px", height: "400px",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "32px 24px 80px", position: "relative" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "Outfit, sans-serif", fontSize: "28px", fontWeight: 800,
            background: "linear-gradient(120deg,#e9edef 0%,#5eead4 40%,#e9edef 60%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "4px",
          }}>
            📚 Thư viện chủ đề
          </h1>
          <p style={{ color: "#a2acb3", fontSize: "14px" }}>
            Khám phá {systemFolders.length + personalFolders.length} bộ từ vựng theo chủ đề
          </p>
        </div>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "320px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              fontSize: "14px", color: "#a2acb3" }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm chủ đề…"
              style={{
                width: "100%", paddingLeft: "36px", paddingRight: "12px",
                paddingTop: "9px", paddingBottom: "9px",
                background: "rgba(255,255,255,0.05)", border: "0.8px solid rgba(255,255,255,0.09)",
                borderRadius: "10px", fontSize: "13px", color: "#e9edef",
                fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
            {[["all","Tất cả"],["inprogress","Đang học"],["notstarted","Chưa bắt đầu"],["done","Hoàn thành"]].map(([v,label]) => (
              <button key={v} onClick={() => setProgressFilter(v)} style={{
                padding: "6px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: 500,
                fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
                background: progressFilter === v ? "rgba(20,184,166,0.2)" : "rgba(255,255,255,0.04)",
                color: progressFilter === v ? "#5eead4" : "#a2acb3",
                border: progressFilter === v ? "0.8px solid rgba(20,184,166,0.35)" : "0.8px solid rgba(255,255,255,0.06)",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Personal folders */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e9edef" }}>
              📁 Folder của bạn
            </span>
            <div style={{ flex: 1, height: "0.8px", background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
            {personalFolders.map(f => (
              <PersonalFolderCard key={f.id} folder={f} onSelectFolder={onSelectFolder} />
            ))}
            <CreateFolderCard onCreate={createFolder} />
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && search === "" && progressFilter === "all" && (
          <div style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e9edef" }}>
                ⭐ Nổi bật
              </span>
              <div style={{ flex: 1, height: "0.8px", background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
              {featured.map(t => <TopicCard key={t.id} topic={t} big onSelectFolder={onSelectFolder} />)}
            </div>
          </div>
        )}

        {/* All topics */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e9edef" }}>
              🗂 Tất cả chủ đề
            </span>
            <span style={{
              fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "9999px",
              background: "rgba(20,184,166,0.15)", color: "#5eead4",
            }}>{filtered.length}</span>
            <div style={{ flex: 1, height: "0.8px", background: "rgba(255,255,255,0.06)" }} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#a2acb3", fontSize: "14px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔎</div>
              Không tìm thấy chủ đề phù hợp.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
              {filtered.map(t => <TopicCard key={t.id} topic={t} onSelectFolder={onSelectFolder} />)}
            </div>
          )}
        </div>

        {/* Phrase folders */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e9edef" }}>
              💬 Folder cụm từ
            </span>
            <div style={{ flex: 1, height: "0.8px", background: "rgba(255,255,255,0.06)" }} />
            <button type="button" onClick={() => navigate(`/app/thuvien/phrase-${PHRASE_ALL_ID}`)} style={{
              fontSize: "12px", fontWeight: 600, color: "#5eead4", fontFamily: "Inter, sans-serif",
              background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
            }}>
              Xem tất cả →
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "#a2acb3", marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
            Collocations, idioms và phrasal verbs được tổng hợp theo chủ đề
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px" }}>
            {PHRASE_FOLDERS.map(f => <PhraseFolderCard key={f.id} folder={f} />)}
          </div>
        </div>

      </div>
    </div>
  );
}