import { useEffect, useRef, useState } from 'react';
import { ModeShell, RoundSummary, SpeakButton } from './ModeShell.jsx';
import { SECONDARY_BTN } from './modeStyles.js';
import { saveBestIfBetter, readBest } from './practiceLogic';
import { speak } from '../../utils/tts';
import { posLabelVi } from '../../api/adapters';
import { gameApi } from '../../api/client';
import { BIRD_X, BIRD_R, COLUMN_W, LIVES, createGame, flap, tick, laneAt, wrapText, maxScore } from './flappyLogic.js';
import FlappySetup from './FlappySetup.jsx';

const W = 640; const H = 420;   // thế giới cố định (Task 8 sẽ đổi sang dọc)
const NET_MSG = 'Chưa lưu được vào bảng xếp hạng';

/** Cỡ chữ/độ rộng cột vẽ theo kích thước canvas trên màn hình: canvas 640px co lại ~0.5 trên điện thoại thì chữ 15px chỉ còn ~7px. */
function viewFor(canvasWidth) {
  const scale = (canvasWidth || W) / W;
  return { fontPx: Math.round(Math.min(28, Math.max(15, 13 / scale))), colW: scale >= 0.8 ? COLUMN_W : 230 };
}

// Màu lấy từ styles/theme.css (xanh ngọc / xanh rêu / đỏ / xám)
const C = { bg1: '#161a1d', bg2: '#0f1214', ink: '#e9edef', brand: '#2dd4bf', brandLight: '#5eead4', brandPale: '#ccfbf1', moss: '#a3bd6a', red: '#f87171' };

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

