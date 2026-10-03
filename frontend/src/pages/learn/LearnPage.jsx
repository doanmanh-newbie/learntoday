// src/pages/learn/LearnPage.jsx
// Chỉ load data và chuyển thẳng vào LearningSession
import { useState, useEffect } from "react";
import { foldersApi } from "../../api/client";
import { LearningSession } from "../../features/learning/LearningSession";

export default function LearnPage({ onNavigateHome, mode = "learn", folderId = null }) {
  const [folder, setFolder] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wordsLearned, setWordsLearned] = useState(0);
  const DAILY_GOAL = 10;

  useEffect(() => {
    if (!folderId) {
      setError("Không có folder nào được chọn");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([
      foldersApi.list(),
      foldersApi.words(folderId),
    ])
      .then(([foldersData, wordsData]) => {
        const allFolders = [
          ...(foldersData.system_folders || []),
          ...(foldersData.personal_folders || []),
        ];
        const found = allFolders.find(f => String(f.id) === String(folderId));

        if (!found) {
          setError(`Không tìm thấy folder`);
          return;
        }

        // Normalize folder
        setFolder({
          id: found.id,
          name: found.name,
          type: found.type,
          icon: found.icon,
          color: found.color || '#6366f1',
          image: found.icon,
        });

        // Normalize words
        const normalized = (wordsData.words || []).map(w => ({
          id: w.id,
          word: w.word,
          phonetic: w.pronunciation || '',
          pronunciation: w.pronunciation || '',
          pos: w.word_type || 'n',
          word_type: w.word_type || 'n',
          meaning: w.meaning,
          example: w.example,
          example_meaning: w.example_meaning,
          examples: w.examples || (w.example ? [{ en: w.example, vi: w.example_meaning || '' }] : []),
          lv: w.level ?? 0,
          level: w.level ?? 0,
        }));
        setWords(normalized);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Không tải được dữ liệu");
      })
      .finally(() => setLoading(false));
  }, [folderId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#07091a', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#8892b0', fontSize: 14 }}>Đang tải từ vựng...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#07091a', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <p style={{ color: '#f87171', fontSize: 16, fontWeight: 700 }}>{error}</p>
        <button onClick={onNavigateHome} style={{
          padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
          border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
        }}>← Quay lại</button>
      </div>
    );
  }

  if (!folder || words.length === 0) return null;

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#07091a' }}>
      <LearningSession
        key={folder.id}
        folder={{ ...folder, words }}
        mode={mode}
        dailyGoal={DAILY_GOAL}
        wordsLearned={wordsLearned}
        onWordComplete={() => setWordsLearned(w => w + 1)}
        onBack={onNavigateHome}
      />
    </div>
  );
}