/* Personal activity tracking — stored locally through the rtdb cache. */
import { getCacheValue, queueRTDBUpdate, todayKey, getCurrentUid, getOrCreateLocalUid, getFullCache } from './rtdb';

function uid(): string {
  return getCurrentUid() || localStorage.getItem('noor_uid') || getOrCreateLocalUid();
}

export function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── Ayahs read (de-duplicated per day) ── */
const seenToday = new Set<string>();
let seenDay = '';

export function markAyahRead(surah: number, ayah: number): void {
  const day = todayKey();
  if (day !== seenDay) { seenDay = day; seenToday.clear(); }
  const key = `${surah}:${ayah}`;
  if (seenToday.has(key)) return;
  seenToday.add(key);
  const path = `ayahs_read/${day}`;
  const total = getCacheValue<number>('ayahs_read_total', 0);
  queueRTDBUpdate(uid(), { [path]: getCacheValue<number>(path, 0) + 1, ayahs_read_total: total + 1 });
}

/* ── Listening time (seconds) ── */
let pendingSeconds = 0;
export function addListenSeconds(sec: number): void {
  if (!(sec > 0) || sec > 5) return; // guard against seeks / clock jumps
  pendingSeconds += sec;
  if (pendingSeconds < 15) return;
  flushListenSeconds();
}
export function flushListenSeconds(): void {
  if (pendingSeconds <= 0) return;
  const path = `listen_seconds/${todayKey()}`;
  const total = getCacheValue<number>('listen_seconds_total', 0);
  const add = Math.round(pendingSeconds);
  pendingSeconds = 0;
  queueRTDBUpdate(uid(), { [path]: getCacheValue<number>(path, 0) + add, listen_seconds_total: total + add });
}

/* ── Sunnah applied today ── */
export function getSunnahDone(day = todayKey()): Record<string, boolean> {
  return getCacheValue<Record<string, boolean>>(`sunnah_done/${day}`, {});
}
export function toggleSunnahDone(id: string): Record<string, boolean> {
  const day = todayKey();
  const cur = { ...getSunnahDone(day) };
  if (cur[id]) delete cur[id]; else cur[id] = true;
  const totalKey = 'sunnah_done_total';
  const total = getCacheValue<number>(totalKey, 0) + (cur[id] ? 1 : -1);
  queueRTDBUpdate(uid(), { [`sunnah_done/${day}`]: cur, [totalKey]: Math.max(0, total) });
  return cur;
}

/* ── Quiz results ── */
export function recordQuizResult(correct: number, total: number): void {
  const played = getCacheValue<number>('quiz_played', 0);
  const right = getCacheValue<number>('quiz_correct', 0);
  const asked = getCacheValue<number>('quiz_asked', 0);
  const best = getCacheValue<number>('quiz_best_pct', 0);
  const pct = total ? Math.round((correct / total) * 100) : 0;
  queueRTDBUpdate(uid(), {
    quiz_played: played + 1, quiz_correct: right + correct, quiz_asked: asked + total,
    quiz_best_pct: Math.max(best, pct),
  });
}

/* ── Read helpers for the stats screen ── */
export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(dateKeyOf(x));
  }
  return out;
}

export function daySeries(path: string, days: string[]): number[] {
  return days.map(k => getCacheValue<number>(`${path}/${k}`, 0));
}

export function sumAll(path: string): number {
  const node = getFullCache()[path] as Record<string, number> | undefined;
  if (!node || typeof node !== 'object') return 0;
  return Object.values(node).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
}
