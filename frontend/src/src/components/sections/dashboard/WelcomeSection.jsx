export default function WelcomeSection({
  username = 'bạn',
  learnedToday = 0,
  learnTarget = 10,
  stats = { totalLearned: 0, streak: 0, accuracy: 0 },
}) {
  const STATS = [
    { label: "Từ đã học", value: String(stats.totalLearned), icon: "📖" },
    { label: "Chuỗi ngày", value: String(stats.streak), icon: "🔥" },
    { label: "Độ chính xác", value: `${stats.accuracy}%`, icon: "🎯" },
  ];

  const progressPct = learnTarget > 0 ? Math.min(100, Math.round((learnedToday / learnTarget) * 100)) : 0;

  const dateStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="animate-fade-in-up mb-8">
      {/* Greeting row */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1
            className="shimmer-text mb-1"
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Chào {username}! 👋
          </h1>
          <p style={{ color: "#8892b0", fontSize: 15 }}>
            Hãy duy trì ngọn lửa học tập ngày hôm nay nhé.
          </p>
        </div>

        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span>📅</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#8892b0" }}>
            {dateStr}
          </span>
        </div>
      </div>

      {/* Progress overview */}
      <div
        className="mt-5 rounded-xl p-4 flex items-center gap-6 flex-wrap"
        style={{
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.15)",
        }}
      >
        {/* Progress bar */}
        <div className="flex flex-col gap-1 flex-1" style={{ minWidth: 180 }}>
          <div className="flex justify-between items-center mb-1">
            <span
              style={{
                fontSize: 12,
                color: "#8892b0",
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              Tiến độ hôm nay
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#a5b4fc" }}>
              {learnedToday} / {learnTarget} từ
            </span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ "--progress-width": `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Mini stats */}
        {STATS.map(({ label, value, icon }) => (
          <div key={label} className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#e8eaf6",
                  fontFamily: "'Outfit',sans-serif",
                  lineHeight: 1,
                }}
              >
                {value}
              </p>
              <p style={{ fontSize: 11, color: "#5a6a8a", marginTop: 2 }}>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
