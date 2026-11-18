import { HomeIcon, RotateCcwIcon, BookIcon, PenIcon, BookOpenIcon, SparklesIcon } from "../../../icons/dashboard/index.jsx";
import { useNavigate } from "react-router-dom";

const TABS = [
  { id: "dashboard", icon: <HomeIcon />, label: "Trang chủ" },
  { id: "review", icon: <RotateCcwIcon />, label: "Ôn tập" },
  { id: "luyentap", icon: <PenIcon />, label: "Luyện tập" },
  { id: "thuvien", icon: <BookIcon />, label: "Thư viện" },
  { id: "dictionary", icon: <BookOpenIcon />, label: "Từ điển" },
  { id: "trochoi", icon: <SparklesIcon />, label: "Trò chơi" },
];

// Đặt câu / Kiểm tra nằm trong tab Luyện tập: vẫn sáng đúng tab khi đang ở đó
const TAB_GROUP = { datcau: "luyentap", kiemtra: "luyentap", docbai: "luyentap", trinhdo: "luyentap", xephang: "luyentap" };

export default function Nav({ activeTab: rawTab, setActiveTab }) {
  const activeTab = TAB_GROUP[rawTab] || rawTab;
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
    trochoi: "/app/tro-choi",
    thuvien: "/app/thuvien",
    luyentap: "/app/luyen-tap",
    dictionary: "/app/dictionary",
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
    navigate(TAB_PATHS[id] ?? "/app");
  };

  return (
    <nav
      className="animate-fade-in delay-100 sticky z-40 flex items-center gap-1 px-3 sm:px-6 py-2"
      style={{
        top: 57,
        background: "rgba(17,19,20,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        // 8 tab không vừa màn hình điện thoại: cho cuộn ngang thay vì tràn/vỡ bố cục
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {TABS.map(({ id, icon, label }) => (
        <button
          key={id}
          className={`nav-tab${activeTab === id ? " active" : ""}`}
          style={{ flexShrink: 0, whiteSpace: "nowrap" }}
          aria-current={activeTab === id ? "page" : undefined}
          ref={(el) => { if (el && activeTab === id) el.scrollIntoView?.({ inline: "center", block: "nearest" }); }}
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
                background: "#5eead4",
                marginLeft: 2,
                boxShadow: "0 0 8px rgba(94,234,212,0.8)",
              }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}