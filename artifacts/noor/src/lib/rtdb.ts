/**
 * rtdb.ts — Firebase Realtime Database + Offline-First Persistence
 *
 * طبقات الحماية:
 *   1. RTDB (online)       — المصدر الرسمي
 *   2. localStorage cache  — آخر snapshot محفوظ (يُحمَّل عند فتح التطبيق أوفلاين)
 *   3. localStorage pending — تغييرات لم تُرسَل بعد (تنجو من إغلاق التطبيق وتُرسَل عند عودة النت)
 *
 * السيناريو الكامل:
 *   • المستخدم أوفلاين → يغيّر الثيم → يُحفظ في cache + pending
 *   • يغلق التطبيق → pending في localStorage (لا يضيع)
 *   • يفتح التطبيق مع نت → يجلب من RTDB + يطبّق pending المحفوظ → يرسل pending → يحدّث RTDB
 *   • يفتح حسابه من تليفون ثاني → يجد آخر تغييراته في RTDB ✅
 */

import { ref, get, update, set } from 'firebase/database';
import { rtdb } from './firebase';

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */

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
   IN-MEMORY STATE
══════════════════════════════════════════════════════════════ */

let _currentUid: string | null = null;
let _cache: Record<string, unknown> = {};
let _pendingUpdates: Record<string, unknown> = {};
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _visibilityHandlerAttached = false;
const FLUSH_INTERVAL_MS = 10_000;

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
    console.info('[RTDB] أوفلاين — تم تحميل البيانات من localStorage');
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
    console.info('[RTDB] استُعيدت', Object.keys(saved).length, 'تحديثات معلّقة من localStorage');
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

function userRef(uid: string) { return ref(rtdb, `users/${uid}`); }

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

export async function saveProfileToRTDB(uid: string, profile: UserProfile): Promise<void> {
  _cache['profile'] = profile;
  saveCache(uid);
  await set(ref(rtdb, `users/${uid}/profile`), profile);
}

export async function updateProfileInRTDB(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const existing = getProfileCache() ?? {} as UserProfile;
  const merged = { ...existing, ...updates };
  _cache['profile'] = merged;
  saveCache(uid);
  await update(ref(rtdb, `users/${uid}/profile`), updates);
}

/* ══════════════════════════════════════════════════════════════
   INIT — المدخل الرئيسي بعد تسجيل الدخول
══════════════════════════════════════════════════════════════ */

/**
 * يُستدعى مرة واحدة بعد تسجيل الدخول.
 *
 * المنطق:
 * 1. يُحمَّل الـ pending المحفوظ من الجلسة السابقة (لو موجود)
 * 2. يجلب بيانات RTDB
 * 3. يطبّق الـ pending على البيانات الجديدة (pending يتغلب على RTDB لأنه أحدث)
 * 4. يحفظ النتيجة في localStorage
 * 5. لو الـ pending مش فارغ → يُجدوَل flush فوري
 * 6. لو RTDB فشل (أوفلاين) → يُحمَّل من localStorage + pending يفضل معلّقاً
 */
export async function initUserSync(uid: string): Promise<void> {
  _currentUid = uid;
  _pendingUpdates = {};
  if (_flushTimer !== null) { clearTimeout(_flushTimer); _flushTimer = null; }

  // ① استعد الـ pending من الجلسة السابقة
  loadPending(uid);
  const hasSavedPending = Object.keys(_pendingUpdates).length > 0;

  try {
    // ② جلب من RTDB
    const snap = await get(userRef(uid));
    _cache = snap.exists() ? (snap.val() as Record<string, unknown>) : {};

    // ③ طبّق الـ pending على RTDB data (pending = أحدث = يتغلب)
    if (hasSavedPending) {
      for (const [k, v] of Object.entries(_pendingUpdates)) {
        setCacheValue(k, v);
      }
    }

    // ④ احفظ النسخة المدمجة في localStorage
    saveCache(uid);

    // ⑤ لو في pending → ابعته لـ RTDB فوراً
    if (hasSavedPending) {
      scheduleFlush(500); // flush سريع بعد نصف ثانية
    }
  } catch (e) {
    // ⑥ أوفلاين — حمّل من localStorage (pending يفضل معلقاً حتى يرجع النت)
    const loaded = loadCache(uid);
    if (!loaded) _cache = {};
    // لو في pending → طبّقه على الكاش
    if (hasSavedPending) {
      for (const [k, v] of Object.entries(_pendingUpdates)) {
        setCacheValue(k, v);
      }
    }
    console.warn('[RTDB] تعذّر الاتصال — وضع أوفلاين، الـ pending محفوظ وسيُرسَل لاحقاً');
  }

  attachVisibilityHandler();
}

/* ══════════════════════════════════════════════════════════════
   BATCH SYNC
══════════════════════════════════════════════════════════════ */

export function queueRTDBUpdate(uid: string, updates: Record<string, unknown>): void {
  if (!uid) return;
  _currentUid = uid;
  for (const [k, v] of Object.entries(updates)) {
    setCacheValue(k, v);
  }
  Object.assign(_pendingUpdates, updates);
  // حفظ فوري في localStorage — يضمن عدم الضياع حتى لو أُغلق التطبيق
  saveCache(uid);
  savePending(uid);
  scheduleFlush();
}

function scheduleFlush(delay = FLUSH_INTERVAL_MS): void {
  if (_flushTimer !== null) return;
  _flushTimer = setTimeout(() => { _flushTimer = null; flushRTDB(); }, delay);
}

export async function flushRTDB(): Promise<void> {
  if (!_currentUid || Object.keys(_pendingUpdates).length === 0) return;
  const uid = _currentUid;
  const updates = { ..._pendingUpdates };
  _pendingUpdates = {};
  try {
    await update(userRef(uid), updates);
    // ✅ نجح الإرسال — امسح الـ pending من localStorage
    savePending(uid); // (فارغ الآن)
    saveCache(uid);   // حدّث cache ليعكس آخر حالة
  } catch (e) {
    // ❌ فشل — أعد الـ pending وخزّنه
    Object.assign(_pendingUpdates, updates);
    savePending(uid);
    console.warn('[RTDB] فشل الإرسال — سيُعاد المحاولة لاحقاً:', e);
  }
}

function attachVisibilityHandler(): void {
  if (_visibilityHandlerAttached) return;
  _visibilityHandlerAttached = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (_flushTimer !== null) { clearTimeout(_flushTimer); _flushTimer = null; }
      flushRTDB();
    }
  });
  window.addEventListener('beforeunload', () => flushRTDB());
}

export function clearSyncState(): void {
  if (_currentUid) clearLS(_currentUid);
  _currentUid = null;
  _cache = {};
  _pendingUpdates = {};
  if (_flushTimer !== null) { clearTimeout(_flushTimer); _flushTimer = null; }
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
