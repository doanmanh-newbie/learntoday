// src/api/outbox.js
// Hàng đợi đồng bộ TIẾN ĐỘ HỌC lên server - bền vững qua F5 và mất mạng.
//
// Vấn đề cũ: LearningSession gọi `wordsApi.completeLearn(id).catch(console.error)` rồi đi tiếp.
// Nếu lúc đó mạng rớt / Supabase đang bận / token hết hạn -> lỗi chỉ in ra console, người học
// thấy "đã học xong" nhưng DB KHÔNG có gì (mất tiến độ, SRS lệch, streak sai).
//
// Cách làm: ghi yêu cầu vào hàng đợi (localStorage) rồi gửi tuần tự, tự thử lại khi lỗi tạm thời.
import { ApiError, getAccessToken, wordsApi } from './client';
import { invalidate } from './cache';

const KEY = 'lt_outbox_v1';
const REJECTED_KEY = 'lt_outbox_rejected_v1';     // mục bị server TỪ CHỐI vĩnh viễn: giữ lại để báo cho người dùng, không bỏ im lặng
const MAX_REJECTED = 20;
const MAX_AUTO_TRIES = 6;

const SENDERS = {
  learn: (e) => wordsApi.completeLearn(e.wordId),
  review: (e) => wordsApi.completeReview(e.wordId, e.payload),
  skip: (e) => wordsApi.skip(e.wordId),
  known: (e) => wordsApi.markKnown(e.wordId),
  snooze: (e) => wordsApi.snooze(e.wordId, e.payload?.days),
};

function load() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(arr) ? arr.filter((e) => SENDERS[e?.kind]) : [];
  } catch {
    return [];
  }
}

function loadRejected() {
  try {
    const arr = JSON.parse(localStorage.getItem(REJECTED_KEY) || '[]');
    return Array.isArray(arr) ? arr.slice(-MAX_REJECTED) : [];
  } catch {
    return [];
  }
}

let queue = load();
let rejected = loadRejected();
let flushing = false;
let timer = null;
let lastError = '';
let stalled = false;
let snapshot = { pending: queue.length, flushing: false, stalled: false, lastError: '', rejected: rejected.length, lastRejected: '' };
const listeners = new Set();

function currentOwner() {
  // user_id nằm trong payload của JWT (không cần xác thực chữ ký ở client, chỉ để gắn nhãn)
  try {
    const token = getAccessToken();
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).user_id || null;
  } catch {
    return null;
  }
}

function publish() {
  snapshot = {
    pending: queue.length, flushing, stalled, lastError,
    rejected: rejected.length, lastRejected: rejected.length ? rejected[rejected.length - 1].message : '',
  };
  listeners.forEach((fn) => fn());
}

function persistRejected() {
  try {
    localStorage.setItem(REJECTED_KEY, JSON.stringify(rejected));
  } catch {
    /* localStorage đầy/bị chặn: vẫn báo được trong phiên này */
  }
}

/** Người dùng đã đọc thông báo "tiến độ bị từ chối". */
export function dismissRejected() {
  rejected = [];
  persistRejected();
  publish();
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    /* localStorage đầy/bị chặn: vẫn còn hàng đợi trong bộ nhớ */
  }
  publish();
}

export function getSyncSnapshot() {
  return snapshot;
}

export function subscribeSync(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function scheduleRetry(tries) {
  clearTimeout(timer);
  if (tries >= MAX_AUTO_TRIES) { stalled = true; publish(); return; }   // chờ người dùng/online
  timer = setTimeout(flushOutbox, Math.min(30000, 1000 * 2 ** tries));
}

/** Gửi lần lượt từng mục. Dừng ở lỗi tạm thời để GIỮ NGUYÊN THỨ TỰ (học trước, ôn sau). */
export async function flushOutbox() {
  if (flushing) return;
  const owner = currentOwner();
  if (!owner) return;                                    // chưa đăng nhập: giữ nguyên hàng đợi
  flushing = true;
  stalled = false;
  publish();
  try {
    while (true) {
      const entry = queue.find((e) => !e.owner || e.owner === owner);
      if (!entry) break;
      try {
        await SENDERS[entry.kind](entry);
        queue = queue.filter((e) => e !== entry);
        invalidate('folders');                             // tiến độ từng folder đã đổi
        lastError = '';
      } catch (err) {
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 409) {                              // đã ghi nhận rồi (gửi lặp) -> coi như thành công
          queue = queue.filter((e) => e !== entry);
        } else if (err instanceof ApiError && err.code === 'SESSION_EXPIRED') {
          lastError = 'Phiên đăng nhập hết hạn - đăng nhập lại để lưu tiếp.';
          break;
        } else if (err instanceof ApiError && !err.retryable && status !== 429) {
          // Lỗi vĩnh viễn (400/403/404...): gửi lại vô ích -> bỏ để không kẹt cả hàng đợi
          console.warn('[outbox] bỏ mục không hợp lệ', entry.kind, entry.wordId, err.message);
          queue = queue.filter((e) => e !== entry);
          rejected = [...rejected, { kind: entry.kind, wordId: entry.wordId, message: err.message || `Lỗi ${status}`, ts: Date.now() }].slice(-MAX_REJECTED);
          persistRejected();                         // báo cho người dùng (SyncBanner) thay vì mất tiến độ trong im lặng
        } else {
          entry.tries = (entry.tries || 0) + 1;
          lastError = err?.message || 'Không kết nối được máy chủ.';
          persist();
          scheduleRetry(entry.tries);
          return;
        }
      }
      persist();
    }
  } finally {
    flushing = false;
    publish();
  }
}

/**
 * Chờ hàng đợi gửi xong (hoặc kẹt / hết `timeoutMs`). Dùng trước khi ĐỌC lại số liệu từ server (trang chủ, danh sách từ mới,
 * từ đến hạn): nếu không chờ, người học vừa xong buổi học sẽ thấy vẫn 0/10 và bị phát lại đúng những từ vừa học vì
 * server chưa kịp nhận tiến độ.
 */
export function whenOutboxIdle(timeoutMs = 6000) {
  const owner = currentOwner();
  const mine = () => queue.filter((e) => !e.owner || e.owner === owner).length;
  if (!owner || mine() === 0) return Promise.resolve(true);
  flushOutbox();
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => { if (done) return; done = true; clearTimeout(t); listeners.delete(check); resolve(ok); };
    const check = () => { if (mine() === 0) finish(true); else if (snapshot.stalled) finish(false); };
    const t = setTimeout(() => finish(false), timeoutMs);
    listeners.add(check);
  });
}

/** Ghi nhận tiến độ: lưu bền vững trước, gửi sau. kind: learn | review | skip | known | snooze */
export function enqueueProgress(kind, wordId, payload = null) {
  if (!SENDERS[kind]) throw new Error(`Loại tiến độ không hợp lệ: ${kind}`);
  queue.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, kind, wordId, payload, owner: currentOwner(), ts: Date.now(), tries: 0 });
  persist();
  flushOutbox();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => flushOutbox());
  window.addEventListener('auth:session', () => flushOutbox());      // Access Token vừa được cấp/khôi phục -> gửi nốt phần còn kẹt
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flushOutbox(); });
  window.addEventListener('auth:expired', () => { lastError = 'Phiên đăng nhập hết hạn - đăng nhập lại để lưu tiếp.'; publish(); });
  if (queue.length) setTimeout(flushOutbox, 1500);
}
