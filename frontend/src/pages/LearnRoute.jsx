// src/pages/LearnRoute.jsx
// Buổi học (STT 6) có URL riêng: /app/learn/:folderId
//  - F5 giữ nguyên folder đang học (trước đây buổi học chỉ là lớp phủ trong Dashboard: F5 là mất, Back thoát luôn trang).
//  - Nút Back của trình duyệt quay về danh sách từ của folder.
// LearnPage toàn màn hình (nền tối) nên KHÔNG bọc trong layout Dashboard.
import { useNavigate, useParams } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import LearnPage from "./learn/LearnPage";

export default function LearnRoute() {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const backToFolder = () => navigate(`/app/thuvien/${folderId}`);

  return (
    <ProtectedRoute>
      <div style={{ position: "relative", minHeight: "100vh", background: "#0f1214" }}>
        <button
          type="button"
          onClick={backToFolder}
          style={{
            position: "fixed", top: 16, left: 16, zIndex: 50,
            padding: "8px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: 600,
            background: "rgba(255,255,255,0.08)", color: "#e9edef",
            border: "0.8px solid rgba(255,255,255,0.15)", cursor: "pointer",
            backdropFilter: "blur(8px)",
          }}
        >
          ← Danh sách từ
        </button>
        <LearnPage key={folderId} mode="learn" folderId={folderId} onNavigateHome={backToFolder} />
      </div>
    </ProtectedRoute>
  );
}
