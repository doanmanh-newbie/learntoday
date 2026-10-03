// src/pages/app/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/sections/dashboard/Header.jsx";
import Nav from "../../components/sections/dashboard/Nav.jsx";
import DashboardHome from "../../components/sections/dashboard/DashboardHome.jsx";
import ReviewLanding from "../../components/sections/dashboard/ReviewLanding.jsx";
import SentencePracticeFull from "../../components/sections/dashboard/SentencePracticeFull.jsx";
import TopicLibrary from "../../components/sections/dashboard/TopicLibrary.jsx";
import StatisticsPage from "../../components/sections/dashboard/StatisticsPage.jsx";
import LearnPage from "../learn/LearnPage.jsx";
import DictionaryPage from "../../components/sections/dashboard/DictionaryPage";
import ReviewPage from "../review/ReviewPage.jsx";
import WordDetailPage from "../WordDetailPage";
import { useAuth } from "../../hooks/useAuth";
import { reviewApi, learningApi, historyApi, studyApi } from "../../api/client";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isWordDetail = location.pathname.startsWith("/app/dictionary/");
  const word = isWordDetail ? decodeURIComponent(location.pathname.split("/").pop()) : null;

  // Suy ra tab ban đầu từ URL, để F5 tại /app/dictionary không bị lệch
  // về "Trang chủ" trong khi thanh địa chỉ vẫn ghi /app/dictionary.
  const getTabFromPath = (pathname) => {
    if (pathname.startsWith("/app/dictionary")) return "dictionary";
    if (pathname.startsWith("/app/on-tap")) return "review";
    if (pathname.startsWith("/app/thongke")) return "thongke";
    if (pathname.startsWith("/app/thuvien")) return "thuvien";
    if (pathname.startsWith("/app/datcau")) return "datcau";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  // Đồng bộ lại khi URL đổi từ bên ngoài (back/forward trình duyệt, hoặc
  // điều hướng trực tiếp), không chỉ lúc mount lần đầu.
  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);
  const [searchQuery, setSearchQuery] = useState("");
  const [minutes, setMinutes] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [dueWords, setDueWords] = useState([]); 
  const [learnedToday, setLearnedToday] = useState(0);
  const [learnTarget, setLearnTarget] = useState(10);
  const [stats, setStats] = useState({ totalLearned: 0, streak: 0, accuracy: 0 });
  const [showLearn, setShowLearn] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

useEffect(() => {
  // Backend trả { count: X }, không phải { due_count: X }
  reviewApi.dueCount()
    .then((data) => setDueCount(data.count ?? data.due_count ?? 0))
    .catch(() => setDueCount(0));

  reviewApi.dueWords()
    .then((data) => {
      const list = (data.words || []).map(w => ({
        id: w.id,
        word: w.word,
        phonetic: w.pronunciation || w.phonetic || '',
        pos: w.word_type || w.pos || 'n',
        meaning: w.meaning,
        example: w.example,
        example_meaning: w.example_meaning,
        lv: w.level ?? w.lv ?? 1,
        level: w.level ?? w.lv ?? 1,
        next_review: w.next_review,
      }));
      setDueWords(list);
    })
    .catch(() => setDueWords([]));

  // Backend trả { learned_today, daily_target, ... }
  learningApi.todayProgress()
    .then((data) => {
      setLearnedToday(data.learned_today ?? data.learned ?? 0);
      setLearnTarget(data.daily_target ?? data.target ?? 10);
    })
    .catch(() => {});

  // Backend trả { total_words_learned, streak, ... }
  historyApi.stats()
    .then((data) =>
      setStats({
        totalLearned: data.total_words_learned ?? data.total_learned ?? 0,
        streak: data.streak ?? 0,
        accuracy: data.accuracy ?? 0,
      })
    )
    .catch(() => {});
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
  const openReview = () => { setActiveTab("review"); };
  const closeLearn = () => { setShowLearn(false); setShowReview(false); setSelectedFolderId(null); };

  const handleNavigate = (target) => {
    if (target === "review") openReview();
    else if (target === "learn") openLearn(null);
    else if (target === "practice") setActiveTab("datcau");
  };

  // ✅ Khi search từ Header: chuyển sang tab Từ điển + truyền query
  const handleHeaderSearch = (value) => {
    if (value && value.trim()) {
      setSearchQuery(value);
      setActiveTab("dictionary");
    }
  };

  return (
    <div className="app-shell relative min-h-screen w-full overflow-x-hidden">
      {!showLearn && !showReview && (
        <>
          <Header
            minutes={minutes}
            streak={stats.streak}
            username={user?.username || 'Bạn'}
            onLogout={handleLogout}
            onSearch={handleHeaderSearch}
          />
          <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
        </>
      )}

      <main className="relative z-10 px-6 py-8" style={{ maxWidth: 960, margin: "0 auto" }}>
        {isWordDetail && word ? (
          <WordDetailPage word={word} />
        ) : (
          <>
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

            {activeTab === "review" && !showLearn && !showReview && (
              <ReviewLanding dueWords={dueWords} onReview={openReview} onGoLearn={() => setActiveTab("thuvien")} />
            )}

            {activeTab === "thongke" && !showLearn && !showReview && <StatisticsPage />}

            {activeTab === "thuvien" && !showLearn && !showReview && <TopicLibrary onSelectFolder={(folder) => openLearn(folder.id)} />}

            {activeTab === "datcau" && !showLearn && !showReview && <SentencePracticeFull />}

            {activeTab === "dictionary" && !showLearn && !showReview && (
              <DictionaryPage
                initialQuery={searchQuery}
                onQueryUsed={() => setSearchQuery("")}
              />
            )}
          </>
        )}

        {showLearn && (
          <div className="fixed inset-0 z-50 bg-[#07091a] overflow-y-auto">
            <LearnPage mode="learn" folderId={selectedFolderId} onNavigateHome={closeLearn} />
          </div>
        )}

        {showReview && (
          <div className="fixed inset-0 z-50 bg-[#07091a] overflow-y-auto">
            <ReviewPage onNavigateHome={closeLearn} onGoLearn={() => openLearn(null)} />
          </div>
        )}

        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}