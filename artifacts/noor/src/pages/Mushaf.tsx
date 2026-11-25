import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ArrowRight, Play, Pause, Copy, Share2, Bookmark, BookOpen, Sun, Moon, Minus, Plus, X, Check, ListOrdered } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { SURAH_NAMES } from '@/lib/constants';
import { useUserSetting } from '@/hooks/use-user-setting';
import { getOrCreateLocalUid, getCurrentUid, queueRTDBUpdate } from '@/lib/rtdb';
import { arNum } from '@/components/noor/kit';

/* ── Data: Madani mushaf, 604 pages ── */
type Row = [number, number, number, number, number]; // surah, ayah, page, juz, hizbQuarter
let _pages: Row[] | null = null;
let _texts: string[] | null = null;
let _tafsir: Record<string, string> | null = null;

async function loadData() {
  if (!_pages) _pages = await (await fetch('/data/quran-pages.json')).json();
  if (!_texts) {
    const raw: { text_uthmani: string }[] = await (await fetch('/data/quran-uthmani-full.json')).json();
    _texts = raw.map(r => r.text_uthmani.replace(/^\uFEFF/, ''));
  }
  return { pages: _pages!, texts: _texts! };
}

// The data file prefixes the basmala to verse 1 of every surah except Al-Fatiha and At-Tawba.
function cleanVerse(surah: number, ayah: number, text: string) {
  if (ayah === 1 && surah !== 1 && surah !== 9) {
    const words = text.split(' ');
    if (words.length > 4 && words[0].startsWith('بِسْمِ')) return words.slice(4).join(' ');
  }
  return text;
}

function audioUrl(reciter: string, s: number, a: number) {
  const base = `https://everyayah.com/data/${reciter}/${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`;
  return Capacitor.isNativePlatform() ? base : `/api/audio-proxy?url=${encodeURIComponent(base)}`;
}

const RECITERS = [
  { id: 'Alafasy_128kbps', name: 'مشاري العفاسي' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبد الباسط (مرتل)' },
  { id: 'Husary_128kbps', name: 'محمود الحصري' },
  { id: 'Minshawy_Murattal_128kbps', name: 'المنشاوي (مرتل)' },
];

const ff = '"IBM Plex Sans Arabic", "Tajawal", sans-serif';

function SurahBanner({ n }: { n: number }) {
  return (
    <div className="relative my-3 mx-auto w-full" style={{ maxWidth: 460 }}>
      <svg viewBox="0 0 460 54" className="w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={`bn${n}`} x1="0" x2="1">
            <stop offset="0" stopColor="#c9962f" /><stop offset=".5" stopColor="#f1d28b" /><stop offset="1" stopColor="#c9962f" />
          </linearGradient>
        </defs>
        <path d="M18 4h424l14 23-14 23H18L4 27z" fill="#0f3d33" stroke={`url(#bn${n})`} strokeWidth="2.5" />
        <path d="M26 10h408l9 17-9 17H26l-9-17z" fill="none" stroke="#d9b46a" strokeWidth=".9" opacity=".7" />
        <g fill="#d9b46a"><path d="M8 27l8-6v12z" /><path d="M452 27l-8-6v12z" /></g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: '"Reem Kufi", ' + ff, color: '#f6e3ad', fontSize: '1.35rem', letterSpacing: 0 }}>
          سورة {SURAH_NAMES[n]}
        </span>
      </div>
    </div>
  );
}

