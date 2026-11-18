// Service worker của Learn Today: mở được khi mạng chập chờn (trang đã từng tải), thông báo nhắc học.
// KHÔNG cache API (/api/...) để dữ liệu học luôn mới.
const CACHE = 'lt-shell-v1';
const SHELL = ['/', '/app', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (e.request.mode === 'navigate') {
    // trang: lấy mạng trước, mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put('/app', copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('/app').then((r) => r || caches.match('/'))));
    return;
  }
  if (/\.(js|css|png|svg|woff2?)$/.test(url.pathname)) {
    // file tĩnh có hash trong tên: dùng cache trước
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    })));
  }
});

// Chrome trên Android (app đã cài) có thể đánh thức SW định kỳ: nhắc học nếu hôm nay chưa mở app
self.addEventListener('periodicsync', (e) => {
  if (e.tag !== 'lt-reminder') return;
  e.waitUntil(self.registration.showNotification('Learn Today 📚', {
    body: 'Đừng quên ôn từ hôm nay để giữ chuỗi nhé!', icon: '/icon-192.png', badge: '/icon-192.png', tag: 'lt-reminder', data: { url: '/app' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = e.notification.data?.url || '/app';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => c.url.includes('/app'));
    return open ? open.focus() : self.clients.openWindow(target);
  }));
});
