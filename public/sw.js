const CACHE_NAME = 'noor-sw-v4';
const DB_NAME = 'noor-prayer-db';
const DB_STORE = 'prayer-data';

const PRAYERS_TO_NOTIFY = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_NAMES_AR = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

// ── IndexedDB helpers (persist prayer data across SW restarts) ────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(DB_STORE);
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function dbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });
  } catch { return null; }
}

async function dbSet(key, value) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const req = tx.objectStore(DB_STORE).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = e => reject(e.target.error);
    });
  } catch {}
}

// ── In-memory state ──────────────────────────────────────────────────────────

let prayerTimes = null;
let notifPref = 'off';
let adhanReciterId = 'azan1';
let scheduledIds = [];
let midnightId = null;

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      await clients.claim();
      // Try to restore prayer data from IndexedDB
      const saved = await dbGet('prayerData');
      if (saved) {
        prayerTimes    = saved.prayerTimes;
        notifPref      = saved.notifPref  ?? 'off';
        adhanReciterId = saved.adhanReciterId ?? 'azan1';
        scheduleAll();
      }
      // Ask open pages to send fresh data
      const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      list.forEach(c => { try { c.postMessage({ type: 'REQUEST_PRAYER_DATA' }); } catch {} });
      scheduleMidnightRefresh();
    })()
  );
});

// ── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', async e => {
  const { type, data } = e.data ?? {};

  if (type === 'UPDATE_PRAYER_DATA') {
    prayerTimes    = data.prayerTimes;
    notifPref      = data.notifPref  ?? 'off';
    adhanReciterId = data.adhanReciterId ?? 'azan1';
    // Persist to IndexedDB so SW can recover after restart
    await dbSet('prayerData', { prayerTimes, notifPref, adhanReciterId, savedAt: Date.now() });
    scheduleAll();
  }

  if (type === 'PING') {
    try { e.source?.postMessage({ type: 'PONG' }); } catch {}
  }
});

// ── Periodic background sync ─────────────────────────────────────────────────

self.addEventListener('periodicsync', async e => {
  if (e.tag === 'prayer-refresh') {
    e.waitUntil((async () => {
      const saved = await dbGet('prayerData');
      if (saved) {
        prayerTimes    = saved.prayerTimes;
        notifPref      = saved.notifPref  ?? 'off';
        adhanReciterId = saved.adhanReciterId ?? 'azan1';
        scheduleAll();
      }
    })());
  }
});

// ── Scheduling ───────────────────────────────────────────────────────────────

function clearScheduled() {
  scheduledIds.forEach(id => clearTimeout(id));
  scheduledIds = [];
}

function scheduleAll() {
  clearScheduled();
  if (!prayerTimes || notifPref === 'off') return;

  const now = Date.now();

  PRAYERS_TO_NOTIFY.forEach(prayer => {
    const timeStr = prayerTimes[prayer];
    if (!timeStr) return;

    const [hh, mm] = timeStr.substring(0, 5).split(':').map(Number);
    const target = new Date();
    target.setHours(hh, mm, 0, 0);

    const delay = target.getTime() - now;
    if (delay > 0 && delay < 86_400_000) {
      const id = setTimeout(() => {
        fireNotification(prayer);
        scheduledIds = scheduledIds.filter(x => x !== id);
      }, delay);
      scheduledIds.push(id);
    }
  });
}

function fireNotification(prayer) {
  const prayerAr = PRAYER_NAMES_AR[prayer] ?? prayer;
  self.registration.showNotification('🕌 حان وقت صلاة ' + prayerAr, {
    body: 'حيَّ على الصلاة • حيَّ على الفلاح',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'prayer-' + prayer,
    requireInteraction: true,
    silent: false,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [300, 100, 300, 100, 300, 200, 500],
    data: { prayer, url: '/' },
  });
}

// ── Midnight refresh ─────────────────────────────────────────────────────────

function scheduleMidnightRefresh() {
  if (midnightId) clearTimeout(midnightId);
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 1, 0, 0);
  const delay = midnight.getTime() - now.getTime();

  midnightId = setTimeout(async () => {
    // Clear old schedule (yesterday's times)
    clearScheduled();
    // Ask open pages to resend fresh today's data
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    list.forEach(c => { try { c.postMessage({ type: 'REQUEST_PRAYER_DATA' }); } catch {} });
    scheduleMidnightRefresh();
  }, delay);
}

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url ?? '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { c.focus(); return; }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
