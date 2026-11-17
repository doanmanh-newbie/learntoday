import { useNavigate } from 'react-router-dom';
import usePracticePool from './usePracticePool';
import { enoughWords, MIN_WORDS } from './practiceLogic';
import { PRACTICE_MODE_META, EXTRA_ACTIVITIES, saveLastMode } from './modes';
import FlashcardsMode from './FlashcardsMode.jsx';
import QuizMode from './QuizMode.jsx';
import MatchMode from './MatchMode.jsx';
import ListenMode from './ListenMode.jsx';
import FlappyMode from './FlappyMode.jsx';
import { PRIMARY_BTN } from './ModeShell.jsx';

const MODE_COMPONENTS = { flash: FlashcardsMode, quiz: QuizMode, match: MatchMode, listen: ListenMode, flappy: FlappyMode };

function NeedWords({ count, onLearn }) {
  return (
    <div style={{ textAlign: 'center', padding: 32, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: 40 }}>📚</div>
      <h3 style={{ color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>Cần học ít nhất {MIN_WORDS} từ để chơi</h3>
      <p style={{ color: '#a2acb3' }}>Bạn mới có {count} từ. Học thêm vài từ rồi quay lại nhé.</p>
      <button style={PRIMARY_BTN} onClick={onLearn}>Chọn chủ đề để học</button>
    </div>
  );
}

export default function PracticePage({ mode }) {
  const navigate = useNavigate();
  const { loading, error, words } = usePracticePool();
  const exit = () => navigate('/app/luyen-tap');

  if (loading) return <p style={{ color: '#a2acb3' }}>Đang tải từ của bạn…</p>;
  const Mode = mode ? MODE_COMPONENTS[mode] : null;
  if (mode === 'flappy') return <FlappyMode words={words} onExit={exit} />;      // tự chọn bộ từ (cả thư mục chưa học), FlappySetup chặn khi thiếu từ
  if (Mode && enoughWords(words)) { saveLastMode(mode); return <Mode key={mode} words={words} onExit={exit} />; }

  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9', margin: '0 0 4px' }}>Luyện tập</h2>
      <p style={{ color: '#a2acb3', marginTop: 0 }}>Chọn một trò chơi để nhớ từ chắc hơn. Dùng các từ bạn đã học.</p>
      {error && <p style={{ color: '#fca5a5' }}>⚠️ {error}</p>}
      {!enoughWords(words) && <NeedWords count={words.length} onLearn={() => navigate('/app/thuvien')} />}
      {(
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', marginTop: enoughWords(words) ? 0 : 14 }}>
          {PRACTICE_MODE_META.filter((m) => enoughWords(words) || m.id === 'flappy').map((m) => (
            <button key={m.id} type="button" onClick={() => navigate(`/app/luyen-tap/${m.id}`)}
              style={{ textAlign: 'left', padding: 18, borderRadius: 16, cursor: 'pointer', color: '#e9edef', background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.2)' }}>
              <div style={{ fontSize: 28 }}>{m.icon}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, margin: '6px 0 2px' }}>{m.title}</div>
              <div style={{ color: '#a2acb3', fontSize: 13 }}>{m.desc}</div>
            </button>
          ))}
        </div>
      )}
      <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9', margin: '28px 0 10px', fontSize: 16 }}>Hoạt động khác</h3>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
        {EXTRA_ACTIVITIES.map((a) => (
          <button key={a.id} type="button" onClick={() => navigate(a.path)}
            style={{ textAlign: 'left', padding: 18, borderRadius: 16, cursor: 'pointer', color: '#e9edef', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 24 }}>{a.icon}</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, margin: '6px 0 2px' }}>{a.title}</div>
            <div style={{ color: '#a2acb3', fontSize: 13 }}>{a.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