export function Mushaf() {
  const [, navigate] = useLocation();
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(1);
  const [dir, setDir] = useState(1);
  const [tone, setTone] = useState<'paper' | 'night'>(() => (localStorage.getItem('noor_mushaf_tone') as 'paper' | 'night') || 'paper');
  const [scale, setScale] = useUserSetting<number>('mushaf_scale', 1);
  const [bookmark, setBookmark] = useUserSetting<{ surah: number; ayah: number } | null>('quran_bookmark', null);
  const [reciter, setReciter] = useState(() => localStorage.getItem('noor_mushaf_reciter') || RECITERS[0].id);
  const [sel, setSel] = useState<{ s: number; a: number } | null>(null);
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirText, setTafsirText] = useState('');
  const [showJump, setShowJump] = useState(false);
  const [jumpTab, setJumpTab] = useState<'surah' | 'juz' | 'page'>('surah');
  const [pageInput, setPageInput] = useState('');
  const [playing, setPlaying] = useState<{ s: number; a: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [chrome, setChrome] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadData().then(({ pages }) => {
      const q = new URLSearchParams(window.location.search);
      const qp = parseInt(q.get('page') || '', 10);
      const qs = parseInt(q.get('surah') || '', 10);
      const qa = parseInt(q.get('ayah') || '1', 10);
      let start = parseInt(localStorage.getItem('noor_mushaf_page') || '1', 10) || 1;
      if (qp >= 1 && qp <= 604) start = qp;
      else if (qs >= 1 && qs <= 114) {
        const r = pages.find(x => x[0] === qs && x[1] === (qa || 1)) || pages.find(x => x[0] === qs);
        if (r) start = r[2];
        if (qa > 1) setSel({ s: qs, a: qa });
      }
      setPage(start);
      setReady(true);
    });
  }, []);

  // index: first row of every page + list by page
  const byPage = useMemo(() => {
    if (!ready || !_pages) return [] as Row[][];
    const out: Row[][] = Array.from({ length: 605 }, () => []);
    for (const r of _pages) out[r[2]].push(r);
    return out;
  }, [ready]);

  const surahStart = useMemo(() => {
    const m: Record<number, number> = {};
    if (_pages) for (const r of _pages) if (r[1] === 1 && m[r[0]] === undefined) m[r[0]] = r[2];
    return m;
  }, [ready]);

  const juzStart = useMemo(() => {
    const m: Record<number, number> = {};
    if (_pages) for (const r of _pages) if (m[r[3]] === undefined) m[r[3]] = r[2];
    return m;
  }, [ready]);

  const rows = byPage[page] ?? [];
  const first = rows[0];
  const juz = first?.[3] ?? 1;
  const mainSurah = first?.[0] ?? 1;

  const goPage = useCallback((n: number, d?: number) => {
    const t = Math.max(1, Math.min(604, n));
    setDir(d ?? (t >= page ? 1 : -1));
    setPage(t);
    setSel(null);
  }, [page]);

  // persist reading position
  useEffect(() => {
    if (!ready || !first) return;
    localStorage.setItem('noor_mushaf_page', String(page));
    const uid = getCurrentUid() || getOrCreateLocalUid();
    if (uid) queueRTDBUpdate(uid, { last_surah: first[0] });
  }, [page, ready, first]);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) { a.onended = null; a.onerror = null; a.pause(); }
    setPlaying(null);
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const playAyah = useCallback((s: number, a: number) => {
    if (!_pages) return;
    const idx = _pages.findIndex(r => r[0] === s && r[1] === a);
    if (idx < 0) { stopAudio(); return; }
    if (!audioRef.current) audioRef.current = document.createElement('audio');
    const el = audioRef.current;
    el.onended = null; el.onerror = null; el.pause();
    el.src = audioUrl(reciter, s, a);
    setPlaying({ s, a });
    const row = _pages[idx];
    setPage(p => { if (p !== row[2]) setDir(row[2] > p ? 1 : -1); return row[2]; });
    const next = () => { const n = _pages![idx + 1]; if (n) playAyah(n[0], n[1]); else stopAudio(); };
    el.onended = next;
    el.onerror = next;
    el.play().catch(() => stopAudio());
  }, [reciter, stopAudio]);

  const togglePagePlay = () => {
    if (playing) { stopAudio(); return; }
    const r = rows[0];
    if (r) playAyah(r[0], r[1]);
  };

  const openAyah = (s: number, a: number) => {
    setSel({ s, a });
    setShowTafsir(false);
    setTafsirText('');
  };

  const loadTafsir = async () => {
    if (!sel) return;
    setShowTafsir(true);
    try {
      if (!_tafsir) _tafsir = await (await fetch('/data/tafsir-muyassar.json')).json();
      setTafsirText(_tafsir![`${sel.s}:${sel.a}`] || 'لا يوجد تفسير متاح لهذه الآية');
    } catch { setTafsirText('تعذّر تحميل التفسير'); }
  };

  const ayahFull = (s: number, a: number) => {
    const i = _pages!.findIndex(r => r[0] === s && r[1] === a);
    return cleanVerse(s, a, _texts![i]);
  };

  const copySel = async () => {
    if (!sel) return;
    const txt = `${ayahFull(sel.s, sel.a)}\n\n﴿${SURAH_NAMES[sel.s]} : ${arNum(sel.a)}﴾\n\nمن تطبيق نور`;
    try { await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const shareSel = async () => {
    if (!sel) return;
    const txt = `${ayahFull(sel.s, sel.a)}\n\n﴿${SURAH_NAMES[sel.s]} : ${arNum(sel.a)}﴾\n\nمن تطبيق نور`;
    try { if (navigator.share) await navigator.share({ text: txt }); else await copySel(); } catch {}
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Arabic book: drag left→right turns to the NEXT page
    if (info.offset.x > 70 || info.velocity.x > 500) goPage(page + 1, 1);
    else if (info.offset.x < -70 || info.velocity.x < -500) goPage(page - 1, -1);
  };

  const night = tone === 'night';
  const toggleTone = () => { const t = night ? 'paper' : 'night'; setTone(t); localStorage.setItem('noor_mushaf_tone', t); };

  if (!ready) {
    return <div className="min-h-[100dvh] flex items-center justify-center text-primary" dir="rtl" style={{ fontFamily: ff }}>جاري فتح المصحف…</div>;
  }

  // group rows by surah for banners
  const segments: { s: number; items: Row[] }[] = [];
  for (const r of rows) {
    const last = segments[segments.length - 1];
    if (last && last.s === r[0]) last.items.push(r); else segments.push({ s: r[0], items: [r] });
  }
  const base = `calc(min(5.5vw, 1.95rem) * ${scale})`;
  const ink = night ? '#eadfbf' : '#1b1408';

  const iconBtn = 'press w-10 h-10 rounded-2xl flex items-center justify-center nr-glass';

  return (
    <div className="fixed inset-0 z-[5] flex flex-col" dir="rtl" style={{ background: night ? '#050b0a' : '#2a1d0b', fontFamily: ff }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: night ? 'radial-gradient(80% 50% at 50% 0%, #0f2f27, transparent)' : 'radial-gradient(80% 50% at 50% 0%, #5b3e14, transparent)' }} />

      {/* Top bar */}
      <AnimatePresence initial={false}>
        {chrome && (
          <motion.div key="top" initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="relative z-20 flex items-center gap-2 px-3" style={{ paddingTop: 'max(0.7rem, env(safe-area-inset-top))', paddingBottom: 8 }}>
            <button className={iconBtn} aria-label="رجوع" onClick={() => { stopAudio(); navigate('/quran'); }}><ArrowRight className="w-5 h-5 text-primary" /></button>
            <button className="flex-1 min-w-0 text-center press" onClick={() => setShowJump(true)}>
              <p className="font-display text-[1.25rem] leading-tight nr-gold-text truncate">سورة {SURAH_NAMES[mainSurah]}</p>
              <p className="text-[11px] text-muted-foreground">الجزء {arNum(juz)} · صفحة {arNum(page)}</p>
            </button>
            <button className={iconBtn} aria-label="تصغير الخط" onClick={() => setScale(Math.max(0.7, +(scale - 0.1).toFixed(2)))}><Minus className="w-4 h-4 text-primary" /></button>
            <button className={iconBtn} aria-label="تكبير الخط" onClick={() => setScale(Math.min(1.5, +(scale + 0.1).toFixed(2)))}><Plus className="w-4 h-4 text-primary" /></button>
            <button className={iconBtn} aria-label="الوضع" onClick={toggleTone}>{night ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book */}
      <div className="relative flex-1 min-h-0 px-3 pb-2" style={{ perspective: 1600 }}>
        <div className="relative h-full mx-auto" style={{ maxWidth: 520 }}>
          {/* stacked page edges */}
          <div className="absolute inset-0 rounded-[10px]" style={{ background: night ? '#0b1815' : '#d8c590', transform: 'translate(-7px, 4px)', opacity: .9 }} />
          <div className="absolute inset-0 rounded-[10px]" style={{ background: night ? '#0d1d19' : '#e5d5a4', transform: 'translate(-3.5px, 2px)' }} />
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div
              key={page}
              custom={dir}
              className={`absolute inset-0 rounded-[10px] overflow-hidden ${night ? 'mushaf-night' : 'mushaf-paper'}`}
              style={{ boxShadow: '0 20px 50px -10px #000c', transformOrigin: 'left center' }}
              variants={{
                enter: (d: number) => ({ rotateY: d > 0 ? 70 : -70, opacity: 0, x: d > 0 ? 40 : -40 }),
                center: { rotateY: 0, opacity: 1, x: 0 },
                exit: (d: number) => ({ rotateY: d > 0 ? -70 : 70, opacity: 0, x: d > 0 ? -60 : 60 }),
              }}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25} onDragEnd={onDragEnd}
            >
              {/* gold frame */}
              <div className="absolute inset-2 rounded-[6px] mushaf-frame pointer-events-none" style={{ borderColor: night ? '#8a6a2a' : '#b6862f' }} />
              {(['top-3 right-3', 'top-3 left-3', 'bottom-3 right-3', 'bottom-3 left-3'] as const).map(c => (
                <span key={c} className={`absolute ${c} w-3 h-3 rotate-45 pointer-events-none`} style={{ background: '#b6862f' }} />
              ))}
              {/* running header */}
              <div className="absolute top-3.5 inset-x-6 flex items-center justify-between text-[11px] font-bold pointer-events-none" style={{ color: night ? '#b99a5a' : '#8a5f12' }}>
                <span>الجزء {arNum(juz)}</span>
                <span>{SURAH_NAMES[mainSurah]}</span>
              </div>
              <div className="absolute inset-0 pt-9 pb-9 px-5 overflow-y-auto no-scrollbar" onClick={() => setChrome(c => !c)}>
                <div className="min-h-full flex flex-col justify-center" style={{ color: ink }}>
                  {segments.map(seg => (
                    <div key={seg.s + '-' + seg.items[0][1]}>
                      {seg.items[0][1] === 1 && <SurahBanner n={seg.s} />}
                      {seg.items[0][1] === 1 && seg.s !== 1 && seg.s !== 9 && (
                        <p className="text-center mushaf-text" style={{ fontSize: `calc(${base} * .95)`, lineHeight: 2, color: night ? '#d9b46a' : '#7a4e0a' }}>
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </p>
                      )}
                      <p className="mushaf-text" style={{ fontSize: base, lineHeight: 2.05 }}>
                        {seg.items.map(r => {
                          const gi = _pages!.indexOf(r);
                          const active = sel && sel.s === r[0] && sel.a === r[1];
                          const isPlaying = playing && playing.s === r[0] && playing.a === r[1];
                          const bm = bookmark && bookmark.surah === r[0] && bookmark.ayah === r[1];
                          return (
                            <span key={r[0] + ':' + r[1]}>
                              <span
                                className={active ? 'ayah-sel' : isPlaying ? 'ayah-playing' : ''}
                                onClick={e => { e.stopPropagation(); openAyah(r[0], r[1]); }}
                              >
                                {cleanVerse(r[0], r[1], _texts![gi])}
                                {' '}<span className="mushaf-num">{arNum(r[1])}</span>
                                {bm && <span style={{ color: '#c0392b', fontSize: '.6em' }}> ◆</span>}
                              </span>{' '}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-3.5 inset-x-0 text-center text-[12px] font-bold pointer-events-none" style={{ color: night ? '#b99a5a' : '#8a5f12' }}>
                {arNum(page)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom bar */}
      <AnimatePresence initial={false}>
        {chrome && (
          <motion.div key="bot" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="relative z-20 px-3" style={{ paddingBottom: 'max(0.7rem, env(safe-area-inset-bottom))' }}>
            <div className="nr-glass rounded-[26px] px-3 py-2.5 mx-auto flex items-center gap-3" style={{ maxWidth: 520 }}>
              <button onClick={togglePagePlay} aria-label={playing ? 'إيقاف' : 'تشغيل'}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center press"
                style={{ borderRadius: '999px 999px 14px 14px / 24px 24px 14px 14px', background: 'linear-gradient(180deg,#f6dd9c,#b98a3e)', color: '#1b1408', boxShadow: 'var(--glow-gold)' }}>
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <input type="range" min={1} max={604} value={page} dir="ltr" style={{ direction: 'ltr', transform: 'scaleX(-1)' }}
                  onChange={e => goPage(parseInt(e.target.value, 10))} className="w-full accent-[#d9b46a]" aria-label="الصفحة" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>{playing ? `${SURAH_NAMES[playing.s]} · آية ${arNum(playing.a)}` : RECITERS.find(r => r.id === reciter)?.name}</span>
                  <span>{arNum(page)} / {arNum(604)}</span>
                </div>
              </div>
              <button className={iconBtn} aria-label="الفهرس" onClick={() => setShowJump(true)}><ListOrdered className="w-5 h-5 text-primary" /></button>
              {bookmark && (
                <button className={iconBtn} aria-label="العلامة" onClick={() => { const r = _pages!.find(x => x[0] === bookmark.surah && x[1] === bookmark.ayah); if (r) goPage(r[2]); }}>
                  <Bookmark className="w-5 h-5 text-primary" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ayah sheet */}
      <AnimatePresence>
        {sel && (
          <>
            <motion.div className="fixed inset-0 z-30 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSel(null)} />
            <motion.div className="fixed bottom-0 inset-x-0 z-40 rounded-t-[30px] nr-glass" style={{ maxHeight: '70vh', overflowY: 'auto' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="p-4 pb-6 max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="nr-section-title">سورة {SURAH_NAMES[sel.s]} · آية {arNum(sel.a)}</p>
                  <button onClick={() => setSel(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(0 0% 100% / .08)' }}><X className="w-4 h-4" /></button>
                </div>
                <p className="mushaf-text text-center" style={{ fontSize: '1.45rem', lineHeight: 2.1, color: '#f3e7c4' }}>{ayahFull(sel.s, sel.a)}</p>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[
                    { l: 'استماع', I: Play, f: () => { playAyah(sel.s, sel.a); setSel(null); } },
                    { l: 'تفسير', I: BookOpen, f: loadTafsir },
                    { l: copied ? 'تم النسخ' : 'نسخ', I: copied ? Check : Copy, f: copySel },
                    { l: 'مشاركة', I: Share2, f: shareSel },
                  ].map(b => (
                    <button key={b.l} onClick={b.f} className="press nr-tile flex flex-col items-center gap-1.5 pt-4 pb-2.5 text-[11px] font-semibold">
                      <b.I className="w-5 h-5 text-primary" />{b.l}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setBookmark({ surah: sel.s, ayah: sel.a }); setSel(null); }}
                  className="press noor-btn-gold w-full rounded-2xl py-3 mt-3 text-sm flex items-center justify-center gap-2"
                ><Bookmark className="w-4 h-4" /> حفظ علامة هنا</button>
                <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                  {RECITERS.map(r => (
                    <button key={r.id} onClick={() => { setReciter(r.id); localStorage.setItem('noor_mushaf_reciter', r.id); }}
                      className={`noor-chip ${reciter === r.id ? 'noor-chip-on' : ''}`}>{r.name}</button>
                  ))}
                </div>
                {showTafsir && (
                  <div className="mt-4 rounded-2xl p-3.5 text-[13px] leading-[2]" style={{ background: 'hsl(165 24% 9% / .8)', border: '1px solid hsl(38 62% 60% / .18)' }}>
                    <p className="text-primary font-bold text-xs mb-1">التفسير الميسّر</p>
                    {tafsirText || 'جاري التحميل…'}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Jump sheet */}
      <AnimatePresence>
        {showJump && (
          <>
            <motion.div className="fixed inset-0 z-30 bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowJump(false)} />
            <motion.div className="fixed bottom-0 inset-x-0 z-40 rounded-t-[30px] nr-glass flex flex-col" style={{ height: '72vh' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="p-4 pb-2 max-w-lg w-full mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="nr-section-title">فهرس المصحف</p>
                  <button onClick={() => setShowJump(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(0 0% 100% / .08)' }}><X className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-2">
                  {([['surah', 'السور'], ['juz', 'الأجزاء'], ['page', 'صفحة']] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setJumpTab(k)} className={`noor-chip flex-1 justify-center ${jumpTab === k ? 'noor-chip-on' : ''}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-8 max-w-lg w-full mx-auto no-scrollbar">
                {jumpTab === 'surah' && Array.from({ length: 114 }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => { goPage(surahStart[n]); setShowJump(false); }} className="press w-full flex items-center gap-3 py-2.5 border-b" style={{ borderColor: 'hsl(38 62% 60% / .1)' }}>
                    <span className="w-9 h-9 flex items-center justify-center text-[12px] font-bold text-primary" style={{ background: 'hsl(38 62% 60% / .12)', borderRadius: '999px 999px 10px 10px / 18px 18px 10px 10px' }}>{arNum(n)}</span>
                    <span className="flex-1 text-right font-semibold">{SURAH_NAMES[n]}</span>
                    <span className="text-[11px] text-muted-foreground">صفحة {arNum(surahStart[n])}</span>
                  </button>
                ))}
                {jumpTab === 'juz' && (
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                      <button key={j} onClick={() => { goPage(juzStart[j]); setShowJump(false); }} className="press nr-tile py-3.5 text-center">
                        <p className="text-[10px] text-muted-foreground">جزء</p><p className="font-bold">{arNum(j)}</p>
                      </button>
                    ))}
                  </div>
                )}
                {jumpTab === 'page' && (
                  <div className="pt-3">
                    <input className="noor-input text-center text-lg" inputMode="numeric" placeholder="رقم الصفحة (١ - ٦٠٤)" value={pageInput} onChange={e => setPageInput(e.target.value.replace(/\D/g, '').slice(0, 3))} />
                    <button className="noor-btn-gold w-full rounded-2xl py-3 mt-3" onClick={() => { const n = parseInt(pageInput, 10); if (n >= 1 && n <= 604) { goPage(n); setShowJump(false); setPageInput(''); } }}>اذهب</button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
