import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, ChevronFirst, ChevronLast, Bookmark } from 'lucide-react';
import { Link } from 'wouter';
import { useQuranSurahs, useSurah } from '@/hooks/use-api';
import { useUserSetting } from '@/hooks/use-user-setting';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { SURAH_NAMES } from '@/lib/constants';

const TOTAL_QURAN_WORDS = 77430;

interface WordItem {
  word: string;
  ayah: number;
  globalIndex: number;
}

function fmtTime(mins: number): string {
  if (!isFinite(mins) || mins < 0) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);
  if (h > 0) return `${h}س ${m}د`;
  return `${m} دقيقة`;
}

export function SpeedReader() {
  const { data: surahs } = useQuranSurahs();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [selectedSurah, setSelectedSurah] = useState(1);
  const [phase, setPhase] = useState<'select' | 'read'>('select');
  const { data: surahData } = useSurah(selectedSurah);

  const [words, setWords] = useState<WordItem[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [wpm, setWpm] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);

  const [savedProgress, setSavedProgress] = useUserSetting<{ surah: number; wordIndex: number; surahName: string } | null>(
    'speed_reader_progress', null
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Theme palette
  const C = {
    pageBg: dark ? '#0a0805' : '#FDFBF5',
    headerBg: dark ? '#0f0c07' : '#F7EDD6',
    headerBorder: dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.3)',
    text: dark ? '#e8d9b8' : '#2C1E16',
    textSecondary: dark ? 'rgba(232,217,184,0.4)' : 'rgba(44,30,22,0.4)',
    wordDisplay: dark ? '#C19A6B' : '#7a4e25',
    wordGlow: dark
      ? '0 0 40px rgba(193,154,107,0.6), 0 0 80px rgba(193,154,107,0.3)'
      : '0 0 20px rgba(193,154,107,0.3)',
    prevNextWord: dark ? '#e8d9b8' : '#2C1E16',
    btnBg: dark ? 'rgba(193,154,107,0.1)' : 'rgba(193,154,107,0.12)',
    btnBorder: dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.35)',
    progressBg: dark ? 'rgba(193,154,107,0.1)' : 'rgba(193,154,107,0.15)',
    statBg: dark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)',
    itemBg: dark ? 'rgba(255,255,255,0.04)' : 'rgba(193,154,107,0.06)',
    itemBorder: dark ? 'rgba(255,255,255,0.06)' : 'rgba(193,154,107,0.15)',
    itemBgHover: dark ? 'rgba(255,255,255,0.08)' : 'rgba(193,154,107,0.1)',
    selectedBg: 'rgba(193,154,107,0.18)',
    selectedBorder: 'rgba(193,154,107,0.4)',
  };

  // Build words array from surah data
  useEffect(() => {
    if (!surahData?.ayahs) return;
    const arr: WordItem[] = [];
    let gIdx = 0;
    surahData.ayahs.forEach((ayah: any) => {
      let text = ayah.text as string;
      if (ayah.numberInSurah === 1 && selectedSurah !== 1 && selectedSurah !== 9) {
        text = text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ', '');
      }
      const ws = text.split(/\s+/).filter(Boolean);
      ws.forEach(w => {
        arr.push({ word: w, ayah: ayah.numberInSurah, globalIndex: gIdx++ });
      });
    });
    setWords(arr);
    setWordIndex(0);
    setIsPlaying(false);
  }, [surahData, selectedSurah]);

  const startInterval = useCallback((currentWpm: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const ms = Math.round(60000 / currentWpm);
    intervalRef.current = setInterval(() => {
      setWordIndex(prev => {
        if (prev >= words.length - 1) {
          clearInterval(intervalRef.current!);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, ms);
  }, [words.length]);

  useEffect(() => {
    if (isPlaying) {
      startInterval(wpm);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, wpm, startInterval]);

  const handleWpmChange = (newWpm: number) => {
    setWpm(newWpm);
    if (isPlaying) startInterval(newWpm);
  };

  const saveBookmark = () => {
    setSavedProgress({ surah: selectedSurah, wordIndex, surahName: SURAH_NAMES[selectedSurah] ?? '' });
  };

  const currentWord = words[wordIndex];
  const prevWord = words[wordIndex - 1];
  const nextWord = words[wordIndex + 1];

  const wordsRemaining = words.length - wordIndex;
  const minsToFinishSurah = wordsRemaining / wpm;
  const wordsReadGlobal = wordIndex;
  const minsToFinishQuran = (TOTAL_QURAN_WORDS - wordsReadGlobal) / wpm;

  // ── Phase: Surah Selection ──
  if (phase === 'select') {
    return (
      <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: C.pageBg }}>
        <div className="flex items-center gap-3 p-4 border-b flex-shrink-0" style={{ background: C.headerBg, borderColor: C.headerBorder }}>
          <Link href="/more">
            <button className="p-2 rounded-full" style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}` }}>
              <ArrowLeft className="w-5 h-5" style={{ color: '#C19A6B' }} />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-lg" style={{ color: C.text, fontFamily: '"Tajawal", sans-serif' }}>قارئ التدبر الذكي</h1>
            <p className="text-xs" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>قراءة كلمة بكلمة مع التدبر</p>
          </div>
        </div>

        {savedProgress && (
          <button
            onClick={() => {
              setSelectedSurah(savedProgress.surah);
              setPhase('read');
              setTimeout(() => setWordIndex(savedProgress.wordIndex), 500);
            }}
            className="mx-4 mt-4 p-4 rounded-2xl flex items-center gap-3"
            style={{ background: 'rgba(193,154,107,0.12)', border: '1px solid rgba(193,154,107,0.35)' }}
          >
            <Bookmark className="w-5 h-5" style={{ color: '#C19A6B' }} />
            <div className="text-right">
              <p className="font-bold text-sm" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>متابعة من آخر توقف</p>
              <p className="text-xs" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>
                سورة {savedProgress.surahName} - الكلمة {savedProgress.wordIndex + 1}
              </p>
            </div>
          </button>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm mb-3" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>اختر سورة للبدء:</p>
          <div className="space-y-2 pb-6">
            {Array.from({ length: 114 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => { setSelectedSurah(num); setPhase('read'); }}
                className="w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-right"
                style={{
                  background: selectedSurah === num ? C.selectedBg : C.itemBg,
                  border: `1px solid ${selectedSurah === num ? C.selectedBorder : C.itemBorder}`,
                }}
              >
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(193,154,107,0.2)', color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
                  {num}
                </span>
                <span className="font-bold" style={{ color: C.text, fontFamily: '"Amiri", serif' }}>
                  {SURAH_NAMES[num] ?? `سورة ${num}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Reading ──
  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: C.pageBg }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ background: C.headerBg, borderColor: C.headerBorder }}>
        <button onClick={() => { setPhase('select'); setIsPlaying(false); }} className="p-2 rounded-full"
          style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}` }}>
          <ArrowLeft className="w-5 h-5" style={{ color: '#C19A6B' }} />
        </button>
        <div className="text-center">
          <p className="font-bold" style={{ color: C.text, fontFamily: '"Amiri", serif' }}>سورة {SURAH_NAMES[selectedSurah]}</p>
          <p className="text-xs" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>آية {currentWord?.ayah ?? 1}</p>
        </div>
        <button onClick={saveBookmark} title="حفظ مكاني">
          <Bookmark
            className="w-5 h-5"
            style={{
              color: savedProgress?.surah === selectedSurah && savedProgress?.wordIndex === wordIndex ? '#C19A6B' : C.textSecondary,
              fill: savedProgress?.surah === selectedSurah && savedProgress?.wordIndex === wordIndex ? '#C19A6B' : 'transparent',
            }}
          />
        </button>
      </div>

      {/* Main word display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 select-none">
        {/* Previous word */}
        <div className="h-16 flex items-center" style={{ opacity: 0.25 }}>
          {prevWord && (
            <span style={{ color: C.prevNextWord, fontFamily: '"Amiri Quran", "Amiri", serif', fontSize: '1.5rem' }}>
              {prevWord.word}
            </span>
          )}
        </div>

        {/* Current word — glowing */}
        <div className="h-40 flex items-center justify-center">
          {currentWord ? (
            <span
              style={{
                fontFamily: '"Amiri Quran", "Amiri", serif',
                fontSize: '3.75rem',
                color: C.wordDisplay,
                textAlign: 'center',
                lineHeight: 1.2,
                textShadow: C.wordGlow,
                transition: 'all 0.15s ease',
              }}
            >
              {currentWord.word}
            </span>
          ) : (
            <span style={{ color: C.textSecondary, fontSize: '1.5rem', fontFamily: '"Tajawal", sans-serif' }}>
              جاري التحميل...
            </span>
          )}
        </div>

        {/* Next word */}
        <div className="h-16 flex items-center" style={{ opacity: 0.25 }}>
          {nextWord && (
            <span style={{ color: C.prevNextWord, fontFamily: '"Amiri Quran", "Amiri", serif', fontSize: '1.5rem' }}>
              {nextWord.word}
            </span>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-t" style={{ borderColor: C.headerBorder, background: C.statBg }}>
        <div className="text-center">
          <p className="text-[10px]" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>الكلمة</p>
          <p className="font-bold text-sm" style={{ color: C.text, fontFamily: '"Tajawal", sans-serif' }}>{wordIndex + 1} / {words.length}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px]" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>باقي للسورة</p>
          <p className="font-bold text-sm" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>{fmtTime(minsToFinishSurah)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px]" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>باقي للختمة</p>
          <p className="font-bold text-sm" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>{fmtTime(minsToFinishQuran)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full relative" style={{ background: C.progressBg }}>
        <div
          className="absolute top-0 right-0 h-full rounded-full transition-all duration-300"
          style={{
            width: words.length ? `${(wordIndex / words.length) * 100}%` : '0%',
            background: 'linear-gradient(to left, #C19A6B, #8a6a3a)',
          }}
        />
      </div>

      {/* WPM Slider */}
      <div className="px-4 pt-3 pb-2" style={{ background: C.headerBg }}>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>20</span>
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={wpm}
            onChange={e => handleWpmChange(Number(e.target.value))}
            className="flex-1 h-1 rounded-full"
            style={{ accentColor: '#C19A6B' }}
          />
          <span className="text-xs" style={{ color: C.textSecondary, fontFamily: '"Tajawal", sans-serif' }}>500</span>
        </div>
        <p className="text-center font-bold mt-1" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', fontSize: '0.9rem' }}>
          {wpm} كلمة/دقيقة
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-4 pb-8 pt-3" style={{ background: C.headerBg }}>
        <button
          onClick={() => { setWordIndex(0); if (isPlaying) startInterval(wpm); }}
          className="p-3 rounded-full"
          style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}` }}
        >
          <ChevronFirst className="w-5 h-5" style={{ color: '#C19A6B' }} />
        </button>
        <button
          onClick={() => setWordIndex(i => Math.max(0, i - 1))}
          className="p-3 rounded-full"
          style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}`, opacity: wordIndex === 0 ? 0.4 : 1 }}
          disabled={wordIndex === 0}
        >
          <SkipBack className="w-5 h-5" style={{ color: '#C19A6B' }} />
        </button>

        <button
          onClick={() => setIsPlaying(p => !p)}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #C19A6B, #7a5020)', boxShadow: '0 4px 20px rgba(193,154,107,0.4)' }}
        >
          {isPlaying
            ? <Pause className="w-7 h-7" style={{ color: '#0f0c07' }} />
            : <Play className="w-7 h-7 translate-x-0.5" style={{ color: '#0f0c07' }} />
          }
        </button>

        <button
          onClick={() => setWordIndex(i => Math.min(words.length - 1, i + 1))}
          className="p-3 rounded-full"
          style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}`, opacity: wordIndex >= words.length - 1 ? 0.4 : 1 }}
          disabled={wordIndex >= words.length - 1}
        >
          <SkipForward className="w-5 h-5" style={{ color: '#C19A6B' }} />
        </button>
        <button
          onClick={() => { setWordIndex(words.length - 1); setIsPlaying(false); }}
          className="p-3 rounded-full"
          style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}` }}
        >
          <ChevronLast className="w-5 h-5" style={{ color: '#C19A6B' }} />
        </button>
      </div>
    </div>
  );
}
