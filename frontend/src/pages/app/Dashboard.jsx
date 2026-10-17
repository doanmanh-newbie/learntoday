// src/pages/app/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
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
import PassTestPage from "./PassTestPage";
import { useAuth } from "../../hooks/useAuth";
import { reviewApi, learningApi, historyApi, studyApi } from "../../api/client";
import { toUiWord } from "../../api/adapters";
import SyncBanner from "../../components/SyncBanner.jsx";

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
    if (pathname.startsWith("/app/kiem-tra")) return "kiemtra";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  // Đồng bộ lại khi URL đổi từ bên ngoài (back/forward trình duyệt, hoặc
  // điều hướng trực tiếp), không chỉ lúc mount lần đầu.
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setActiveTab(getTabFromPath(location.pathname));
  }
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

  const [loadError, setLoadError] = useState("");

  // Nạp 4 số liệu song song. Dùng allSettled: 1 API lỗi không làm mất các số còn lại, và lỗi được HIỂN THỊ
  // (trước đây `.catch(() => {})` nuốt hết -> DB lỗi thì người dùng chỉ thấy toàn số 0 mà không biết vì sao).
  const loadData = useCallback(async () => {
    const results = await Promise.allSettled([
      reviewApi.dueCount(),
      reviewApi.dueWords(),
      learningApi.todayProgress(),
      historyApi.stats(),
    ]);
    const [count, words, progress, st] = results;

    if (count.status === "fulfilled") setDueCount(count.value.count ?? count.value.due_count ?? 0);
    if (words.status === "fulfilled") setDueWords((words.value.words || []).map(toUiWord));
    if (progress.status === "fulfilled") {
      setLearnedToday(progress.value.learned_today ?? progress.value.learned ?? 0);
      setLearnTarget(progress.value.daily_target ?? progress.value.target ?? 10);
    }
    if (st.status === "fulfilled") {
      setStats({
        totalLearned: st.value.total_words_learned ?? st.value.total_learned ?? 0,
        streak: st.value.streak ?? 0,
        accuracy: st.value.accuracy ?? 0,
      });
      setMinutes(st.value.study_minutes_today ?? 0);     // số phút THẬT hôm nay (không đếm lại từ 0 mỗi lần mở trang)
    }
    const failed = results.find((r) => r.status === "rejected");
    setLoadError(failed ? (failed.reason?.message || "Không tải được số liệu học tập.") : "");
  }, []);

  useEffect(() => { Promise.resolve().then(loadData); }, [loadData]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;   // không tính phút khi tab chạy nền
      setMinutes((m) => m + 1);
      studyApi.heartbeat(1).catch(() => {});                // mất 1 nhịp không quan trọng
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };
  const openLearn = (folderId) => { setSelectedFolderId(folderId); setShowLearn(true); setShowReview(false); };
  // Tab "Ôn tập" = màn giới thiệu + danh sách từ đến hạn; bấm "Ôn tập ngay" mới mở phiên ôn thật.
  // (Trước đây cả 2 nút cùng gọi setActiveTab("review") nên không bao giờ vào được phiên ôn.)
  const goReviewTab = () => { setActiveTab("review"); };
  const startReview = () => { setShowReview(true); setShowLearn(false); };
  const goPickFolder = () => { setShowLearn(false); setShowReview(false); setSelectedFolderId(null); setActiveTab("thuvien"); };
  const closeLearn = () => {
    setShowLearn(false); setShowReview(false); setSelectedFolderId(null);
    loadData();                    // làm mới số từ cần ôn / tiến độ hôm nay / streak sau khi học xong
  };

  const handleNavigate = (target) => {
    if (target === "review") goReviewTab();
    else if (target === "learn") goPickFolder();      // cần chọn folder trước (openLearn(null) chỉ ra màn lỗi)
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

      <SyncBanner />

      <main className="relative z-10 px-6 py-8" style={{ maxWidth: 960, margin: "0 auto" }}>
        {loadError && !showLearn && !showReview && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16,
                        padding: "10px 16px", borderRadius: 12, fontSize: 13, color: "#fecaca",
                        background: "rgba(127,29,29,0.35)", border: "1px solid rgba(248,113,113,0.35)" }}>
            <span>⚠️ {loadError}</span>
            <button onClick={loadData} style={{ padding: "4px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                                                fontWeight: 700, background: "#f87171", color: "#450a0a" }}>
              Thử lại
            </button>
          </div>
        )}
        {isWordDetail && word ? (
          <WordDetailPage key={word} word={word} />
        ) : (
          <>
            {activeTab === "dashboard" && !showLearn && !showReview && (
              <DashboardHome
                username={user?.username || "Bạn"}
                dueCount={dueCount}
                onReview={goReviewTab}
                onGoLearn={goPickFolder}
                wordsLearnedToday={learnedToday}
                learnTarget={learnTarget}
                stats={stats}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === "review" && !showLearn && !showReview && (
              <ReviewLanding dueWords={dueWords} onReview={startReview} onGoLearn={goPickFolder} />
            )}

            {activeTab === "thongke" && !showLearn && !showReview && <StatisticsPage />}

            {activeTab === "thuvien" && !showLearn && !showReview && <TopicLibrary onSelectFolder={openLearn} />   /* TopicLibrary truyền ID folder (không phải object) */}

            {activeTab === "datcau" && !showLearn && !showReview && <SentencePracticeFull />}
            {activeTab === "kiemtra" && !showLearn && !showReview && <PassTestPage />}

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
            <ReviewPage onNavigateHome={closeLearn} onGoLearn={() => { closeLearn(); goPickFolder(); }} />
          </div>
        )}

        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}