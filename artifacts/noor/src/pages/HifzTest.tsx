import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, BookOpen, RotateCcw, Trophy, CheckCircle, XCircle,
  Volume2, VolumeX, Star, ChevronDown,
} from 'lucide-react';
import { useUserSetting } from '@/hooks/use-user-setting';
import { auth } from '@/lib/firebase';
import { queueRTDBUpdate, getCacheValue } from '@/lib/rtdb';

/* ═══════════════════════════════════════════════════════════════
   RECITERS
═══════════════════════════════════════════════════════════════ */
const RECITERS = [
  { id: 'alafasy',    name: 'مشاري العفاسي',          baseUrl: 'https://www.everyayah.com/data/Alafasy_64kbps/' },
  { id: 'husary',     name: 'محمود خليل الحصري',       baseUrl: 'https://www.everyayah.com/data/Husary_64kbps/' },
  { id: 'minshawi',   name: 'محمد صديق المنشاوي',      baseUrl: 'https://www.everyayah.com/data/Minshawy_Murattal_128kbps/' },
  { id: 'basit',      name: 'عبد الباسط عبد الصمد',   baseUrl: 'https://www.everyayah.com/data/Abdul_Basit_Murattal_64kbps/' },
  { id: 'maher',      name: 'ماهر المعيقلي',           baseUrl: 'https://www.everyayah.com/data/Maher_AlMuaiqly_64kbps/' },
  { id: 'shuraym',    name: 'سعود الشريم',             baseUrl: 'https://www.everyayah.com/data/Saood_ash-Shuraym_64kbps/' },
  { id: 'dussary',    name: 'ياسر الدوسري',            baseUrl: 'https://www.everyayah.com/data/Yasser_Ad-Dussary_128kbps/' },
  { id: 'banna',      name: 'محمود علي البنا',         baseUrl: 'https://www.everyayah.com/data/Mahmoud_Ali_Al_Banna_32kbps/' },
  { id: 'hudhaify',   name: 'علي الحذيفي',             baseUrl: 'https://www.everyayah.com/data/Hudhaify_64kbps/' },
  { id: 'akhdar',     name: 'إبراهيم الأخضر',          baseUrl: 'https://www.everyayah.com/data/Ibrahim_Akhdar_32kbps/' },
  { id: 'ajmy',       name: 'أحمد بن علي العجمي',     baseUrl: 'https://www.everyayah.com/data/ahmed_ibn_ali_al_ajamy_128kbps/' },
  { id: 'katamy',     name: 'ناصر القطامي',            baseUrl: 'https://www.everyayah.com/data/Nasser_Alqatami_128kbps/' },
  { id: 'shaatree',   name: 'أبو بكر الشاطري',         baseUrl: 'https://www.everyayah.com/data/Abu_Bakr_Ash-Shaatree_64kbps/' },
  { id: 'basfar',     name: 'عبد الله بصفر',           baseUrl: 'https://www.everyayah.com/data/Abdullah_Basfar_64kbps/' },
] as const;

