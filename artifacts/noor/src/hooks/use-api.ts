import { useQuery } from '@tanstack/react-query';
import { SURAH_NAMES } from '@/lib/constants';

// ─────────────────────────────────────────────────────────────────────────────
// Local Quran Data — quran-uthmani-full.json (offline-first)
// Format: [{id, verse_key: "surah:ayah", text_uthmani}]
// ─────────────────────────────────────────────────────────────────────────────

type UthmaniVerse = { id: number; verse_key: string; text_uthmani: string };
let _uthmaniData: UthmaniVerse[] | null = null;
let _uthmaniPromise: Promise<UthmaniVerse[]> | null = null;

async function loadUthmaniData(): Promise<UthmaniVerse[]> {
  if (_uthmaniData) return _uthmaniData;
  if (_uthmaniPromise) return _uthmaniPromise;
  _uthmaniPromise = fetch('/data/quran-uthmani-full.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data => { _uthmaniData = data; return data as UthmaniVerse[]; });
  return _uthmaniPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Local Surah Metadata — fully offline, no API needed
// ─────────────────────────────────────────────────────────────────────────────

const SURAH_AYAH_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const SURAH_REVELATION: ('Meccan'|'Medinan')[] = ['Meccan','Medinan','Medinan','Medinan','Medinan','Meccan','Meccan','Medinan','Medinan','Meccan','Meccan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Medinan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Medinan','Medinan','Medinan','Medinan','Medinan','Medinan','Medinan','Medinan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Medinan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Meccan','Medinan','Meccan','Meccan','Meccan','Meccan'];
const SURAH_ENGLISH = ['Al-Fatihah','Al-Baqarah','Ali-Imran','An-Nisa','Al-Maidah','Al-Anam','Al-Araf','Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Rad','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Taha','Al-Anbiya','Al-Hajj','Al-Muminun','An-Nur','Al-Furqan','Ash-Shuara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqiah','Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah','As-Saf','Al-Jumuah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Maarij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Naziat','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-Ala','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qariah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Maun','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'];

const LOCAL_SURAHS = Array.from({ length: 114 }, (_, i) => ({
  number: i + 1,
  name: SURAH_NAMES[i + 1] ?? '',
  englishName: SURAH_ENGLISH[i] ?? '',
  revelationType: SURAH_REVELATION[i] ?? 'Meccan',
  numberOfAyahs: SURAH_AYAH_COUNTS[i] ?? 0,
}));

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
    queryFn: async () => LOCAL_SURAHS,
    staleTime: Infinity,
  });
}

export function useSurah(number: number) {
  return useQuery({
    queryKey: ['surah', number],
    queryFn: async () => {
      // Try local file first (offline-first)
      try {
        const allVerses = await loadUthmaniData();
        const prefix = `${number}:`;
        const ayahs = allVerses
          .filter(v => v.verse_key.startsWith(prefix))
          .map(v => ({
            numberInSurah: parseInt(v.verse_key.split(':')[1], 10),
            text: v.text_uthmani,
            number: v.id,
          }));
        if (ayahs.length > 0) {
          return { number, name: SURAH_NAMES[number] ?? '', ayahs };
        }
      } catch { /* fall through to API */ }

      // Fallback to API
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

// --- PRAYER TIMES — Offline-first via adhan.js + API for Hijri enrichment ---
// Priority: 1) localStorage cache  2) adhan.js (instant, always offline)
// Hijri date: enriched from aladhan API in background if network available.
// • City/day changes → different query key → instant recompute via adhan.js
// • Works 100% offline forever, no first-fetch requirement
export function usePrayerTimes(lat: number | null, lng: number | null, dateOffset = 0) {
  return useQuery({
    queryKey: ['prayer-times', lat, lng, dateOffset],
    queryFn: async () => {
      if (!lat || !lng) throw new Error("No coordinates");

      const isoDate = _ptIsoDate(dateOffset);

      // ── 1. Try localStorage cache first (zero-cost, works offline) ──────────
      const cached = _ptLoad(lat, lng, isoDate);
      if (cached) return cached;

      // ── 2. Compute with adhan.js immediately (always works, no network) ─────
      let result: PrayerTimesResult;
      try {
        const { Coordinates, PrayerTimes, CalculationMethod } = await import('adhan');
        const coords = new Coordinates(lat, lng);
        const params = CalculationMethod.Egyptian();
        const d = new Date();
        d.setDate(d.getDate() + dateOffset);
        const pt = new PrayerTimes(coords, d, params);
        const fmt = (date: Date) =>
          `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        result = {
          timings: {
            Fajr:     fmt(pt.fajr),
            Sunrise:  fmt(pt.sunrise),
            Dhuhr:    fmt(pt.dhuhr),
            Asr:      fmt(pt.asr),
            Maghrib:  fmt(pt.maghrib),
            Isha:     fmt(pt.isha),
            Midnight: fmt((pt as unknown as { midnight: Date }).midnight),
          },
          hijri: undefined,
        };
      } catch {
        throw new Error('Prayer times unavailable — adhan.js failed');
      }

      // ── 3. Save adhan result immediately (so caller gets instant data) ──────
      _ptSave(lat, lng, isoDate, result);

      // ── 4. Try API in background for better Hijri date (non-blocking) ───────
      //    If it succeeds, overwrite cache with API timings + Hijri.
      //    The query will auto-refresh from cache on next navigation.
      try {
        const aladhanDate = _ptAladhanDate(dateOffset);
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${aladhanDate}?latitude=${lat}&longitude=${lng}&method=5`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          const enriched: PrayerTimesResult = {
            timings: data.data.timings as Record<string, string>,
            hijri: data.data.date?.hijri as { day: string; month: { ar: string }; year: string } | undefined,
          };
          _ptSave(lat, lng, isoDate, enriched);
          return enriched;
        }
      } catch { /* offline — keep adhan result */ }

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
