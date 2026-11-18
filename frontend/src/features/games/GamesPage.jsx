// Mục "Trò chơi": game học từ vựng (hiện có Flappy Bird). /app/tro-choi/<id> mở thẳng game.
import { useNavigate } from 'react-router-dom';
import usePracticePool from '../practice/usePracticePool';
import { GAMES } from '../practice/modes';
import FlappyMode from '../practice/FlappyMode.jsx';
import { GAMES_PATH } from './gameRoutes';

export default function GamesPage({ game }) {
  const navigate = useNavigate();
  const { loading, words } = usePracticePool();
  const exit = () => navigate(GAMES_PATH);

  if (loading) return <p style={{ color: '#a2acb3' }}>Đang tải từ của bạn…</p>;
  // FlappySetup tự chọn bộ từ (cả thư mục chưa học) và chặn khi thiếu từ
  if (game === 'flappy') return <FlappyMode words={words} onExit={exit} />;

  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#f1f5f9', margin: '0 0 4px' }}>Trò chơi</h2>
      <p style={{ color: '#a2acb3', marginTop: 0 }}>Vừa chơi vừa học từ vựng.</p>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
        {GAMES.map((g) => (
          <button key={g.id} type="button" onClick={() => navigate(`${GAMES_PATH}/${g.id}`)}
            style={{ textAlign: 'left', padding: 18, borderRadius: 16, cursor: 'pointer', color: '#e9edef', background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.2)' }}>
            <div style={{ fontSize: 28 }}>{g.icon}</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, margin: '6px 0 2px' }}>{g.title}</div>
            <div style={{ color: '#a2acb3', fontSize: 13 }}>{g.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
