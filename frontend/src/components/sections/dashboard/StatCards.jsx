import { RotateCcwIcon, TargetIcon } from "../../../icons/dashboard/index.jsx";

function ReviewCard({ dueCount = 0, onReview }) {
  return (
    <div className="glass-card animate-fade-in-up delay-150 p-6 flex flex-col gap-4">
      {/* Label */}
      <div className="flex items-center gap-2">
        <RotateCcwIcon />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#10b981",
            textTransform: "uppercase",
          }}
        >
          Ôn tập hàng ngày
        </span>
      </div>

      {/* Count */}
      <div className="flex items-end gap-3">
        <span
          className="animate-count-up delay-300"
          style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 52,
            fontWeight: 800,
            color: "#e8eaf6",
            lineHeight: 1,
          }}
        >
          {dueCount}
        </span>
        <span
          style={{
            fontSize: 20,
            color: "#8892b0",
            marginBottom: 6,
            fontFamily: "'Outfit',sans-serif",
            fontWeight: 600,
          }}
        >
          từ
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#8892b0" }}>
        cần ôn hôm nay để không bị quên
      </p>

      {/* Progress */}
      <div className="progress-bar-track" style={{ marginTop: "auto" }}>
        <div
          className="progress-bar-fill"
          style={{
            "--progress-width": dueCount > 0 ? "100%" : "0%",
            background: "linear-gradient(90deg,#10b981,#059669)",
          }}
        />
      </div>

      <button
        type="button"
        onClick={onReview}
        className="btn-primary w-full py-3 rounded-xl text-sm"
        style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
      >
        Ôn tập ngay →
      </button>
    </div>
  );
}

function GoalCard({ learnedToday = 0, learnTarget = 10, onLearn }) {
  const progressPct = learnTarget > 0 ? Math.min(100, Math.round((learnedToday / learnTarget) * 100)) : 0;

  return (
    <div className="glass-card animate-fade-in-up delay-200 p-6 flex flex-col gap-4">
      {/* Label */}
      <div className="flex items-center gap-2">
        <TargetIcon />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#f59e0b",
            textTransform: "uppercase",
          }}
        >
          Mục tiêu hôm nay
        </span>
      </div>

      {/* Count */}
      <div className="flex items-end gap-2">
        <span
          className="animate-count-up delay-350"
          style={{
            fontFamily: "'Outfit',sans-serif",
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1,
            background: "linear-gradient(135deg,#a5b4fc,#8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {learnedToday}
        </span>
        <span
          style={{
            fontSize: 26,
            color: "#5a6a8a",
            marginBottom: 6,
            fontFamily: "'Outfit',sans-serif",
            fontWeight: 600,
          }}
        >
          /{learnTarget}
        </span>
        <span
          style={{
            fontSize: 20,
            color: "#8892b0",
            marginBottom: 6,
            fontFamily: "'Outfit',sans-serif",
            fontWeight: 600,
          }}
        >
          từ
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#8892b0" }}>
        mục tiêu học từ mới hàng ngày của bạn
      </p>

      {/* Progress */}
      <div className="progress-bar-track" style={{ marginTop: "auto" }}>
        <div className="progress-bar-fill" style={{ "--progress-width": `${progressPct}%` }} />
      </div>

      <button type="button" onClick={onLearn} className="btn-ghost w-full py-3 rounded-xl" style={{ fontSize: 14 }}>
        Học từ mới →
      </button>
    </div>
  );
}

// src/components/sections/dashboard/StatCards.jsx
export default function StatCards({ dueCount, learnedToday, learnTarget, onReview, onLearn }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Card Ôn tập */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="text-sm text-gray-400">Ôn tập hằng ngày</p>
            <p className="text-2xl font-bold text-yellow-400">{dueCount} từ</p>
            <p className="text-xs text-gray-500">cần ôn hôm nay để không bị quên</p>
          </div>
        </div>
        <button
          onClick={onReview}
          disabled={dueCount === 0}
          className={`mt-3 w-full px-4 py-2 rounded-lg text-sm font-semibold transition ${
            dueCount > 0
              ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
              : "bg-gray-500/20 text-gray-500 cursor-not-allowed"
          }`}
        >
          {dueCount > 0 ? "Ôn tập ngay →" : "Không có từ cần ôn"}
        </button>
      </div>

      {/* Card Học mới */}
      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-sm text-gray-400">Mục tiêu hằng ngày</p>
            <p className="text-2xl font-bold text-blue-400">{learnedToday} / {learnTarget} từ</p>
            <p className="text-xs text-gray-500">mục tiêu học từ mới hàng ngày của bạn</p>
          </div>
        </div>
        <button
          onClick={onLearn}
          className="mt-3 w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition"
        >
          Học từ mới →
        </button>
      </div>
    </div>
  );
}
