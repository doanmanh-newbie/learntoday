import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BIRD_X, BIRD_R, FLAP_V, LIVES, SPEED_START, SPEED_STEP, SPEED_MAX, GAP_PX, ENDING_S, MIN_ANSWER_GAP_MS,
  pointsFor, maxScore, laneAt, buildQuestions, MAX_ANSWERS, createGame, flap, tick, wrapText,
} from '../flappyLogic.js';

const H = 420;
const mk = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ id: i + 1, word: `w${i + 1}`, meaning: `nghia${i + 1}`, difficulty: 1, ...extra }));
const WORDS = mk(5);
const lcg = (seed = 7) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const laneY = (q) => (q.answerIndex + 0.5) * (H / q.choices.length);
const wrongY = (q) => (((q.answerIndex + 1) % q.choices.length) + 0.5) * (H / q.choices.length);

/** Giữ chim ở y (hàm của câu hiện tại) tới khi có sự kiện; trả các sự kiện. */
function run(g, yOf, max = 5000) {
  if (g.phase === 'ready') flap(g);
  for (let i = 0; i < max; i++) {
    const q = g.questions[g.promptIndex];
    if (q) { g.bird.y = yOf(q); g.bird.vy = 0; }
    const ev = tick(g, 1 / 60);
    if (ev.length) return ev;
  }
  throw new Error('không có sự kiện');
}

test('laneAt chia chiều cao thành n ô đều nhau và kẹp ở biên', () => {
  assert.equal(laneAt(0, 4, H), 0);
  assert.equal(laneAt(H / 4 - 1, 4, H), 0);
  assert.equal(laneAt(H / 4 + 1, 4, H), 1);
  assert.equal(laneAt(H - 1, 4, H), 3);
  assert.equal(laneAt(-50, 4, H), 0);
  assert.equal(laneAt(H + 50, 4, H), 3);
  assert.equal(laneAt(H / 2 + 1, 2, H), 1);
  assert.equal(laneAt(500, 2, 1000), 1);
});

test('buildQuestions: mỗi từ một câu, đủ hai hướng, đáp án đúng chỉ số', () => {
  const qs = buildQuestions(mk(8), { random: lcg() });
  assert.equal(qs.length, 8);
  assert.equal(new Set(qs.map((q) => q.word.id)).size, 8);
  assert.deepEqual(new Set(qs.map((q) => q.dir)), new Set(['en_vi', 'vi_en']));
  for (const q of qs) {
    assert.equal(q.choices.length, 4);
    assert.equal(q.choices[q.answerIndex], q.dir === 'en_vi' ? q.word.meaning : q.word.word);
    assert.equal(q.prompt, q.dir === 'en_vi' ? q.word.word : q.word.meaning);
  }
});

test('buildQuestions: tối đa MAX_ANSWERS (200) câu, không trùng từ', () => {
  const qs = buildQuestions(mk(250), { random: lcg() });
  assert.equal(MAX_ANSWERS, 200);
  assert.equal(qs.length, 200);
  assert.equal(new Set(qs.map((q) => q.word.id)).size, 200);
});

test('buildQuestions: thư mục nhỏ lấy nhiễu từ distractorPool; không đủ thì ít ô, không trùng', () => {
  for (const q of buildQuestions(mk(2), { distractorPool: mk(10), random: lcg() })) assert.equal(q.choices.length, 4);
  for (const q of buildQuestions(mk(3), { random: lcg() })) {
    assert.equal(q.choices.length, 3);
    assert.equal(new Set(q.choices).size, 3);
  }
  assert.deepEqual(buildQuestions(mk(1), { random: lcg() }), []);
});

test('ván không có câu hỏi nào kết thúc ngay (không treo)', () => {
  assert.equal(createGame([]).phase, 'over');
});

test('ready: chim nhún nhẹ, chưa rơi; chạm lần đầu thì bắt đầu và bay lên', () => {
  const g = createGame(WORDS, { random: lcg() });
  for (let i = 0; i < 30; i++) tick(g, 1 / 60);
  assert.equal(g.phase, 'ready');
  assert.ok(Math.abs(g.bird.y - H / 2) <= 6.01);
  assert.equal(flap(g), true);
  assert.equal(g.phase, 'playing');
  assert.equal(g.bird.vy, FLAP_V);
  assert.equal(flap(g), false);
});

test('trọng lực kéo chim xuống, bay lên đẩy lên; chạm trần/sàn chỉ bị chặn', () => {
  const g = createGame(WORDS, { random: lcg() });
  flap(g);
  g.bird.y = H / 2; g.bird.vy = 0;
  tick(g, 0.05);
  assert.ok(g.bird.y > H / 2);
  for (let i = 0; i < 100; i++) { g.columns[0].x = 600; tick(g, 1 / 60); }
  assert.equal(g.bird.y, H - BIRD_R);
  assert.equal(g.phase, 'playing');
  for (let i = 0; i < 100; i++) { flap(g); g.columns[0].x = 600; tick(g, 1 / 60); }
  assert.equal(g.bird.y, BIRD_R);
});

