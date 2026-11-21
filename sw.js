/* Service worker Keuangan Keluarga.
 * - Berkas aplikasi disimpan di perangkat supaya bisa dibuka tanpa internet.
 * - Setiap kali online, versi terbaru diunduh diam-diam dan dipakai saat aplikasi dibuka berikutnya.
 * - Permintaan ke Google (Apps Script) tidak pernah disimpan atau dicegat.
 */
var VERSI = 'kk-v4';
var CACHE_FONT = 'kk-font-v1';
var SHELL = [
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSI).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== VERSI && k !== CACHE_FONT; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Tampilkan salinan tersimpan dulu, sambil mengambil yang terbaru untuk lain kali.
function segarkan(e, cacheNama, req, kunci) {
  return caches.open(cacheNama).then(function (c) {
    return c.match(kunci || req).then(function (hit) {
      var jaringan = fetch(req, kunci ? { cache: 'no-cache' } : undefined).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) c.put(kunci || req, res.clone());
        return res;
      }).catch(function () { return null; });
      e.waitUntil(jaringan);
      return hit || jaringan.then(function (res) { return res || Response.error(); });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  if (u.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      e.respondWith(segarkan(e, VERSI, new Request('./index.html'), './index.html'));
    } else {
      e.respondWith(segarkan(e, VERSI, req));
    }
    return;
  }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(segarkan(e, CACHE_FONT, req));
  }
  // lainnya (termasuk script.google.com) langsung ke jaringan
});
