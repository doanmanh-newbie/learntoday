import { useEffect, useRef, useState } from 'react';
import { ModeShell, RoundSummary, SpeakButton } from './ModeShell.jsx';
import { SECONDARY_BTN } from './modeStyles.js';
import { saveBestIfBetter, readBest } from './practiceLogic';
import { speak } from '../../utils/tts';
import { posLabelVi } from '../../api/adapters';
import { gameApi } from '../../api/client';
import { LIVES, createGame, flap, tick, maxScore } from './flappyLogic.js';
import { draw, viewFor } from './flappyDraw.js';
import FlappySetup from './FlappySetup.jsx';
import FlappyLeaderboard from './FlappyLeaderboard.jsx';

const NET_MSG = 'Chưa lưu được vào bảng xếp hạng';
const PORTRAIT = { w: 360, h: 560 }; const LANDSCAPE = { w: 640, h: 420 };
/** Khung hẹp (điện thoại dọc) dùng thế giới dọc; chọn một lần lúc bắt đầu ván. */
const worldFor = (containerWidth) => (containerWidth < 520 ? PORTRAIT : LANDSCAPE);

const snapshot = (g) => ({ promptIndex: g.promptIndex, total: g.questions.length, lives: g.lives, score: g.score });

const isTyping = (el) => !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

