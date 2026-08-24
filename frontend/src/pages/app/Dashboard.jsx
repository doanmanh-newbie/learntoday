// src/pages/app/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/sections/dashboard/Header.jsx";
import Nav from "../../components/sections/dashboard/Nav.jsx";
import WelcomeSection from "../../components/sections/dashboard/WelcomeSection.jsx";
import StatCards from "../../components/sections/dashboard/StatCards.jsx";
import AIAssistant from "../../components/sections/dashboard/AIAssistant.jsx";
import TopicLibrary from "../../components/sections/dashboard/TopicLibrary.jsx";
import SentencePracticeFull from "../../components/sections/dashboard/SentencePracticeFull.jsx";
import StatisticsPage from "../../components/sections/dashboard/StatisticsPage.jsx";
// Import Learn/Review
import LearnPage from "../learn/LearnPage.jsx";
import ReviewPage from "../review/ReviewPage.jsx";
import { useAuth } from "../../hooks/useAuth";
import { reviewApi, learningApi, historyApi, studyApi } from "../../api/client";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── State ──
  const [activeTab, setActiveTab] = useState("dashboard");
  const [minutes, setMinutes] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [learnedToday, setLearnedToday] = useState(0);
  const [learnTarget, setLearnTarget] = useState(10);
  const [stats, setStats] = useState({ totalLearned: 0, streak: 0, accuracy: 0 });

  // ── State cho Learn/Review ──
  const [showLearn, setShowLearn] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [learnMode, setLearnMode] = useState("learn");

  // Nạp dữ liệu
  useEffect(() => {
    reviewApi.dueCount().then((data) => setDueCount(data.due_count ?? 0)).catch(() => setDueCount(0));
    learningApi.todayProgress().then((data) => {
      setLearnedToday(data.learned ?? 0);
      setLearnTarget(data.target ?? 10);
    }).catch(() => {});
    historyApi.stats().then((data) =>
      setStats({ totalLearned: data.total_learned ?? 0, streak: data.streak ?? 0, accuracy: data.accuracy ?? 0 })
    ).catch(() => {});
  }, []);

  // Heartbeat
  useEffect(() => {
    const id = setInterval(() => {
      setMinutes((m) => m + 1);
      studyApi.heartbeat(1).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Handlers ──
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const openLearn = (folderId) => {
    setSelectedFolderId(folderId);
    setLearnMode("learn");
    setShowLearn(true);
    setShowReview(false);
  };

  const openReview = () => {
    setLearnMode("review");
    setShowReview(true);
    setShowLearn(false);
  };

  const closeLearn = () => {
    setShowLearn(false);
    setShowReview(false);
    setSelectedFolderId(null);
  };

  // ── Render ──
  return (
    <div className="app-shell relative min-h-screen w-full overflow-x-hidden">
      {/* Background orbs */}
      <div className="orb" style={{ width: 600, height: 600, top: -200, left: -150, background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
      <div className="orb" style={{ width: 500, height: 500, bottom: -100, right: -100, background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />
      <div className="orb animate-float" style={{ width: 300, height: 300, top: "30%", right: "20%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", animationDuration: "5s" }} />

      {/* Header + Nav - Ẩn khi học */}
      {!showLearn && !showReview && (
        <>
          <Header minutes={minutes} streak={stats.streak} username={user?.username || 'Bạn'} onLogout={handleLogout} />
          <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}

      <main className="relative z-10 px-6 py-8" style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && !showLearn && !showReview && (
          <>
            <WelcomeSection username={user?.username || 'bạn'} learnedToday={learnedToday} learnTarget={learnTarget} stats={stats} />
            <StatCards dueCount={dueCount} learnedToday={learnedToday} learnTarget={learnTarget} onReview={openReview} onLearn={() => openLearn(null)} />
            <AIAssistant />
          </>
        )}

        {/* ── THỐNG KÊ ── */}
        {activeTab === "thongke" && !showLearn && !showReview && <StatisticsPage />}

        {/* ── THƯ VIỆN ── */}
        {activeTab === "thuvien" && !showLearn && !showReview && <TopicLibrary onSelectFolder={openLearn} />}

        {/* ── ĐẶT CÂU ── */}
        {activeTab === "datcau" && !showLearn && !showReview && <SentencePracticeFull />}

        {/* ── HỌC TỪ MỚI (Overlay) ── */}
        {showLearn && (
          <div className="fixed inset-0 z-50 bg-[#07091a] overflow-y-auto">
            <LearnPage
              mode="learn"
              folderId={selectedFolderId}
              onNavigateHome={closeLearn}
            />
          </div>
        )}

        {/* ── ÔN TẬP (Overlay) ── */}
        {showReview && (
          <div className="fixed inset-0 z-50 bg-[#07091a] overflow-y-auto">
            <ReviewPage
              onNavigateHome={closeLearn}
            />
          </div>
        )}

        <div style={{ height: 40 }} />
      </main>

      {/* Nav - Chỉ hiện khi không học */}
      {!showLearn && !showReview && <Nav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}