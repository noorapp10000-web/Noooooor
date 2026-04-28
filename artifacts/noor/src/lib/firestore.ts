import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/* ─── Types ─────────────────────────────────────────────── */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  governorate?: string | null;
  isPublic: boolean;
  tasbeehCount: number;
  quranCompletions: number;
  currentSurah: number;
  azkarStreak: number;
  tadabburStreak: number;
  noorScore: number;
  earnedBadges: string[];
}

export interface SohbaUserData {
  userId: string;
  displayName: string;
  governorate?: string | null;
  isPublic: boolean;
  tasbeehCount: number;
  quranCompletions: number;
  currentSurah: number;
  azkarStreak: number;
  tadabburStreak: number;
  earnedBadges: string[];
}

export interface GovernorateRanking {
  id: string;
  name: string;
  totalCount: number;
}

/* ─── Sohba / User Leaderboard ──────────────────────────── */
export async function syncUserLeaderboard(data: SohbaUserData): Promise<number> {
  const noorScore =
    Math.floor(data.tasbeehCount * 0.5) +
    data.quranCompletions * 1000 +
    data.azkarStreak * 50 +
    data.tadabburStreak * 20;

  await setDoc(
    doc(db, 'sohbaLeaderboard', data.userId),
    { ...data, noorScore, updatedAt: serverTimestamp() },
    { merge: true },
  );
  return noorScore;
}

/* ─── In-memory cache (5 دقائق TTL) ─────────────────────── */
const CACHE_TTL_MS = 5 * 60 * 1000;
let _usersCache:  { data: LeaderboardEntry[];  at: number } | null = null;
let _govCache:    { data: GovernorateRanking[]; at: number } | null = null;

/** امسح الكاش عشان الـ refresh الإجباري يجيب بيانات جديدة */
export function invalidateLeaderboardCache(): void {
  _usersCache = null;
  _govCache   = null;
}

export async function fetchLeaderboard(forceRefresh = false): Promise<LeaderboardEntry[]> {
  if (!forceRefresh && _usersCache && Date.now() - _usersCache.at < CACHE_TTL_MS) {
    return _usersCache.data;
  }
  const q = query(
    collection(db, 'sohbaLeaderboard'),
    orderBy('tasbeehCount', 'desc'),
    limit(100),
  );
  const snap = await getDocs(q);
  const data = snap.docs
    .map((d) => d.data() as LeaderboardEntry)
    .filter((e) => e.isPublic === true)
    .slice(0, 50);
  _usersCache = { data, at: Date.now() };
  return data;
}

export async function fetchUserEntry(userId: string): Promise<LeaderboardEntry | null> {
  const snap = await getDoc(doc(db, 'sohbaLeaderboard', userId));
  return snap.exists() ? (snap.data() as LeaderboardEntry) : null;
}

export async function hideLeaderboardEntry(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'sohbaLeaderboard', userId), { isPublic: false });
  } catch { /* entry might not exist yet — safe to ignore */ }
}

export async function deleteLeaderboardEntry(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'sohbaLeaderboard', userId));
  } catch { /* ignore */ }
}

/* ─── Governorate Leaderboard ───────────────────────────── */
export async function incrementGovernorateCounter(
  governorateId: string,
  governorateName: string,
  amount: number,
): Promise<void> {
  if (!governorateId || amount <= 0) return;
  await setDoc(
    doc(db, 'governorateLeaderboard', governorateId),
    {
      id: governorateId,
      name: governorateName,
      totalCount: increment(amount),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function fetchGovernorateLeaderboard(forceRefresh = false): Promise<GovernorateRanking[]> {
  if (!forceRefresh && _govCache && Date.now() - _govCache.at < CACHE_TTL_MS) {
    return _govCache.data;
  }
  const snap = await getDocs(collection(db, 'governorateLeaderboard'));
  const data = snap.docs
    .map((d) => d.data() as GovernorateRanking)
    .filter((g) => (g.totalCount ?? 0) > 0)
    .sort((a, b) => (b.totalCount ?? 0) - (a.totalCount ?? 0));
  _govCache = { data, at: Date.now() };
  return data;
}

/* ─── Rebuild governorate leaderboard from scratch ──────── */

/**
 * يقرأ كل إدخالات sohbaLeaderboard ويعيد بناء governorateLeaderboard من الصفر.
 * يحفظ قائمة المستخدمين المُدرَجين عشان نمنع الازدواجية في الحسابات اللاحقة.
 */
export async function rebuildGovernorateLeaderboard(
  governorates: Array<{ id: string; name: string }>,
): Promise<{ governoratesUpdated: number; totalTasbeeh: number }> {
  // 1. اقرأ كل بيانات الترتيب
  const snap = await getDocs(collection(db, 'sohbaLeaderboard'));
  const entries = snap.docs.map((d) => ({
    userId: d.id,
    ...(d.data() as { governorate?: string | null; tasbeehCount?: number }),
  }));

  // 2. اجمع التسبيح لكل محافظة حسب الاسم
  const totalsByName: Record<string, number> = {};
  const includedUserIds: string[] = [];
  for (const entry of entries) {
    const count = entry.tasbeehCount ?? 0;
    if (entry.governorate && count > 0) {
      totalsByName[entry.governorate] = (totalsByName[entry.governorate] ?? 0) + count;
      includedUserIds.push(entry.userId);
    }
  }

  // 3. اكتب كل محافظة فيها تسبيح في Firestore
  let governoratesUpdated = 0;
  let totalTasbeeh = 0;
  for (const gov of governorates) {
    const govTotal = totalsByName[gov.name] ?? 0;
    if (govTotal > 0) {
      await setDoc(
        doc(db, 'governorateLeaderboard', gov.id),
        { id: gov.id, name: gov.name, totalCount: govTotal, updatedAt: serverTimestamp() },
      );
      governoratesUpdated++;
      totalTasbeeh += govTotal;
    }
  }

  // 4. احفظ metadata الإعادة عشان نمنع الازدواجية للمستخدمين اللي اتحسبوا
  await setDoc(doc(db, 'meta', 'lastRebuild'), {
    timestamp: serverTimestamp(),
    includedUserIds,
  });

  return { governoratesUpdated, totalTasbeeh };
}

/**
 * رجّع قائمة userIds اللي اتحسبوا في آخر إعادة بناء.
 * بنستخدمها عشان نمنع إضافة نفس التسبيح مرتين.
 */
export async function getRebuildIncludedUsers(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, 'meta', 'lastRebuild'));
    if (!snap.exists()) return [];
    return (snap.data().includedUserIds ?? []) as string[];
  } catch { return []; }
}

/* ─── Session-batched governorate counter (localStorage) ── */
// كل ضغطة تسبيح بتزود الرقم ده محلياً، ولما الجلسة تنتهي
// (كل 5 دقائق أو إغلاق الصفحة) بنبعت رقم واحد لـ Firestore
const PENDING_GOV_KEY = 'noor_pending_gov_count';

export function getPendingGovernorateCount(): number {
  try {
    return parseInt(localStorage.getItem(PENDING_GOV_KEY) || '0', 10) || 0;
  } catch { return 0; }
}

export function addPendingGovernorateCount(n: number): void {
  try {
    const current = getPendingGovernorateCount();
    localStorage.setItem(PENDING_GOV_KEY, String(current + n));
  } catch { /* ignore */ }
}

export function clearPendingGovernorateCount(): void {
  try { localStorage.removeItem(PENDING_GOV_KEY); } catch { /* ignore */ }
}