function Play({ pool, onExit, onAgain }) {
  const canvasRef = useRef(null);
  const [ui, setUi] = useState({ promptIndex: 0, total: 0, lives: LIVES, score: 0 });
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState(null);       // { ok, text } sau mỗi câu
  const [result, setResult] = useState(null);
  const [showBoard, setShowBoard] = useState(false);
  const [submit, setSubmit] = useState(null);         // null | {saving} | {rank_week, rank_all} | {error}

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const world = worldFor(canvas.clientWidth);
    canvas.style.aspectRatio = `${world.w} / ${world.h}`;   // đặt thẳng vào DOM (không qua JSX) để React không ghi đè
    canvas.width = world.w * dpr; canvas.height = world.h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const game = createGame(pool.words, { world, distractorPool: pool.distractorPool });
    setQuestions(game.questions); setUi(snapshot(game)); setMessage(null); setResult(null); setSubmit(null);
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const view = viewFor(canvas.clientWidth, world.w, reduced);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => Object.assign(view, viewFor(canvas.clientWidth, world.w, reduced)));
    ro?.observe(canvas);
    let alive = true;

    const finish = () => {
      const record = game.score > 0 ? saveBestIfBetter('flappy', game.score) : false;   // 0 điểm thì không phải kỷ lục
      setResult({ correct: game.correct, answered: game.answered, score: game.score, bestStreak: game.bestStreak, record,
        max: maxScore(game.questions.map((q) => q.word)), wrong: game.wrong });
      if (game.answered < 1) return;                  // server từ chối ván rỗng
      setSubmit({ saving: true });
      gameApi.submitFlappy(game.log, pool.folderId)   // đúng một lần, không tự thử lại
        .then((r) => alive && setSubmit({ rank_week: r.rank_week, rank_all: r.rank_all }))
        .catch((e) => alive && setSubmit({ error: e && e.status >= 400 && e.status < 500 && e.message ? e.message : NET_MSG }));
    };

    let raf = 0;
    let last = null;
    const frame = (now) => {
      const dt = last == null ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));   // luôn hữu hạn và >= 0
      last = now;
      const events = tick(game, dt);
      draw(ctx, game, view);
      for (const ev of events) {
        if (ev.type !== 'answer') continue;
        setUi(snapshot(game));
        setMessage(ev.ok ? { ok: true, text: `Đúng! +${ev.points} điểm` } : { ok: false, text: `Chưa đúng. Đáp án: ${ev.question.choices[ev.question.answerIndex]}` });
        speak(ev.question.word.word);
      }
      if (game.phase === 'over') { finish(); return; }                         // dừng vòng lặp
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const doFlap = () => { flap(game); };
    const onKey = (e) => {
      if (game.phase === 'over' || e.repeat || isTyping(e.target)) return;       // hết ván: trả lại phím Space cho trang
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); doFlap(); }
    };
    const onPointer = (e) => { e.preventDefault(); doFlap(); };
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('pointerdown', onPointer);
    return () => { alive = false; cancelAnimationFrame(raf); ro?.disconnect(); window.removeEventListener('keydown', onKey); canvas.removeEventListener('pointerdown', onPointer); };
  }, [pool]);

  if (result) {
    const best = readBest('flappy');
    const rank = (submit && submit.rank_week != null ? ` · hạng tuần #${submit.rank_week}` : '') + (submit && submit.rank_all != null ? ` · hạng mọi thời gian #${submit.rank_all}` : '');
    return (
      <ModeShell title="Flappy Bird" icon="🐦" onExit={onExit}>
        <RoundSummary correct={result.correct} total={result.answered}
          extra={`Điểm ${result.score}/${result.max} · chuỗi đúng dài nhất ${result.bestStreak}${best ? ` · điểm cao nhất ${best}` : ''}${rank}`}
          record={result.record} onAgain={onAgain} onExit={onExit} />
        {submit && (submit.saving || submit.error) && (
          <p aria-live="polite" style={{ textAlign: 'center', fontSize: 13, color: submit.error ? '#fca5a5' : '#a2acb3', margin: '4px 0 0' }}>
            {submit.saving ? 'Đang lưu vào bảng xếp hạng…' : submit.error}
          </p>
        )}
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button type="button" style={{ ...SECONDARY_BTN, padding: '8px 16px', fontSize: 13 }} onClick={() => setShowBoard((v) => !v)}>
            {showBoard ? 'Ẩn bảng xếp hạng' : 'Xem bảng xếp hạng'}
          </button>
        </div>
        {showBoard && <div style={{ marginTop: 12 }}><FlappyLeaderboard /></div>}
        {result.wrong.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h4 style={{ margin: '0 0 8px', fontFamily: 'Outfit, sans-serif', fontSize: 15, color: '#f1f5f9' }}>Từ cần ôn lại</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {result.wrong.map((q, i) => (
                <li key={`${q.word.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <span style={{ flex: 1, color: '#e9edef' }}><strong>{q.word.word}</strong> <span style={{ color: '#a2acb3' }}>— {q.word.meaning}</span></span>
                  <SpeakButton text={q.word.word} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </ModeShell>
    );
  }

  const q = ui.promptIndex < questions.length ? questions[ui.promptIndex] : null;   // hết câu thì ẩn
  const en = !!q && q.dir === 'en_vi';
  return (
    <ModeShell title="Flappy Bird" icon="🐦" progress={ui.total ? `${Math.min(ui.promptIndex + 1, ui.total)}/${ui.total}` : null} onExit={onExit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ color: '#a2acb3', fontSize: 12 }}>{q ? (en ? 'Bay vào nghĩa đúng của từ' : 'Bay vào từ tiếng Anh đúng với nghĩa') : ' '}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', minHeight: 36 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 800, color: '#f1f5f9', overflowWrap: 'anywhere' }}>{q ? q.prompt : ''}</span>
            {en && <span style={{ fontSize: 13, color: '#5eead4', fontStyle: 'italic' }}>{posLabelVi(q.word.word_type)}</span>}
          </div>
        </div>
        {en && <SpeakButton text={q.word.word} />}
        <div aria-label={`Còn ${ui.lives} mạng`} style={{ fontSize: 20, letterSpacing: 2, color: '#f87171', whiteSpace: 'nowrap' }}>
          {Array.from({ length: LIVES }, (_, i) => <span key={i} style={{ opacity: i < ui.lives ? 1 : 0.2 }}>♥</span>)}
        </div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 18, color: '#99f6e4', minWidth: 56, textAlign: 'right' }}>{ui.score} đ</div>
      </div>
      <canvas ref={canvasRef} role="img" aria-label="Màn chơi: điều khiển chú chim bay vào ô đáp án đúng"
        style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
          touchAction: 'none', userSelect: 'none', cursor: 'pointer' }} />
      <div aria-live="polite" style={{ minHeight: 26, marginTop: 10, fontSize: 14, fontWeight: 600, color: message ? (message.ok ? '#bcd08c' : '#fca5a5') : '#a2acb3' }}>
        {message ? (message.ok ? `✅ ${message.text}` : `❌ ${message.text}`) : 'Chạm màn hình hoặc nhấn Space để bay lên. Thả ra là chim rơi xuống.'}
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#848f97' }}>Ô sáng nằm ngang tầm chim lúc cột chạm tới chính là đáp án bạn chọn. Sai 3 lần là hết mạng.</p>
      <div style={{ marginTop: 10 }}><button type="button" style={{ ...SECONDARY_BTN, padding: '6px 12px', fontSize: 12 }} onClick={onAgain}>↻ Chơi lại từ đầu</button></div>
    </ModeShell>
  );
}

export default function FlappyMode({ words, onExit }) {
  const [pool, setPool] = useState(null);
  if (!pool) {
    return (
      <ModeShell title="Flappy Bird" icon="🐦" onExit={onExit}>
        <FlappySetup learnedWords={words} onStart={setPool} />
      </ModeShell>
    );
  }
  return <Play pool={pool} onExit={onExit} onAgain={() => setPool(null)} />;
}
