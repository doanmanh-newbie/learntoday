import { useState } from "react";

// ── Image data ────────────────────────────────────────────────────────────────

const TOPICS = [
  {
    id: 1,
    name: "Công nghệ",
    nameEn: "Technology",
    img: "https://images.unsplash.com/photo-1683813479742-4730f91fa3ec?w=600&h=400&fit=crop&auto=format",
    totalWords: 120,
    learnedWords: 87,
    level: "Lv3",
    levelColor: "#a5b4fc",
    levelBg: "rgba(165,180,252,0.18)",
    tags: ["AI", "Lập trình", "Phần mềm"],
    featured: true,
    progress: 73,
  },
  {
    id: 2,
    name: "Du lịch",
    nameEn: "Travel",
    img: "https://images.unsplash.com/photo-1783380018489-8168411a876d?w=600&h=400&fit=crop&auto=format",
    totalWords: 95,
    learnedWords: 12,
    level: "Lv2",
    levelColor: "#34d399",
    levelBg: "rgba(52,211,153,0.18)",
    tags: ["Khách sạn", "Giao thông", "Văn hóa"],
    featured: true,
    progress: 13,
  },
  {
    id: 3,
    name: "Kinh doanh",
    nameEn: "Business",
    img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&h=400&fit=crop&auto=format",
    totalWords: 140,
    learnedWords: 140,
    level: "Lv4",
    levelColor: "#8b5cf6",
    levelBg: "rgba(139,92,246,0.18)",
    tags: ["Họp hành", "Đàm phán", "Marketing"],
    featured: true,
    progress: 100,
  },
  {
    id: 4,
    name: "Khoa học",
    nameEn: "Science",
    img: "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?w=600&h=400&fit=crop&auto=format",
    totalWords: 110,
    learnedWords: 0,
    level: "Lv5",
    levelColor: "#f59e0b",
    levelBg: "rgba(245,158,11,0.18)",
    tags: ["Vật lý", "Hóa học", "Sinh học"],
    featured: false,
    progress: 0,
  },
  {
    id: 5,
    name: "Ẩm thực",
    nameEn: "Food & Cuisine",
    img: "https://images.unsplash.com/photo-1636647511729-6703539ba71f?w=600&h=400&fit=crop&auto=format",
    totalWords: 80,
    learnedWords: 34,
    level: "Lv1",
    levelColor: "#10b981",
    levelBg: "rgba(16,185,129,0.18)",
    tags: ["Nguyên liệu", "Nhà hàng", "Công thức"],
    featured: false,
    progress: 43,
  },
  {
    id: 6,
    name: "Thể thao",
    nameEn: "Sports & Fitness",
    img: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&h=400&fit=crop&auto=format",
    totalWords: 90,
    learnedWords: 56,
    level: "Lv2",
    levelColor: "#34d399",
    levelBg: "rgba(52,211,153,0.18)",
    tags: ["Thi đấu", "Luyện tập", "Dinh dưỡng"],
    featured: false,
    progress: 62,
  },
  {
    id: 7,
    name: "Thiên nhiên",
    nameEn: "Nature",
    img: "https://images.unsplash.com/photo-1595104615356-cbe9c4364513?w=600&h=400&fit=crop&auto=format",
    totalWords: 75,
    learnedWords: 0,
    level: "Lv2",
    levelColor: "#34d399",
    levelBg: "rgba(52,211,153,0.18)",
    tags: ["Động vật", "Thực vật", "Môi trường"],
    featured: false,
    progress: 0,
  },
  {
    id: 8,
    name: "Nghệ thuật",
    nameEn: "Arts & Culture",
    img: "https://images.unsplash.com/photo-1606819717115-9159c900370b?w=600&h=400&fit=crop&auto=format",
    totalWords: 88,
    learnedWords: 21,
    level: "Lv3",
    levelColor: "#a5b4fc",
    levelBg: "rgba(165,180,252,0.18)",
    tags: ["Hội họa", "Âm nhạc", "Điêu khắc"],
    featured: false,
    progress: 24,
  },
  {
    id: 9,
    name: "Y tế",
    nameEn: "Healthcare",
    img: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&h=400&fit=crop&auto=format",
    totalWords: 105,
    learnedWords: 0,
    level: "Lv4",
    levelColor: "#8b5cf6",
    levelBg: "rgba(139,92,246,0.18)",
    tags: ["Triệu chứng", "Điều trị", "Dược phẩm"],
    featured: false,
    progress: 0,
  },
];

