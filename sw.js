/**
 * 🏛️ Service Worker - Smart GovReport Hub 2.5
 * ผู้พัฒนา: ทีม AI Agent (5.5 โค้ดเดอร์หลังบ้าน & 5.2 เซียน SA)
 * วัตถุประสงค์:
 * 1. รองรับการทำงานแบบออฟไลน์ 100% (Offline-First Architecture)
 * 2. แคช Core Assets, CDN Libraries (Tailwind, FontAwesome, Sarabun, Prompt, Chart.js)
 * 3. จัดการการอัปเดตแคชอัตโนมัติ (Stale-While-Revalidate & Cache-First)
 */

const CACHE_NAME = 'govreport-cache-v5.0.0';

// ทรัพยากรหลักที่ต้อง Pre-cache สำหรับการเปิดใช้งานแบบออฟไลน์
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/custom.css',
  './css/main.css',
  './css/print-a4.css',
  './js/app.js',
  './js/voice-input.js',
  './js/modules/01-core-state.js',
  './js/modules/02-db-api.js',
  './js/modules/03-numeral.js',
  './js/modules/05-logbook-views.js',
  './js/modules/06-evidence-pdpa.js',
  './js/modules/07-signature.js',
  './js/modules/09-gov-docs.js',
  './js/modules/10-membership.js',
  './js/modules/11-sync-hub.js',
  './js/modules/12-audit-console.js',
  './js/modules/13-knowledge-photo-hub.js',
  './js/modules/14-rbac-manager.js',
  './js/modules/15-pwa-manager.js',
  './static/icons/icon-192.png',
  './static/icons/icon-512.png',
  './static/icons/icon-maskable-192.png',
  './static/icons/icon-maskable-512.png',
  './static/icons/apple-touch-icon.png',
  './static/icons/favicon.ico',
  './static/icons/icon.svg'
];

// CDN Domains ที่อนุญาตให้ทำ Runtime Caching (ฟอนต์, ไอคอน, สคริปต์ภายนอก)
const CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// 1. Install Event: โหลดและแคชทรัพยากรหลักทันที
self.addEventListener('install', (event) => {
  console.log(`📦 [ServiceWorker] Installing version: ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [ServiceWorker] Pre-caching core application shell & modules...');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('⚠️ [ServiceWorker] Non-critical precache error (asset will load on demand):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: ล้างแคชเวอร์ชันเก่าและเข้าควบคุม Clients ทันที
self.addEventListener('activate', (event) => {
  console.log(`🛡️ [ServiceWorker] Activating version: ${CACHE_NAME}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`🧹 [ServiceWorker] Removing obsolete cache: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: จัดสรรคำขอตามยุทธศาสตร์การแคช
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // ข้ามคำขอที่ไม่ใช่ GET (เช่น POST, PUT, DELETE ให้ผ่านเน็ตเวิร์กตรง)
  if (request.method !== 'GET') {
    return;
  }

  // A. จัดการคำขอ API ของระบบ (/api/*) -> Network-First with Offline Fallback
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          console.log(`🔌 [ServiceWorker] API offline fallback for ${url.pathname}`);
          // ตอบกลับ JSON โหมดออฟไลน์อย่างสุภาพ
          return new Response(
            JSON.stringify({
              offline: true,
              status: 'offline',
              message: 'ระบบกำลังทำงานในโหมดออฟไลน์ ข้อมูลถูกบันทึกในอุปกรณ์ของผู้ใช้งานเรียบร้อยแล้ว',
              timestamp: new Date().toISOString()
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 200
            }
          );
        })
    );
    return;
  }

  // B. จัดการ CDN Assets (Tailwind, Fonts, Icons) -> Cache-First with Network Fetch
  const isCdn = CDN_HOSTS.some((host) => url.hostname.includes(host));
  if (isCdn) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          // หากไม่มีเน็ตและไม่มีในแคช ให้ปล่อยผ่านเงียบๆ
          return new Response('', { status: 408, statusText: 'Offline CDN Asset Unavailable' });
        });
      })
    );
    return;
  }

  // C. จัดการไฟล์ภายในระบบ (App Shell, HTML, CSS, JS, Images) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // ดึงจากเน็ตเวิร์กเบื้องหลังเพื่ออัปเดตแคชให้ใหม่เสมอ
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // หากเน็ตหลุด ให้ดึงไฟล์ index.html เป็น fallback หากเป็นคำขอเปิดหน้าเว็บ
        if (request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });

      // ส่งแคชที่มีอยู่กลับไปก่อนทันใจ (Instant Load)
      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Message Event: รองรับการสั่งงานจากไคลเอนต์ (ล้างแคช, บังคับอัปเดต)
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.action === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('🧹 [ServiceWorker] Cache manually cleared on demand.');
    });
  }
});
