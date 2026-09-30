import { HomeIcon, RotateCcwIcon, BarChartIcon, BookIcon, PenIcon, BookOpenIcon } from "../../../icons/dashboard/index.jsx";
import { useNavigate } from "react-router-dom";

const TABS = [
  { id: "dashboard", icon: <HomeIcon />, label: "Trang chủ" },
  { id: "review", icon: <RotateCcwIcon />, label: "Ôn tập" },
  { id: "thongke", icon: <BarChartIcon />, label: "Thống kê" },
  { id: "thuvien", icon: <BookIcon />, label: "Thư viện chủ đề" },
  { id: "datcau", icon: <PenIcon />, label: "Đặt câu · Sửa lỗi" },
  { id: "dictionary", icon: <BookOpenIcon />, label: "Từ điển" }, // Thêm cái này
];

export default function Nav({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  // Map tab -> URL, để URL luôn phản ánh đúng tab đang xem (đồng bộ 2
  // chiều với Dashboard.jsx: F5 tại bất kỳ URL nào cũng ra đúng tab đó).
  // Lưu ý: "/app/review" và "/app/learn" đã là route ĐỘC LẬP (ReviewRoute,
  // LearnRoute - toàn màn hình, không Header/Nav). Tab "Ôn tập" trong Nav
  // này chỉ là màn hình landing NẰM TRONG Dashboard, nên phải dùng path
  // khác để không bị điều hướng nhầm ra khỏi Dashboard.
  const TAB_PATHS = {
    dashboard: "/app",
    review: "/app/on-tap",
    thongke: "/app/thongke",
    thuvien: "/app/thuvien",
    datcau: "/app/datcau",
    dictionary: "/app/dictionary",
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
    navigate(TAB_PATHS[id] ?? "/app");
  };

  return (
    <nav
      className="animate-fade-in delay-100 sticky z-40 flex items-center gap-1 px-6 py-2"
      style={{
        top: 57,
        background: "rgba(7,9,26,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {TABS.map(({ id, icon, label }) => (
        <button
          key={id}
          className={`nav-tab${activeTab === id ? " active" : ""}`}
          onClick={() => handleTabClick(id)}
        >
          {icon}
          {label}
          {activeTab === id && (
            <span
              style={{
                display: "inline-block",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#a5b4fc",
                marginLeft: 2,
                boxShadow: "0 0 8px rgba(165,180,252,0.8)",
              }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}