const RECITER_STORAGE_KEY = 'noor_hifz_reciter_id';
const DEFAULT_RECITER_ID = 'alafasy';

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
interface VerseData {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

interface TestQuestion {
  verseKey: string;
  surahNum: number;
  verseNum: number;
  verseText: string;
  blankWord: string;
  wordIndex: number;
  allWords: string[];
  choices: string[];
  correctIndex: number;
  audioUrl: string;
}

type Rating = 'ضعيف' | 'متوسط' | 'ممتاز';
type Screen = 'surahs' | 'tests' | 'question' | 'results';

/* ═══════════════════════════════════════════════════════════════
   SURAH DATA
═══════════════════════════════════════════════════════════════ */
const SURAH_INFO: { name: string; count: number }[] = [
  { name: 'الفاتحة', count: 7 }, { name: 'البقرة', count: 286 },
  { name: 'آل عمران', count: 200 }, { name: 'النساء', count: 176 },
  { name: 'المائدة', count: 120 }, { name: 'الأنعام', count: 165 },
  { name: 'الأعراف', count: 206 }, { name: 'الأنفال', count: 75 },
  { name: 'التوبة', count: 129 }, { name: 'يونس', count: 109 },
  { name: 'هود', count: 123 }, { name: 'يوسف', count: 111 },
  { name: 'الرعد', count: 43 }, { name: 'إبراهيم', count: 52 },
  { name: 'الحجر', count: 99 }, { name: 'النحل', count: 128 },
  { name: 'الإسراء', count: 111 }, { name: 'الكهف', count: 110 },
  { name: 'مريم', count: 98 }, { name: 'طه', count: 135 },
  { name: 'الأنبياء', count: 112 }, { name: 'الحج', count: 78 },
  { name: 'المؤمنون', count: 118 }, { name: 'النور', count: 64 },
  { name: 'الفرقان', count: 77 }, { name: 'الشعراء', count: 227 },
  { name: 'النمل', count: 93 }, { name: 'القصص', count: 88 },
  { name: 'العنكبوت', count: 69 }, { name: 'الروم', count: 60 },
  { name: 'لقمان', count: 34 }, { name: 'السجدة', count: 30 },
  { name: 'الأحزاب', count: 73 }, { name: 'سبأ', count: 54 },
  { name: 'فاطر', count: 45 }, { name: 'يس', count: 83 },
  { name: 'الصافات', count: 182 }, { name: 'ص', count: 88 },
  { name: 'الزمر', count: 75 }, { name: 'غافر', count: 85 },
  { name: 'فصلت', count: 54 }, { name: 'الشورى', count: 53 },
  { name: 'الزخرف', count: 89 }, { name: 'الدخان', count: 59 },
  { name: 'الجاثية', count: 37 }, { name: 'الأحقاف', count: 35 },
  { name: 'محمد', count: 38 }, { name: 'الفتح', count: 29 },
  { name: 'الحجرات', count: 18 }, { name: 'ق', count: 45 },
  { name: 'الذاريات', count: 60 }, { name: 'الطور', count: 49 },
  { name: 'النجم', count: 62 }, { name: 'القمر', count: 55 },
  { name: 'الرحمن', count: 78 }, { name: 'الواقعة', count: 96 },
  { name: 'الحديد', count: 29 }, { name: 'المجادلة', count: 22 },
  { name: 'الحشر', count: 24 }, { name: 'الممتحنة', count: 13 },
  { name: 'الصف', count: 14 }, { name: 'الجمعة', count: 11 },
  { name: 'المنافقون', count: 11 }, { name: 'التغابن', count: 18 },
  { name: 'الطلاق', count: 12 }, { name: 'التحريم', count: 12 },
  { name: 'الملك', count: 30 }, { name: 'القلم', count: 52 },
  { name: 'الحاقة', count: 52 }, { name: 'المعارج', count: 44 },
  { name: 'نوح', count: 28 }, { name: 'الجن', count: 28 },
  { name: 'المزمل', count: 20 }, { name: 'المدثر', count: 56 },
  { name: 'القيامة', count: 40 }, { name: 'الإنسان', count: 31 },
  { name: 'المرسلات', count: 50 }, { name: 'النبأ', count: 40 },
  { name: 'النازعات', count: 46 }, { name: 'عبس', count: 42 },
  { name: 'التكوير', count: 29 }, { name: 'الانفطار', count: 19 },
  { name: 'المطففين', count: 36 }, { name: 'الانشقاق', count: 25 },
  { name: 'البروج', count: 22 }, { name: 'الطارق', count: 17 },
  { name: 'الأعلى', count: 19 }, { name: 'الغاشية', count: 26 },
  { name: 'الفجر', count: 30 }, { name: 'البلد', count: 20 },
  { name: 'الشمس', count: 15 }, { name: 'الليل', count: 21 },
  { name: 'الضحى', count: 11 }, { name: 'الشرح', count: 8 },
  { name: 'التين', count: 8 }, { name: 'العلق', count: 19 },
  { name: 'القدر', count: 5 }, { name: 'البينة', count: 8 },
  { name: 'الزلزلة', count: 8 }, { name: 'العاديات', count: 11 },
  { name: 'القارعة', count: 11 }, { name: 'التكاثر', count: 8 },
  { name: 'العصر', count: 3 }, { name: 'الهمزة', count: 9 },
  { name: 'الفيل', count: 5 }, { name: 'قريش', count: 4 },
  { name: 'الماعون', count: 7 }, { name: 'الكوثر', count: 3 },
  { name: 'الكافرون', count: 6 }, { name: 'النصر', count: 3 },
  { name: 'المسد', count: 5 }, { name: 'الإخلاص', count: 4 },
  { name: 'الفلق', count: 5 }, { name: 'الناس', count: 6 },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const CACHE_KEY = 'noor_quran_uthmani_v2';

// Arabic stop words / very common short function words
const STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'أن', 'إن', 'لا', 'ما', 'كل',
  'قد', 'لم', 'لن', 'بل', 'ثم', 'أو', 'هو', 'هي', 'هم', 'هن', 'هذا',
  'هذه', 'هؤلاء', 'ذلك', 'تلك', 'أولئك', 'هنا', 'هناك', 'به', 'بها',
  'لهم', 'لها', 'له', 'بهم', 'بها', 'فيه', 'فيها', 'فيهم', 'منه',
  'منها', 'منهم', 'عليه', 'عليها', 'عليهم', 'إله', 'وما', 'فما',
  'ولا', 'وإن', 'وأن', 'فإن', 'فأن', 'لما', 'كما', 'إذ', 'إذا',
]);

function stripDiacritics(word: string): string {
  // Remove Arabic diacritics and special marks
  return word.replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0670\u0671]/g, '');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getAudioUrl(surahNum: number, verseNum: number, baseUrl: string): string {
  const s = String(surahNum).padStart(3, '0');
  const v = String(verseNum).padStart(3, '0');
  return `${baseUrl}${s}${v}.mp3`;
}

function getTestCount(surahNum: number): number {
  const count = SURAH_INFO[surahNum - 1].count;
  if (count <= 8) return 1;
  return Math.ceil(count / 6);
}

function getTestVerseRange(surahNum: number, testIdx: number): [number, number] {
  const count = SURAH_INFO[surahNum - 1].count;
  if (count <= 8) return [1, count];
  const start = testIdx * 6 + 1;
  const end = Math.min(start + 5, count);
  return [start, end];
}

function getRatingLabel(correct: number, total: number): Rating {
  if (correct === total) return 'ممتاز';
  if (total - correct <= 2) return 'متوسط';
  return 'ضعيف';
}

function getRatingColor(rating: Rating | null): { bg: string; text: string; border: string } {
  if (rating === 'ممتاز') return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', border: 'rgba(34,197,94,0.4)' };
  if (rating === 'متوسط') return { bg: 'rgba(234,179,8,0.15)', text: '#d97706', border: 'rgba(234,179,8,0.4)' };
  if (rating === 'ضعيف') return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.35)' };
  return { bg: 'transparent', text: '#C19A6B', border: 'rgba(193,154,107,0.2)' };
}

/**
 * Score how similar a candidate word is to the target word.
 * Higher score = more similar (better distractor).
 * Uses: length match, shared letters, prefix/suffix similarity.
 */
