import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── Chart data ──────────────────────────────────────────────────────────────

const weekData = [
  { label: "T2", words: 12 },
  { label: "T3", words: 18 },
  { label: "T4", words: 8 },
  { label: "T5", words: 22 },
  { label: "T6", words: 15 },
  { label: "T7", words: 29 },
  { label: "CN", words: 4 },
];

const monthData = [
  { label: "T1", words: 45 },
  { label: "T2", words: 62 },
  { label: "T3", words: 38 },
  { label: "T4", words: 71 },
  { label: "T5", words: 55 },
  { label: "T6", words: 83 },
  { label: "T7", words: 67 },
  { label: "T8", words: 49 },
  { label: "T9", words: 91 },
  { label: "T10", words: 74 },
  { label: "T11", words: 58 },
  { label: "T12", words: 30 },
];

const levelChartData = [
  { label: "Lv1", words: 52, color: "#10b981", glow: "rgba(16,185,129,0.55)" },
  { label: "Lv2", words: 38, color: "#34d399", glow: "rgba(52,211,153,0.5)" },
  { label: "Lv3", words: 61, color: "#a5b4fc", glow: "rgba(165,180,252,0.55)" },
  { label: "Lv4", words: 27, color: "#8b5cf6", glow: "rgba(139,92,246,0.55)" },
  { label: "Lv5", words: 14, color: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
  { label: "Lv6", words: 5,  color: "#f87171", glow: "rgba(248,113,113,0.5)" },
];

// ── Level config ─────────────────────────────────────────────────────────────

const LEVELS = {
  Lv1: { color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.28)"  },
  Lv2: { color: "#34d399", bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.28)"  },
  Lv3: { color: "#a5b4fc", bg: "rgba(165,180,252,0.12)", border: "rgba(165,180,252,0.28)" },
  Lv4: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.28)"  },
  Lv5: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.28)"  },
  Lv6: { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.28)" },
};

// ── Vocab data ────────────────────────────────────────────────────────────────

const vocabData = [
  { word: "accomplish",   meaning: "đạt được, hoàn thành",   folder: "Công việc",  level: "Lv3", learned: true  },
  { word: "significant",  meaning: "đáng kể, quan trọng",    folder: "Học thuật",  level: "Lv4", learned: true  },
  { word: "milestone",    meaning: "cột mốc quan trọng",     folder: "Công việc",  level: "Lv3", learned: true  },
  { word: "perseverance", meaning: "sự kiên trì",            folder: "Phẩm chất",  level: "Lv5", learned: true  },
  { word: "collaborate",  meaning: "cộng tác, hợp tác",      folder: "Công việc",  level: "Lv3", learned: false },
  { word: "resilient",    meaning: "kiên cường, bền bỉ",     folder: "Phẩm chất",  level: "Lv4", learned: false },
  { word: "innovative",   meaning: "sáng tạo, đổi mới",      folder: "Công nghệ",  level: "Lv4", learned: true  },
  { word: "eloquent",     meaning: "hùng hồn, lưu loát",     folder: "Giao tiếp",  level: "Lv5", learned: false },
  { word: "dedicate",     meaning: "cống hiến, dành tặng",   folder: "Phẩm chất",  level: "Lv2", learned: true  },
  { word: "analyze",      meaning: "phân tích",              folder: "Học thuật",  level: "Lv3", learned: true  },
  { word: "fluent",       meaning: "trôi chảy, thành thạo",  folder: "Giao tiếp",  level: "Lv2", learned: true  },
  { word: "strategy",     meaning: "chiến lược",             folder: "Công việc",  level: "Lv3", learned: false },
];

const ALL_FOLDERS = [...new Set(vocabData.map(v => v.folder))];
const ALL_LVS     = ["Lv1", "Lv2", "Lv3", "Lv4", "Lv5", "Lv6"];

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, isLevel }) {
  if (!active || !payload?.length) return null;
  const lv = isLevel ? LEVELS[label] : null;
  return (
    <div
      style={{
        background: "rgba(15,17,40,0.96)",
        border: `1px solid ${lv ? lv.border : "rgba(99,102,241,0.3)"}`,
        backdropFilter: "blur(12px)",
        borderRadius: "12px",
        padding: "10px 16px",
      }}
    >
      <p style={{ color: "#8892b0", fontSize: "11px", marginBottom: "4px", fontFamily: "Inter, sans-serif" }}>
        {label}
      </p>
      <p style={{ color: lv ? lv.color : "#a5b4fc", fontWeight: 700, fontSize: "15px", fontFamily: "Outfit, sans-serif" }}>
        {payload[0].value} từ
      </p>
    </div>
  );
}

