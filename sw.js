// Chip service worker: network-first app shell with offline fallback, plus Firebase Cloud Messaging for streak reminders.
const CACHE='chip-v2',SHELL=['/','/index.html','/chapters.js','/fund.js','/icons.js','/mascot.js','/game.js','/social.js','/practice.js','/firebase-config.js','/prices.json','/manifest.json','/icons/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('/index.html'))))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(w=>w[0]?w[0].focus():self.clients.openWindow('/')))});
// Background push: the FCM SDK shows `notification` payloads itself. Wrapped so a blocked CDN never breaks offline caching.
try{importScripts('/firebase-config.js','https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');
 if(self.FIREBASE_VAPID_KEY){firebase.initializeApp(self.FIREBASE_CONFIG);firebase.messaging()}}catch(e){}
