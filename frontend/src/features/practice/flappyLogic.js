// "Chim bay chọn nghĩa" (bay liên tục): logic thuần của game (không có canvas/React, test được bằng node).
// Mỗi từ một cột 2-4 ô trôi từ phải sang; cột chạm tới chim thì ô ngang tầm tâm chim là đáp án, cột vẫn trôi tiếp (không đứng yên).
// Server (backend/app/utils/game_score.py) chấm lại từ `g.log` bằng cùng luật điểm/mạng/giãn cách.
import { shuffle } from '../../utils/helpers';
import { usableWords } from './practiceLogic';
import { meaningChoices, wordChoices, sameText } from '../learning/quizChoices';

export const BIRD_X = 110;
export const BIRD_R = 15;
export const GRAVITY = 1500;          // px/s^2
export const FLAP_V = -430;           // vận tốc đặt khi bay lên (px/s, âm = đi lên)
export const MAX_FALL = 620;
export const COLUMN_W = 170;
export const SPEED_START = 90;
export const SPEED_STEP = 4;          // mỗi câu đúng nhanh thêm
export const SPEED_MAX = 150;
export const GAP_PX = 520;            // khoảng cách cột kế tiếp; GAP_PX / SPEED_MAX >= MIN_ANSWER_GAP_MS
export const ENDING_S = 1.2;          // sau câu cuối / hết mạng: chim bay thêm rồi mới báo 'over'
export const MIN_ANSWER_GAP_MS = 2500;
export const LIVES = 3;
export const MAX_ANSWERS = 200;       // server (game_score.MAX_ANSWERS) từ chối ván dài hơn
export const TIER_POINTS = { 1: 10, 2: 13, 3: 16, 4: 20 };
const DT_MAX = 0.05;

const tierOf = (t) => { const n = Math.trunc(Number(t)); return Number.isFinite(n) ? Math.min(4, Math.max(1, n)) : 1; };

/** Điểm một câu đúng: điểm theo bậc, +2 cho mỗi câu đúng liên tiếp sau câu đầu (tối đa +10). `streak` đã tính câu này. */
export const pointsFor = (tier, streak) => TIER_POINTS[tierOf(tier)] + Math.min(Math.max(streak - 1, 0), 5) * 2;

/** Điểm tối đa của một ván trả lời đúng hết `words` (thứ tự không ảnh hưởng tổng). */
export const maxScore = (words) => (words || []).reduce((sum, w, i) => sum + pointsFor(w.difficulty, i + 1), 0);

/** Ô (0..n-1) mà tâm chim đang nằm ngang tầm; chạm trần/sàn thì thuộc ô đầu/cuối. */
export function laneAt(y, lanes, h) {
  if (lanes <= 0) return 0;
  return Math.min(lanes - 1, Math.max(0, Math.floor(y / (h / lanes))));
}

/** Mỗi từ dùng được một câu (hướng en_vi hoặc vi_en ngẫu nhiên); bỏ từ không đủ 2 lựa chọn. */
export function buildQuestions(words, { distractorPool = words, random = Math.random } = {}) {
  const pool = usableWords(distractorPool);
  const out = [];
  for (const word of shuffle(usableWords(words), random).slice(0, MAX_ANSWERS)) {
    const dir = random() < 0.5 ? 'en_vi' : 'vi_en';
    const en = dir === 'en_vi';
    const choices = en ? meaningChoices(word, pool, 3) : wordChoices(word, pool, 3);
    if (choices.length < 2) continue;
    const answer = en ? word.meaning : word.word;
    out.push({ word, dir, prompt: en ? word.word : word.meaning, choices, answerIndex: choices.findIndex((c) => sameText(c, answer)) });
  }
  return out;
}

const newColumn = (g, qi) => ({ qi, x: Math.max(g.w + 10, BIRD_X + BIRD_R + GAP_PX), colW: COLUMN_W, resolved: false, feedback: null });

export function createGame(words, { world = { w: 640, h: 420 }, distractorPool = words, random = Math.random } = {}) {
  const questions = buildQuestions(words, { distractorPool, random });
  const g = {
    questions, w: world.w, h: world.h,
    phase: questions.length ? 'ready' : 'over',   // ready (chờ chạm lần đầu) | playing | ending | over
    t: 0, playT: 0, endingT: 0, endReason: null,
    bird: { y: world.h / 2, vy: 0 },
    columns: [], promptIndex: 0,
    speed: SPEED_START,
    lives: LIVES, score: 0, streak: 0, bestStreak: 0, correct: 0, answered: 0,
    log: [], wrong: [],
  };
  if (questions.length) g.columns.push(newColumn(g, 0));
  return g;
}

