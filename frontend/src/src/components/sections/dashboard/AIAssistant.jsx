import { useState } from "react";
import {
  BrainIcon,
  SparklesIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "../../../icons/dashboard/index.jsx";

const VOCAB = [
  { word: "accomplish", pos: "v", vi: "đạt được thành tựu" },
  { word: "significant", pos: "adj", vi: "đáng kể" },
  { word: "milestone", pos: "n", vi: "cột mốc" },
];

function VocabChips() {
  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#5a6a8a",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Từ vựng gợi ý
      </p>
      <div className="flex gap-2 flex-wrap">
        {VOCAB.map(({ word, pos, vi }) => (
          <div key={word} className="vocab-chip cursor-pointer">
            <span style={{ fontWeight: 600 }}>{word}</span>
            <span style={{ color: "#6366f1", marginLeft: 4 }}>({pos})</span>
            <span style={{ color: "#5a6a8a", marginLeft: 4 }}>: {vi}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackError() {
  return (
    <div
      className="rounded-xl p-4 flex gap-3"
      style={{
        background: "rgba(248,113,113,0.06)",
        border: "1px solid rgba(248,113,113,0.18)",
      }}
    >
      <div style={{ marginTop: 1, flexShrink: 0 }}>
        <AlertTriangleIcon />
      </div>
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#f87171",
            marginBottom: 4,
            letterSpacing: "0.04em",
          }}
        >
          Phản hồi AI · Lỗi ngữ pháp phát hiện
        </p>
        <p style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.6 }}>
          Cần dùng số ít{" "}
          <span
            style={{
              background: "rgba(248,113,113,0.15)",
              borderRadius: 4,
              padding: "1px 5px",
              fontWeight: 700,
              color: "#fca5a5",
            }}
          >
            "milestone"
          </span>{" "}
          sau mạo từ "a", hoặc bỏ "a" thành{" "}
          <span
            style={{
              background: "rgba(248,113,113,0.15)",
              borderRadius: 4,
              padding: "1px 5px",
              fontWeight: 700,
              color: "#fca5a5",
            }}
          >
            "significant milestones"
          </span>
          .
        </p>
      </div>
    </div>
  );
}

function FeedbackSuggestion() {
  return (
    <div
      className="rounded-xl p-4 flex gap-3"
      style={{
        background: "rgba(16,185,129,0.06)",
        border: "1px solid rgba(16,185,129,0.18)",
      }}
    >
      <div style={{ marginTop: 1, flexShrink: 0 }}>
        <CheckCircleIcon />
      </div>
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#10b981",
            marginBottom: 4,
            letterSpacing: "0.04em",
          }}
        >
          Gợi ý câu đúng
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#6ee7b7",
            lineHeight: 1.6,
            fontStyle: "italic",
          }}
        >
          "He accomplished a very significant{" "}
          <span
            style={{
              textDecoration: "underline",
              textDecorationColor: "rgba(110,231,183,0.5)",
              fontWeight: 600,
            }}
          >
            milestone
          </span>{" "}
          last year." hoặc "He accomplished very significant{" "}
          <span
            style={{
              textDecoration: "underline",
              textDecorationColor: "rgba(110,231,183,0.5)",
              fontWeight: 600,
            }}
          >
            milestones
          </span>{" "}
          last year."
        </p>
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [sentence, setSentence] = useState(
    "Anh ấy đã đạt được những cột mốc vô cùng quan trọng vào năm ngoái."
  );

  return (
    <div className="glass-card animate-fade-in-up delay-250 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{
              background: "rgba(165,180,252,0.1)",
              border: "1px solid rgba(165,180,252,0.2)",
            }}
          >
            <BrainIcon />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#a5b4fc",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              AI ASSISTANT
            </span>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#e8eaf6",
              }}
            >
              Đặt câu + Sửa lỗi AI · Cấp độ B1
            </p>
            <p style={{ fontSize: 12, color: "#8892b0", marginTop: 1 }}>
              Luyện viết câu với từ vựng đã học và nhận phản hồi ngữ pháp tức thì từ AI.
            </p>
          </div>
        </div>

        <button
          className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
          style={{ whiteSpace: "nowrap" }}
        >
          <SparklesIcon />
          🎯 Luyện tập
        </button>
      </div>

      <VocabChips />

      {/* Input + feedback area */}
      <div className="flex flex-col gap-3">
        {/* Vietnamese sentence input */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(99,102,241,0.07)",
            border: "1px solid rgba(99,102,241,0.18)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#6366f1",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Đặt câu:
          </p>
          <textarea
            className="w-full resize-none bg-transparent outline-none"
            style={{
              fontSize: 14,
              color: "#c7d2fe",
              fontStyle: "italic",
              lineHeight: 1.6,
              minHeight: 48,
            }}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
          />
        </div>

        {/* English translation */}
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <p style={{ fontSize: 13.5, color: "#8892b0", lineHeight: 1.6 }}>
            "He accomplished a very significant milestones last year."
          </p>
        </div>

        <FeedbackError />
        <FeedbackSuggestion />
      </div>
    </div>
  );
}
