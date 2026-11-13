// src/components/sections/dashboard/Header.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { readTheme, applyTheme, saveTheme, nextTheme } from "../../../utils/theme";
import {
  SearchIcon,
  ClockIcon,
  FireIcon,
  ChevronDownIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
} from "../../../icons/dashboard/index.jsx";
import { dictionaryApi } from "../../../api/client";
import BrandLogo from "../../brand/BrandLogo";

// Phát âm dùng chung (đọc giọng Anh-Anh/Anh-Mỹ theo Cài đặt) - trước đây mỗi file tự chép 1 bản, cố định en-US
import { speak } from "../../../utils/tts";

// ─── Header chính ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const [theme, setTheme] = useState(() => readTheme());
  const toggle = () => {
    const next = applyTheme(nextTheme(theme));
    saveTheme(next);
    setTheme(next);
  };
  const light = theme === "light";
  return (
    <button type="button" onClick={toggle} aria-label={light ? "Chuyển sang chế độ tối" : "Chuyển sang chế độ sáng"}
      title={light ? "Chế độ tối" : "Chế độ sáng"}
      style={{ padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
        color: "#99f6e4", background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)" }}>
      {light ? "🌙 Tối" : "☀️ Sáng"}
    </button>
  );
}

export default function Header({ minutes, streak = 0, username = 'Bạn', onLogout, onSearch }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestionData, setSuggestionData] = useState({ q: "", list: [] });
  const searchRef = useRef(null);

  const initials = username.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase()).join('');

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => setDropdownOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [dropdownOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestionData({ q: "", list: [] });      // bấm ra ngoài ô tìm kiếm -> đóng danh sách gợi ý
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dropdownItems = [
    { icon: <UserIcon />, label: "Trang cá nhân", to: "/app/cai-dat/ho-so" },
    { icon: <SettingsIcon />, label: "Cài đặt học tập", to: "/app/cai-dat" },
  ];

  const handleInputChange = (value) => {
    setSearchInput(value);
    onSearch?.(value);
  };

  // Gợi ý từ KHO TỪ ĐIỂN thật (database + nguồn gợi ý trực tuyến): gọi sau 250ms ngừng gõ
  useEffect(() => {
    const q = searchInput.trim();
    if (!q) return undefined;
    let cancelled = false;
    const t = setTimeout(() => {
      dictionaryApi.suggest(q, 6)
        .then((res) => { if (!cancelled) setSuggestionData({ q, list: res.suggestions || [] }); })
        .catch(() => { /* gợi ý là phụ, lỗi thì bỏ qua */ });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchInput]);
  const suggestions = suggestionData.q === searchInput.trim() ? suggestionData.list : [];

  // Chọn từ (hoặc nhấn Enter): sang trang chi tiết, trang đó tra từ điển thật
  const handleSelectWord = (word) => {
    const key = word.trim().toLowerCase();
    if (!/^[a-z][a-z'\- ]{0,59}$/.test(key)) return;      // chỉ chữ cái tiếng Anh
    setSearchInput(key);
    setSuggestionData({ q: "", list: [] });
    speak(key);
    navigate(`/app/dictionary/${encodeURIComponent(key)}`);
  };

  return (
    <header
      className="animate-fade-in-down sticky top-0 z-50 flex items-center gap-4 px-6 py-3"
      style={{
        background: "rgba(17,19,20,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div style={{ minWidth: 148 }}><BrandLogo size={32} to="/app" /></div>

      {/* Search + Autocomplete */}
      <div ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
        <div style={{ position: "relative" }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#a2acb3", pointerEvents: "none" }}>
            <SearchIcon />
          </span>
          <input
            className="search-input w-full"
            placeholder="Tìm kiếm từ vựng..."
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSelectWord(searchInput); }}
            aria-label="Tìm kiếm từ vựng"
          />
        </div>

        {/* Dropdown gợi ý */}
        {suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "110%", left: 0, right: 0, background: "#161a1d", border: "0.8px solid rgba(255,255,255,0.15)", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden" }}>
            {suggestions.map((word) => (
              <button
                key={word}
                style={{ display: "block", width: "100%", padding: "12px 16px", background: "transparent", border: "none", textAlign: "left", color: "#99f6e4", fontSize: "14px", fontWeight: 600, cursor: "pointer", borderBottom: "0.8px solid rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(20,184,166,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                onClick={() => handleSelectWord(word)}
              >
                📖 {word}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
        <ClockIcon />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f87171", fontFamily: "'Outfit',sans-serif" }}>{minutes} phút học</span>
      </div>

      <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />

      <ThemeToggle />

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg animate-streak-bounce" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <FireIcon />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f87171", fontFamily: "'Outfit',sans-serif" }}>{streak} ngày</span>
      </div>

      {/* User dropdown */}
      <div className="relative">
        <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} onClick={(e) => { e.stopPropagation(); setDropdownOpen((o) => !o); }}>
          <div className="pulse-ring relative" style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#0f766e,#0e8077)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>
            {initials || 'U'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#99f6e4" }}>{username}</span>
          <span style={{ color: "#a2acb3", transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "none", display: "flex" }}>
            <ChevronDownIcon />
          </span>
        </button>

        {dropdownOpen && (
          <div className="dropdown-menu absolute right-0 mt-2 p-1.5" style={{ top: "100%" }}>
            {dropdownItems.map(({ icon, label, to }) => (
              <button
                key={label}
                type="button"
                className="dropdown-item w-full text-left"
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigate(to); }}
              >
                <span style={{ color: "#a2acb3" }}>{icon}</span>
                {label}
              </button>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 8px" }} />
            <button type="button" className="dropdown-item danger w-full text-left" onClick={(e) => { e.stopPropagation(); onLogout?.(); }}>
              <LogOutIcon />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}