function distractorSimilarityScore(candidate: string, target: string): number {
  if (candidate.length === 0 || target.length === 0) return 0;

  // Length similarity (0–35 pts) — same length is best
  const lenDiff = Math.abs(candidate.length - target.length);
  const lenScore = Math.max(0, 35 - lenDiff * 8);

  // Letter-set overlap (0–35 pts) — share same Arabic root letters
  const targetChars = new Set(target.split(''));
  let overlap = 0;
  for (const ch of candidate) {
    if (targetChars.has(ch)) overlap++;
  }
  const overlapScore = Math.round((overlap / Math.max(target.length, 1)) * 35);

  // Prefix match (0–15 pts) — same morphological prefix (1–3 chars)
  let prefixMatch = 0;
  for (let i = 0; i < Math.min(3, candidate.length, target.length); i++) {
    if (candidate[i] === target[i]) prefixMatch++;
    else break;
  }
  const prefixScore = prefixMatch * 5;

  // Suffix match (0–15 pts) — same grammatical ending (case, gender, number)
  let suffixMatch = 0;
  for (let i = 1; i <= Math.min(3, candidate.length, target.length); i++) {
    if (candidate[candidate.length - i] === target[target.length - i]) suffixMatch++;
    else break;
  }
  const suffixScore = suffixMatch * 5;

  return lenScore + overlapScore + prefixScore + suffixScore;
}

// Build a word pool from surah words for distractors
function buildWordPool(surahVerses: VerseData[], excludeWord: string): string[] {
  const strippedExclude = stripDiacritics(excludeWord);
  const seen = new Set<string>();
  const pool: { word: string; score: number }[] = [];

  for (const v of surahVerses) {
    const words = v.text_uthmani.split(/\s+/);
    for (const w of words) {
      const stripped = stripDiacritics(w);
      if (
        stripped === strippedExclude ||
        seen.has(stripped) ||
        stripped.length < 3 ||
        STOP_WORDS.has(stripped) ||
        STOP_WORDS.has(w)
      ) continue;
      seen.add(stripped);
      // Score: higher = more similar in weight/form to the correct word
      const score = distractorSimilarityScore(stripped, strippedExclude);
      pool.push({ word: w, score });
    }
  }

  // Sort by most similar first
  pool.sort((a, b) => b.score - a.score);
  return pool.map(p => p.word);
}

function buildQuestion(verse: VerseData, surahVerses: VerseData[], baseUrl: string): TestQuestion {
  const [surahNum, verseNum] = verse.verse_key.split(':').map(Number);
  const words = verse.text_uthmani.split(/\s+/).filter(w => w.length > 0);

  // Find good candidates: not too short, not stop words, prefer middle of verse
  const candidates: number[] = [];
  for (let i = 0; i < words.length; i++) {
    const stripped = stripDiacritics(words[i]);
    if (stripped.length >= 3 && !STOP_WORDS.has(stripped) && !STOP_WORDS.has(words[i])) {
      candidates.push(i);
    }
  }

  // If no suitable candidates, use any word with length > 2
  const pool2 = candidates.length > 0
    ? candidates
    : words.map((_, i) => i).filter(i => words[i].length > 2);

  // Pick from middle portion of candidates for better questions
  let chosenIdx: number;
  if (pool2.length === 0) {
    chosenIdx = Math.floor(words.length / 2);
  } else {
    const midStart = Math.floor(pool2.length * 0.2);
    const midEnd = Math.floor(pool2.length * 0.8);
    const midPool = pool2.slice(midStart, midEnd + 1);
    const selectedPool = midPool.length > 0 ? midPool : pool2;
    chosenIdx = selectedPool[Math.floor(Math.random() * selectedPool.length)];
  }

  const blankWord = words[chosenIdx];

  // Get distractors from surah — pick from the top-scored pool
  // but ensure the two distractors are sufficiently different from each other
  const wordPool = buildWordPool(surahVerses, blankWord);
  const distractors: string[] = [];
  for (const candidate of wordPool) {
    if (distractors.length >= 2) break;
    const strippedCandidate = stripDiacritics(candidate);
    // Don't let the two distractors be nearly identical to each other
    const tooSimilarToChosen = distractors.some(chosen => {
      const strippedChosen = stripDiacritics(chosen);
      const sim = distractorSimilarityScore(strippedCandidate, strippedChosen);
      return sim > 70; // similarity threshold between distractors
    });
    if (!tooSimilarToChosen) {
      distractors.push(candidate);
    }
  }

  // Fallback: use words from the verse itself
  if (distractors.length < 2) {
    for (const w of shuffle([...words])) {
      if (distractors.length >= 2) break;
      if (stripDiacritics(w) !== stripDiacritics(blankWord) && !distractors.some(d => stripDiacritics(d) === stripDiacritics(w))) {
        distractors.push(w);
      }
    }
  }
  if (distractors.length < 2) {
    distractors.push('...');
  }

  const choices = shuffle([blankWord, ...distractors.slice(0, 2)]);
  const correctIndex = choices.indexOf(blankWord);

  return {
    verseKey: verse.verse_key,
    surahNum,
    verseNum,
    verseText: verse.text_uthmani,
    blankWord,
    wordIndex: chosenIdx,
    allWords: words,
    choices,
    correctIndex,
    audioUrl: getAudioUrl(surahNum, verseNum, baseUrl),
  };
}