const PHRASE_FOLDERS = [
  {
    id: "pf1",
    name: "Cụm từ Công việc",
    desc: "Collocations & phrases thông dụng trong môi trường văn phòng",
    count: 64,
    color: "#6366f1",
    glow: "rgba(99,102,241,0.25)",
    border: "rgba(99,102,241,0.2)",
    bg: "rgba(99,102,241,0.06)",
    phrases: ["take the lead", "meet a deadline", "on the same page", "touch base"],
  },
  {
    id: "pf2",
    name: "Thành ngữ thông dụng",
    desc: "Idioms hay gặp trong văn nói và văn viết tiếng Anh",
    count: 48,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    border: "rgba(245,158,11,0.2)",
    bg: "rgba(245,158,11,0.06)",
    phrases: ["hit the nail on the head", "under the weather", "bite the bullet", "break a leg"],
  },
  {
    id: "pf3",
    name: "Cụm động từ (Phrasal Verbs)",
    desc: "Các phrasal verb quan trọng nhất cho giao tiếp hàng ngày",
    count: 80,
    color: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    border: "rgba(16,185,129,0.2)",
    bg: "rgba(16,185,129,0.06)",
    phrases: ["give up", "look into", "carry on", "run out of"],
  },
  {
    id: "pf4",
    name: "Cụm từ Du lịch",
    desc: "Hội thoại và từ vựng thiết yếu khi đi du lịch nước ngoài",
    count: 52,
    color: "#34d399",
    glow: "rgba(52,211,153,0.25)",
    border: "rgba(52,211,153,0.2)",
    bg: "rgba(52,211,153,0.06)",
    phrases: ["check in / check out", "round trip", "local cuisine", "off the beaten track"],
  },
];

const LEVEL_OPTS = ["Tất cả", "Lv1", "Lv2", "Lv3", "Lv4", "Lv5"];
const LEVEL_CFG = {
  Lv1: { color: "#10b981", bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.3)" },
  Lv2: { color: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.3)" },
  Lv3: { color: "#a5b4fc", bg: "rgba(165,180,252,0.15)", border: "rgba(165,180,252,0.3)" },
  Lv4: { color: "#8b5cf6", bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.3)" },
  Lv5: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
};

// ── Topic Card ────────────────────────────────────────────────────────────────

