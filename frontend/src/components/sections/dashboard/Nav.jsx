import { HomeIcon, RotateCcwIcon, BarChartIcon, BookIcon, PenIcon, BookOpenIcon } from "../../../icons/dashboard/index.jsx";

const TABS = [
  { id: "dashboard", icon: <HomeIcon />, label: "Trang chủ" },
  { id: "review", icon: <RotateCcwIcon />, label: "Ôn tập" },
  { id: "thongke", icon: <BarChartIcon />, label: "Thống kê" },
  { id: "thuvien", icon: <BookIcon />, label: "Thư viện chủ đề" },
  { id: "datcau", icon: <PenIcon />, label: "Đặt câu · Sửa lỗi" },
  { id: "dictionary", icon: <BookOpenIcon />, label: "Từ điển" }, // Thêm cái này
];


export default function Nav({ activeTab, setActiveTab }) {
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
          onClick={() => setActiveTab(id)}
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
