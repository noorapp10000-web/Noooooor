/**
 * store.ts — Pure localStorage persistence (no Firebase)
 *
 * نفس الـ API القديمة — كل الملفات التانية مش محتاجة تتغير.
 * البيانات محفوظة في localStorage فقط على الجهاز.
 */

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  governorateId: string;
  governorateName: string;
  lat: number;
  lng: number;
  joinedAt: number;
  nameLastChanged?: number;
}

/* ══════════════════════════════════════════════════════════════
   LOCAL UID
══════════════════════════════════════════════════════════════ */

export function getOrCreateLocalUid(): string {
  let uid = localStorage.getItem('noor_uid');
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem('noor_uid', uid);
  }
  return uid;
}

/* ══════════════════════════════════════════════════════════════
   IN-MEMORY STATE
══════════════════════════════════════════════════════════════ */

let _currentUid: string | null = null;
let _cache: Record<string, unknown> = {};
let _pendingUpdates: Record<string, unknown> = {};
let _visibilityHandlerAttached = false;

/* ══════════════════════════════════════════════════════════════
   localStorage KEYS
══════════════════════════════════════════════════════════════ */

const cacheKey   = (uid: string) => `noor_rtdb_cache_${uid}`;
const pendingKey = (uid: string) => `noor_rtdb_pending_${uid}`;

/* ══════════════════════════════════════════════════════════════
   localStorage HELPERS
══════════════════════════════════════════════════════════════ */

function saveCache(uid: string): void {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify(_cache)); } catch {}
}

function loadCache(uid: string): boolean {
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    if (!raw) return false;
    _cache = JSON.parse(raw) as Record<string, unknown>;
    return true;
  } catch { return false; }
}

function savePending(uid: string): void {
  try {
    if (Object.keys(_pendingUpdates).length > 0) {
      localStorage.setItem(pendingKey(uid), JSON.stringify(_pendingUpdates));
    } else {
      localStorage.removeItem(pendingKey(uid));
    }
  } catch {}
}

function loadPending(uid: string): void {
  try {
    const raw = localStorage.getItem(pendingKey(uid));
    if (!raw) return;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    Object.assign(_pendingUpdates, saved);
  } catch {}
}

function clearLS(uid: string): void {
  try {
    localStorage.removeItem(cacheKey(uid));
    localStorage.removeItem(pendingKey(uid));
  } catch {}
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ══════════════════════════════════════════════════════════════
   CACHE ACCESSORS
══════════════════════════════════════════════════════════════ */

export function getCacheValue<T>(dotPath: string, defaultVal: T): T {
  const parts = dotPath.split('/');
  let cur: unknown = _cache;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return defaultVal;
    cur = (cur as Record<string, unknown>)[p];
  }
  return (cur === undefined || cur === null) ? defaultVal : (cur as T);
}

export function setCacheValue(dotPath: string, value: unknown): void {
  const parts = dotPath.split('/');
  let cur: Record<string, unknown> = _cache;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {};
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

export function getFullCache(): Record<string, unknown> { return _cache; }

/* ══════════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════════ */

export function getProfileCache(): UserProfile | null {
  const p = _cache['profile'];
  if (!p || typeof p !== 'object') return null;
  return p as UserProfile;
}

export function saveProfileToRTDB(_uid: string, profile: UserProfile): void {
  const uid = _uid || getOrCreateLocalUid();
  _cache['profile'] = profile;
  saveCache(uid);
}

export function updateProfileInRTDB(uid: string, updates: Partial<UserProfile>): void {
  const existing = getProfileCache() ?? {} as UserProfile;
  const merged = { ...existing, ...updates };
  _cache['profile'] = merged;
  saveCache(uid);
}

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */

export function initUserSync(uid: string): void {
  _currentUid = uid;
  _pendingUpdates = {};

  loadPending(uid);
  const hasSavedPending = Object.keys(_pendingUpdates).length > 0;

  const loaded = loadCache(uid);
  if (!loaded) _cache = {};

  if (hasSavedPending) {
    for (const [k, v] of Object.entries(_pendingUpdates)) {
      setCacheValue(k, v);
    }
    saveCache(uid);
    _pendingUpdates = {};
    savePending(uid);
  }

  attachVisibilityHandler();
}

export function initUserSyncFast(uid: string): void {
  initUserSync(uid);
}

/* ══════════════════════════════════════════════════════════════
   BATCH SYNC — localStorage only
══════════════════════════════════════════════════════════════ */

export function queueRTDBUpdate(uid: string, updates: Record<string, unknown>): void {
  if (!uid) return;
  _currentUid = uid;
  for (const [k, v] of Object.entries(updates)) {
    setCacheValue(k, v);
  }
  Object.assign(_pendingUpdates, updates);
  saveCache(uid);
  savePending(uid);
}

export async function flushRTDB(): Promise<void> {
  if (!_currentUid) return;
  saveCache(_currentUid);
  _pendingUpdates = {};
  savePending(_currentUid);
}

function attachVisibilityHandler(): void {
  if (_visibilityHandlerAttached) return;
  _visibilityHandlerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && _currentUid) {
      saveCache(_currentUid);
    }
  });
}

