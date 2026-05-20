import { useState, useRef, useEffect, useCallback } from 'react';
import { useTutorial } from '@/components/TutorialMascotContext';
import { useQuranSurahs, useSurah, useTafsir } from '@/hooks/use-api';
import { useUserSetting } from '@/hooks/use-user-setting';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { getOrCreateLocalUid } from '@/lib/rtdb';
import { getCacheValue, getCurrentUid, queueRTDBUpdate, getSettingCache, queueSettingSync } from '@/lib/rtdb';
import { SURAH_NAMES } from '@/lib/constants';
import { Search, Headphones, FileText, Bookmark, X, ChevronRight, AArrowUp, AArrowDown, Download, Loader2, Copy, Share2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { padZero, cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';

type MoshafType = { id: number; name: string; description: string; img_src: string; download_link: string };

// ── Arabic text normalizer (removes tashkeel, normalises alef variants) ──
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

// ── Module-level caches for local JSON data ──
type QuranEntry = { s: number; a: number; t: string; n: string };
let _quranCache: QuranEntry[] | null = null;
let _tafsirCache: Record<string, string> | null = null;

async function getQuranIndex(): Promise<QuranEntry[]> {
  if (_quranCache) return _quranCache;
  // quran-search.json uses quran-simple edition (modern Arabic spelling, no tashkeel)
  // This makes searching with normal user-typed Arabic work correctly.
  const tryUrls = ['/data/quran-search.json', '/data/quran-uthmani.json'];
  for (const url of tryUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const raw: { s: number; a: number; t: string }[] = await res.json();
      _quranCache = raw.map(e => ({ ...e, n: normalizeArabic(e.t) }));
      return _quranCache!;
    } catch { /* try next */ }
  }
  throw new Error('فهرس البحث غير متوفر — تأكد من اتصال البيانات');
}

/* ── Share helper ── */
async function shareAyah(text: string, surahName: string, ayahNum: number) {
  const shareText = `${surahName} — الآية ${ayahNum}\n\n${text}\n\n📱 من تطبيق نور`;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text: shareText, dialogTitle: 'مشاركة الآية' });
      return;
    } catch {}
  }
  if (navigator.share) {
    try { await navigator.share({ text: shareText }); return; } catch {}
  }
  try { await navigator.clipboard.writeText(shareText); } catch {}
  const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  window.open(url, '_blank', 'noopener');
}

async function copyAyah(text: string, surahName: string, ayahNum: number) {
  const copyText = `${surahName} — الآية ${ayahNum}\n\n${text}`;
  try { await navigator.clipboard.writeText(copyText); } catch {}
}