test('column_keeps_flying_after_answer', () => {
  const g = createGame(WORDS, { random: lcg() });
  const q0 = g.questions[0];
  const ev = run(g, laneY);
  assert.equal(ev[0].type, 'answer');
  assert.equal(ev[0].ok, true);
  const y = g.bird.y;
  const col = g.columns[0];
  assert.equal(col.resolved, true);
  assert.equal(col.feedback.picked, q0.answerIndex);
  assert.equal(g.phase, 'playing');
  const next = g.columns[1];
  assert.equal(next.qi, 1);
  assert.ok(next.x >= BIRD_X + BIRD_R + GAP_PX);
  const x = col.x;
  tick(g, 1 / 60);
  assert.ok(col.x < x);
  assert.ok(Math.abs(g.bird.y - y) < H / 2);   // chim không bị đặt lại về giữa
});

test('prompt_switches_when_previous_resolved', () => {
  const g = createGame(WORDS, { random: lcg() });
  assert.equal(g.promptIndex, 0);
  run(g, laneY);
  assert.equal(g.promptIndex, 1);
});

test('speed_slower_and_capped', () => {
  const g = createGame(mk(40), { random: lcg() });
  assert.equal(g.speed, SPEED_START);
  run(g, laneY);
  assert.equal(g.speed, SPEED_START + SPEED_STEP);
  for (let n = 0; n < 30; n++) run(g, laneY);
  assert.equal(g.speed, SPEED_MAX);
});

test('min_answer_gap_matches_server', () => {
  assert.ok((GAP_PX / SPEED_MAX) * 1000 >= MIN_ANSWER_GAP_MS);
});

test('scoring_uses_tier_and_streak', () => {
  const g = createGame(mk(6, { difficulty: 3 }), { random: lcg() });
  const pts = [];
  for (let n = 0; n < 3; n++) pts.push(run(g, laneY)[0].points);
  assert.deepEqual(pts, [16, 18, 20]);
  const q = g.questions[g.promptIndex];
  const ev = run(g, wrongY);
  assert.equal(ev[0].ok, false);
  assert.deepEqual([g.streak, g.lives, g.bestStreak], [0, LIVES - 1, 3]);
  assert.deepEqual(g.wrong, [q]);
  assert.equal(pointsFor(99, 1), 20);
  assert.equal(pointsFor(undefined, 1), 10);
});

test('max_score_matches_all_correct_run', () => {
  assert.equal(maxScore(WORDS), 70);
  const g = createGame(WORDS, { random: lcg() });
  for (let n = 0; n < 5; n++) run(g, laneY);
  assert.equal(g.score, 70);
  assert.equal(g.score, maxScore(WORDS));
});

test('over_on_lives_or_done', () => {
  const lose = createGame(mk(8), { random: lcg() });
  for (let n = 0; n < LIVES; n++) run(lose, wrongY);
  assert.equal(lose.phase, 'ending');
  assert.equal(lose.columns.filter((c) => !c.resolved).length, 0);
  let over = [];
  for (let i = 0; i < 200 && !over.length; i++) over = tick(lose, 1 / 60);
  assert.deepEqual(over, [{ type: 'over', reason: 'lives' }]);
  assert.equal(lose.phase, 'over');
  assert.deepEqual(tick(lose, 1), []);

  const win = createGame(WORDS, { random: lcg() });
  for (let n = 0; n < 5; n++) run(win, laneY);
  assert.equal(win.phase, 'ending');
  over = [];
  for (let i = 0; i < 200 && !over.length; i++) over = tick(win, 1 / 60);
  assert.deepEqual(over, [{ type: 'over', reason: 'done' }]);
  assert.ok(ENDING_S > 0);
});

test('log_records_choice_text_and_time', () => {
  const g = createGame(WORDS, { random: lcg() });
  run(g, laneY);
  run(g, wrongY);
  assert.equal(g.log.length, 2);
  const [a, b] = g.log;
  const q0 = g.questions[0];
  assert.deepEqual([a.word_id, a.dir, a.choice], [q0.word.id, q0.dir, q0.choices[q0.answerIndex]]);
  const q1 = g.questions[1];
  assert.equal(b.choice, q1.choices[(q1.answerIndex + 1) % q1.choices.length]);
  assert.ok(Number.isInteger(a.t_ms) && Number.isInteger(b.t_ms));
  assert.ok(a.t_ms > 0 && b.t_ms > a.t_ms);
  assert.ok(b.t_ms - a.t_ms >= MIN_ANSWER_GAP_MS);
});

test('huge_dt_is_clamped', () => {
  const g = createGame(WORDS, { random: lcg() });
  flap(g);
  tick(g, 5);
  assert.ok(g.bird.y >= BIRD_R && g.bird.y <= H - BIRD_R);
  assert.equal(g.answered, 0);
});

test('wrapText: ngắt dòng theo độ rộng, cắt bằng … khi quá số dòng hoặc một từ quá dài', () => {
  const measure = (s) => s.length * 10;                          // mỗi ký tự rộng 10px
  assert.deepEqual(wrapText(measure, 'vé', 100), ['vé']);
  assert.deepEqual(wrapText(measure, 'lịch trình du lịch', 100), ['lịch trình', 'du lịch']);
  const long = wrapText(measure, 'một hai ba bốn năm sáu bảy tám chín mười', 100, 2);
  assert.equal(long.length, 2);
  assert.ok(long[1].endsWith('…'));
  assert.ok(long.every((l) => measure(l) <= 100));
  const huge = wrapText(measure, 'supercalifragilistic', 100, 3);
  assert.equal(huge.length, 1);
  assert.ok(measure(huge[0]) <= 100 && huge[0].endsWith('…'));
  assert.deepEqual(wrapText(measure, '', 100), []);
});