// ── Stat Card helper ──────────────────────────────────────────────────────────

function StatCard({ children, glowColor }) {
  const base = "rgba(255,255,255,0.08)";
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `0.8px solid ${base}`,
        backdropFilter: "blur(12px)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "default",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 8px 32px ${glowColor}`;
        e.currentTarget.style.borderColor = glowColor.replace("0.2)", "0.35)");
        e.currentTarget.style.transform = "scale(1.02)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.borderColor = base;
        e.currentTarget.style.transform = "";
      }}
    >
      {children}
    </div>
  );
}

// ── Pill button ───────────────────────────────────────────────────────────────

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 12px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
        background: active ? "rgba(99,102,241,0.2)"   : "rgba(255,255,255,0.05)",
        color:      active ? "#a5b4fc"                 : "#5a6a8a",
        border:     active ? "0.8px solid rgba(99,102,241,0.4)" : "0.8px solid rgba(255,255,255,0.07)",
        transition: "all 0.2s ease",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  // chart
  const [chartView, setChartView] = useState("date"); // "date" | "level"
  const [period, setPeriod]       = useState("week");  // "week" | "month"
  const [hoveredBar, setHoveredBar] = useState(null);

  // vocab list
  const [expanded,      setExpanded]      = useState(false);
  const [filterMode,    setFilterMode]    = useState("all");    // "all" | "folder" | "level"
  const [activeFolder,  setActiveFolder]  = useState(null);
  const [activeLevel,   setActiveLevel]   = useState(null);

  // resolve chart data
  const dateData  = period === "week" ? weekData : monthData;
  const chartData = chartView === "level" ? levelChartData : dateData;
  const barSize   = chartView === "level" ? 36 : period === "week" ? 32 : 20;

  // resolve vocab list
  const pool = expanded ? vocabData : vocabData.slice(0, 5);
  const filteredVocab = pool.filter(v => {
    if (filterMode === "folder" && activeFolder) return v.folder === activeFolder;
    if (filterMode === "level"  && activeLevel)  return v.level  === activeLevel;
    return true;
  });

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#07091a", fontFamily: "Inter, sans-serif" }}>

      {/* Ambient glows */}
      <div style={{ position: "fixed", left: "-150px", top: "-200px", width: "600px", height: "600px",
        borderRadius: "300px", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", right: "-100px", top: "200px", width: "500px", height: "500px",
        borderRadius: "250px", background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
        filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: "960px", margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1
              style={{
                fontFamily: "Outfit, sans-serif", fontSize: "28px", fontWeight: 800,
                background: "linear-gradient(120deg, #e8eaf6 0%, #a5b4fc 40%, #e8eaf6 60%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: "4px",
              }}
            >
              📊 Thống kê học tập
            </h1>
            <p style={{ color: "#8892b0", fontSize: "14px" }}>Theo dõi tiến độ học tập của bạn</p>
          </div>

          {/* Period toggle — shown only in date mode */}
          {chartView === "date" && (
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)",
              border: "0.8px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "4px", gap: "4px" }}>
              {[["week","Tuần này"],["month","Tháng này"]].map(([v, label]) => (
                <button key={v} onClick={() => setPeriod(v)}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                    fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
                    background: period === v ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
                    color:      period === v ? "#fff" : "#8892b0",
                    boxShadow:  period === v ? "0 0 16px rgba(99,102,241,0.4)" : "none",
                    border: "none",
                  }}
                >{label}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── 4 Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px", marginBottom: "24px" }}
          className="lg:grid-cols-4">

          {/* Card 1 */}
          <StatCard glowColor="rgba(99,102,241,0.2)">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "22px" }}>📖</span>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "9999px",
                background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>75%</span>
            </div>
            <div>
              <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "22px", fontWeight: 800, color: "#e8eaf6" }}>
                186<span style={{ fontSize: "13px", color: "#5a6a8a", fontWeight: 600 }}>/247</span>
              </p>
              <p style={{ fontSize: "11px", color: "#8892b0", marginTop: "2px" }}>từ đã học</p>
            </div>
            <div style={{ width: "100%", height: "6px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div style={{ width: "75%", height: "100%", borderRadius: "9999px",
                background: "linear-gradient(90deg,#6366f1,#8b5cf6)", boxShadow: "0 0 8px rgba(139,92,246,0.5)", transition: "width 0.7s ease" }} />
            </div>
          </StatCard>

          {/* Card 2 */}
          <StatCard glowColor="rgba(249,115,22,0.2)">
            <span style={{ fontSize: "22px" }}>🔥</span>
            <div>
              <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "26px", fontWeight: 800,
                background: "linear-gradient(135deg,#fb923c,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>5</p>
              <p style={{ fontSize: "11px", color: "#8892b0", marginTop: "2px" }}>ngày liên tiếp</p>
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: "6px", borderRadius: "9999px",
                  background: i < 5 ? "linear-gradient(90deg,#f97316,#fb923c)" : "rgba(255,255,255,0.07)",
                  boxShadow: i < 5 ? "0 0 6px rgba(249,115,22,0.4)" : "none",
                }} />
              ))}
            </div>
          </StatCard>

          {/* Card 3 */}
          <StatCard glowColor="rgba(250,204,21,0.15)">
            <span style={{ fontSize: "22px" }}>⏰</span>
            <div>
              <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "22px", fontWeight: 800, color: "#e8eaf6" }}>
                54h <span style={{ fontSize: "16px" }}>12p</span>
              </p>
              <p style={{ fontSize: "11px", color: "#8892b0", marginTop: "2px" }}>từ trước đến nay</p>
            </div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#facc15" }}>↑ 3h 20p tuần này</p>
          </StatCard>

          {/* Card 4 */}
          <StatCard glowColor="rgba(16,185,129,0.2)">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "22px" }}>🎯</span>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "9999px",
                background: "rgba(16,185,129,0.15)", color: "#10b981" }}>40%</span>
            </div>
            <div>
              <p style={{ fontFamily: "Outfit, sans-serif", fontSize: "22px", fontWeight: 800, color: "#e8eaf6" }}>
                4<span style={{ fontSize: "13px", color: "#5a6a8a", fontWeight: 600 }}>/10</span>
              </p>
              <p style={{ fontSize: "11px", color: "#8892b0", marginTop: "2px" }}>mục tiêu hôm nay</p>
            </div>
            <div style={{ width: "100%", height: "6px", borderRadius: "9999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div style={{ width: "40%", height: "100%", borderRadius: "9999px",
                background: "linear-gradient(90deg,#10b981,#059669)", boxShadow: "0 0 8px rgba(16,185,129,0.5)", transition: "width 0.7s ease" }} />
            </div>
          </StatCard>
        </div>

        {/* ── Bar Chart ── */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)", borderRadius: "16px", padding: "24px", marginBottom: "24px",
        }}>
          {/* Chart header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "15px", fontWeight: 700, color: "#e8eaf6" }}>
                Số từ đã học
              </h2>
              <p style={{ fontSize: "11px", color: "#5a6a8a", marginTop: "2px" }}>
                {chartView === "level" ? "Phân loại theo cấp độ" : period === "week" ? "7 ngày qua" : "12 tháng qua"}
              </p>
            </div>

            {/* View mode pills */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Chart view selector */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)",
                border: "0.8px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "3px", gap: "3px" }}>
                <button
                  onClick={() => setChartView("date")}
                  style={{
                    padding: "5px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: 500,
                    fontFamily: "Inter, sans-serif", cursor: "pointer", border: "none", transition: "all 0.2s ease",
                    background: chartView === "date" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
                    color: chartView === "date" ? "#fff" : "#8892b0",
                    boxShadow: chartView === "date" ? "0 0 10px rgba(99,102,241,0.4)" : "none",
                  }}
                >
                  📅 Theo ngày
                </button>
                <button
                  onClick={() => setChartView("level")}
                  style={{
                    padding: "5px 12px", borderRadius: "7px", fontSize: "12px", fontWeight: 500,
                    fontFamily: "Inter, sans-serif", cursor: "pointer", border: "none", transition: "all 0.2s ease",
                    background: chartView === "level" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
                    color: chartView === "level" ? "#fff" : "#8892b0",
                    boxShadow: chartView === "level" ? "0 0 10px rgba(99,102,241,0.4)" : "none",
                  }}
                >
                  🎓 Theo cấp độ
                </button>
              </div>

              {/* Legend dot */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px",
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />
                <span style={{ fontSize: "11px", color: "#8892b0" }}>Số từ</span>
              </div>
            </div>
          </div>

          {/* Level legend strip */}
          {chartView === "level" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              {levelChartData.map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: d.color,
                    boxShadow: `0 0 6px ${d.glow}` }} />
                  <span style={{ fontSize: "11px", color: "#8892b0", fontFamily: "Inter, sans-serif" }}>{d.label}</span>
                </div>
              ))}
            </div>
          )}

          <ResponsiveContainer width="100%" height={210}>
            <BarChart
              data={chartData}
              barSize={barSize}
              margin={{ top: 24, right: 4, left: -24, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5a6a8a", fontSize: 12, fontFamily: "Inter, sans-serif" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5a6a8a", fontSize: 11, fontFamily: "Inter, sans-serif" }}
              />
              <Tooltip
                content={<CustomTooltip isLevel={chartView === "level"} />}
                cursor={{ fill: "rgba(99,102,241,0.06)", radius: 8 }}
              />
              <Bar
                dataKey="words"
                radius={[6, 6, 0, 0]}
                label={{ position: "top", fill: "#8892b0", fontSize: 11, fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                onMouseEnter={(_, index) => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {chartData.map((entry, index) => {
                  const isHovered = hoveredBar === index;
                  if (chartView === "level") {
                    return (
                      <Cell
                        key={index}
                        fill={entry.color}
                        style={{ filter: isHovered ? `drop-shadow(0 0 10px ${entry.glow})` : "none", transition: "filter 0.2s ease" }}
                        opacity={isHovered ? 1 : 0.85}
                      />
                    );
                  }
                  return (
                    <Cell
                      key={index}
                      fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
                      style={{ filter: isHovered ? "drop-shadow(0 0 8px rgba(139,92,246,0.6))" : "none", transition: "filter 0.2s ease" }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Vocabulary List ── */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "0.8px solid rgba(255,255,255,0.07)",
          borderRadius: "16px", overflow: "hidden",
        }}>

          {/* List header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px", borderBottom: "0.8px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "15px", fontWeight: 700, color: "#e8eaf6" }}>
                Danh sách từ vựng
              </h2>
              <p style={{ fontSize: "11px", color: "#5a6a8a", marginTop: "2px" }}>
                {vocabData.length} từ · {vocabData.filter(v => v.learned).length} đã học
              </p>
            </div>

            {/* Primary filter tabs */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[["all","Tất cả"],["folder","Chủ đề"],["level","Cấp độ"]].map(([mode, label]) => (
                <button key={mode}
                  onClick={() => {
                    setFilterMode(mode);
                    setActiveFolder(null);
                    setActiveLevel(null);
                  }}
                  style={{
                    padding: "5px 14px", borderRadius: "9999px", fontSize: "12px", fontWeight: 500,
                    fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
                    background: filterMode === mode ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                    color:      filterMode === mode ? "#a5b4fc" : "#5a6a8a",
                    border:     filterMode === mode ? "0.8px solid rgba(99,102,241,0.4)" : "0.8px solid rgba(255,255,255,0.07)",
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Sub-filter row: topics */}
          {filterMode === "folder" && (
            <div style={{
              display: "flex", gap: "8px", padding: "10px 24px", flexWrap: "wrap",
              borderBottom: "0.8px solid rgba(255,255,255,0.05)",
              background: "rgba(99,102,241,0.03)",
            }}>
              <Pill active={activeFolder === null} onClick={() => setActiveFolder(null)}>Tất cả chủ đề</Pill>
              {ALL_FOLDERS.map(f => (
                <Pill key={f} active={activeFolder === f} onClick={() => setActiveFolder(f)}>{f}</Pill>
              ))}
            </div>
          )}

          {/* Sub-filter row: levels */}
          {filterMode === "level" && (
            <div style={{
              display: "flex", gap: "8px", padding: "10px 24px", flexWrap: "wrap",
              borderBottom: "0.8px solid rgba(255,255,255,0.05)",
              background: "rgba(99,102,241,0.03)",
            }}>
              <Pill active={activeLevel === null} onClick={() => setActiveLevel(null)}>Tất cả cấp</Pill>
              {ALL_LVS.map(lv => {
                const cfg = LEVELS[lv];
                const isActive = activeLevel === lv;
                return (
                  <button key={lv}
                    onClick={() => setActiveLevel(lv)}
                    style={{
                      padding: "4px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: 600,
                      fontFamily: "Inter, sans-serif", cursor: "pointer", transition: "all 0.2s ease",
                      background: isActive ? cfg.bg : "rgba(255,255,255,0.05)",
                      color:      isActive ? cfg.color : "#5a6a8a",
                      border:     isActive ? `0.8px solid ${cfg.border}` : "0.8px solid rgba(255,255,255,0.07)",
                      boxShadow:  isActive ? `0 0 8px ${cfg.border}` : "none",
                    }}
                  >{lv}</button>
                );
              })}
            </div>
          )}

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2rem 1fr 1fr auto auto",
            gap: "1rem",
            padding: "10px 24px",
            borderBottom: "0.8px solid rgba(255,255,255,0.04)",
            fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.06em", color: "#5a6a8a",
          }}>
            <span />
            <span>Từ vựng</span>
            <span>Nghĩa</span>
            <span>Chủ đề</span>
            <span>Cấp độ</span>
          </div>

          {/* Rows */}
          <div>
            {filteredVocab.length === 0 ? (
              <p style={{ padding: "24px", textAlign: "center", color: "#5a6a8a", fontSize: "13px" }}>
                Không có từ nào phù hợp.
              </p>
            ) : (
              filteredVocab.map((item, i) => {
                const lv = LEVELS[item.level];
                return (
                  <div
                    key={item.word}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2rem 1fr 1fr auto auto",
                      gap: "1rem",
                      padding: "14px 24px",
                      alignItems: "center",
                      borderBottom: i < filteredVocab.length - 1 ? "0.8px solid rgba(255,255,255,0.04)" : "none",
                      background: "transparent",
                      transition: "background 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Status square */}
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", transition: "all 0.2s ease",
                      background: item.learned ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                      border:     item.learned ? "0.8px solid rgba(16,185,129,0.3)" : "0.8px solid rgba(255,255,255,0.1)",
                      color:      item.learned ? "#10b981" : "#5a6a8a",
                    }}>
                      {item.learned ? "✓" : "○"}
                    </div>

                    {/* Word */}
                    <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: "14px", color: "#c7d2fe" }}>
                      {item.word}
                    </span>

                    {/* Meaning */}
                    <span style={{ fontSize: "13px", color: "#8892b0" }}>{item.meaning}</span>

                    {/* Folder */}
                    <span style={{
                      fontSize: "11px", padding: "3px 10px", borderRadius: "9999px", fontWeight: 500,
                      whiteSpace: "nowrap",
                      background: "rgba(99,102,241,0.1)", color: "#a5b4fc",
                      border: "0.8px solid rgba(99,102,241,0.2)",
                    }}>
                      {item.folder}
                    </span>

                    {/* Level badge */}
                    <span style={{
                      fontSize: "11px", padding: "3px 10px", borderRadius: "9999px", fontWeight: 700,
                      textAlign: "center", minWidth: "40px",
                      background: lv.bg, color: lv.color, border: `0.8px solid ${lv.border}`,
                    }}>
                      {item.level}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Expand / Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "100%", padding: "14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              fontSize: "13px", fontWeight: 500, fontFamily: "Inter, sans-serif",
              color: "#8892b0", background: "transparent",
              borderTop: "0.8px solid rgba(255,255,255,0.06)",
              cursor: "pointer", transition: "all 0.2s ease",
              border: "none", borderTop: "0.8px solid rgba(255,255,255,0.06)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.color = "#a5b4fc"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8892b0"; }}
          >
            <span>{expanded ? "Thu gọn" : `Xem thêm ${vocabData.length - 5} từ`}</span>
            <span style={{ display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>↓</span>
          </button>
        </div>

      </div>
    </div>
  );s
}
