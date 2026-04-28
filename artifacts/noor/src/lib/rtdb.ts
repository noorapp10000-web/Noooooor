/**
 * rtdb.ts — Firebase Realtime Database (RTDB only, no localStorage)
 *
 * المسار: users/{uid}/
 * الاستراتيجية:
 *   - تحميل: جلب كل بيانات المستخدم مرة واحدة عند بدء الجلسة
 *   - كتابة: قائمة انتظار + إرسال كل 10 ثواني
 *   - إرسال فوري: عند إخفاء الصفحة أو إغلاقها
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
   IN-MEMORY CACHE
══════════════════════════════════════════════════════════════ */

let _currentUid: string | null = null;
let _cache: Record<string, unknown> = {};
let _pendingUpdates: Record<string, unknown> = {};
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _visibilityHandlerAttached = false;
const FLUSH_INTERVAL_MS = 10_000;

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

function userRef(uid: string) {
  return ref(rtdb, `users/${uid}`);
}

/** اليوم بصيغة YYYY-MM-DD */
export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ══════════════════════════════════════════════════════════════
   CACHE ACCESSORS
══════════════════════════════════════════════════════════════ */

/** اقرأ قيمة من الكاش بمسار نقطي مثل "tasbih_totals" أو "daily_tracker/2025-01-01" */
export function getCacheValue<T>(dotPath: string, defaultVal: T): T {
  const parts = dotPath.split('/');
  let cur: unknown = _cache;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return defaultVal;
    cur = (cur as Record<string, unknown>)[p];
  }
  return (cur === undefined || cur === null) ? defaultVal : (cur as T);
}

/** ضع قيمة في الكاش (للتحديث الفوري في الـ UI) */
export function setCacheValue(dotPath: string, value: unknown): void {
  const parts = dotPath.split('/');
  let cur: Record<string, unknown> = _cache;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] === null) {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

/** الكاش الكامل */
export function getFullCache(): Record<string, unknown> {
  return _cache;
}

/* ══════════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════════ */

export function getProfileCache(): UserProfile | null {
  const p = _cache['profile'];
  if (!p || typeof p !== 'object') return null;
  return p as UserProfile;
}

/** احفظ الـ profile في RTDB والكاش */
export async function saveProfileToRTDB(uid: string, profile: UserProfile): Promise<void> {
  _cache['profile'] = profile;
  await set(ref(rtdb, `users/${uid}/profile`), profile);
}

/** حدّث حقول معينة في الـ profile */
export async function updateProfileInRTDB(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const existing = getProfileCache() ?? {} as UserProfile;
  const merged = { ...existing, ...updates };
  _cache['profile'] = merged;
  await update(ref(rtdb, `users/${uid}/profile`), updates);
}

/* ══════════════════════════════════════════════════════════════
   INIT — تهيئة جلسة المستخدم
══════════════════════════════════════════════════════════════ */

/** يُستدعى مرة واحدة بعد تسجيل الدخول — يجلب كل بيانات المستخدم في الكاش */
export async function initUserSync(uid: string): Promise<void> {
  _currentUid = uid;
  _pendingUpdates = {};
  if (_flushTimer !== null) { clearTimeout(_flushTimer); _flushTimer = null; }

  try {
    const snap = await get(userRef(uid));
    if (snap.exists()) {
      _cache = snap.val() as Record<string, unknown>;
    } else {
      _cache = {};
    }
  } catch (e) {
    console.warn('[RTDB] Init load error:', e);
    _cache = {};
  }

  attachVisibilityHandler();
}

/* ══════════════════════════════════════════════════════════════
   BATCH SYNC — مزامنة مؤجلة
══════════════════════════════════════════════════════════════ */

/** قائمة انتظار تحديث — يحدّث الكاش فوراً ويؤجل الإرسال */
export function queueRTDBUpdate(uid: string, updates: Record<string, unknown>): void {
  if (!uid) return;
  _currentUid = uid;
  // حدّث الكاش فوراً
  for (const [k, v] of Object.entries(updates)) {
    setCacheValue(k, v);
  }
  Object.assign(_pendingUpdates, updates);
  scheduleFlush();
}

function scheduleFlush(): void {
  if (_flushTimer !== null) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    flushRTDB();
  }, FLUSH_INTERVAL_MS);
}

export async function flushRTDB(): Promise<void> {
  if (!_currentUid || Object.keys(_pendingUpdates).length === 0) return;
  const uid = _currentUid;
  const updates = { ..._pendingUpdates };
  _pendingUpdates = {};
  try {
    await update(userRef(uid), updates);
  } catch (e) {
    Object.assign(_pendingUpdates, updates);
    console.warn('[RTDB] Flush error:', e);
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

/** مسح الحالة عند تسجيل الخروج */
export function clearSyncState(): void {
  _currentUid = null;
  _cache = {};
  _pendingUpdates = {};
  if (_flushTimer !== null) { clearTimeout(_flushTimer); _flushTimer = null; }
}

/* ══════════════════════════════════════════════════════════════
   HELPERS للصفحات
══════════════════════════════════════════════════════════════ */

/** قائمة انتظار تسبيح */
export function queueTasbihSync(
  uid: string,
  totals: Record<string, number>,
  counts: Record<string, number>,
  dailyCount: number,
): void {
  const today = todayKey();
  queueRTDBUpdate(uid, {
    tasbih_totals: totals,
    tasbih_counts: counts,
    [`tasbih_daily/${today}`]: dailyCount,
  });
}

/** قائمة انتظار المتتبع اليومي */
export function queueDailyTrackerSync(
  uid: string,
  dateKey: string,
  state: { prayers: Record<string, boolean>; quranWird: boolean },
): void {
  queueRTDBUpdate(uid, {
    [`daily_tracker/${dateKey}`]: state,
  });
}

/** قائمة انتظار أذكار اليوم */
export function queueAzkarSync(
  uid: string,
  catId: string | number,
  progress: Record<number, number>,
): void {
  const today = todayKey();
  queueRTDBUpdate(uid, {
    [`azkar/${today}/${catId}`]: progress,
  });
}

/** الـ UID الحالي */
export function getCurrentUid(): string | null {
  return _currentUid;
}

/** كم تسبيحة اتبعتت بالفعل لعداد المحافظة في Firestore */
export function getGovSyncedCount(): number {
  return getCacheValue<number>('gov_synced_count', 0);
}

/** احفظ الرقم المبعوت للمحافظة عشان نحسب الفرق المرة الجاية */
export function queueGovSyncedCountUpdate(uid: string, count: number): void {
  queueRTDBUpdate(uid, { gov_synced_count: count });
}

/* ══════════════════════════════════════════════════════════════
   SETTINGS — تفضيلات المستخدم
══════════════════════════════════════════════════════════════ */

/** اقرأ إعداد من الكاش */
export function getSettingCache<T>(key: string, defaultVal: T): T {
  return getCacheValue<T>(`settings/${key}`, defaultVal);
}

/** قائمة انتظار تحديث إعداد */
export function queueSettingSync(uid: string, key: string, value: unknown): void {
  queueRTDBUpdate(uid, { [`settings/${key}`]: value });
}