async function fetchQuranData(): Promise<Record<string, VerseData[]>> {
  // 1. Try localStorage cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && parsed['1']) return parsed;
    }
  } catch {}

  // 2. Try local file (offline-first)
  try {
    const localRes = await fetch('/data/quran-uthmani-full.json');
    if (localRes.ok) {
      const verses: VerseData[] = await localRes.json();
      const bySurah: Record<string, VerseData[]> = {};
      for (const v of verses) {
        const sNum = v.verse_key.split(':')[0];
        if (!bySurah[sNum]) bySurah[sNum] = [];
        bySurah[sNum].push(v);
      }
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(bySurah)); } catch {}
      return bySurah;
    }
  } catch {}

  // 3. Try alquran.cloud (same source used in Quran page)
  try {
    const cloudRes = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
    if (cloudRes.ok) {
      const cloudData = await cloudRes.json();
      const bySurah: Record<string, VerseData[]> = {};
      let id = 1;
      for (const surah of cloudData.data.surahs) {
        const sNum = String(surah.number);
        bySurah[sNum] = surah.ayahs.map((a: { numberInSurah: number; text: string }) => ({
          id: id++,
          verse_key: `${surah.number}:${a.numberInSurah}`,
          text_uthmani: a.text,
        }));
      }
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(bySurah)); } catch {}
      return bySurah;
    }
  } catch {}

  // 4. Fallback: quran.com API
  const res = await fetch('https://api.quran.com/api/v4/quran/verses/uthmani');
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const verses: VerseData[] = data.verses ?? [];
  const bySurah: Record<string, VerseData[]> = {};
  for (const v of verses) {
    const sNum = v.verse_key.split(':')[0];
    if (!bySurah[sNum]) bySurah[sNum] = [];
    bySurah[sNum].push(v);
  }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(bySurah)); } catch {}
  return bySurah;
}

