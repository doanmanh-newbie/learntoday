import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/sections/dashboard/Header.jsx";
import Nav from "../../components/sections/dashboard/Nav.jsx";
import DashboardHome from "../../components/sections/dashboard/DashboardHome.jsx"; // Trang chủ mới
import ReviewLanding from "../../components/sections/dashboard/ReviewLanding.jsx"; // Trang Ôn tập (bản gốc)
import SentencePracticeFull from "../../components/sections/dashboard/SentencePracticeFull.jsx";
import TopicLibrary from "../../components/sections/dashboard/TopicLibrary.jsx";
import StatisticsPage from "../../components/sections/dashboard/StatisticsPage.jsx";
import LearnPage from "../learn/LearnPage.jsx";
import ReviewPage from "../review/ReviewPage.jsx";
import { useAuth } from "../../hooks/useAuth";
import { reviewApi, learningApi, historyApi, studyApi } from "../../api/client";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [minutes, setMinutes] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [learnedToday, setLearnedToday] = useState(0);
  const [learnTarget, setLearnTarget] = useState(10);
  const [stats, setStats] = useState({ totalLearned: 0, streak: 0, accuracy: 0 });

  const [showLearn, setShowLearn] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

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

  useEffect(() => {
    const id = setInterval(() => {
      setMinutes((m) => m + 1);
      studyApi.heartbeat(1).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const openLearn = (folderId) => { setSelectedFolderId(folderId); setShowLearn(true); setShowReview(false); };
  const openReview = () => { setShowReview(true); setShowLearn(false); };
  const closeLearn = () => { setShowLearn(false); setShowReview(false); setSelectedFolderId(null); };

  const handleNavigate = (target) => {
    if (target === "review") openReview();
    else if (target === "learn") openLearn(null);
    else if (target === "practice") setActiveTab("datcau");
  };

  return (
    <div className="app-shell relative min-h-screen w-full overflow-x-hidden">
      <div className="orb" style={{ width: 600, height: 600, top: -200, left: -150, background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
      <div className="orb" style={{ width: 500, height: 500, bottom: -100, right: -100, background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }} />
      <div className="orb animate-float" style={{ width: 300, height: 300, top: "30%", right: "20%", background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)", animationDuration: "5s" }} />

      {!showLearn && !showReview && (
        <>
          <Header minutes={minutes} streak={stats.streak} username={user?.username || 'Bạn'} onLogout={handleLogout} />
          <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}

      <main className="relative z-10 px-6 py-8" style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* TRANG CHỦ - Dùng DashboardHome mới */}
        {activeTab === "dashboard" && !showLearn && !showReview && (
          <DashboardHome 
            username={user?.username || "Bạn"}
            dueCount={dueCount} 
            onReview={openReview} 
            onGoLearn={() => setActiveTab("thuvien")}
            wordsLearnedToday={learnedToday}
            learnTarget={learnTarget}
            stats={stats}
            onNavigate={handleNavigate}
          />
        )}

        {/* ÔN TẬP - Dùng ReviewLanding gốc */}
        {activeTab === "review" && !showLearn && !showReview && (
          <ReviewLanding dueCount={dueCount} onReview={openReview} onGoLearn={() => setActiveTab("thuvien")} />
        )}

        {activeTab === "thongke" && !showLearn && !showReview && <StatisticsPage />}
        {activeTab === "thuvien" && !showLearn && !showReview && <TopicLibrary onSelectFolder={openLearn} />}
        {activeTab === "datcau" && !showLearn && !showReview && <SentencePracticeFull />}

        {showLearn && (
          <div className="fixed inset-0 z-50 bg-[#07091a] overflow-y-auto">
            <LearnPage mode="learn" folderId={selectedFolderId} onNavigateHome={closeLearn} />
          </div>
        )}
        {showReview && (
          <div className="fixed inset-0 z-50 bg-[#07091a] overflow-y-auto">
            <ReviewPage onNavigateHome={closeLearn} />
          </div>
        )}

        <div style={{ height: 40 }} />
      </main>

      {!showLearn && !showReview && <Nav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}