/** Chạm/nhấn: bắt đầu ván (lần đầu) hoặc bay lên. Trả true nếu phase đổi. */
export function flap(g) {
  if (g.phase === 'over') return false;
  if (g.phase === 'ready') { g.phase = 'playing'; g.bird.vy = FLAP_V; return true; }
  g.bird.vy = FLAP_V;
  return false;
}

function resolve(g, col, events) {
  const q = g.questions[col.qi];
  const lane = laneAt(g.bird.y, q.choices.length, g.h);
  const ok = lane === q.answerIndex;
  g.answered += 1;
  let points = 0;
  if (ok) {
    g.correct += 1; g.streak += 1; g.bestStreak = Math.max(g.bestStreak, g.streak);
    points = pointsFor(q.word.difficulty, g.streak);
    g.score += points;
    g.speed = Math.min(SPEED_MAX, g.speed + SPEED_STEP);
  } else {
    g.streak = 0; g.lives -= 1; g.wrong.push(q);
  }
  col.resolved = true;
  col.feedback = { picked: lane, correctIndex: q.answerIndex, ok };
  g.promptIndex = col.qi + 1;
  const last = g.log.length ? g.log[g.log.length - 1].t_ms : 0;
  g.log.push({ word_id: q.word.id, dir: q.dir, choice: q.choices[lane], t_ms: Math.max(last + 1, Math.round(g.playT * 1000)) });
  events.push({ type: 'answer', ok, lane, points, question: q });
  if (g.lives <= 0 || g.promptIndex >= g.questions.length) {   // không sinh cột mới: server từ chối câu trả lời sau khi hết mạng
    g.phase = 'ending'; g.endingT = 0; g.endReason = g.lives <= 0 ? 'lives' : 'done';
  } else g.columns.push(newColumn(g, col.qi + 1));
}

/**
 * Tiến game `dt` giây (kẹp 0.05). Trả sự kiện: {type:'answer', ok, lane, points, question} | {type:'over', reason}.
 * Sửa trực tiếp `g` (đối tượng game riêng của component, không phải state React).
 */
export function tick(g, dt) {
  const events = [];
  dt = Math.min(Math.max(dt, 0), DT_MAX);
  g.t += dt;
  if (g.phase === 'over') return events;

  if (g.phase === 'ready') {                       // chim nhún nhẹ chờ người chơi
    g.bird.y = g.h / 2 + Math.sin(g.t * 3) * 6;
    return events;
  }

  g.playT += dt;
  g.bird.vy = Math.min(g.bird.vy + GRAVITY * dt, MAX_FALL);
  g.bird.y += g.bird.vy * dt;
  if (g.bird.y < BIRD_R) { g.bird.y = BIRD_R; g.bird.vy = 0; }
  if (g.bird.y > g.h - BIRD_R) { g.bird.y = g.h - BIRD_R; g.bird.vy = 0; }

  for (const col of g.columns) col.x -= g.speed * dt;
  if (g.phase === 'playing') {
    const col = g.columns.find((c) => !c.resolved);
    if (col && col.x <= BIRD_X + BIRD_R) resolve(g, col, events);
  }
  g.columns = g.columns.filter((c) => !c.resolved || c.x + c.colW >= 0);

  if (g.phase === 'ending') {
    g.endingT += dt;
    if (g.endingT >= ENDING_S) { g.phase = 'over'; events.push({ type: 'over', reason: g.endReason }); }
  }
  return events;
}

/** Cắt `s` cho vừa `maxWidth` (đo bằng `measure`), thêm "…" nếu phải cắt. */
function fitWidth(measure, s, maxWidth) {
  if (measure(s) <= maxWidth) return s;
  let t = s;
  while (t.length > 1 && measure(`${t}…`) > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

/**
 * Ngắt `text` thành tối đa `maxLines` dòng vừa `maxWidth` (`measure(text) -> px` được truyền vào để test không cần canvas).
 * Quá số dòng thì phần còn lại gộp vào dòng cuối và cắt bằng "…"; một từ dài hơn cả dòng cũng bị cắt.
 */
export function wrapText(measure, text, maxWidth, maxLines = 3) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && measure(next) > maxWidth) { lines.push(cur); cur = word; } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) lines.splice(maxLines - 1, lines.length, lines.slice(maxLines - 1).join(' '));
  return lines.map((l) => fitWidth(measure, l, maxWidth));
}
