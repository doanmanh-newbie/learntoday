// src/components/sections/dashboard/Header.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  SearchIcon,
  ClockIcon,
  FireIcon,
  ChevronDownIcon,
  GlobeIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
} from "../../../icons/dashboard/index.jsx";
import { DICTIONARY } from "../../../data/dictionary";

// Hàm phát âm
function speak(text, lang = "en-US") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  window.speechSynthesis.speak(utt);
}

// ─── Header chính ─────────────────────────────────────────────────────────────
export default function Header({ minutes, streak = 0, username = 'Bạn', onLogout, onSearch, searchValue }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
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
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dropdownItems = [
    { icon: <GlobeIcon />, label: "Dịch" },
    { icon: <SettingsIcon />, label: "Cài đặt" },
    { icon: <UserIcon />, label: "Trang cá nhân" },
  ];

  const handleInputChange = (value) => {
    setSearchInput(value);
    if (value.trim()) {
      const keys = Object.keys(DICTIONARY);
      const matches = keys.filter((w) => w.startsWith(value.trim().toLowerCase()));
      setSuggestions(matches.slice(0, 6));
    } else {
      setSuggestions([]);
    }
    onSearch?.(value);
  };

  // 🆕 ĐÃ SỬA: Khi chọn từ, chuyển trang thay vì mở Modal
  const handleSelectWord = (word) => {
    setSearchInput(word);
    setSuggestions([]);
    speak(word); // Phát âm từ ngay khi bấm chọn
    navigate(`/app/dictionary/${word}`); // Chuyển hướng tới trang chi tiết từ
  };

  return (
    <header
      className="animate-fade-in-down sticky top-0 z-50 flex items-center gap-4 px-6 py-3"
      style={{
        background: "rgba(7,9,26,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <Link to="/app" className="flex items-center gap-2 no-underline" style={{ minWidth: 148 }}>
        <div className="animate-glow" style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>📚</span>
        </div>
        <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 17, color: "#e8eaf6", letterSpacing: "-0.3px" }}>
          Learn <span style={{ color: "#a5b4fc" }}>Today</span>
        </span>
      </Link>

      {/* Search + Autocomplete */}
      <div ref={searchRef} style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
        <div style={{ position: "relative" }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5a6a8a", pointerEvents: "none" }}>
            <SearchIcon />
          </span>
          <input
            className="search-input w-full"
            placeholder="Tìm kiếm từ vựng..."
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
          />
        </div>

        {/* Dropdown gợi ý */}
        {suggestions.length > 0 && (
          <div style={{ position: "absolute", top: "110%", left: 0, right: 0, background: "#0e1130", border: "0.8px solid rgba(255,255,255,0.15)", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden" }}>
            {suggestions.map((word) => (
              <button
                key={word}
                style={{ display: "block", width: "100%", padding: "12px 16px", background: "transparent", border: "none", textAlign: "left", color: "#c7d2fe", fontSize: "14px", fontWeight: 600, cursor: "pointer", borderBottom: "0.8px solid rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; }}
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

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.18)" }}>
        <ClockIcon />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#facc15", fontFamily: "'Outfit',sans-serif" }}>{minutes} phút học</span>
      </div>

      <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg animate-streak-bounce" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
        <FireIcon />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fb923c", fontFamily: "'Outfit',sans-serif" }}>{streak} ngày</span>
      </div>

      {/* User dropdown */}
      <div className="relative">
        <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} onClick={(e) => { e.stopPropagation(); setDropdownOpen((o) => !o); }}>
          <div className="pulse-ring relative" style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>
            {initials || 'U'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#c7d2fe" }}>{username}</span>
          <span style={{ color: "#5a6a8a", transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "none", display: "flex" }}>
            <ChevronDownIcon />
          </span>
        </button>

        {dropdownOpen && (
          <div className="dropdown-menu absolute right-0 mt-2 p-1.5" style={{ top: "100%" }}>
            {dropdownItems.map(({ icon, label }) => (
              <div key={label} className="dropdown-item">
                <span style={{ color: "#8892b0" }}>{icon}</span>
                {label}
              </div>
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