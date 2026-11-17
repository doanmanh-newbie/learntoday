// Vẽ canvas cho "Chim bay chọn nghĩa": hàm thuần nhận (ctx, game, view), kích thước thế giới lấy từ g.w / g.h.
import { BIRD_X, BIRD_R, laneAt, wrapText } from './flappyLogic.js';

// Màu lấy từ styles/theme.css (xanh ngọc / xanh rêu / đỏ / xám)
const C = {
  bg: '#0f1214', surface: '#161a1d', ink: '#e9edef',
  brand900: '#134e4a', brand700: '#0f766e', brand600: '#0d9488', brand500: '#14b8a6', brand400: '#2dd4bf', brand300: '#5eead4', brand100: '#ccfbf1',
  moss300: '#bcd08c', moss400: '#a3bd6a', red400: '#f87171',
};
const FONT = 'Inter, system-ui, sans-serif';

/**
 * Cỡ chữ vẽ (đơn vị thế giới) để chữ hiển thị thật >= 14px: canvas thế giới `worldW` bị co còn `canvasWidth` px trên màn hình.
 * `reducedMotion` tắt trôi nền (lối chơi không đổi).
 */
export function viewFor(canvasWidth, worldW, reducedMotion = false) {
  const scale = (canvasWidth || worldW) / worldW;
  return { fontPx: Math.min(28, Math.max(15, Math.ceil(14 / scale))), reducedMotion };
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}

/** Dải đồi trôi ngang: `off` tăng theo thời gian, sin liên tục nên không cần nối vòng. */
function ridge(ctx, g, baseY, amp, k, off, fill) {
  ctx.beginPath();
  ctx.moveTo(0, g.h);
  for (let x = 0; x <= g.w + 16; x += 16) {
    const u = (x + off) * k;
    ctx.lineTo(x, baseY - amp * (0.6 * Math.sin(u) + 0.4 * Math.sin(u * 2.3 + 1.7)));
  }
  ctx.lineTo(g.w, g.h);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
}

function drawBackground(ctx, g, view) {
  const { w, h } = g;
  const t = view.reducedMotion ? 0 : g.t;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, C.brand900); sky.addColorStop(0.55, C.surface); sky.addColorStop(1, C.bg);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(204,251,241,0.35)';                     // sao xa, trôi rất chậm
  for (let i = 0; i < 18; i++) {
    const span = w + 20;
    const x = (((i * 137 - t * 6) % span) + span) % span - 10;
    const y = (i * 71) % (h * 0.55);
    ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1.4, i % 4 === 0 ? 2 : 1.4);
  }
  ridge(ctx, g, h * 0.78, h * 0.07, 0.012, t * 14, 'rgba(20,184,166,0.10)');   // đồi xa
  ridge(ctx, g, h * 0.93, h * 0.05, 0.02, t * 40, 'rgba(13,148,136,0.20)');    // đồi gần, trôi nhanh hơn
}

function drawColumn(ctx, g, col, view, isNext) {
  const q = g.questions[col.qi];
  if (!q || col.x >= g.w) return;
  const n = q.choices.length;
  const laneH = g.h / n;
  const under = isNext ? laneAt(g.bird.y, n, g.h) : -1;      // ô đang nằm ngang tầm chim: sáng lên để dễ ngắm
  const lineH = Math.round(view.fontPx * 1.27);
  ctx.font = `600 ${view.fontPx}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const measure = (s) => ctx.measureText(s).width;
  const maxLines = Math.max(2, Math.min(5, Math.floor((laneH - 14) / lineH)));
  for (let i = 0; i < n; i++) {
    let fill = 'rgba(15,18,20,0.62)'; let stroke = 'rgba(45,212,191,0.45)'; let width = 1.5;
    if (col.feedback) {
      if (i === col.feedback.correctIndex) { fill = 'rgba(85,111,45,0.75)'; stroke = C.moss400; width = 2.5; }
      else if (i === col.feedback.picked) { fill = 'rgba(127,29,29,0.75)'; stroke = C.red400; width = 2.5; }
      else { fill = 'rgba(15,18,20,0.45)'; stroke = 'rgba(255,255,255,0.12)'; width = 1; }
    } else if (i === under) { fill = 'rgba(15,118,110,0.78)'; stroke = C.brand300; width = 2.5; }
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
  ctx.beginPath(); ctx.moveTo(BIRD_X + BIRD_R + 12, g.bird.y); ctx.lineTo(Math.min(col.x, g.w), g.bird.y); ctx.stroke();
  ctx.restore();
}

/** Chim tròn sáng, viền tối dày để nổi trên mọi nền; mắt to, mỏ xanh rêu, cánh vỗ khi bay lên. */
function drawBird(ctx, g) {
  const { y, vy } = g.bird;
  const R = BIRD_R;
  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(Math.max(-0.45, Math.min(0.8, vy / 700)));
  ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = C.bg;

  ctx.fillStyle = C.brand500;                                         // đuôi
  ctx.beginPath(); ctx.moveTo(-R + 3, -2); ctx.lineTo(-R - 9, -8); ctx.lineTo(-R - 7, 4); ctx.closePath(); ctx.fill(); ctx.stroke();

  ctx.fillStyle = C.moss300;                                          // mỏ
  ctx.beginPath(); ctx.moveTo(R - 3, -5); ctx.lineTo(R + 10, 0); ctx.lineTo(R - 3, 5); ctx.closePath(); ctx.fill(); ctx.stroke();

  ctx.fillStyle = C.brand300;                                         // thân
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.brand100;                                         // bụng
  ctx.beginPath(); ctx.ellipse(2, 6, R * 0.6, R * 0.4, 0, 0, Math.PI * 2); ctx.fill();

  const flapY = vy < 0 ? Math.sin(g.t * 28) * 5 : 3;                  // cánh vỗ khi đang bay lên
  ctx.fillStyle = C.brand600;
  ctx.beginPath(); ctx.ellipse(-4, 1 + flapY, 9, 5.5, -0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#ffffff';                                          // mắt
  ctx.beginPath(); ctx.arc(6, -5, 5, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = C.bg;
  ctx.beginPath(); ctx.arc(7.5, -5, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawReadyHint(ctx, g, view) {
  const fs = view.fontPx + 1;
  ctx.font = `700 ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const text = g.w < g.h ? 'Chạm để bay' : 'Chạm hoặc nhấn Space để bay';
  const w = ctx.measureText(text).width + 36;
  const h = fs * 2.2;
  const cy = g.h / 2 - 40 - h / 2;
  roundedRect(ctx, g.w / 2 - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill();
  ctx.fillStyle = C.ink; ctx.fillText(text, g.w / 2, cy);
}

export function draw(ctx, g, view) {
  drawBackground(ctx, g, view);
  const next = g.phase === 'playing' || g.phase === 'ready' ? g.columns.find((c) => !c.resolved) : null;
  for (const col of g.columns) drawColumn(ctx, g, col, view, col === next);
  drawAim(ctx, g, next);
  drawBird(ctx, g);
  if (g.phase === 'ready') drawReadyHint(ctx, g, view);
}
