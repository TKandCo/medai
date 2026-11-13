// Service worker: lưu sẵn khung web để dùng khi mất mạng.
// Đổi VERSION mỗi khi sửa file trong site/assets để người dùng nhận bản mới.
const VERSION = 'medai-v11';
const SHELL = ['./', 'index.html', 'assets/style.css', 'assets/app.js', 'assets/core.js', 'assets/hoc.js', 'assets/on-luyen.js', 'assets/phan-tich.js', 'assets/phan-tich-core.js', 'assets/icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
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
  // Mọi tệp của web: lấy bản mới nhất từ mạng (bỏ qua bộ nhớ đệm cũ của trình duyệt),
  // mất mạng thì dùng bản đã lưu. Nhờ vậy sửa lỗi xong là người dùng nhận ngay.
  // Riêng bộ đọc chữ (vendor) rất nặng: không lưu ở đây.
  if (url.pathname.includes('/vendor/')) return; // để trình duyệt tự lo, không chép vào bộ nhớ của web
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(event.request, copy)); }
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true })),
  );
});
