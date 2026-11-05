// Service worker: lưu sẵn khung web để dùng khi mất mạng.
// Đổi VERSION mỗi khi sửa file trong site/assets để người dùng nhận bản mới.
const VERSION = 'medai-v4';
const SHELL = ['./', 'index.html', 'assets/style.css', 'assets/app.js', 'assets/core.js', 'assets/hoc.js', 'assets/icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/data/db.json')) {
    // Dữ liệu: lấy bản mới nhất, mất mạng thì dùng bản đã lưu.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request)));
});
