/* 读书记录页 SW —— 只缓存应用外壳，资源交给浏览器 HTTP 缓存。构建：ae403ccb1a17 */
const BUILD = 'ae403ccb1a17';
const SHELL = 'shell-' + BUILD;
const FILES = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k.startsWith('shell-') && k !== SHELL).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 只接管页面导航；图片/数据等一律交给浏览器原生缓存
  if (req.mode !== 'navigate' && !(req.destination === 'document')) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        const c = await caches.open(SHELL);
        c.put('./index.html', res.clone());
      }
      return res;
    } catch (err) {
      const hit = await caches.match('./index.html') || await caches.match('./');
      if (hit) return hit;
      throw err;
    }
  })());
});
