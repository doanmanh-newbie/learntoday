import { RotateCcwIcon, TargetIcon } from "../../../icons/dashboard/index.jsx";

function ReviewCard() {
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
          18
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
            "--progress-width": "0%",
            background: "linear-gradient(90deg,#10b981,#059669)",
          }}
        />
      </div>

      <button
        className="btn-primary w-full py-3 rounded-xl text-sm"
        style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
      >
        Ôn tập ngay →
      </button>
    </div>
  );
}

function GoalCard() {
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
          4
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
          /10
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
        <div className="progress-bar-fill" style={{ "--progress-width": "40%" }} />
      </div>

      <button className="btn-ghost w-full py-3 rounded-xl" style={{ fontSize: 14 }}>
        Học từ mới →
      </button>
    </div>
  );
}

export default function StatCards() {
  return (
    <div
      className="grid gap-5 mb-7"
      style={{ gridTemplateColumns: "1fr 1fr" }}
    >
      <ReviewCard />
      <GoalCard />
    </div>
  );
}
