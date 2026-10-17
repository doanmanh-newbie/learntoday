// src/pages/AppHome.jsx
// Trang chủ tạm thời sau khi đăng nhập (route "/app"). Đây KHÔNG phải dashboard
// thật bạn đã làm ở Figma (folder components/sections/dashboard hiện đang rỗng) —
// đây chỉ là trang tạm để có chỗ điều hướng vào Học từ vựng / Ôn tập, tránh
// "cụt đường" sau khi đăng nhập. Gửi mình file dashboard thật để thay vào đây.
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AppHome() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Chào {user?.username ?? "bạn"} 👋
        </h1>
        <p className="mt-1 text-slate-600">Hôm nay bạn muốn học gì?</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/app/learn"
          className="rounded-2xl border border-solid border-slate-200 bg-white p-6 no-underline transition-shadow hover:shadow-md"
        >
          <p className="text-lg font-bold text-slate-900">📚 Học từ vựng mới</p>
          <p className="mt-1 text-sm text-slate-600">Khám phá và học các từ chưa biết trong từng chủ đề.</p>
        </Link>
        <Link
          to="/app/review"
          className="rounded-2xl border border-solid border-slate-200 bg-white p-6 no-underline transition-shadow hover:shadow-md"
        >
          <p className="text-lg font-bold text-slate-900">🔁 Ôn tập</p>
          <p className="mt-1 text-sm text-slate-600">Ôn lại từ đã học theo lịch SRS để nhớ lâu hơn.</p>
        </Link>
      </div>

      <p className="text-sm text-slate-400">
        Các mục khác trên thanh điều hướng (Folder, Tìm kiếm, Lịch sử...) chưa có trang — sẽ làm ở các bước tiếp theo.
      </p>
    </div>
  );
}
