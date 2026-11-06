import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronFirst, ChevronLast, Bookmark, Search, Type, AlignJustify } from 'lucide-react';
import { useSurah } from '@/hooks/use-api';
import { useUserSetting } from '@/hooks/use-user-setting';
import { SURAH_NAMES } from '@/lib/constants';
import { PageHeader, EightStar, ChipTabs, GoldBar, Spinner, arNum } from '@/components/noor/kit';
import { normalizeArabic } from '@/lib/arabic-utils';
import { markAyahRead } from '@/lib/stats';
import { cn } from '@/lib/utils';

const TOTAL_QURAN_WORDS = 77430;
const PRESETS = [{ wpm: 30, label: 'تدبّر' }, { wpm: 60, label: 'هادئ' }, { wpm: 120, label: 'متوسط' }, { wpm: 200, label: 'سريع' }];

interface WordItem { word: string; ayah: number; idx: number }
type Display = 'word' | 'ayah';

function fmtMins(mins: number): string {
  if (!isFinite(mins) || mins < 0) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.max(1, Math.round(mins % 60));
  return h > 0 ? `${arNum(h)}س ${arNum(m)}د` : `${arNum(m)} د`;
}

export function SpeedReader() {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [phase, setPhase] = useState<'select' | 'read'>('select');
  const { data: surahData } = useSurah(selectedSurah);
  const [words, setWords] = useState<WordItem[]>([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [wpm, setWpm] = useUserSetting<number>('speed_reader_wpm', 60);
  const [display, setDisplay] = useUserSetting<Display>('speed_reader_display', 'word');
  const [isPlaying, setIsPlaying] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [savedProgress, setSavedProgress] = useUserSetting<{ surah: number; wordIndex: number; surahName: string } | null>('speed_reader_progress', null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAyahRef = useRef(0);

  useEffect(() => {
    if (!surahData?.ayahs) return;
    const arr: WordItem[] = [];
    let i = 0;
    surahData.ayahs.forEach((ayah: { text: string; numberInSurah: number }) => {
      let text = ayah.text;
      if (ayah.numberInSurah === 1 && selectedSurah !== 1 && selectedSurah !== 9) text = text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ', '');
      text.split(/\s+/).filter(Boolean).forEach(w => arr.push({ word: w, ayah: ayah.numberInSurah, idx: i++ }));
    });
    setWords(arr);
    setWordIndex(pendingIndex !== null ? Math.min(pendingIndex, arr.length - 1) : 0);
    setPendingIndex(null);
    setIsPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahData, selectedSurah]);

  const ayahGroups = useMemo(() => {
    const m = new Map<number, WordItem[]>();
    for (const w of words) { if (!m.has(w.ayah)) m.set(w.ayah, []); m.get(w.ayah)!.push(w); }
    return m;
  }, [words]);

  const start = useCallback((rate: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setWordIndex(prev => {
        if (prev >= words.length - 1) { if (intervalRef.current) clearInterval(intervalRef.current); setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, Math.round(60000 / rate));
  }, [words.length]);

  useEffect(() => {
    if (isPlaying) start(wpm); else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, wpm, start]);

  const cur = words[wordIndex];
  useEffect(() => {
    if (cur && cur.ayah !== lastAyahRef.current) { lastAyahRef.current = cur.ayah; markAyahRead(selectedSurah, cur.ayah); }
  }, [cur, selectedSurah]);

  const openSurah = (n: number, at?: number) => { setPendingIndex(at ?? null); setSelectedSurah(n); setPhase('read'); };

  if (phase === 'select') {
    const q = normalizeArabic(search.trim());
    const list = Array.from({ length: 114 }, (_, i) => i + 1).filter(n => !q || normalizeArabic(SURAH_NAMES[n] ?? '').includes(q) || String(n) === search.trim());
    return (
      <div className="min-h-screen flex flex-col" dir="rtl">
        <PageHeader title="قارئ التدبّر الذكي" subtitle="اقرأ كلمة بكلمة أو آية بآية بإيقاع يناسب تدبّرك" icon="quran">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن سورة..." className="noor-input" />
          </div>
        </PageHeader>
        <div className="max-w-lg mx-auto w-full px-4 pt-4 pb-10">
          {savedProgress && (
            <button onClick={() => openSurah(savedProgress.surah, savedProgress.wordIndex)}
              className="press w-full mb-4 p-4 rounded-3xl noor-card-hero flex items-center gap-3 text-right">
              <Bookmark className="w-5 h-5 text-primary fill-current" />
              <div className="flex-1">
                <p className="font-bold text-sm text-primary">متابعة من آخر توقف</p>
                <p className="text-xs text-muted-foreground">سورة {savedProgress.surahName} · الكلمة {arNum(savedProgress.wordIndex + 1)}</p>
              </div>
            </button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            {list.map(n => (
              <button key={n} onClick={() => openSurah(n)} className="press noor-card rounded-2xl p-3 flex items-center gap-3 text-right">
                <EightStar n={n} size={34} />
                <span className="font-quran text-lg text-foreground truncate">{SURAH_NAMES[n] ?? `سورة ${n}`}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const prev = words[wordIndex - 1];
  const next = words[wordIndex + 1];
  const remaining = words.length - wordIndex;
  const ayahWords = cur ? ayahGroups.get(cur.ayah) ?? [] : [];

  return (
    <div className="h-[100dvh] flex flex-col" dir="rtl">
      <PageHeader title={`سورة ${SURAH_NAMES[selectedSurah] ?? ''}`} subtitle={cur ? `الآية ${arNum(cur.ayah)} · الكلمة ${arNum(wordIndex + 1)} من ${arNum(words.length)}` : 'جارٍ التحميل…'}
        back={() => { setPhase('select'); setIsPlaying(false); }}
        right={
          <button onClick={() => setSavedProgress({ surah: selectedSurah, wordIndex, surahName: SURAH_NAMES[selectedSurah] ?? '' })} aria-label="حفظ موضعي"
            className={cn('press w-10 h-10 rounded-2xl flex items-center justify-center', savedProgress?.surah === selectedSurah && savedProgress.wordIndex === wordIndex ? 'noor-btn-gold' : 'noor-btn-ghost')}>
            <Bookmark className="w-4 h-4" />
          </button>
        }>
        <ChipTabs<Display> value={display} onChange={setDisplay} items={[
          { id: 'word', label: 'كلمة بكلمة', icon: <Type className="w-4 h-4" /> },
          { id: 'ayah', label: 'الآية كاملة', icon: <AlignJustify className="w-4 h-4" /> },
        ]} />
      </PageHeader>

      {/* Stage */}
      <div className="flex-1 flex items-center justify-center px-5 py-4 min-h-0">
        <div className="w-full max-w-lg qr-emerald qr-surface rounded-[32px] min-h-[280px] flex flex-col items-center justify-center p-6 relative overflow-hidden">
          <div className="absolute inset-0 noor-pattern" style={{ opacity: 0.05 }} />
          {!cur ? <Spinner /> : display === 'word' ? (
            <>
              <span className="relative font-quran text-2xl qr-ink opacity-25 h-10">{prev?.word ?? ''}</span>
              <span key={wordIndex} className="relative font-quran text-[3.6rem] leading-[1.4] text-gold-gradient my-3 animate-fade-up text-center"
                style={{ filter: 'drop-shadow(0 0 22px hsl(40 80% 60% / .35))' }}>{cur.word}</span>
              <span className="relative font-quran text-2xl qr-ink opacity-25 h-10">{next?.word ?? ''}</span>
              <span className="absolute bottom-4"><EightStar n={cur.ayah} size={34} /></span>
            </>
          ) : (
            <p className="relative font-quran text-[1.7rem] leading-[2.4] text-center qr-ink">
              {ayahWords.map(w => (
                <span key={w.idx} onClick={() => setWordIndex(w.idx)}
                  className={cn('px-0.5 rounded transition-colors cursor-pointer', w.idx === wordIndex ? 'text-gold-gradient' : w.idx < wordIndex ? 'opacity-90' : 'opacity-40')}>
                  {w.word}{' '}
                </span>
              ))}
              <EightStar n={cur.ayah} size={32} />
            </p>
          )}
        </div>
      </div>

      {/* Dashboard */}
      <div className="flex-shrink-0 glass rounded-t-[28px] px-4 pt-4" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-lg mx-auto">
          <GoldBar value={words.length ? (wordIndex + 1) / words.length : 0} className="mb-3" />
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div><p className="text-[10px] text-muted-foreground">السرعة</p><p className="font-bold text-primary text-sm tabular-nums">{arNum(wpm)} ك/د</p></div>
            <div><p className="text-[10px] text-muted-foreground">باقي السورة</p><p className="font-bold text-foreground text-sm">{fmtMins(remaining / wpm)}</p></div>
            <div><p className="text-[10px] text-muted-foreground">باقي الختمة</p><p className="font-bold text-muted-foreground text-sm">{fmtMins((TOTAL_QURAN_WORDS - wordIndex) / wpm)}</p></div>
          </div>
          <div className="flex gap-2 mb-3">
            {PRESETS.map(p => (
              <button key={p.wpm} onClick={() => setWpm(p.wpm)} className={cn('press flex-1 h-9 rounded-xl text-xs font-bold', wpm === p.wpm ? 'noor-btn-gold' : 'noor-btn-ghost')}>{p.label}</button>
            ))}
          </div>
          <input type="range" min={20} max={400} step={10} value={wpm} onChange={e => setWpm(Number(e.target.value))} className="w-full mb-3 accent-[hsl(var(--primary))]" />
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setWordIndex(0)} aria-label="البداية" className="press w-11 h-11 rounded-2xl noor-btn-ghost flex items-center justify-center"><ChevronLast className="w-5 h-5" /></button>
            <button onClick={() => setWordIndex(i => Math.max(0, i - 1))} aria-label="السابق" className="press w-11 h-11 rounded-2xl noor-btn-ghost flex items-center justify-center"><SkipForward className="w-5 h-5" /></button>
            <button onClick={() => setIsPlaying(p => !p)} aria-label={isPlaying ? 'إيقاف' : 'تشغيل'} className="press w-16 h-16 rounded-full noor-gold-orb flex items-center justify-center text-background">
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 translate-x-0.5" />}
            </button>
            <button onClick={() => setWordIndex(i => Math.min(words.length - 1, i + 1))} aria-label="التالي" className="press w-11 h-11 rounded-2xl noor-btn-ghost flex items-center justify-center"><SkipBack className="w-5 h-5" /></button>
            <button onClick={() => { setWordIndex(Math.max(0, words.length - 1)); setIsPlaying(false); }} aria-label="النهاية" className="press w-11 h-11 rounded-2xl noor-btn-ghost flex items-center justify-center"><ChevronFirst className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
