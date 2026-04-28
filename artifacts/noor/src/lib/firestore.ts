import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  getDocs,
  increment,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
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

/* ─── Global Counter ─────────────────────────────────────── */
const COUNTER_DOC = doc(db, 'globalCounter', 'main');

export async function initCounter(): Promise<number> {
  const snap = await getDoc(COUNTER_DOC);
  if (!snap.exists()) {
    await setDoc(COUNTER_DOC, { totalCount: 0, updatedAt: serverTimestamp() });
    return 0;
  }
  return (snap.data().totalCount as number) || 0;
}

export async function incrementGlobalCounter(amount = 1): Promise<void> {
  // setDoc مع merge:true + increment() آمن تماماً:
  // - لو الـ doc مش موجود: يعمله بـ totalCount = amount
  // - لو موجود: يزيد totalCount بـ amount بشكل atomic
  await setDoc(
    COUNTER_DOC,
    { totalCount: increment(amount), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export function subscribeToGlobalCounter(
  callback: (data: { count: number }) => void,
): Unsubscribe {
  return onSnapshot(COUNTER_DOC, (snap) => {
    if (snap.exists()) {
      callback({ count: (snap.data().totalCount as number) || 0 });
    } else {
      callback({ count: 0 });
    }
  });
}

/* ─── Active Dhikr Sessions ─────────────────────────────── */
// عدد الذاكرين الآن = من ضغطوا زرار التسبيح في آخر 3 دقائق
const SESSIONS_COL = collection(db, 'activeSessions');
const SESSION_TTL_MS = 3 * 60 * 1000; // 3 دقائق

function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem('noor_sid');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('noor_sid', sid);
  }
  return sid;
}

export async function recordTasbeehPress(): Promise<void> {
  // يُستدعى من صفحة التسبيح عند كل ضغطة
  // يسجّل/يجدد جلسة المستخدم في Firebase لحساب عدد الذاكرين الآن
  try {
    const sid = getOrCreateSessionId();
    await setDoc(
      doc(db, 'activeSessions', sid),
      { lastSeen: serverTimestamp() },
      { merge: true },
    );
  } catch { /* ignore */ }
}

export async function registerSession(sid: string): Promise<void> {
  await setDoc(doc(db, 'activeSessions', sid), {
    lastSeen: serverTimestamp(),
  });
}

export async function refreshSession(sid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'activeSessions', sid), {
      lastSeen: serverTimestamp(),
    });
  } catch {
    await registerSession(sid);
  }
}

export async function unregisterSession(sid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'activeSessions', sid));
  } catch { /* ignore */ }
}

export function subscribeToActiveSessions(
  callback: (count: number) => void,
): Unsubscribe {
  return onSnapshot(SESSIONS_COL, (snap) => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    let count = 0;
    snap.forEach((d) => {
      const ts = d.data().lastSeen as Timestamp | null;
      if (ts && ts.toMillis() > cutoff) count++;
    });
    callback(count);
  });
}

/* ─── Sohba / Leaderboard ───────────────────────────────── */
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

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // نجيب كل الـ docs بدون composite index
  // ونفلتر ونرتب على جانب الـ client
  const snap = await getDocs(collection(db, 'sohbaLeaderboard'));
  const all = snap.docs.map((d) => d.data() as LeaderboardEntry);
  return all
    .filter((e) => e.isPublic === true)
    .sort((a, b) => (b.tasbeehCount ?? 0) - (a.tasbeehCount ?? 0))
    .slice(0, 50);
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
