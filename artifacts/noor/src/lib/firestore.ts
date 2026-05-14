/**
 * firestore.ts — stubs (الترتيب اتشال، كل الوظائف بترجع بيانات فاضية)
 */

export interface LeaderboardEntry {
  userId: string; displayName: string; governorate?: string | null;
  isPublic: boolean; tasbeehCount: number; quranCompletions: number;
  currentSurah: number; azkarStreak: number; tadabburStreak: number;
  noorScore: number; earnedBadges: string[];
}
export interface SohbaUserData {
  userId: string; displayName: string; governorate?: string | null;
  isPublic: boolean; tasbeehCount: number; quranCompletions: number;
  currentSurah: number; azkarStreak: number; tadabburStreak: number;
  earnedBadges: string[];
}
export interface GovernorateRanking { id: string; name: string; totalCount: number; }

export async function syncUserLeaderboard(_data: SohbaUserData): Promise<number> { return 0; }
export function invalidateLeaderboardCache(): void {}
export async function fetchLeaderboard(_forceRefresh = false): Promise<LeaderboardEntry[]> { return []; }
export async function fetchUserEntry(_userId: string): Promise<LeaderboardEntry | null> { return null; }
export async function hideLeaderboardEntry(_userId: string): Promise<void> {}
export async function deleteLeaderboardEntry(_userId: string): Promise<void> {}
export async function fetchGovernorateLeaderboard(_forceRefresh = false): Promise<GovernorateRanking[]> { return []; }
export async function incrementGovernorateCounter(_id: string, _name: string, _amount: number): Promise<void> {}
export async function rebuildGovernorateLeaderboard(_govs: Array<{ id: string; name: string }>): Promise<{ governoratesUpdated: number; totalTasbeeh: number }> { return { governoratesUpdated: 0, totalTasbeeh: 0 }; }
export async function getRebuildIncludedUsers(): Promise<string[]> { return []; }

const PENDING_GOV_KEY = 'noor_pending_gov_count';
export function getPendingGovernorateCount(): number { return 0; }
export function addPendingGovernorateCount(_n: number): void {}
export function clearPendingGovernorateCount(): void { try { localStorage.removeItem(PENDING_GOV_KEY); } catch {} }
