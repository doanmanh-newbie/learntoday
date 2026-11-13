// src/pages/ReviewRoute.jsx
// Buổi ôn tập (STT 5) có URL riêng: /app/review. ReviewPage toàn màn hình nên không bọc layout Dashboard.
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import ReviewPage from "./review/ReviewPage";

export default function ReviewRoute() {
  const navigate = useNavigate();
  const home = () => navigate("/app/on-tap");

  return (
    <ProtectedRoute>
      <div style={{ position: "relative", minHeight: "100vh", background: "#0f1214" }}>
        <button
          type="button"
          onClick={home}
          style={{
            position: "fixed", top: 16, left: 16, zIndex: 50,
            padding: "8px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: 600,
            background: "rgba(255,255,255,0.08)", color: "#e9edef",
            border: "0.8px solid rgba(255,255,255,0.15)", cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          ← Ôn tập
        </button>
        <ReviewPage onNavigateHome={home} onGoLearn={() => navigate("/app/thuvien")} />
      </div>
    </ProtectedRoute>
  );
}