/* ═══════════════════════════════════════════════════════════════
   VERSE DISPLAY COMPONENT
═══════════════════════════════════════════════════════════════ */
function VerseWithBlank({ words, blankIdx, answered, correct, dark }: {
  words: string[];
  blankIdx: number;
  answered: boolean;
  correct: boolean;
  dark: boolean;
}) {
  return (
    <p
      dir="rtl"
      className="leading-loose text-center text-xl"
      style={{
        fontFamily: '"Scheherazade New", "Amiri", serif',
        lineHeight: '2.4',
        color: dark ? '#d4b483' : '#2d1a00',
      }}
    >
      {words.map((w, i) => {
        if (i !== blankIdx) return <span key={i}>{w} </span>;
        if (!answered) {
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                minWidth: '4em',
                borderBottom: `2.5px dashed ${dark ? '#C19A6B' : '#8B6340'}`,
                margin: '0 4px',
                color: 'transparent',
                background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)',
                borderRadius: '4px',
                padding: '0 0.3em',
                verticalAlign: 'middle',
              }}
            >
              {w}
            </span>
          );
        }
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              margin: '0 4px',
              padding: '0 0.3em',
              borderRadius: '6px',
              background: correct ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.15)',
              color: correct
                ? (dark ? '#4ade80' : '#166534')
                : (dark ? '#f87171' : '#991b1b'),
              border: `1px solid ${correct ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            }}
          >
            {w}{' '}
          </span>
        );
      })}
    </p>
  );
}

/* ── Linen SVG texture card background ───────────────────────── */
function LinenBg({ dark }: { dark: boolean }) {
  const base = dark ? '#1C1108' : '#D0BC9C';
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="linen-tex" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.85 0.6" numOctaves="4" seed="12" stitchTiles="stitch" result="n"/>
          <feColorMatrix in="n" type="matrix"
            values={dark
              ? "0 0 0 0 0.12  0 0 0 0 0.09  0 0 0 0 0.04  0 0 0 0.55 0"
              : "0 0 0 0 0.78  0 0 0 0 0.69  0 0 0 0 0.55  0 0 0 0.48 0"
            }
          />
        </filter>
        <pattern id="linen-warp" width="3" height="1" patternUnits="userSpaceOnUse">
          <rect width="3" height="0.45" y="0.28" fill={dark ? 'rgba(80,50,20,0.5)' : 'rgba(140,110,70,0.25)'}/>
        </pattern>
        <pattern id="linen-weft" width="1" height="3" patternUnits="userSpaceOnUse">
          <rect width="0.45" height="3" x="0.28" fill={dark ? 'rgba(80,50,20,0.3)' : 'rgba(140,110,70,0.16)'}/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={base}/>
      <rect width="100%" height="100%" fill="url(#linen-warp)"/>
      <rect width="100%" height="100%" fill="url(#linen-weft)"/>
      <rect width="100%" height="100%" filter="url(#linen-tex)" opacity="0.55"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export function HifzTest() {
  const [, navigate] = useLocation();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  // Quran data
  const [quranData, setQuranData] = useState<Record<string, VerseData[]> | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [screen, setScreen] = useState<Screen>('surahs');
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedTest, setSelectedTest] = useState<number>(0);

  // Reciter state
  const [reciterId, setReciterId] = useState<string>(() => {
    try { return localStorage.getItem(RECITER_STORAGE_KEY) ?? DEFAULT_RECITER_ID; } catch { return DEFAULT_RECITER_ID; }
  });
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const currentReciter = RECITERS.find(r => r.id === reciterId) ?? RECITERS[0];

  const selectReciter = useCallback((id: string) => {
    setReciterId(id);
    setReciterPickerOpen(false);
    try { localStorage.setItem(RECITER_STORAGE_KEY, id); } catch {}
  }, []);

  // Quiz state
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ratings from Firebase cache
  const [ratingsVersion, setRatingsVersion] = useState(0);

  // Load Quran data once
  useEffect(() => {
    fetchQuranData()
      .then(data => { setQuranData(data); setLoading(false); })
      .catch(e => { setLoadError(e.message); setLoading(false); });
  }, []);

  // Colors
  const bg = dark ? '#0f0c07' : '#FDFBF0';
  const cardBg = dark ? '#1a1208' : '#fff';
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';
  const textPrimary = dark ? '#d4b483' : '#3d2000';
  const textSec = dark ? '#8B6B3D' : '#9E7B4A';

  const getStoredRating = useCallback((surahNum: number, testIdx: number): Rating | null => {
    return getCacheValue<Rating | null>(`hifz_results/${surahNum}_${testIdx}`, null);
  }, [ratingsVersion]);

  const saveRating = useCallback((surahNum: number, testIdx: number, rating: Rating) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    queueRTDBUpdate(uid, { [`hifz_results/${surahNum}_${testIdx}`]: rating });
    setRatingsVersion(v => v + 1);
  }, []);

  // Stop audio when navigating
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setAudioPlaying(false);
    setAudioEnded(false);
  }, []);

  const playAudio = useCallback((url: string) => {
    stopAudio();
    const audio = new Audio(url);
    audioRef.current = audio;
    setAudioPlaying(true);
    setAudioEnded(false);
    audio.play().catch(() => {
      setAudioPlaying(false);
      setAudioEnded(true);
    });
    audio.onended = () => {
      setAudioPlaying(false);
      setAudioEnded(true);
    };
    audio.onerror = () => {
      setAudioPlaying(false);
      setAudioEnded(true);
    };
  }, [stopAudio]);

  // Start a test
  const startTest = useCallback((surahNum: number, testIdx: number) => {
    if (!quranData) return;
    const surahVerses = quranData[String(surahNum)] ?? [];
    const [rangeStart, rangeEnd] = getTestVerseRange(surahNum, testIdx);
    const testVerses = surahVerses.filter(v => {
      const vNum = parseInt(v.verse_key.split(':')[1], 10);
      return vNum >= rangeStart && vNum <= rangeEnd;
    });
    const reciter = RECITERS.find(r => r.id === reciterId) ?? RECITERS[0];
    const qs = testVerses.map(v => buildQuestion(v, surahVerses, reciter.baseUrl));
    setQuestions(qs);
    setSelectedSurah(surahNum);
    setSelectedTest(testIdx);
    setQIndex(0);
    setSelectedChoice(null);
    setCorrectAnswers(0);
    setAnswers([]);
    setAudioPlaying(false);
    setAudioEnded(false);
    setScreen('question');
  }, [quranData, reciterId]);

  // Handle answer selection
  const handleAnswer = useCallback((choiceIdx: number) => {
    if (selectedChoice !== null) return;
    stopAudio();
    setSelectedChoice(choiceIdx);
    const correct = choiceIdx === questions[qIndex].correctIndex;
    if (correct) setCorrectAnswers(c => c + 1);
    setAnswers(a => [...a, correct]);
    // Play audio after answering — doesn't block navigation
    const url = getAudioUrl(questions[qIndex].surahNum, questions[qIndex].verseNum, currentReciter.baseUrl);
    playAudio(url);
  }, [selectedChoice, questions, qIndex, playAudio, stopAudio, currentReciter]);

  // Go to next question — always allowed even if audio is still playing
  const handleNext = useCallback(() => {
    stopAudio();
    if (qIndex + 1 >= questions.length) {
      // Show results
      const total = questions.length;
      const correct = correctAnswers + (selectedChoice === questions[qIndex].correctIndex ? 0 : 0);
      const finalCorrect = answers.filter(Boolean).length;
      const rating = getRatingLabel(finalCorrect, total);
      saveRating(selectedSurah, selectedTest, rating);
      setScreen('results');
    } else {
      setQIndex(i => i + 1);
      setSelectedChoice(null);
      setAudioPlaying(false);
      setAudioEnded(false);
    }
  }, [audioPlaying, qIndex, questions, answers, correctAnswers, selectedSurah, selectedTest, saveRating, stopAudio]);

  const handleBack = () => {
    stopAudio();
    if (screen === 'tests') setScreen('surahs');
    else if (screen === 'question' || screen === 'results') setScreen('tests');
    else navigate('/more');
  };

  // Get surah completion status
  const getSurahStats = (surahNum: number) => {
    const totalTests = getTestCount(surahNum);
    let done = 0;
    let best: Rating | null = null;
    const ratingOrder: Record<Rating, number> = { 'ضعيف': 0, 'متوسط': 1, 'ممتاز': 2 };
    for (let i = 0; i < totalTests; i++) {
      const r = getStoredRating(surahNum, i);
      if (r) {
        done++;
        if (!best || ratingOrder[r] > ratingOrder[best]) best = r;
      }
    }
    return { done, total: totalTests, best };
  };

  const finalScore = answers.filter(Boolean).length;
  const finalRating = getRatingLabel(finalScore, questions.length);

  // Header title
  const headerTitle =
    screen === 'surahs' ? 'اختبار الحفظ' :
    screen === 'tests' ? `سورة ${SURAH_INFO[selectedSurah - 1]?.name}` :
    screen === 'question' ? `سورة ${SURAH_INFO[selectedSurah - 1]?.name}` :
    'نتيجة الاختبار';

  return (
    <div
      className="min-h-screen pb-24"
      dir="rtl"
      style={{
        background: screen === 'question' ? (dark ? '#160E05' : '#CCB894') : bg,
        backgroundImage: screen === 'question'
          ? (dark
            ? 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(55,30,8,0.45) 2px,rgba(55,30,8,0.45) 3px),repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(55,30,8,0.28) 3px,rgba(55,30,8,0.28) 4px)'
            : 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(120,90,50,0.15) 2px,rgba(120,90,50,0.15) 3px),repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(120,90,50,0.1) 3px,rgba(120,90,50,0.1) 4px)')
          : 'none',
      }}
    >
      {/* Audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 pt-4 pb-3"
        style={{ background: bg, borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(193,154,107,0.12)' }}
            data-testid="button-back"
          >
            <ChevronLeft size={20} className="text-[#C19A6B]" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-bold truncate"
              style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}
            >
              {headerTitle}
            </h1>
            {screen === 'question' && (
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                سؤال {qIndex + 1} من {questions.length} • الاختبار {selectedTest + 1}
              </p>
            )}
          </div>
          <BookOpen size={22} className="text-[#C19A6B] flex-shrink-0" />
        </div>

        {/* Progress bar */}
        {screen === 'question' && (
          <div className="max-w-lg mx-auto mt-2">
            <div className="h-1.5 rounded-full" style={{ background: dark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.15)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#C19A6B,#8B6340)' }}
                animate={{ width: `${((qIndex + (selectedChoice !== null ? 1 : 0)) / questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center pt-20 gap-4">
            <div className="w-12 h-12 border-4 border-[#C19A6B]/20 border-t-[#C19A6B] rounded-full animate-spin" />
            <p className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
              جاري تحميل القرآن الكريم...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && loadError && (
          <div className="text-center pt-20 px-4">
            <p className="text-base mb-4" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>
              تعذّر تحميل البيانات. تحقق من الاتصال بالإنترنت.
            </p>
            <button
              onClick={() => { setLoading(true); setLoadError(''); fetchQuranData().then(d => { setQuranData(d); setLoading(false); }).catch(e => { setLoadError(e.message); setLoading(false); }); }}
              className="px-6 py-3 rounded-2xl text-white font-bold"
              style={{ background: 'linear-gradient(135deg,#8B6340,#C19A6B)', fontFamily: '"Tajawal", sans-serif' }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── SURAH LIST ── */}
          {!loading && !loadError && screen === 'surahs' && (
            <motion.div
              key="surahs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-xs mb-4 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                اختر السورة التي تريد اختبار حفظها
              </p>

              <div className="flex flex-col gap-2">
                {SURAH_INFO.map((surah, idx) => {
                  const surahNum = idx + 1;
                  const stats = getSurahStats(surahNum);
                  const rColor = stats.best ? getRatingColor(stats.best) : null;
                  return (
                    <motion.button
                      key={surahNum}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedSurah(surahNum); setScreen('tests'); }}
                      className="w-full text-right p-3 rounded-2xl flex items-center gap-3"
                      style={{ background: cardBg, border: `1px solid ${border}` }}
                      data-testid={`button-surah-${surahNum}`}
                    >
                      {/* Surah number */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{
                          background: 'rgba(193,154,107,0.12)',
                          color: '#C19A6B',
                          fontFamily: '"Tajawal", sans-serif',
                        }}
                      >
                        {surahNum}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-bold text-base"
                            style={{ fontFamily: '"Scheherazade New", "Amiri", serif', color: textPrimary }}
                          >
                            {surah.name}
                          </span>
                          {stats.best && rColor && (
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: rColor.bg, color: rColor.text, border: `1px solid ${rColor.border}` }}
                            >
                              {stats.best}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                          {surah.count} آية • {stats.total} اختبار
                          {stats.done > 0 && ` • أكملت ${stats.done} من ${stats.total}`}
                        </p>
                      </div>

                      <ChevronLeft size={16} className="text-[#C19A6B]/50 flex-shrink-0" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Bottom verse */}
              <div className="mt-8 mb-4 text-center px-2">
                <div className="h-px mb-4" style={{ background: `linear-gradient(to left, transparent, rgba(193,154,107,0.3), transparent)` }} />
                <p
                  className="text-base leading-loose"
                  style={{ fontFamily: '"Amiri", serif', color: dark ? '#8B6B3D' : '#B8946A' }}
                >
                  وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ
                </p>
                <p className="text-xs mt-1" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>القمر: 17</p>
              </div>
            </motion.div>
          )}

          {/* ── TEST LIST ── */}
          {!loading && !loadError && screen === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-4 p-4 rounded-2xl text-center" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <p
                  className="text-2xl mb-1"
                  style={{ fontFamily: '"Scheherazade New", "Amiri", serif', color: textPrimary }}
                >
                  سورة {SURAH_INFO[selectedSurah - 1]?.name}
                </p>
                <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                  {SURAH_INFO[selectedSurah - 1]?.count} آية •{' '}
                  {getTestCount(selectedSurah)} اختبار
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {Array.from({ length: getTestCount(selectedSurah) }, (_, i) => {
                  const [rangeStart, rangeEnd] = getTestVerseRange(selectedSurah, i);
                  const rating = getStoredRating(selectedSurah, i);
                  const rColor = getRatingColor(rating);
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => startTest(selectedSurah, i)}
                      className="w-full text-right p-4 rounded-2xl flex items-center justify-between"
                      style={{ background: cardBg, border: `1.5px solid ${rating ? rColor.border : border}` }}
                      data-testid={`button-test-${i}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className="font-bold text-base"
                            style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}
                          >
                            الاختبار {i + 1}
                          </p>
                          {rating && (
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: rColor.bg, color: rColor.text, border: `1px solid ${rColor.border}` }}
                            >
                              {rating}
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                          الآيات {rangeStart} – {rangeEnd} •{' '}
                          {rangeEnd - rangeStart + 1} سؤال
                          {rating && ' • اضغط لإعادة الاختبار'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {rating
                          ? <RotateCcw size={18} className="text-[#C19A6B]/70" />
                          : <ChevronLeft size={18} className="text-[#C19A6B]/50" style={{ transform: 'rotate(180deg)' }} />
                        }
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── QUESTION ── */}
          {screen === 'question' && questions.length > 0 && (
            <motion.div
              key={`q-${qIndex}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Verse info */}
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? 'rgba(193,154,107,0.65)' : 'rgba(70,45,15,0.7)' }}>
                  {SURAH_INFO[questions[qIndex].surahNum - 1]?.name} : {questions[qIndex].verseNum}
                </span>
                <span className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? 'rgba(193,154,107,0.5)' : 'rgba(70,45,15,0.5)' }}>
                  {questions[qIndex].verseKey}
                </span>
              </div>

              {/* Verse card — linen texture */}
              <div
                className="rounded-2xl mb-5"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  border: dark ? '1.5px solid rgba(193,154,107,0.22)' : '1.5px solid rgba(100,70,30,0.32)',
                  boxShadow: dark ? 'none' : '0 6px 28px rgba(100,70,30,0.18)',
                }}
              >
                <LinenBg dark={dark} />
                <div style={{ position: 'relative', zIndex: 1, padding: '1.25rem' }}>
                  {/* Decorative rule */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, height: 1, background: dark ? 'rgba(193,154,107,0.22)' : 'rgba(100,70,30,0.22)' }}/>
                    <span style={{ fontSize: 10, fontFamily: '"Tajawal", sans-serif', color: dark ? 'rgba(193,154,107,0.6)' : 'rgba(80,50,20,0.6)', letterSpacing: '0.06em' }}>أكمل الآية الكريمة</span>
                    <div style={{ flex: 1, height: 1, background: dark ? 'rgba(193,154,107,0.22)' : 'rgba(100,70,30,0.22)' }}/>
                  </div>
                  <VerseWithBlank
                    words={questions[qIndex].allWords}
                    blankIdx={questions[qIndex].wordIndex}
                    answered={selectedChoice !== null}
                    correct={selectedChoice === questions[qIndex].correctIndex}
                    dark={dark}
                  />
                  {/* Audio indicator */}
                  {selectedChoice !== null && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      {audioPlaying
                        ? <Volume2 size={15} className="text-[#C19A6B] animate-pulse" />
                        : <VolumeX size={15} style={{ color: dark ? 'rgba(193,154,107,0.4)' : 'rgba(80,50,20,0.3)' }} />
                      }
                      <span style={{ fontFamily: '"Tajawal", sans-serif', fontSize: 11, color: dark ? 'rgba(193,154,107,0.55)' : 'rgba(80,50,20,0.5)' }}>
                        {audioPlaying ? currentReciter.name : 'انتهت التلاوة'}
                      </span>
                    </div>
                  )}
                </div>
                {/* Corner ornaments */}
                <span aria-hidden="true" style={{ position: 'absolute', top: 7, right: 10, fontSize: 10, color: dark ? 'rgba(193,154,107,0.4)' : 'rgba(100,70,30,0.38)', lineHeight: 1, userSelect: 'none' }}>✦</span>
                <span aria-hidden="true" style={{ position: 'absolute', top: 7, left: 10, fontSize: 10, color: dark ? 'rgba(193,154,107,0.4)' : 'rgba(100,70,30,0.38)', lineHeight: 1, userSelect: 'none' }}>✦</span>
                <span aria-hidden="true" style={{ position: 'absolute', bottom: 7, right: 10, fontSize: 10, color: dark ? 'rgba(193,154,107,0.4)' : 'rgba(100,70,30,0.38)', lineHeight: 1, userSelect: 'none' }}>✦</span>
                <span aria-hidden="true" style={{ position: 'absolute', bottom: 7, left: 10, fontSize: 10, color: dark ? 'rgba(193,154,107,0.4)' : 'rgba(100,70,30,0.38)', lineHeight: 1, userSelect: 'none' }}>✦</span>
              </div>

              {/* Reciter selector */}
              <div className="relative mb-4">
                <button
                  onClick={() => setReciterPickerOpen(o => !o)}
                  className="flex items-center gap-1.5 mx-auto rounded-full px-3 py-1"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    fontSize: 12,
                    color: dark ? 'rgba(193,154,107,0.8)' : 'rgba(80,50,20,0.7)',
                    background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(100,70,30,0.07)',
                    border: `1px solid ${dark ? 'rgba(193,154,107,0.2)' : 'rgba(100,70,30,0.2)'}`,
                  }}
                  data-testid="button-reciter-picker"
                >
                  <span>{currentReciter.name}</span>
                  <ChevronDown size={12} style={{ transform: reciterPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                <AnimatePresence>
                  {reciterPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: '50%',
                        transform: 'translateX(50%)',
                        width: 260,
                        zIndex: 50,
                        borderRadius: 14,
                        overflow: 'hidden',
                        background: dark ? '#1e1408' : '#fff8ee',
                        border: `1px solid ${dark ? 'rgba(193,154,107,0.25)' : 'rgba(100,70,30,0.2)'}`,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                        maxHeight: 280,
                        overflowY: 'auto',
                      }}
                    >
                      {RECITERS.map((r, rIdx) => (
                        <button
                          key={r.id}
                          onClick={() => selectReciter(r.id)}
                          className="w-full text-right px-4 py-2.5 flex items-center justify-between gap-2"
                          style={{
                            fontFamily: '"Tajawal", sans-serif',
                            fontSize: 13,
                            color: r.id === reciterId
                              ? (dark ? '#e0c080' : '#5a3800')
                              : (dark ? 'rgba(193,154,107,0.8)' : 'rgba(80,50,20,0.8)'),
                            background: r.id === reciterId
                              ? (dark ? 'rgba(193,154,107,0.14)' : 'rgba(193,154,107,0.12)')
                              : 'transparent',
                            borderBottom: rIdx < RECITERS.length - 1
                              ? `1px solid ${dark ? 'rgba(193,154,107,0.07)' : 'rgba(100,70,30,0.07)'}`
                              : 'none',
                          }}
                          data-testid={`button-reciter-${r.id}`}
                        >
                          <span>{r.name}</span>
                          {r.id === reciterId && (
                            <CheckCircle size={13} style={{ color: '#C19A6B', flexShrink: 0 }} />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Choices */}
              <div className="flex flex-col gap-3">
                {questions[qIndex].choices.map((choice, idx) => {
                  const isCorrect = idx === questions[qIndex].correctIndex;
                  const isSelected = idx === selectedChoice;
                  let bgStyle: string;
                  let borderStyle: string;
                  let textColor: string;

                  if (selectedChoice === null) {
                    bgStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.48)';
                    borderStyle = dark ? 'rgba(193,154,107,0.22)' : 'rgba(100,70,30,0.3)';
                    textColor = dark ? '#D4B070' : '#2D1400';
                  } else if (isCorrect) {
                    bgStyle = 'rgba(34,197,94,0.18)';
                    borderStyle = 'rgba(34,197,94,0.5)';
                    textColor = dark ? '#4ade80' : '#166534';
                  } else if (isSelected) {
                    bgStyle = 'rgba(239,68,68,0.15)';
                    borderStyle = 'rgba(239,68,68,0.5)';
                    textColor = dark ? '#f87171' : '#991b1b';
                  } else {
                    bgStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.28)';
                    borderStyle = dark ? 'rgba(193,154,107,0.12)' : 'rgba(100,70,30,0.15)';
                    textColor = dark ? 'rgba(193,154,107,0.45)' : 'rgba(80,50,20,0.45)';
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileTap={selectedChoice === null ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedChoice !== null}
                      className="w-full text-center p-4 rounded-2xl flex items-center justify-between transition-all"
                      style={{
                        background: bgStyle,
                        border: `1.5px solid ${borderStyle}`,
                        backdropFilter: 'blur(6px)',
                        cursor: selectedChoice !== null ? 'default' : 'pointer',
                      }}
                      data-testid={`button-choice-${idx}`}
                    >
                      <span
                        className="flex-1 text-center text-xl"
                        style={{
                          fontFamily: '"Scheherazade New", "Amiri", serif',
                          color: textColor,
                          lineHeight: '2',
                        }}
                      >
                        {choice}
                      </span>
                      {selectedChoice !== null && isCorrect && (
                        <CheckCircle size={20} className="text-green-500 flex-shrink-0 mr-2" />
                      )}
                      {selectedChoice !== null && isSelected && !isCorrect && (
                        <XCircle size={20} className="text-red-500 flex-shrink-0 mr-2" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Next button */}
              <AnimatePresence>
                {selectedChoice !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5"
                  >
                    <button
                      onClick={handleNext}
                      className="w-full py-4 rounded-2xl font-bold text-white text-base transition-opacity"
                      style={{
                        fontFamily: '"Tajawal", sans-serif',
                        background: 'linear-gradient(135deg,#8B6340,#C19A6B)',
                      }}
                      data-testid="button-next"
                    >
                      {qIndex + 1 >= questions.length ? 'عرض النتيجة' : 'السؤال التالي →'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {screen === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              {/* Score cards */}
              <div className="flex gap-3 mb-6 mt-2">
                <div
                  className="flex-1 rounded-2xl py-5 flex flex-col items-center gap-1"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <span className="text-3xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#22c55e' }}>
                    {finalScore}
                  </span>
                  <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#22c55e' }}>
                    صحيح
                  </span>
                </div>
                <div
                  className="flex-1 rounded-2xl py-5 flex flex-col items-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <span className="text-3xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#ef4444' }}>
                    {questions.length - finalScore}
                  </span>
                  <span className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#ef4444' }}>
                    خطأ
                  </span>
                </div>
              </div>

              {/* Trophy & Rating */}
              <div className="mb-6 p-6 rounded-2xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <Trophy size={52} className="text-[#C19A6B] mx-auto mb-4" />
                <p className="text-4xl font-bold mb-2" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>
                  {finalScore} / {questions.length}
                </p>
                {(() => {
                  const rColor = getRatingColor(finalRating);
                  return (
                    <span
                      className="inline-block text-lg font-bold px-5 py-2 rounded-full mb-2"
                      style={{ background: rColor.bg, color: rColor.text, border: `2px solid ${rColor.border}` }}
                    >
                      {finalRating}
                    </span>
                  );
                })()}
                <p className="text-sm mt-2" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                  {finalRating === 'ممتاز' ? 'ما شاء الله، أحسنت!' :
                   finalRating === 'متوسط' ? 'جيد، استمر في المراجعة' :
                   'لا بأس، راجع الآيات وأعد الاختبار'}
                </p>
              </div>

              {/* Answer bubbles */}
              <div className="flex justify-center gap-2 flex-wrap mb-6">
                {answers.map((correct, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: correct ? '#22c55e' : '#ef4444' }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => startTest(selectedSurah, selectedTest)}
                  className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg,#8B6340,#C19A6B)' }}
                  data-testid="button-restart"
                >
                  <RotateCcw size={18} />
                  أعد الاختبار
                </button>
                <button
                  onClick={() => setScreen('tests')}
                  className="w-full py-4 rounded-2xl font-bold"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)',
                    color: dark ? '#C19A6B' : '#8B6340',
                    border: `1px solid ${border}`,
                  }}
                  data-testid="button-back-tests"
                >
                  اختبارات السورة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