export function clearSyncState(): void {
  if (_currentUid) clearLS(_currentUid);
  _currentUid = null;
  _cache = {};
  _pendingUpdates = {};
}

/* ══════════════════════════════════════════════════════════════
   PAGE HELPERS
══════════════════════════════════════════════════════════════ */

export function queueTasbihSync(uid: string, totals: Record<string, number>, counts: Record<string, number>, dailyCount: number): void {
  const today = todayKey();
  queueRTDBUpdate(uid, { tasbih_totals: totals, tasbih_counts: counts, [`tasbih_daily/${today}`]: dailyCount });
}

export function queueDailyTrackerSync(uid: string, dateKey: string, state: { prayers: Record<string, boolean>; quranWird: boolean }): void {
  queueRTDBUpdate(uid, { [`daily_tracker/${dateKey}`]: state });
}

export function queueAzkarSync(uid: string, catId: string | number, progress: Record<number, number>): void {
  const today = todayKey();
  queueRTDBUpdate(uid, { [`azkar/${today}/${catId}`]: progress });
}

export function getCurrentUid(): string | null { return _currentUid; }

export function getGovSyncedCount(): number { return getCacheValue<number>('gov_synced_count', 0); }

export function queueGovSyncedCountUpdate(uid: string, count: number): void {
  queueRTDBUpdate(uid, { gov_synced_count: count });
}

export function getSettingCache<T>(key: string, defaultVal: T): T {
  return getCacheValue<T>(`settings/${key}`, defaultVal);
}

export function queueSettingSync(uid: string, key: string, value: unknown): void {
  queueRTDBUpdate(uid, { [`settings/${key}`]: value });
}

/* ══════════════════════════════════════════════════════════════
   BACKUP / RESTORE
══════════════════════════════════════════════════════════════ */

export function exportAllData(): string {
  const uid = _currentUid || localStorage.getItem('noor_uid') || '';
  const data: Record<string, unknown> = {
    _version: 2,
    _exportedAt: new Date().toISOString(),
    _uid: uid,
    _cache: _cache,
  };
  // Include extra localStorage keys (prayer times cache, quran surahs, etc.)
  const extras: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('noor_pt_') || k.startsWith('noor_quran') || k === 'noor_uid')) {
      try { extras[k] = localStorage.getItem(k) ?? ''; } catch {}
    }
  }
  data._extras = extras;
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonStr: string): { success: boolean; error?: string } {
  try {
    const data = JSON.parse(jsonStr) as Record<string, unknown>;
    if (!data._cache || typeof data._cache !== 'object') {
      return { success: false, error: 'ملف النسخة الاحتياطية غير صحيح' };
    }

    const uid = _currentUid || localStorage.getItem('noor_uid') || getOrCreateLocalUid();
    _cache = data._cache as Record<string, unknown>;
    saveCache(uid);

    if (data._extras && typeof data._extras === 'object') {
      for (const [k, v] of Object.entries(data._extras as Record<string, string>)) {
        try { if (k !== 'noor_uid') localStorage.setItem(k, v); } catch {}
      }
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: 'تعذّر قراءة الملف — تأكد أنه ملف نور صحيح' };
  }
}
