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

  // Nạp dữ liệu thật từ backend khi vào Dashboard
  useEffect(() => {
    reviewApi
      .dueCount()
      .then((data) => setDueCount(data.due_count ?? data.count ?? 0))
      .catch(() => setDueCount(0));

    learningApi
      .todayProgress()
      .then((data) => {
        setLearnedToday(data.learned ?? data.learned_today ?? 0);
        setLearnTarget(data.target ?? data.daily_target ?? 10);
      })
      .catch(() => {});

    historyApi
      .stats()
      .then((data) =>
        setStats({
          totalLearned: data.total_learned ?? 0,
          streak: data.streak ?? 0,
          accuracy: data.accuracy ?? 0,
        })
      )
      .catch(() => {});
  }, []);

  // Đếm phút học trong phiên (heartbeat) — khớp STT 12 (giữ chuỗi học 15 phút)
  useEffect(() => {
    const id = setInterval(() => {
      setMinutes((m) => m + 1);
      studyApi.heartbeat(1).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app-shell relative min-h-screen w-full overflow-x-hidden">
      {/* Background ambient orbs */}
      <div
        className="orb"
        style={{
          width: 600,
          height: 600,
          top: -200,
          left: -150,
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="orb"
        style={{
          width: 500,
          height: 500,
          bottom: -100,
          right: -100,
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
        }}
      />
      <div
        className="orb animate-float"
        style={{
          width: 300,
          height: 300,
          top: "30%",
          right: "20%",
          background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
          animationDuration: "5s",
        }}
      />

      <Header minutes={minutes} username={user?.username || 'Bạn'} onLogout={handleLogout} />
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="relative z-10 px-6 py-8" style={{ maxWidth: 960, margin: "0 auto" }}>
        {activeTab === "dashboard" && (
          <>
            <WelcomeSection
              username={user?.username || 'bạn'}
              learnedToday={learnedToday}
              learnTarget={learnTarget}
              stats={stats}
            />
            <StatCards
              dueCount={dueCount}
              learnedToday={learnedToday}
              learnTarget={learnTarget}
              onReview={() => setActiveTab("thuvien")}
              onLearn={() => setActiveTab("thuvien")}
            />
            <AIAssistant />
          </>
        )}

        {activeTab === "thongke" && <StatisticsPage />}
        {activeTab === "thuvien" && <TopicLibrary />}
        {activeTab === "datcau" && <SentencePracticeFull />}

        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}
