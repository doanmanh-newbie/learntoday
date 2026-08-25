// src/pages/ReviewRoute.jsx
// Cùng lý do như LearnRoute.jsx: ReviewPage full màn hình, không bọc AppLayout.
// ReviewPage bản gốc KHÔNG có nút quay lại nào ở màn hình tổng quan (chỉ có
// onNavigateHome truyền vào nhưng không được gọi ở đâu cả) -> thêm 1 nút nhỏ
// nổi góc trên-trái để không bị "cụt đường" khi tích hợp thật.
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import ReviewPage from "./review/ReviewPage";

export default function ReviewRoute() {
  const navigate = useNavigate();

  return (
    <ProtectedRoute>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => navigate("/app")}
          style={{
            position: "fixed", top: 16, left: 16, zIndex: 50,
            padding: "8px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: 600,
            background: "rgba(255,255,255,0.08)", color: "#e8eaf6",
            border: "0.8px solid rgba(255,255,255,0.15)", cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          ← Trang chủ
        </button>
        <ReviewPage onNavigateHome={() => navigate("/app")} onGoLearn={() => navigate("/app/learn")} />
      </div>
    </ProtectedRoute>
  );
}
