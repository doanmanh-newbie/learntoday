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
import DictionaryPage from "../../components/sections/dashboard/DictionaryPage";
import WordDetailPage from "../WordDetailPage";
import PhraseFolderPage from "../../features/phrases/PhraseFolderPage.jsx";
import { phraseIdFromFolderId } from "../../features/phrases/phrasesData";
import PassTestPage from "./PassTestPage";
import PracticePage from "../../features/practice/PracticePage.jsx";
import { modeFromPath } from "../../features/practice/modes";
import FolderWordsPage from "./FolderWordsPage";
import SettingsPage from "./SettingsPage";
import { useAuth } from "../../hooks/useAuth";
import { reviewApi, learningApi, historyApi, studyApi } from "../../api/client";
import { toUiWord } from "../../api/adapters";
import SyncBanner from "../../components/SyncBanner.jsx";
import { whenOutboxIdle, getSyncSnapshot, subscribeSync } from "../../api/outbox";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isWordDetail = location.pathname.startsWith("/app/dictionary/");
  const word = isWordDetail ? decodeURIComponent(location.pathname.split("/").pop()) : null;

  // /app/thuvien/<folderId> = màn danh sách từ của 1 folder (STT 3 phần B)
  const folderMatch = location.pathname.match(/^\/app\/thuvien\/([^/]+)\/?$/);
  const folderId = folderMatch ? decodeURIComponent(folderMatch[1]) : null;

  // Suy ra tab ban đầu từ URL, để F5 tại /app/dictionary không bị lệch
  // về "Trang chủ" trong khi thanh địa chỉ vẫn ghi /app/dictionary.
  const getTabFromPath = (pathname) => {
    if (pathname.startsWith("/app/dictionary")) return "dictionary";
    if (pathname.startsWith("/app/on-tap")) return "review";
    if (pathname.startsWith("/app/thongke")) return "thongke";
    if (pathname.startsWith("/app/thuvien")) return "thuvien";
    if (pathname.startsWith("/app/luyen-tap")) return "luyentap";
    if (pathname.startsWith("/app/datcau")) return "datcau";
    if (pathname.startsWith("/app/kiem-tra")) return "kiemtra";
    if (pathname.startsWith("/app/cai-dat")) return "caidat";
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

  const [loadError, setLoadError] = useState("");

  // Nạp 4 số liệu song song. Dùng allSettled: 1 API lỗi không làm mất các số còn lại, và lỗi được HIỂN THỊ
  // (trước đây `.catch(() => {})` nuốt hết -> DB lỗi thì người dùng chỉ thấy toàn số 0 mà không biết vì sao).
  const loadData = useCallback(async () => {
    // Vừa học/ôn xong: chờ tiến độ gửi lên server rồi mới đọc số liệu, kẻo trang chủ hiện số cũ (0/10)
    if (getSyncSnapshot().pending > 0) await whenOutboxIdle(5000);
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

  // Hàng đợi vừa gửi xong (kể cả sau khi hết thời gian chờ ở trên): nạp lại để số liệu luôn mới nhất
  useEffect(() => {
    let prev = getSyncSnapshot().pending;
    return subscribeSync(() => {
      const now = getSyncSnapshot().pending;
      if (prev > 0 && now === 0) loadData();
      prev = now;
    });
  }, [loadData]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;   // không tính phút khi tab chạy nền
      setMinutes((m) => m + 1);
      studyApi.heartbeat(1).catch(() => {});                // mất 1 nhịp không quan trọng
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/login"); };
  // Học / ôn tập là ROUTE thật (có URL riêng): F5 không mất chỗ, nút Back của trình duyệt hoạt động đúng,
  // và Dashboard tự nạp lại số liệu khi quay về (trước đây là lớp phủ + state nên số liệu bị cũ).
  const openFolder = (id) => navigate(`/app/thuvien/${id}`);        // xem danh sách từ của folder
  const startLearn = (id) => navigate(`/app/learn/${id}`);          // "Bắt đầu học"
  const startReview = () => navigate("/app/review");                // "Ôn tập ngay" -> phiên ôn thật
  const goPickFolder = () => navigate("/app/thuvien");
  const openPractice = (mode) => navigate(mode ? `/app/luyen-tap/${mode}` : "/app/luyen-tap");
  const practiceMode = modeFromPath(location.pathname);

  // ✅ Khi search từ Header: chuyển sang tab Từ điển + truyền query
  const handleHeaderSearch = (value) => {
    if (value && value.trim()) {
      setSearchQuery(value);
      navigate("/app/dictionary");
    }
  };

  return (
    <div className="app-shell relative min-h-screen w-full overflow-x-hidden">
      <Header
        minutes={minutes}
        streak={stats.streak}
        username={user?.username || 'Bạn'}
        onLogout={handleLogout}
        onSearch={handleHeaderSearch}
      />
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />

      <SyncBanner />

      <main className="relative z-10 px-6 py-8" style={{ maxWidth: 1200, margin: "0 auto" }}>
        {loadError && (
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
            {activeTab === "dashboard" && (
              <DashboardHome
                username={user?.username || "Bạn"}
                dueCount={dueCount}
                wordsLearnedToday={learnedToday}
                learnTarget={learnTarget}
                stats={stats}
                minutes={minutes}
                onStartReview={startReview}
                onGoLearn={goPickFolder}
                onOpenPractice={openPractice}
              />
            )}

            {activeTab === "review" && (
              <ReviewLanding dueWords={dueWords} onReview={startReview} onGoLearn={goPickFolder} />
            )}

            {activeTab === "thongke" && <StatisticsPage />}

            {activeTab === "thuvien" && (
              phraseIdFromFolderId(folderId)
                ? <PhraseFolderPage groupId={phraseIdFromFolderId(folderId)} onBack={goPickFolder} />
                : folderId
                ? <FolderWordsPage key={folderId} folderId={folderId} onBack={goPickFolder} onStart={startLearn} />
                : <TopicLibrary onSelectFolder={openFolder} />   /* TopicLibrary truyền ID folder (không phải object) */
            )}

            {activeTab === "luyentap" && <PracticePage mode={practiceMode} />}
            {activeTab === "datcau" && <SentencePracticeFull />}
            {activeTab === "kiemtra" && <PassTestPage />}
            {activeTab === "caidat" && <SettingsPage />}

            {activeTab === "dictionary" && (
              <DictionaryPage
                initialQuery={searchQuery}
                onQueryUsed={() => setSearchQuery("")}
              />
            )}
          </>
        )}

        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}