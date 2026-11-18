// PWA: đăng ký service worker, nút "Cài lên màn hình chính", nhắc học bằng thông báo của trình duyệt.

/** Số ms từ `now` tới lần nhắc kế tiếp lúc `hour`:00 (đúng giờ hoặc đã qua -> ngày mai). */
export function msUntilReminder(now, hour) {
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

let deferredPrompt = null;
const listeners = new Set();
export const canInstall = () => Boolean(deferredPrompt);
export const onInstallAvailable = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function isStandalone() {
  return typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
}

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((fn) => fn(false));
  return outcome;                                   // 'accepted' | 'dismissed'
}

export function registerPwa() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((fn) => fn(true));
  });
  if ('serviceWorker' in navigator && import.meta.env?.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
}

// ── nhắc học ──
const REMINDER_KEY = 'lt_push_reminder';      // { enabled, hour }
const STUDIED_KEY = 'lt_studied_date';        // ngày (yyyy-mm-dd) đã học, để không nhắc khi đã học rồi

export function readReminder() {
  try { return { enabled: false, hour: 20, ...JSON.parse(localStorage.getItem(REMINDER_KEY) || '{}') }; } catch { return { enabled: false, hour: 20 }; }
}
export function saveReminder(value) { try { localStorage.setItem(REMINDER_KEY, JSON.stringify(value)); } catch { /* bỏ qua */ } }
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function markStudiedToday() { try { localStorage.setItem(STUDIED_KEY, todayKey()); } catch { /* bỏ qua */ } }
const studiedToday = () => { try { return localStorage.getItem(STUDIED_KEY) === todayKey(); } catch { return false; } };

export async function enableNotifications() {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

async function showReminder() {
  if (studiedToday() || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const title = 'Learn Today 📚';
  const options = { body: 'Đến giờ học rồi! Vài phút ôn từ để giữ chuỗi nhé.', icon: '/icon-192.png', badge: '/icon-192.png', tag: 'lt-reminder', data: { url: '/app' } };
  const reg = await navigator.serviceWorker?.getRegistration?.();
  if (reg) reg.showNotification(title, options);
  else new Notification(title, options);
}

let timer = null;
/** Hẹn thông báo nhắc học khi app đang mở (kể cả chạy nền dạng app đã cài). Gọi lại khi đổi giờ. */
export function scheduleReminder() {
  clearTimeout(timer);
  const { enabled, hour } = readReminder();
  if (!enabled || typeof window === 'undefined') return;
  timer = setTimeout(() => { showReminder(); scheduleReminder(); }, msUntilReminder(new Date(), hour));
  navigator.serviceWorker?.ready?.then((reg) => reg.periodicSync?.register('lt-reminder', { minInterval: 12 * 3600 * 1000 })).catch(() => {});
}