function TopicCard({ topic, big = false }) {
  const [hovered, setHovered] = useState(false);
  const lv = LEVEL_CFG[topic.level] || LEVEL_CFG.Lv3;
  const done = topic.progress === 100;
  const started = topic.progress > 0 && !done;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        height: big ? "260px" : "200px",
        border: hovered ? "0.8px solid rgba(255,255,255,0.18)" : "0.8px solid rgba(255,255,255,0.08)",
        boxShadow: hovered ? "0 16px 40px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "all 0.35s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        background: "#0d0f24",
      }}
    >
      {/* Background image */}
      <img
        src={topic.img}
        alt={topic.name}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.5s ease",
          opacity: hovered ? 0.55 : 0.4,
        }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(7,9,26,0.97) 0%, rgba(7,9,26,0.55) 55%, rgba(7,9,26,0.2) 100%)",
        transition: "opacity 0.35s ease",
      }} />

      {/* Top-right: level badge */}
      <div style={{
        position: "absolute", top: "12px", right: "12px",
        padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700,
        background: lv.bg, color: lv.color, border: `0.8px solid ${lv.border}`,
        backdropFilter: "blur(8px)",
      }}>
        {topic.level}
      </div>

      {/* Done badge */}
      {done && (
        <div style={{
          position: "absolute", top: "12px", left: "12px",
          padding: "3px 10px", borderRadius: "9999px", fontSize: "10px", fontWeight: 700,
          background: "rgba(16,185,129,0.2)", color: "#10b981",
          border: "0.8px solid rgba(16,185,129,0.35)",
          backdropFilter: "blur(8px)",
        }}>
          ✓ Hoàn thành
        </div>
      )}

      {/* Bottom content */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px" }}>
        {/* Tags row */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
          {topic.tags.map(t => (
            <span key={t} style={{
              fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px",
              background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(4px)", fontFamily: "Inter, sans-serif",
            }}>{t}</span>
          ))}
        </div>

        {/* Title */}
        <p style={{
          fontFamily: "Outfit, sans-serif", fontWeight: 800,
          fontSize: big ? "22px" : "17px", color: "#e8eaf6", marginBottom: "2px",
          lineHeight: 1.2,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}>
          {topic.name}
        </p>
        <p style={{ fontSize: "11px", color: "#8892b0", marginBottom: "10px", fontFamily: "Inter, sans-serif" }}>
          {topic.nameEn} · {topic.totalWords} từ
        </p>

        {/* Progress bar */}
        {topic.progress > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", color: "#5a6a8a", fontFamily: "Inter, sans-serif" }}>
                {topic.learnedWords}/{topic.totalWords} từ đã học
              </span>
              <span style={{ fontSize: "10px", fontWeight: 600, color: done ? "#10b981" : "#a5b4fc", fontFamily: "Inter, sans-serif" }}>
                {topic.progress}%
              </span>
            </div>
            <div style={{ height: "4px", borderRadius: "9999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{
                width: `${topic.progress}%`, height: "100%", borderRadius: "9999px",
                background: done
                  ? "linear-gradient(90deg,#10b981,#059669)"
                  : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                boxShadow: done ? "0 0 6px rgba(16,185,129,0.5)" : "0 0 6px rgba(139,92,246,0.5)",
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        )}

        {/* CTA button */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 14px", borderRadius: "9px", fontSize: "12px", fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          background: hovered
            ? done ? "rgba(16,185,129,0.25)" : "rgba(99,102,241,0.3)"
            : "rgba(255,255,255,0.1)",
          color: done ? "#10b981" : "#a5b4fc",
          border: hovered
            ? done ? "0.8px solid rgba(16,185,129,0.4)" : "0.8px solid rgba(99,102,241,0.4)"
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

// ── Phrase Folder Card ────────────────────────────────────────────────────────

function PhraseFolderCard({ folder }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <p style={{
            fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "15px",
            color: "#e8eaf6", marginBottom: "4px",
          }}>
            {folder.name}
          </p>
          <p style={{ fontSize: "11px", color: "#8892b0", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
            {folder.desc}
          </p>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600,
          background: folder.bg, color: folder.color,
          border: `0.8px solid ${folder.border}`,
          whiteSpace: "nowrap", marginLeft: "12px",
          flexShrink: 0,
        }}>
          {folder.count} cụm
        </span>
      </div>

      {/* Phrase chips */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
        {folder.phrases.map(p => (
          <span key={p} style={{
            fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "6px",
            fontFamily: "Inter, sans-serif", fontStyle: "italic",
            background: "rgba(255,255,255,0.06)", color: folder.color,
            border: `0.8px solid ${folder.border}`,
            transition: "all 0.2s ease",
          }}>
            "{p}"
          </span>
        ))}
        <span style={{
          fontSize: "11px", padding: "4px 10px", borderRadius: "6px",
          color: "#5a6a8a", fontFamily: "Inter, sans-serif",
        }}>
          +{folder.count - 4} nữa…
        </span>
      </div>

      {/* Footer CTA */}
      <div style={{
        marginTop: "14px", paddingTop: "12px",
        borderTop: `0.8px solid ${folder.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "11px", color: "#5a6a8a", fontFamily: "Inter, sans-serif" }}>
          Học qua flashcard · Quiz · Viết câu
        </span>
        <span style={{
          fontSize: "12px", fontWeight: 600, color: folder.color,
          fontFamily: "Inter, sans-serif",
          opacity: hovered ? 1 : 0.7, transition: "opacity 0.2s ease",
        }}>
          Xem tất cả →
        </span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TopicLibraryPage() {
  const [search, setSearch]         = useState("");
  const [levelFilter, setLevelFilter] = useState("Tất cả");
  const [progressFilter, setProgressFilter] = useState("all"); // all | inprogress | notstarted | done

  const filtered = TOPICS.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.nameEn.toLowerCase().includes(search.toLowerCase());
    const matchLevel  = levelFilter === "Tất cả" || t.level === levelFilter;
    const matchProg   =
      progressFilter === "all"       ? true :
      progressFilter === "done"      ? t.progress === 100 :
      progressFilter === "inprogress"? t.progress > 0 && t.progress < 100 :
      progressFilter === "notstarted"? t.progress === 0 : true;
    return matchSearch && matchLevel && matchProg;
  });

  const featured = TOPICS.filter(t => t.featured);

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#07091a", fontFamily: "Inter, sans-serif" }}>
      {/* Ambient glows */}
      <div style={{ position: "fixed", right: "-80px", top: "100px", width: "500px", height: "500px",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", left: "-100px", bottom: "100px", width: "400px", height: "400px",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px 80px", position: "relative" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "Outfit, sans-serif", fontSize: "28px", fontWeight: 800,
            background: "linear-gradient(120deg,#e8eaf6 0%,#a5b4fc 40%,#e8eaf6 60%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "4px",
          }}>
            📚 Thư viện chủ đề
          </h1>
          <p style={{ color: "#8892b0", fontSize: "14px" }}>Khám phá bộ từ vựng và cụm từ theo chủ đề</p>
        </div>

        {/* ── Search + filters ── */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "320px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              fontSize: "14px", color: "#5a6a8a" }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm chủ đề…"
              style={{
                width: "100%", paddingLeft: "36px", paddingRight: "12px",
                paddingTop: "9px", paddingBottom: "9px",
                background: "rgba(255,255,255,0.05)", border: "0.8px solid rgba(255,255,255,0.09)",
                borderRadius: "10px", fontSize: "13px", color: "#e8eaf6",
                fontFamily: "Inter, sans-serif", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Level filter */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {LEVEL_OPTS.map(lv => {
              const active = levelFilter === lv;
              const cfg = lv !== "Tất cả" ? LEVEL_CFG[lv] : null;
              return (
                <button key={lv} onClick={() => setLevelFilter(lv)} style={{
                  padding: "6px 14px", borderRadius: "9999px", fontSize: "12px", fontWeight: 500,
                  fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
                  background: active ? (cfg ? cfg.bg : "rgba(99,102,241,0.2)") : "rgba(255,255,255,0.05)",
                  color:      active ? (cfg ? cfg.color : "#a5b4fc") : "#5a6a8a",
                  border:     active ? `0.8px solid ${cfg ? cfg.border : "rgba(99,102,241,0.4)"}` : "0.8px solid rgba(255,255,255,0.07)",
                  boxShadow:  active && cfg ? `0 0 8px ${cfg.border}` : "none",
                }}>
                  {lv}
                </button>
              );
            })}
          </div>

          {/* Progress filter */}
          <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
            {[["all","Tất cả"],["inprogress","Đang học"],["notstarted","Chưa bắt đầu"],["done","Hoàn thành"]].map(([v,label]) => (
              <button key={v} onClick={() => setProgressFilter(v)} style={{
                padding: "6px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: 500,
                fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
                background: progressFilter === v ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                color:      progressFilter === v ? "#a5b4fc" : "#5a6a8a",
                border:     progressFilter === v ? "0.8px solid rgba(99,102,241,0.35)" : "0.8px solid rgba(255,255,255,0.06)",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* ── Featured strip ── */}
        {search === "" && levelFilter === "Tất cả" && progressFilter === "all" && (
          <div style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e8eaf6" }}>
                ⭐ Nổi bật
              </span>
              <div style={{ flex: 1, height: "0.8px", background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
              {featured.map(t => <TopicCard key={t.id} topic={t} big />)}
            </div>
          </div>
        )}

        {/* ── All topics grid ── */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e8eaf6" }}>
              🗂 Tất cả chủ đề
            </span>
            <span style={{
              fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "9999px",
              background: "rgba(99,102,241,0.15)", color: "#a5b4fc",
            }}>
              {filtered.length}
            </span>
            <div style={{ flex: 1, height: "0.8px", background: "rgba(255,255,255,0.06)" }} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#5a6a8a", fontSize: "14px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔎</div>
              Không tìm thấy chủ đề phù hợp.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
              {filtered.map(t => <TopicCard key={t.id} topic={t} />)}
            </div>
          )}
        </div>

        {/* ── Phrase folders section ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: "16px", color: "#e8eaf6" }}>
              💬 Folder cụm từ
            </span>
            <div style={{ flex: 1, height: "0.8px", background: "rgba(255,255,255,0.06)" }} />
            <button style={{
              fontSize: "12px", fontWeight: 500, color: "#a5b4fc", fontFamily: "Inter, sans-serif",
              background: "none", border: "none", cursor: "pointer",
            }}>
              Xem tất cả →
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "#5a6a8a", marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
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