function AyahCopyButton({ text, surahName, ayahNum, dark }: { text: string; surahName: string; ayahNum: number; dark: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async e => {
        e.stopPropagation();
        await copyAyah(text, surahName, ayahNum);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-all active:scale-90"
      style={{
        background: copied ? 'rgba(34,197,94,0.18)' : (dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.15)'),
        border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(193,154,107,0.35)'}`,
        color: copied ? '#16a34a' : (dark ? '#E8C98A' : '#6B4820'),
        fontFamily: '"Tajawal", sans-serif',
        fontSize: '0.6rem',
        lineHeight: '1.6',
      }}
    >
      {copied ? <span style={{ fontSize: 11 }}>✓</span> : <Copy className="w-2.5 h-2.5" />}
      {copied ? 'تم' : 'نسخ'}
    </button>
  );
}

async function getTafsirIndex(): Promise<Record<string, string>> {
  if (_tafsirCache) return _tafsirCache;
  const res = await fetch('/data/tafsir-muyassar.json');
  if (!res.ok) throw new Error('local tafsir not ready');
  _tafsirCache = await res.json();
  return _tafsirCache!;
}


function MoshafSheet({ dark, onClose }: { dark: boolean; onClose: () => void }) {
  const [moshafList, setMoshafList] = useState<MoshafType[]>([]);
  useEffect(() => {
    fetch('/data/moshaf.json').then(r => r.json()).then(setMoshafList).catch(() => {});
  }, []);
  const bg = dark ? '#1a1208' : '#fdfbf0';
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-16" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-3xl shadow-2xl"
        style={{ background: bg, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: 'rgba(193,154,107,0.4)' }} />
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: border }}>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.12)' }}>
            <X size={16} className="text-[#C19A6B]" />
          </button>
          <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>تحميل نسخة المصحف</p>
          <div className="w-8" />
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-3" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          {moshafList.length === 0 && (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)' }} />)}
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {moshafList.map(m => (
              <a
                key={m.id}
                href={m.download_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-2xl"
                style={{ background: dark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)', border: `1px solid ${border}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>{m.name}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>{m.description}</p>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#8B6340,#C19A6B)' }}>
                  <Download size={14} className="text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const FONT_MIN = 1.2;
const FONT_MAX = 2.8;
const FONT_STEP = 0.15;

// ── Hizb start positions (surah, ayah) — 60 ahzab ─────────────────────────
const HIZB_DATA: { hizb: number; juz: number; surah: number; ayah: number }[] = [
  { hizb: 1,  juz: 1,  surah: 1,  ayah: 1   },
  { hizb: 2,  juz: 1,  surah: 2,  ayah: 75  },
  { hizb: 3,  juz: 2,  surah: 2,  ayah: 142 },
  { hizb: 4,  juz: 2,  surah: 2,  ayah: 204 },
  { hizb: 5,  juz: 3,  surah: 2,  ayah: 253 },
  { hizb: 6,  juz: 3,  surah: 2,  ayah: 283 },
  { hizb: 7,  juz: 4,  surah: 3,  ayah: 56  },
  { hizb: 8,  juz: 4,  surah: 3,  ayah: 92  },
  { hizb: 9,  juz: 5,  surah: 3,  ayah: 171 },
  { hizb: 10, juz: 5,  surah: 4,  ayah: 1   },
  { hizb: 11, juz: 6,  surah: 4,  ayah: 24  },
  { hizb: 12, juz: 6,  surah: 4,  ayah: 148 },
  { hizb: 13, juz: 7,  surah: 5,  ayah: 3   },
  { hizb: 14, juz: 7,  surah: 5,  ayah: 82  },
  { hizb: 15, juz: 8,  surah: 6,  ayah: 1   },
  { hizb: 16, juz: 8,  surah: 6,  ayah: 111 },
  { hizb: 17, juz: 9,  surah: 7,  ayah: 1   },
  { hizb: 18, juz: 9,  surah: 7,  ayah: 88  },
  { hizb: 19, juz: 10, surah: 7,  ayah: 188 },
  { hizb: 20, juz: 10, surah: 8,  ayah: 41  },
  { hizb: 21, juz: 11, surah: 9,  ayah: 1   },
  { hizb: 22, juz: 11, surah: 9,  ayah: 93  },
  { hizb: 23, juz: 12, surah: 11, ayah: 1   },
  { hizb: 24, juz: 12, surah: 11, ayah: 96  },
  { hizb: 25, juz: 13, surah: 12, ayah: 53  },
  { hizb: 26, juz: 13, surah: 13, ayah: 18  },
  { hizb: 27, juz: 14, surah: 15, ayah: 1   },
  { hizb: 28, juz: 14, surah: 16, ayah: 1   },
  { hizb: 29, juz: 15, surah: 17, ayah: 1   },
  { hizb: 30, juz: 15, surah: 17, ayah: 99  },
  { hizb: 31, juz: 16, surah: 18, ayah: 75  },
  { hizb: 32, juz: 16, surah: 19, ayah: 59  },
  { hizb: 33, juz: 17, surah: 21, ayah: 1   },
  { hizb: 34, juz: 17, surah: 22, ayah: 1   },
  { hizb: 35, juz: 18, surah: 23, ayah: 1   },
  { hizb: 36, juz: 18, surah: 24, ayah: 21  },
  { hizb: 37, juz: 19, surah: 25, ayah: 21  },
  { hizb: 38, juz: 19, surah: 26, ayah: 111 },
  { hizb: 39, juz: 20, surah: 27, ayah: 56  },
  { hizb: 40, juz: 20, surah: 28, ayah: 51  },
  { hizb: 41, juz: 21, surah: 29, ayah: 46  },
  { hizb: 42, juz: 21, surah: 31, ayah: 21  },
  { hizb: 43, juz: 22, surah: 33, ayah: 31  },
  { hizb: 44, juz: 22, surah: 34, ayah: 24  },
  { hizb: 45, juz: 23, surah: 36, ayah: 28  },
  { hizb: 46, juz: 23, surah: 38, ayah: 1   },
  { hizb: 47, juz: 24, surah: 39, ayah: 32  },
  { hizb: 48, juz: 24, surah: 40, ayah: 41  },
  { hizb: 49, juz: 25, surah: 41, ayah: 47  },
  { hizb: 50, juz: 25, surah: 43, ayah: 23  },
  { hizb: 51, juz: 26, surah: 46, ayah: 1   },
  { hizb: 52, juz: 26, surah: 48, ayah: 17  },
  { hizb: 53, juz: 27, surah: 51, ayah: 31  },
  { hizb: 54, juz: 27, surah: 54, ayah: 1   },
  { hizb: 55, juz: 28, surah: 58, ayah: 1   },
  { hizb: 56, juz: 28, surah: 60, ayah: 1   },
  { hizb: 57, juz: 29, surah: 67, ayah: 1   },
  { hizb: 58, juz: 29, surah: 72, ayah: 1   },
  { hizb: 59, juz: 30, surah: 78, ayah: 1   },
  { hizb: 60, juz: 30, surah: 89, ayah: 1   },
];

// ── Juz start positions (surah, ayah) ──────────────────────────────────────
const JUZ_DATA: { juz: number; name: string; surah: number; ayah: number }[] = [
  { juz: 1,  name: 'الجزء الأول',       surah: 1,  ayah: 1  },
  { juz: 2,  name: 'الجزء الثاني',      surah: 2,  ayah: 142 },
  { juz: 3,  name: 'الجزء الثالث',      surah: 2,  ayah: 253 },
  { juz: 4,  name: 'الجزء الرابع',      surah: 3,  ayah: 92  },
  { juz: 5,  name: 'الجزء الخامس',      surah: 4,  ayah: 24  },
  { juz: 6,  name: 'الجزء السادس',      surah: 4,  ayah: 148 },
  { juz: 7,  name: 'الجزء السابع',      surah: 5,  ayah: 82  },
  { juz: 8,  name: 'الجزء الثامن',      surah: 6,  ayah: 111 },
  { juz: 9,  name: 'الجزء التاسع',      surah: 7,  ayah: 88  },
  { juz: 10, name: 'الجزء العاشر',      surah: 8,  ayah: 41  },
  { juz: 11, name: 'الجزء الحادي عشر',  surah: 9,  ayah: 93  },
  { juz: 12, name: 'الجزء الثاني عشر',  surah: 11, ayah: 6   },
  { juz: 13, name: 'الجزء الثالث عشر',  surah: 12, ayah: 53  },
  { juz: 14, name: 'الجزء الرابع عشر',  surah: 15, ayah: 1   },
  { juz: 15, name: 'الجزء الخامس عشر',  surah: 17, ayah: 1   },
  { juz: 16, name: 'الجزء السادس عشر',  surah: 18, ayah: 75  },
  { juz: 17, name: 'الجزء السابع عشر',  surah: 21, ayah: 1   },
  { juz: 18, name: 'الجزء الثامن عشر',  surah: 23, ayah: 1   },
  { juz: 19, name: 'الجزء التاسع عشر',  surah: 25, ayah: 21  },
  { juz: 20, name: 'الجزء العشرون',     surah: 27, ayah: 56  },
  { juz: 21, name: 'الجزء الحادي والعشرون', surah: 29, ayah: 46 },
  { juz: 22, name: 'الجزء الثاني والعشرون', surah: 33, ayah: 31 },
  { juz: 23, name: 'الجزء الثالث والعشرون', surah: 36, ayah: 28 },
  { juz: 24, name: 'الجزء الرابع والعشرون', surah: 39, ayah: 32 },
  { juz: 25, name: 'الجزء الخامس والعشرون', surah: 41, ayah: 47 },
  { juz: 26, name: 'الجزء السادس والعشرون', surah: 46, ayah: 1  },
  { juz: 27, name: 'الجزء السابع والعشرون', surah: 51, ayah: 31 },
  { juz: 28, name: 'الجزء الثامن والعشرون', surah: 58, ayah: 1  },
  { juz: 29, name: 'الجزء التاسع والعشرون', surah: 67, ayah: 1  },
  { juz: 30, name: 'الجزء الثلاثون',    surah: 78, ayah: 1   },
];

/** Compute juz number for an ayah using JUZ_DATA (for locally-loaded surahs lacking juz field) */
function lookupJuz(surah: number, ayahNum: number): number {
  let result = 1;
  for (const j of JUZ_DATA) {
    if (j.surah < surah || (j.surah === surah && j.ayah <= ayahNum)) result = j.juz;
    else break;
  }
  return result;
}

/** Compute approximate hizbQuarter using HIZB_DATA (returns hizb*4 so hizbDisplay shows correct حزب, ربع 4 fallback) */
function lookupHizbQuarter(surah: number, ayahNum: number): number {
  let result = 4;
  for (const h of HIZB_DATA) {
    if (h.surah < surah || (h.surah === surah && h.ayah <= ayahNum)) result = h.hizb * 4;
    else break;
  }
  return result;
}

type Mode = 'normal' | 'listen' | 'tafsir';

function getWordAudioUrl(surah: number, ayah: number, wordIdx: number): string {
  return `https://audio.qurancdn.com/wbw/${padZero(surah, 3)}_${padZero(ayah, 3)}_${padZero(wordIdx, 3)}.mp3`;
}

function AyahMarker({ num, bookmarked, dark }: { num: number; bookmarked?: boolean; dark: boolean }) {
  return (
    <span className="inline-block align-middle mx-1" style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
      <svg width="28" height="28" viewBox="0 0 100 100" style={{ display: 'inline', verticalAlign: 'middle' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={bookmarked ? '#C19A6B' : dark ? '#7a5c2a' : '#C19A6B'} strokeWidth="2.5" />
        <circle cx="50" cy="50" r="38" fill={bookmarked ? 'rgba(193,154,107,0.25)' : 'rgba(193,154,107,0.08)'} stroke={bookmarked ? '#C19A6B' : dark ? '#5a3e18' : 'rgba(193,154,107,0.5)'} strokeWidth="1.5" />
        <text x="50" y="56" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: num > 99 ? '28px' : '32px', fill: bookmarked ? '#C19A6B' : dark ? '#c9a96e' : '#8B5E3C', fontFamily: 'serif', fontWeight: 'bold' }}>
          {num}
        </text>
      </svg>
    </span>
  );
}

export function Quran() {
  const { data: surahs, isLoading: loadingList } = useQuranSurahs();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const { showTutorial } = useTutorial();

  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [scrollToAyah, setScrollToAyah] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (selectedSurah) {
      showTutorial('quran:surah:' + selectedSurah,
        `أنت داخل السورة الآن! 📖\n\n• اضغط مطوّلاً على أي آية لعرض تفسيرها الميسّر\n• زر 🔊 يشغّل التلاوة آية بآية بصوت القارئ المختار\n• A+ / A− : تكبير وتصغير حجم الخط حسب راحتك\n• 🔖 الضغط المطوّل يحفظ إشارة مرجعية في الآية\n• السهم ← فوق للعودة لقائمة السور في أي وقت\n\n💡 اضغط مرتين على الآية لنسخها ومشاركتها`
      );
    }
  }, [selectedSurah, showTutorial]);
  const { data: surahData, isLoading: loadingSurah } = useSurah(selectedSurah ?? 0);

  const [mode, setMode] = useState<Mode>('normal');
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [currentHizb, setCurrentHizb] = useState<number | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: tafsirData } = useTafsir(selectedSurah ?? 0, activeAyah ?? 0);

  const [bookmark, setBookmark] = useUserSetting<{ surah: number; ayah: number } | null>('quran_bookmark', null);
  const [fontSize, setFontSize] = useUserSetting<number>('quran_font_size', 1.75);
  const [showMoshaf, setShowMoshaf] = useState(false);

  // Quran text search
  const [searchView, setSearchView] = useState<'surahs' | 'search' | 'juz' | 'hizb'>('surahs');
  const [quranSearch, setQuranSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCount, setSearchCount] = useState(0);

  const trackSurahSelection = useCallback((surahNum: number) => {
    const uid = getCurrentUid() || getOrCreateLocalUid();
    if (!uid) return;

    const prevSurah = getCacheValue<number>('last_surah', 1);
    const updates: Record<string, unknown> = { last_surah: surahNum };

    if (surahNum === 1 && prevSurah >= 110) {
      const completions = getCacheValue<number>('quran_completions', 0);
      updates['quran_completions'] = completions + 1;
    }

    // حساب سلسلة التدبر بناءً على آخر تاريخ دخول
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDate = getSettingCache<string>('tadabbur_last_date', '');
    if (lastDate !== todayStr) {
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const streak = getCacheValue<number>('tadabbur_streak', 0);
      updates['tadabbur_streak'] = lastDate === yesterdayStr ? streak + 1 : 1;
      queueSettingSync(uid, 'tadabbur_last_date', todayStr);
    }

    queueRTDBUpdate(uid, updates);
  }, []);

  // ── Search Quran text (local JSON + API fallback, with Arabic normalization) ──
  const searchQuran = useCallback(async (term: string) => {
    const t = term.trim();
    if (!t) { setSearchResults([]); setSearchCount(0); return; }
    setSearchLoading(true);
    try {
      const data = await getQuranIndex();
      const normalized = normalizeArabic(t);
      const results = data.filter(e => e.n.includes(normalized));
      setSearchResults(results);
      setSearchCount(results.length);
    } catch { setSearchResults([]); setSearchCount(0); }
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (searchView === 'search') searchQuran(quranSearch); }, 500);
    return () => clearTimeout(timer);
  }, [quranSearch, searchView, searchQuran]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + FONT_STEP, FONT_MAX));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - FONT_STEP, FONT_MIN));
  const lineHeight = (fontSize * 2.0).toFixed(2) + 'rem';

  // Theme-dependent color palette
  const C = {
    pageBg: dark ? '#0f0c07' : '#FDFBF5',
    headerBg: dark ? '#130f08' : '#F7EDD6',
    headerBorder: dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.35)',
    headerShadow: dark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(193,154,107,0.15)',
    mushafBg: dark
      ? 'linear-gradient(180deg, #1c1408 0%, #160f06 100%)'
      : 'linear-gradient(180deg, #FFFDF4 0%, #F8EFDB 100%)',
    mushafBorder: dark ? 'rgba(193,154,107,0.3)' : 'rgba(193,154,107,0.45)',
    mushafShadow: dark
      ? '0 0 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(193,154,107,0.15)'
      : '0 0 20px rgba(193,154,107,0.2), inset 0 1px 0 rgba(193,154,107,0.3)',
    ayahText: dark ? '#ddd0b0' : '#2C1E16',
    surahTitle: dark ? '#d4b483' : '#7a4e25',
    bismillah: dark ? '#b89050' : '#8B5E3C',
    searchBg: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)',
    searchText: dark ? '#e8d9b8' : '#2C1E16',
    searchBorder: dark ? 'rgba(193,154,107,0.25)' : 'rgba(193,154,107,0.4)',
    itemBg: dark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)',
    itemBorder: dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.25)',
    itemText: dark ? '#e8d9b8' : '#2C1E16',
    subtleText: dark ? 'rgba(193,154,107,0.6)' : '#8B5E3C',
    modalBg: dark ? '#1a1208' : '#FFFDF4',
    modalBorder: dark ? 'rgba(193,154,107,0.3)' : 'rgba(193,154,107,0.4)',
    modalText: dark ? '#ddd0b0' : '#2C1E16',
    hinBg: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)',
    hintBorder: dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.25)',
    btnBg: dark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.15)',
    btnBorder: dark ? 'rgba(193,154,107,0.25)' : 'rgba(193,154,107,0.4)',
    bookmarkBg: dark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.12)',
    bookmarkBorder: dark ? 'rgba(193,154,107,0.35)' : 'rgba(193,154,107,0.5)',
  };

  useEffect(() => {
    if (!wordAudioRef.current) {
      wordAudioRef.current = new Audio();
      wordAudioRef.current.onended = () => setPlayingWord(null);
      wordAudioRef.current.onerror = () => setPlayingWord(null);
    }
  }, []);

  // Scroll to ayah after surah loads
  useEffect(() => {
    if (!scrollToAyah || !surahData || loadingSurah) return;
    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-ayah="${scrollToAyah}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setScrollToAyah(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [scrollToAyah, surahData, loadingSurah]);

  const playWord = (surah: number, ayah: number, wordPos: number) => {
    const wordKey = `${surah}:${ayah}:${wordPos}`;
    if (!wordAudioRef.current) return;
    wordAudioRef.current.pause();
    wordAudioRef.current.src = getWordAudioUrl(surah, ayah, wordPos);
    wordAudioRef.current.load();
    wordAudioRef.current.play().catch(() => setPlayingWord(null));
    setPlayingWord(wordKey);
  };

  const handleAyahClick = (ayahNum: number) => {
    if (mode === 'normal') {
      setSelectedAyah(prev => prev === ayahNum ? null : ayahNum);
    } else if (mode === 'tafsir') {
      setActiveAyah(ayahNum);
    }
  };

  const handleWordClick = (ayahNum: number, wordIdx: number) => {
    if (mode === 'listen' && selectedSurah) {
      playWord(selectedSurah, ayahNum, wordIdx);
    }
  };

  const saveBookmark = (ayahNum: number) => {
    if (selectedSurah) setBookmark({ surah: selectedSurah, ayah: ayahNum });
    setSelectedAyah(null);
  };

  const goToBookmark = () => {
    if (!bookmark) return;
    if (bookmark.surah === selectedSurah) {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-ayah="${bookmark.ayah}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setSelectedSurah(bookmark.surah);
      setScrollToAyah(bookmark.ayah);
    }
  };

  useEffect(() => {
    setCurrentJuz(null);
    setCurrentHizb(null);
    setSelectedAyah(null);
  }, [selectedSurah]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !surahData) return;
    const container = scrollRef.current;
    const ayahEls = container.querySelectorAll<HTMLElement>('[data-ayah]');
    const containerTop = container.scrollTop;
    for (const el of ayahEls) {
      if (el.offsetTop - containerTop > -10) {
        const juz = el.dataset.juz;
        const hizb = el.dataset.hizb;
        if (juz) setCurrentJuz(parseInt(juz));
        if (hizb) setCurrentHizb(parseFloat(hizb));
        break;
      }
    }
  }, [surahData]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const filteredSurahs = surahs?.filter(
    s => (SURAH_NAMES[s.number] ?? s.name).includes(search) || s.englishName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Surah list ──
  if (!selectedSurah) {
    return (
      <div
        className="pt-6 px-4 max-w-lg mx-auto h-screen flex flex-col"
        dir="rtl"
        style={{ background: C.pageBg }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}` }}>
            <svg width="18" height="18" viewBox="0 0 40 40" fill="#C19A6B"><polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" /></svg>
          </div>
          <h1 className="text-2xl font-bold flex-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}>القرآن الكريم</h1>
          <button
            onClick={() => setShowMoshaf(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
            style={{ fontFamily: '"Tajawal", sans-serif', background: C.btnBg, border: `1px solid ${C.btnBorder}`, color: '#C19A6B' }}
          >
            <Download size={13} />
            تحميل المصحف
          </button>
        </div>
        <AnimatePresence>
          {showMoshaf && <MoshafSheet dark={dark} onClose={() => setShowMoshaf(false)} />}
        </AnimatePresence>

        {/* Tab switcher */}
        <div className="flex rounded-xl mb-4 overflow-hidden" style={{ border: `1px solid ${C.searchBorder}`, background: C.searchBg }}>
          <button
            onClick={() => setSearchView('surahs')}
            className="flex-1 py-2.5 text-xs font-bold transition-all"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: searchView === 'surahs' ? '#C19A6B' : 'transparent',
              color: searchView === 'surahs' ? '#0f0c07' : C.subtleText,
            }}
          >السور</button>
          <button
            onClick={() => setSearchView('juz')}
            className="flex-1 py-2.5 text-xs font-bold transition-all"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: searchView === 'juz' ? '#C19A6B' : 'transparent',
              color: searchView === 'juz' ? '#0f0c07' : C.subtleText,
            }}
          >الأجزاء</button>
          <button
            onClick={() => setSearchView('hizb')}
            className="flex-1 py-2.5 text-xs font-bold transition-all"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: searchView === 'hizb' ? '#C19A6B' : 'transparent',
              color: searchView === 'hizb' ? '#0f0c07' : C.subtleText,
            }}
          >الأحزاب</button>
          <button
            onClick={() => setSearchView('search')}
            className="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-all"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: searchView === 'search' ? '#C19A6B' : 'transparent',
              color: searchView === 'search' ? '#0f0c07' : C.subtleText,
            }}
          >
            <Search size={11} />
            بحث
          </button>
        </div>

        {searchView === 'juz' ? (
          /* ── Juz (Portion) Navigator ── */
          <div className="flex-1 overflow-y-auto space-y-2 pb-24">
            {JUZ_DATA.map(j => (
              <button
                key={j.juz}
                onClick={() => {
                  trackSurahSelection(j.surah);
                  setSelectedSurah(j.surah);
                  setScrollToAyah(j.ayah);
                  setMode('normal');
                  setSelectedAyah(null);
                  setActiveAyah(null);
                }}
                className="w-full p-4 rounded-2xl flex items-center justify-between transition-all"
                style={{ background: C.itemBg, border: `1px solid ${C.itemBorder}` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'rgba(193,154,107,0.15)', border: '1px solid rgba(193,154,107,0.3)', color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {j.juz}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: C.itemText }}>{j.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
                      {SURAH_NAMES[j.surah]} — آية {j.ayah}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'rgba(193,154,107,0.4)' }} />
              </button>
            ))}
          </div>
        ) : searchView === 'hizb' ? (
          /* ── Hizb Navigator — 60 ahzab ── */
          <div className="flex-1 overflow-y-auto space-y-2 pb-24">
            {HIZB_DATA.map(h => (
              <button
                key={h.hizb}
                onClick={() => {
                  trackSurahSelection(h.surah);
                  setSelectedSurah(h.surah);
                  setScrollToAyah(h.ayah);
                  setMode('normal');
                  setSelectedAyah(null);
                  setActiveAyah(null);
                }}
                className="w-full p-3.5 rounded-2xl flex items-center justify-between transition-all"
                style={{ background: C.itemBg, border: `1px solid ${C.itemBorder}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: 'rgba(193,154,107,0.15)', border: '1px solid rgba(193,154,107,0.3)', color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {h.hizb}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: C.itemText }}>الحزب {h.hizb}</h3>
                    <p className="text-xs mt-0.5" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
                      ج{h.juz} · {SURAH_NAMES[h.surah]} — آية {h.ayah}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'rgba(193,154,107,0.4)' }} />
              </button>
            ))}
          </div>
        ) : searchView === 'surahs' ? (
          <>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#C19A6B', opacity: 0.6 }} />
              <input
                type="text"
                placeholder="ابحث عن سورة..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full py-3 pr-10 pl-4 rounded-2xl outline-none text-sm"
                style={{
                  background: C.searchBg,
                  border: `1px solid ${C.searchBorder}`,
                  color: C.searchText,
                  fontFamily: '"Tajawal", sans-serif',
                }}
              />
            </div>

            {bookmark && (
              <button
                onClick={() => { setSelectedSurah(bookmark.surah); setScrollToAyah(bookmark.ayah); }}
                className="mb-4 p-4 rounded-2xl flex items-center justify-between transition-all"
                style={{ background: C.bookmarkBg, border: `1px solid ${C.bookmarkBorder}` }}
              >
                <div className="text-right">
                  <p className="text-xs mb-1 flex items-center gap-1" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
                    <Bookmark className="w-3.5 h-3.5 fill-current" /> علامة محفوظة
                  </p>
                  <p className="font-bold text-sm" style={{ color: C.itemText, fontFamily: '"Tajawal", sans-serif' }}>
                    سورة {SURAH_NAMES[bookmark.surah]} — الآية {bookmark.ayah}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: '#C19A6B' }} />
              </button>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pb-24">
              {loadingList ? (
                <div className="text-center py-10 animate-pulse" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>جاري التحميل...</div>
              ) : (
                filteredSurahs?.map(s => (
                  <button
                    key={s.number}
                    onClick={() => { trackSurahSelection(s.number); setSelectedSurah(s.number); setMode('normal'); setSelectedAyah(null); setActiveAyah(null); }}
                    className="w-full p-4 rounded-2xl flex items-center justify-between transition-all"
                    style={{ background: C.itemBg, border: `1px solid ${C.itemBorder}` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: 'rgba(193,154,107,0.15)', border: '1px solid rgba(193,154,107,0.3)', color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
                        {s.number}
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-base" style={{ fontFamily: '"Amiri", serif', color: C.itemText }}>{SURAH_NAMES[s.number] ?? s.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
                          {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {s.numberOfAyahs} آية
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: 'rgba(193,154,107,0.4)' }} />
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          /* ── Quran text search ── */
          <>
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#C19A6B', opacity: 0.6 }} />
              {searchLoading && (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: '#C19A6B' }} />
              )}
              <input
                type="text"
                placeholder="اكتب كلمة أو جزءاً من آية..."
                value={quranSearch}
                onChange={e => setQuranSearch(e.target.value)}
                className="w-full py-3 pr-10 pl-10 rounded-2xl outline-none text-sm"
                style={{
                  background: C.searchBg,
                  border: `1px solid ${C.searchBorder}`,
                  color: C.searchText,
                  fontFamily: '"Tajawal", sans-serif',
                }}
                autoFocus
              />
            </div>

            {searchCount > 0 && (
              <p className="text-xs mb-2 text-right" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
                {searchCount} نتيجة
              </p>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pb-24">
              {!quranSearch.trim() && (
                <div className="text-center py-12" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">ابحث في كلمات القرآن الكريم</p>
                </div>
              )}
              {quranSearch.trim() && !searchLoading && searchResults.length === 0 && (
                <div className="text-center py-12" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
                  <p className="text-sm">لا توجد نتائج</p>
                </div>
              )}
              {(searchResults as QuranEntry[]).slice(0, 60).map((match, i) => {
                const surahNameAr = SURAH_NAMES[match.s] ?? `سورة ${match.s}`;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      trackSurahSelection(match.s);
                      setSelectedSurah(match.s);
                      setScrollToAyah(match.a);
                      setMode('normal');
                      setSelectedAyah(null);
                      setActiveAyah(null);
                      setSearchView('surahs');
                    }}
                    className="w-full p-4 rounded-2xl text-right transition-all"
                    style={{ background: C.itemBg, border: `1px solid ${C.itemBorder}` }}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(193,154,107,0.4)' }} />
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(193,154,107,0.15)', color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
                          {surahNameAr}
                        </span>
                        <span className="text-xs" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
                          آية {match.a}
                        </span>
                      </div>
                    </div>
                    <p className="text-base leading-relaxed" style={{
                      fontFamily: '"Scheherazade New", "Amiri Quran", serif',
                      color: C.ayahText,
                      fontSize: '1.1rem',
                      lineHeight: '2.2rem',
                    }}>
                      {match.t}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Surah reader ──
  const surahName = SURAH_NAMES[selectedSurah] ?? surahs?.find(s => s.number === selectedSurah)?.name ?? '';
  const hizbDisplay = currentHizb
    ? `حزب ${Math.ceil(currentHizb / 4)} • ربع ${Math.ceil(currentHizb) % 4 || 4}`
    : '';

  return (
    <div className="h-screen flex flex-col relative" dir="rtl" style={{ background: C.pageBg }}>
      {/* ── Header ── */}
      <div
        className="px-4 pt-3 pb-2 z-10 flex-shrink-0"
        style={{ background: C.headerBg, borderBottom: `1px solid ${C.headerBorder}`, boxShadow: C.headerShadow }}
      >
        {/* Row 1: Surah name + Juz + Hizb */}
        <div className="text-center mb-2 pb-2" style={{ borderBottom: `1px solid ${C.headerBorder}` }}>
          <h2 className="font-bold text-base leading-tight" style={{ fontFamily: '"Amiri", serif', color: C.surahTitle }}>
            {surahName}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
            الجزء {currentJuz ?? (selectedSurah ? lookupJuz(selectedSurah, 1) : '—')}
            {hizbDisplay ? ` • ${hizbDisplay}` : ''}
          </p>
        </div>

        {/* Row 2: Close button + action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSelectedSurah(null); setMode('normal'); setSelectedAyah(null); setActiveAyah(null); wordAudioRef.current?.pause(); }}
            className="p-2 rounded-full"
            style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}` }}
          >
            <X className="w-4 h-4" style={{ color: '#C19A6B' }} />
          </button>

          <div className="flex gap-1.5 items-center">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= FONT_MIN}
              className="flex items-center justify-center rounded-full transition-all"
              style={{
                width: 32, height: 32,
                background: C.btnBg,
                border: `1px solid ${C.btnBorder}`,
                color: fontSize <= FONT_MIN ? 'rgba(193,154,107,0.3)' : '#C19A6B',
                flexShrink: 0,
              }}
              title="تصغير الخط"
            >
              <AArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={increaseFontSize}
              disabled={fontSize >= FONT_MAX}
              className="flex items-center justify-center rounded-full transition-all"
              style={{
                width: 32, height: 32,
                background: C.btnBg,
                border: `1px solid ${C.btnBorder}`,
                color: fontSize >= FONT_MAX ? 'rgba(193,154,107,0.3)' : '#C19A6B',
                flexShrink: 0,
              }}
              title="تكبير الخط"
            >
              <AArrowUp className="w-4 h-4" />
            </button>
            {bookmark && (
              <button
                onClick={goToBookmark}
                className="p-2 rounded-full relative"
                style={{ background: 'rgba(193,154,107,0.15)', border: `1px solid ${C.bookmarkBorder}` }}
                title="انتقل للعلامة المحفوظة"
              >
                <Bookmark className="w-4 h-4 fill-current" style={{ color: '#C19A6B' }} />
              </button>
            )}
            <button
              onClick={() => { setMode(mode === 'listen' ? 'normal' : 'listen'); setSelectedAyah(null); }}
              className="p-2 rounded-full transition-all"
              title="الاستماع كلمة بكلمة"
              style={{
                background: mode === 'listen' ? '#C19A6B' : C.btnBg,
                border: `1px solid ${C.btnBorder}`,
              }}
            >
              <Headphones className="w-4 h-4" style={{ color: mode === 'listen' ? '#0f0c07' : '#C19A6B' }} />
            </button>
            <button
              onClick={() => { setMode(mode === 'tafsir' ? 'normal' : 'tafsir'); setSelectedAyah(null); }}
              className="p-2 rounded-full transition-all"
              title="التفسير"
              style={{
                background: mode === 'tafsir' ? '#C19A6B' : C.btnBg,
                border: `1px solid ${C.btnBorder}`,
              }}
            >
              <FileText className="w-4 h-4" style={{ color: mode === 'tafsir' ? '#0f0c07' : '#C19A6B' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Mode hint */}
      {mode === 'listen' && (
        <div className="px-4 py-1.5 text-center flex-shrink-0" style={{ background: C.hinBg, borderBottom: `1px solid ${C.hintBorder}` }}>
          <p className="text-xs font-bold" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>اضغط على أي كلمة لسماع نطقها</p>
        </div>
      )}
      {mode === 'tafsir' && (
        <div className="px-4 py-1.5 text-center flex-shrink-0" style={{ background: C.hinBg, borderBottom: `1px solid ${C.hintBorder}` }}>
          <p className="text-xs font-bold" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>اضغط على أي آية لعرض تفسيرها</p>
        </div>
      )}
      {mode === 'normal' && (
        <div className="px-4 py-1.5 text-center flex-shrink-0" style={{ background: C.hinBg, borderBottom: `1px solid ${C.hintBorder}` }}>
          <p className="text-xs" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>اضغط على آية لتعيين علامة الحفظ</p>
        </div>
      )}

      {/* ── Quran Text ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 px-3 pb-24">
        {loadingSurah ? (
          <div className="text-center py-20 animate-pulse" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>جاري تحميل السورة...</div>
        ) : (
          <div
            className="min-h-full overflow-hidden"
            style={{
              background: C.mushafBg,
              border: `2px solid ${C.mushafBorder}`,
              boxShadow: C.mushafShadow,
              borderRadius: '8px',
            }}
          >
            {/* Top double-rule border - Madinah Mushaf style */}
            <div style={{ height: '3px', background: dark ? '#5a3e18' : '#8B5E3C' }} />
            <div style={{ height: '1px', background: 'transparent' }} />
            <div style={{ height: '8px', background: `linear-gradient(90deg, ${dark ? '#3d2a0a' : '#5c3518'} 0%, #C19A6B 15%, #f0c040 30%, #C19A6B 50%, #f0c040 70%, #C19A6B 85%, ${dark ? '#3d2a0a' : '#5c3518'} 100%)` }} />
            <div style={{ height: '3px', background: dark ? '#5a3e18' : '#8B5E3C' }} />

            {/* Surah name banner - Madinah Mushaf style */}
            <div
              className="py-4 px-4 text-center"
              style={{
                borderBottom: `2px solid ${C.mushafBorder}`,
                background: dark
                  ? 'linear-gradient(180deg, rgba(193,154,107,0.12) 0%, rgba(193,154,107,0.06) 100%)'
                  : 'linear-gradient(180deg, rgba(193,154,107,0.18) 0%, rgba(193,154,107,0.08) 100%)',
              }}
            >
              {/* Decorative SVG top */}
              <div className="flex items-center justify-center gap-1 mb-2">
                <svg width="60" height="10" viewBox="0 0 120 20" fill="none">
                  <path d="M0 10 Q20 2 40 10 Q60 18 80 10 Q100 2 120 10" stroke={dark ? '#C19A6B' : '#8B5E3C'} strokeWidth="1.5" fill="none" opacity="0.7"/>
                </svg>
                <svg width="14" height="14" viewBox="0 0 100 100"><polygon points="50,5 61,35 93,35 68,57 77,88 50,70 23,88 32,57 7,35 39,35" fill="#C19A6B" /></svg>
                <svg width="60" height="10" viewBox="0 0 120 20" fill="none">
                  <path d="M0 10 Q20 18 40 10 Q60 2 80 10 Q100 18 120 10" stroke={dark ? '#C19A6B' : '#8B5E3C'} strokeWidth="1.5" fill="none" opacity="0.7"/>
                </svg>
              </div>

              {/* Surah name in rectangle frame */}
              <div
                className="inline-block px-8 py-2 mx-auto mb-2"
                style={{
                  border: `1.5px solid ${dark ? 'rgba(193,154,107,0.5)' : 'rgba(139,94,60,0.6)'}`,
                  borderRadius: '4px',
                  background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(253,245,228,0.9)',
                  boxShadow: `inset 0 1px 0 ${dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)'}`,
                }}
              >
                <h2 className="text-2xl tracking-widest" style={{ fontFamily: '"Scheherazade New", "Amiri Quran", serif', color: C.surahTitle, letterSpacing: '0.12em' }}>
                  سُورَةُ {surahName}
                </h2>
              </div>

              {selectedSurah !== 1 && selectedSurah !== 9 && (
                <p className="text-xl mt-1 block" style={{ fontFamily: '"Scheherazade New", "Amiri Quran", serif', color: C.bismillah, lineHeight: 2.2 }}>
                  بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ
                </p>
              )}

              {/* Decorative bottom */}
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="h-px flex-1 max-w-20" style={{ background: `linear-gradient(to right, transparent, ${dark ? 'rgba(193,154,107,0.5)' : 'rgba(139,94,60,0.5)'})` }} />
                <div className="w-1 h-1 rounded-full" style={{ background: '#C19A6B', opacity: 0.5 }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B' }} />
                <div className="w-1 h-1 rounded-full" style={{ background: '#C19A6B', opacity: 0.5 }} />
                <div className="h-px flex-1 max-w-20" style={{ background: `linear-gradient(to left, transparent, ${dark ? 'rgba(193,154,107,0.5)' : 'rgba(139,94,60,0.5)'})` }} />
              </div>
            </div>

            {/* Ayah text body */}
            <div
              className="px-5 py-6 text-justify relative"
              style={{
                fontFamily: '"Scheherazade New", "Amiri Quran", "Amiri", serif',
                color: C.ayahText,
                direction: 'rtl',
                fontSize: `${fontSize}rem`,
                lineHeight,
              }}
            >
              {surahData?.ayahs?.map((ayah: any) => {
                let text: string = ayah.text;
                if (selectedSurah !== 1 && ayah.numberInSurah === 1) {
                  text = text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ', '');
                }
                const isBookmarked = bookmark?.surah === selectedSurah && bookmark?.ayah === ayah.numberInSurah;
                const isSelected = selectedAyah === ayah.numberInSurah;
                const isActive = activeAyah === ayah.numberInSurah;

                // Listen mode: clickable words
                if (mode === 'listen') {
                  const wordList = text.split(/\s+/).filter(Boolean);
                  return (
                    <span
                      key={ayah.numberInSurah}
                      data-ayah={ayah.numberInSurah}
                      data-juz={ayah.juz ?? (selectedSurah ? lookupJuz(selectedSurah, ayah.numberInSurah) : undefined)}
                      data-hizb={ayah.hizbQuarter ?? (selectedSurah ? lookupHizbQuarter(selectedSurah, ayah.numberInSurah) : undefined)}
                    >
                      {wordList.map((word, wi) => {
                        const wordKey = `${selectedSurah}:${ayah.numberInSurah}:${wi + 1}`;
                        const isWordPlaying = playingWord === wordKey;
                        return (
                          <span
                            key={wi}
                            onClick={() => handleWordClick(ayah.numberInSurah, wi + 1)}
                            className="cursor-pointer px-0.5 rounded-sm transition-all duration-150"
                            style={{
                              background: isWordPlaying ? 'rgba(193,154,107,0.5)' : 'transparent',
                              color: isWordPlaying ? (dark ? '#fff' : '#2C1E16') : undefined,
                            }}
                          >
                            {word}{' '}
                          </span>
                        );
                      })}
                      <AyahMarker num={ayah.numberInSurah} bookmarked={isBookmarked} dark={dark} />
                    </span>
                  );
                }

                // Normal / tafsir mode
                return (
                  <span
                    key={ayah.numberInSurah}
                    data-ayah={ayah.numberInSurah}
                    data-juz={ayah.juz ?? (selectedSurah ? lookupJuz(selectedSurah, ayah.numberInSurah) : undefined)}
                    data-hizb={ayah.hizbQuarter ?? (selectedSurah ? lookupHizbQuarter(selectedSurah, ayah.numberInSurah) : undefined)}
                    onClick={() => handleAyahClick(ayah.numberInSurah)}
                    className="inline cursor-pointer transition-all duration-200 rounded-sm"
                    style={{
                      background: isSelected
                        ? 'rgba(193,154,107,0.18)'
                        : isActive
                        ? 'rgba(193,154,107,0.22)'
                        : isBookmarked
                        ? 'rgba(193,154,107,0.1)'
                        : 'transparent',
                      borderBottom: isSelected
                        ? '2px solid rgba(193,154,107,0.7)'
                        : isActive
                        ? '2px solid #C19A6B'
                        : 'none',
                      paddingInline: '2px',
                    }}
                  >
                    {text}
                    <AyahMarker num={ayah.numberInSurah} bookmarked={isBookmarked} dark={dark} />
                    {/* Inline action buttons when selected */}
                    {isSelected && mode === 'normal' && (
                      <span className="inline-flex items-center gap-1 mr-1 align-middle" style={{ verticalAlign: 'middle' }}>
                        <button
                          onClick={e => { e.stopPropagation(); saveBookmark(ayah.numberInSurah); }}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-all active:scale-90"
                          style={{
                            background: '#C19A6B',
                            color: '#0f0c07',
                            fontFamily: '"Tajawal", sans-serif',
                            fontSize: '0.6rem',
                            lineHeight: '1.6',
                          }}
                        >
                          <Bookmark className="w-2.5 h-2.5 fill-current" />
                          حفظ
                        </button>
                        <AyahCopyButton
                          text={ayah.text}
                          surahName={surahName}
                          ayahNum={ayah.numberInSurah}
                          dark={dark}
                        />
                        <button
                          onClick={e => { e.stopPropagation(); shareAyah(ayah.text, surahName, ayah.numberInSurah); }}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-all active:scale-90"
                          style={{
                            background: dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.15)',
                            border: '1px solid rgba(193,154,107,0.35)',
                            color: dark ? '#E8C98A' : '#6B4820',
                            fontFamily: '"Tajawal", sans-serif',
                            fontSize: '0.6rem',
                            lineHeight: '1.6',
                          }}
                        >
                          <Share2 className="w-2.5 h-2.5" />
                          مشاركة
                        </button>
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Bottom ornamental border - Madinah Mushaf style */}
            <div style={{ height: '3px', background: dark ? '#5a3e18' : '#8B5E3C' }} />
            <div style={{ height: '8px', background: `linear-gradient(90deg, ${dark ? '#3d2a0a' : '#5c3518'} 0%, #C19A6B 15%, #f0c040 30%, #C19A6B 50%, #f0c040 70%, #C19A6B 85%, ${dark ? '#3d2a0a' : '#5c3518'} 100%)` }} />
            <div style={{ height: '3px', background: dark ? '#5a3e18' : '#8B5E3C' }} />
          </div>
        )}
      </div>

      {/* ── Tafsir modal ── */}
      <Dialog.Root
        open={mode === 'tafsir' && !!activeAyah && !!tafsirData}
        onOpenChange={open => { if (!open) setActiveAyah(null); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed bottom-0 left-0 right-0 max-h-[75vh] rounded-t-3xl p-6 z-50 overflow-y-auto shadow-2xl"
            dir="rtl"
            style={{ background: C.modalBg, border: `1px solid ${C.modalBorder}`, borderBottom: 'none' }}
          >
            <div className="w-12 h-1.5 rounded-full mx-auto mb-5" style={{ background: 'rgba(193,154,107,0.4)' }} />
            <Dialog.Title className="text-base font-bold mb-4" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
              التفسير الميسر — الآية {activeAyah}
            </Dialog.Title>
            <div
              className="text-lg leading-loose"
              style={{ fontFamily: '"Amiri", serif', color: C.modalText }}
              dangerouslySetInnerHTML={{ __html: tafsirData?.text ?? 'جاري التحميل...' }}
            />
            <button
              onClick={() => setActiveAyah(null)}
              className="mt-6 w-full py-3 rounded-2xl font-bold transition-all"
              style={{ background: '#C19A6B', color: '#0f0c07', fontFamily: '"Tajawal", sans-serif' }}
            >
              إغلاق
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
