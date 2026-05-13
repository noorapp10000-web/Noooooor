import { useQuery } from '@tanstack/react-query';

// ─────────────────────────────────────────────────────────────────────────────
// Prayer Times — persistent localStorage cache (survives app restarts)
// Cache key format: noor_pt_{lat4}_{lng4}_{YYYY-MM-DD}
// Expires automatically at midnight (date changes → different key → re-fetch)
// ─────────────────────────────────────────────────────────────────────────────

type PrayerTimesResult = {
  timings: Record<string, string>;
  hijri: { day: string; month: { ar: string }; year: string } | undefined;
};

function _ptIsoDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function _ptAladhanDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`; // DD-MM-YYYY for API
}

function _ptCacheKey(lat: number, lng: number, isoDate: string): string {
  return `noor_pt_${lat.toFixed(4)}_${lng.toFixed(4)}_${isoDate}`;
}

function _ptLoad(lat: number, lng: number, isoDate: string): PrayerTimesResult | null {
  try {
    const raw = localStorage.getItem(_ptCacheKey(lat, lng, isoDate));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { isoDate: string; result: PrayerTimesResult };
    if (parsed.isoDate !== isoDate) return null; // stale entry
    return parsed.result;
  } catch {
    return null;
  }
}

function _ptSave(lat: number, lng: number, isoDate: string, result: PrayerTimesResult): void {
  try {
    localStorage.setItem(_ptCacheKey(lat, lng, isoDate), JSON.stringify({ isoDate, result }));
    // Purge entries older than 14 days to keep storage tidy
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith('noor_pt_')) {
        const datePart = k.split('_').pop() ?? '';
        if (datePart < cutoffStr) localStorage.removeItem(k);
      }
    }
  } catch {
    // localStorage quota exceeded — silently skip
  }
}

// ─────────────────────────────────────────────────────────────────────────────

// --- QURAN API ---
export function useQuranSurahs() {
  return useQuery({
    queryKey: ['quran-surahs'],
    queryFn: async () => {
      const res = await fetch('https://api.alquran.cloud/v1/meta');
      if (!res.ok) throw new Error('Failed to fetch surahs');
      const data = await res.json();
      return data.data.surahs.references as Array<{
        number: number;
        name: string;
        englishName: string;
        revelationType: string;
        numberOfAyahs: number;
      }>;
    },
    staleTime: Infinity,
  });
}

export function useSurah(number: number) {
  return useQuery({
    queryKey: ['surah', number],
    queryFn: async () => {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${number}/quran-uthmani`);
      if (!res.ok) throw new Error('Failed to fetch surah');
      const data = await res.json();
      return data.data;
    },
    enabled: !!number,
    staleTime: Infinity,
  });
}

export function useTafsir(surah: number, ayah: number) {
  return useQuery({
    queryKey: ['tafsir', surah, ayah],
    queryFn: async () => {
      const res = await fetch(`https://api.quran.com/api/v4/tafsirs/16/by_ayah/${surah}:${ayah}?language=ar`);
      if (!res.ok) throw new Error('Failed to fetch tafsir');
      const data = await res.json();
      return data.tafsir;
    },
    enabled: !!surah && !!ayah,
  });
}

export function useVerseWords(surah: number, ayah: number) {
  return useQuery({
    queryKey: ['verse-words', surah, ayah],
    queryFn: async () => {
      const res = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?words=true&word_fields=text_uthmani,audio_url&per_page=1`
      );
      if (!res.ok) throw new Error('Failed to fetch words');
      const data = await res.json();
      const words = data.verses?.[0]?.words ?? [];
      return words.filter((w: any) => w.char_type_name !== 'end');
    },
    enabled: !!surah && !!ayah,
    staleTime: Infinity,
  });
}

// --- PRAYER TIMES API (method=5 = Egyptian General Authority of Survey) ---
// Results are cached in localStorage keyed by (lat, lng, date).
// • Today's times: cached until tomorrow midnight (date key changes → auto-refresh)
// • Past/future days: cached indefinitely (they don't change)
// • Works fully offline after first successful fetch per day
export function usePrayerTimes(lat: number | null, lng: number | null, dateOffset = 0) {
  return useQuery({
    queryKey: ['prayer-times', lat, lng, dateOffset],
    queryFn: async () => {
      if (!lat || !lng) throw new Error("No coordinates");

      const isoDate = _ptIsoDate(dateOffset);

      // ── 1. Try localStorage first (works offline) ──────────────────────────
      const cached = _ptLoad(lat, lng, isoDate);
      if (cached) return cached;

      // ── 2. Not cached → fetch from API ─────────────────────────────────────
      const aladhanDate = _ptAladhanDate(dateOffset);
      const res = await fetch(
        `https://api.aladhan.com/v1/timings/${aladhanDate}?latitude=${lat}&longitude=${lng}&method=5`
      );
      if (!res.ok) throw new Error('Failed to fetch prayer times');
      const data = await res.json();
      const result: PrayerTimesResult = {
        timings: data.data.timings as Record<string, string>,
        hijri: data.data.date?.hijri as { day: string; month: { ar: string }; year: string } | undefined,
      };

      // ── 3. Persist to localStorage for offline use ─────────────────────────
      _ptSave(lat, lng, isoDate, result);

      return result;
    },
    enabled: lat !== null && lng !== null,
    // staleTime = until midnight: forces a background re-fetch if the date
    // has rolled over to a new day within the same app session.
    staleTime: (() => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight.getTime() - now.getTime(); // ms until next midnight
    })(),
    retry: 2,
  });
}

// --- RECITERS API ---
export function useReciters() {
  return useQuery({
    queryKey: ['mp3quran-reciters'],
    queryFn: async () => {
      const res = await fetch('https://mp3quran.net/api/v3/reciters?language=ar');
      if (!res.ok) throw new Error('Failed to fetch reciters');
      const data = await res.json();
      return data.reciters as Array<{
        id: string;
        name: string;
        country?: string;
        moshaf: Array<{ id: number; name: string; server: string; surah_total: string; moshaf_type: number }>;
      }>;
    },
    staleTime: Infinity,
  });
}
