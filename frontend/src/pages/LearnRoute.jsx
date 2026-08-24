// src/pages/LearnRoute.jsx
// LearnPage được thiết kế toàn màn hình (nền tối #07091a), nên KHÔNG bọc
// trong AppLayout (sẽ bị header/nav sáng màu phá vỡ trải nghiệm học liền mạch).
// File này chỉ làm nhiệm vụ: bảo vệ route (cần đăng nhập) + nối nút "Về trang
// chủ" bên trong LearnPage vào router thật, thay vì để trống như bản gốc.
import { useNavigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import LearnPage from "./learn/LearnPage";

export default function LearnRoute() {
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
        <LearnPage onNavigateHome={() => navigate("/app")} />
      </div>
    </ProtectedRoute>
  );
}
