/**
 * 青岚OS · Service Worker
 * PWA 离线缓存 + 微软商店上架必需
 * 版本 v1
 */

const CACHE_NAME = 'qinglan-os-v1';
const BASE = '/Qinglan/';

// 预缓存的核心资源（首次安装即下载；不含大视频，视频按需缓存）
const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'css/style.css',
  BASE + 'js/crypto.js',
  BASE + 'js/data.js',
  BASE + 'js/fs.js',
  BASE + 'js/terminal.js',
  BASE + 'js/apps.js',
  BASE + 'js/engine.js',
  BASE + 'assets/favicon.png',
  BASE + 'assets/icon-192.png',
  BASE + 'assets/icon-256.png',
  BASE + 'assets/icon-512.png',
  BASE + 'assets/icon.svg'
];

/* ---- install：逐个缓存（避免 addAll 一个失败全失败）---- */
self.addEventListener('install', event => {
  console.log('[SW] install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] precache skip:', url, err.message)
          )
        )
      )
    )
  );
  self.skipWaiting();
});

/* ---- activate：清理旧版本缓存 ---- */
self.addEventListener('activate', event => {
  console.log('[SW] activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- fetch：缓存优先，网络兜底 ---- */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 只处理同源请求
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // 网络请求
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;

        // 视频文件：初次在线播放后加入缓存，方便下次离线
        if (url.pathname.includes('/assets/videos/') && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, clone).catch(() => {})
          );
        }

        return response;
      }).catch(() => {
        // 完全离线：导航请求兜底回 index.html
        if (event.request.mode === 'navigate') {
          return caches.match(BASE + 'index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});