function drawBackground(ctx, g) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, C.bg1); sky.addColorStop(1, C.bg2);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.035)';          // mấy đám mây mờ trôi chậm cho có cảm giác bay
  for (let i = 0; i < 8; i++) {
    const span = W + 160;
    const x = (((i * 97 - g.t * 16 * (1 + (i % 3) * 0.4)) % span) + span) % span - 80;
    ctx.beginPath(); ctx.ellipse(x, 40 + ((i * 53) % (H - 90)), 46 + (i % 3) * 10, 14, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function drawColumn(ctx, g, col, view, isNext) {
  const q = g.questions[col.qi];
  if (!q || col.x >= W) return;
  const n = q.choices.length;
  const laneH = H / n;
  const under = isNext ? laneAt(g.bird.y, n, H) : -1;      // ô đang nằm ngang tầm chim: sáng lên để dễ ngắm
  const lineH = Math.round(view.fontPx * 1.27);
  ctx.font = `600 ${view.fontPx}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const measure = (s) => ctx.measureText(s).width;
  const maxLines = Math.max(2, Math.min(5, Math.floor((laneH - 14) / lineH)));
  for (let i = 0; i < n; i++) {
    let fill = 'rgba(45,212,191,0.10)'; let stroke = 'rgba(45,212,191,0.4)'; let width = 1.5;
    if (col.feedback) {
      if (i === col.feedback.correctIndex) { fill = 'rgba(163,189,106,0.34)'; stroke = C.moss; width = 2.5; }
      else if (i === col.feedback.picked) { fill = 'rgba(248,113,113,0.3)'; stroke = C.red; width = 2.5; }
      else { fill = 'rgba(255,255,255,0.04)'; stroke = 'rgba(255,255,255,0.12)'; width = 1; }
    } else if (i === under) { fill = 'rgba(45,212,191,0.28)'; stroke = C.brandLight; width = 2.5; }
    roundedRect(ctx, col.x, i * laneH + 3, col.colW, laneH - 6, 12);
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke();

    const lines = wrapText(measure, q.choices[i], col.colW - 22, maxLines);
    ctx.fillStyle = C.ink;
    const top = i * laneH + laneH / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, k) => ctx.fillText(line, col.x + col.colW / 2, top + k * lineH));
  }
}

/** Vạch ngắm đứt đoạn từ chim tới mép cột đang tới: chỉ ra ô sẽ được chọn. */
function drawAim(ctx, g, col) {
  if (!col || col.x <= BIRD_X + BIRD_R) return;
  ctx.save();
  ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(94,234,212,0.7)';
  ctx.beginPath(); ctx.moveTo(BIRD_X + BIRD_R + 10, g.bird.y); ctx.lineTo(Math.min(col.x, W), g.bird.y); ctx.stroke();
  ctx.restore();
}

function drawBird(ctx, g) {
  const { y, vy } = g.bird;
  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(Math.max(-0.45, Math.min(0.8, vy / 700)));
  ctx.fillStyle = C.red;                                              // mỏ
  ctx.beginPath(); ctx.moveTo(BIRD_R - 2, -3); ctx.lineTo(BIRD_R + 9, 1); ctx.lineTo(BIRD_R - 2, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.brand;                                            // thân
  ctx.beginPath(); ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.brandPale;                                        // bụng
  ctx.beginPath(); ctx.ellipse(1, 5, BIRD_R * 0.65, BIRD_R * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  const flap1 = vy < 0 ? Math.sin(g.t * 28) * 5 : 2;                  // cánh vỗ khi đang bay lên
  ctx.fillStyle = C.brandLight;
  ctx.beginPath(); ctx.ellipse(-4, 1 + flap1, 9, 5, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';                                             // mắt
  ctx.beginPath(); ctx.arc(5, -5, 4.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.bg2;
  ctx.beginPath(); ctx.arc(6.2, -5, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawReadyHint(ctx, view) {
  const fs = view.fontPx + 1;
  ctx.font = `700 ${fs}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const text = 'Chạm hoặc nhấn Space để bay';
  const w = ctx.measureText(text).width + 36;
  const h = fs * 2.2;
  roundedRect(ctx, W / 2 - w / 2, H / 2 - 40 - h, w, h, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill();
  ctx.fillStyle = C.ink; ctx.fillText(text, W / 2, H / 2 - 40 - h / 2);
}

function draw(ctx, g, view) {
  drawBackground(ctx, g);
  const next = g.phase === 'playing' || g.phase === 'ready' ? g.columns.find((c) => !c.resolved) : null;
  for (const col of g.columns) drawColumn(ctx, g, col, view, col === next);
  drawAim(ctx, g, next);
  drawBird(ctx, g);
  if (g.phase === 'ready') drawReadyHint(ctx, view);
}

const snapshot = (g) => ({ promptIndex: g.promptIndex, total: g.questions.length, lives: g.lives, score: g.score });

const isTyping = (el) => !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

function Play({ pool, onExit, onAgain }) {
  const canvasRef = useRef(null);
  const [ui, setUi] = useState({ promptIndex: 0, total: 0, lives: LIVES, score: 0 });
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState(null);       // { ok, text } sau mỗi câu
  const [result, setResult] = useState(null);
  const [submit, setSubmit] = useState(null);         // null | {saving} | {rank_week, rank_all} | {error}

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const game = createGame(pool.words, { world: { w: W, h: H }, distractorPool: pool.distractorPool });
    setQuestions(game.questions); setUi(snapshot(game)); setMessage(null); setResult(null); setSubmit(null);
    const view = viewFor(canvas.clientWidth);
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => Object.assign(view, viewFor(canvas.clientWidth)));
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
    const rank = submit && submit.rank_week != null ? ` · hạng tuần #${submit.rank_week} · hạng mọi thời gian #${submit.rank_all}` : '';
    return (
      <ModeShell title="Chim bay chọn nghĩa" icon="🐦" onExit={onExit}>
        <RoundSummary correct={result.correct} total={result.answered}
          extra={`Điểm ${result.score}/${result.max} · chuỗi đúng dài nhất ${result.bestStreak}${best ? ` · điểm cao nhất ${best}` : ''}${rank}`}
          record={result.record} onAgain={onAgain} onExit={onExit} />
        {submit && (submit.saving || submit.error) && (
          <p aria-live="polite" style={{ textAlign: 'center', fontSize: 13, color: submit.error ? '#fca5a5' : '#a2acb3', margin: '4px 0 0' }}>
            {submit.saving ? 'Đang lưu vào bảng xếp hạng…' : submit.error}
          </p>
        )}
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
    <ModeShell title="Chim bay chọn nghĩa" icon="🐦" progress={ui.total ? `${Math.min(ui.promptIndex + 1, ui.total)}/${ui.total}` : null} onExit={onExit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ color: '#a2acb3', fontSize: 12 }}>{q ? (en ? 'Bay vào nghĩa đúng của từ' : 'Bay vào từ tiếng Anh đúng với nghĩa') : ' '}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', minHeight: 36 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#f1f5f9' }}>{q ? q.prompt : ''}</span>
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
        style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${W} / ${H}`, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)',
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
      <ModeShell title="Chim bay chọn nghĩa" icon="🐦" onExit={onExit}>
        <FlappySetup learnedWords={words} onStart={setPool} />
      </ModeShell>
    );
  }
  return <Play pool={pool} onExit={onExit} onAgain={() => setPool(null)} />;
}
