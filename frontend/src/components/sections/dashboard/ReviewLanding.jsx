// src/components/sections/dashboard/ReviewLanding.jsx
// Nội dung tab "Ôn tập" - bám đúng STT 5: hiện số từ đến hạn, nút bắt đầu ôn.
// Trường hợp X=0 hiện thông báo chúc mừng + gợi ý học từ mới.

export default function ReviewLanding({ dueCount = 0, onReview, onGoLearn }) {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 480, margin: "40px auto 0" }}>
      <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
        {dueCount > 0 ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
            <p style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 4 }}>
              Bạn có <strong style={{ color: "#a5b4fc" }}>{dueCount}</strong> từ đến lịch ôn tập
            </p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              Ôn ngay để không quên những gì đã học.
            </p>
            <button
              type="button"
              onClick={onReview}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📖 Ôn tập ngay
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
            <p style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 4 }}>
              Chúc mừng! Hôm nay bạn không có từ nào cần ôn tập.
            </p>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 24 }}>
              Hãy học từ mới để duy trì đà nhé!
            </p>
            <button
              type="button"
              onClick={onGoLearn}
              style={{
                padding: "12px 28px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#c7d2fe",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📖 Học từ mới
            </button>
          </>
        )}
      </div>
    </div>
  );
}
