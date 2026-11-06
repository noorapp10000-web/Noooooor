import { TASBIH_TYPES } from '@/lib/constants';
import {
  queueTasbihSync,
  flushRTDB,
  getCacheValue,
  getCurrentUid,
  getOrCreateLocalUid,
  todayKey,
} from '@/lib/rtdb';
import { BarChart2 } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, memo } from 'react';
import { useUserSetting } from '@/hooks/use-user-setting';
import { vibrateLight } from '@/lib/haptics';

const BEAD_COUNT = 33;

const BeadsSVG = memo(function BeadsSVG({ count, limit }: { count: number; limit: number }) {
  const beadsToShow = Math.min(BEAD_COUNT, limit);
  const inRound = count % limit;
  const progress = count > 0 && inRound === 0 ? 1 : inRound / limit;
  const filled = Math.round(progress * beadsToShow);
  const rounds = Math.floor(count / limit);
  const c = 150, r = 122;
  const circ = 2 * Math.PI * (r - 22);

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      <defs>
        <linearGradient id="tsbGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(40 72% 72%)" />
          <stop offset="55%" stopColor="hsl(35 52% 54%)" />
          <stop offset="100%" stopColor="hsl(28 45% 38%)" />
        </linearGradient>
        <radialGradient id="tsbBead" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="hsl(42 85% 85%)" />
          <stop offset="45%" stopColor="hsl(36 55% 56%)" />
          <stop offset="100%" stopColor="hsl(28 50% 30%)" />
        </radialGradient>
        <radialGradient id="tsbEmpty" cx="35%" cy="30%" r="70%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--card))' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--border))' }} />
        </radialGradient>
      </defs>
      {/* progress track */}
      <circle cx={c} cy={c} r={r - 22} fill="none" style={{ stroke: 'hsl(var(--border))' }} strokeWidth="3" opacity="0.6" />
      <circle cx={c} cy={c} r={r - 22} fill="none" stroke="url(#tsbGold)" strokeWidth="3.5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dashoffset .35s cubic-bezier(.22,1,.36,1)' }} />
      {/* string */}
      <circle cx={c} cy={c} r={r} fill="none" style={{ stroke: 'hsl(var(--primary) / 0.35)' }} strokeWidth="1" />
      {Array.from({ length: beadsToShow }, (_, i) => {
        const ang = (i / beadsToShow) * 2 * Math.PI - Math.PI / 2;
        const x = c + r * Math.cos(ang), y = c + r * Math.sin(ang);
        const on = i < filled;
        const big = i % 11 === 0;
        return (
          <circle key={i} cx={x} cy={y} r={big ? 9 : 7}
            fill={on ? 'url(#tsbBead)' : 'url(#tsbEmpty)'}
            strokeWidth="1"
            style={{ stroke: on ? 'hsl(30 45% 35% / 0.5)' : 'hsl(var(--muted-foreground) / 0.35)' }} />
        );
      })}
      {/* imam bead + tassel */}
      <circle cx={c} cy={c - r - 2} r={11} fill="url(#tsbBead)" />
      <path d={`M${c} ${c - r + 9} L${c} ${c - r + 26}`} stroke="url(#tsbGold)" strokeWidth="2.5" strokeLinecap="round" />
      {rounds > 0 && (
        <g>
          <rect x={c - 26} y={c + 46} width={52} height={22} rx={11} style={{ fill: 'hsl(var(--primary) / 0.14)' }} />
          <text x={c} y={c + 62} textAnchor="middle" fontSize="13" fontWeight="700" style={{ fill: 'hsl(var(--primary))' }} fontFamily="IBM Plex Sans Arabic">×{rounds}</text>
        </g>
      )}
    </svg>
  );
});

function ResetConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.2 }}
        className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center"
      >
        <svg width="32" height="32" viewBox="0 0 40 40" className="mx-auto mb-3 text-primary opacity-60">
          <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" fill="currentColor"/>
        </svg>
        <h3 className="font-bold text-lg mb-1" style={{ fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif' }}>تصفير العداد</h3>
        <p className="text-muted-foreground text-sm mb-5" style={{ fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif' }}>هل تريد تصفير عداد هذا التسبيح؟</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors" style={{ fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif' }}>
            إلغاء
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm transition-colors"
            style={{ background: 'linear-gradient(135deg, #C19A6B, #a07a4a)', color: '#000', fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif' }}>
            تصفير
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function Tasbih() {
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [typeIndex, setTypeIndex] = useState<number>(() => getCacheValue<number>('tasbih_type_idx', 0));
  const [totals, setTotals] = useState<Record<string, number>>(() => getCacheValue<Record<string, number>>('tasbih_totals', {}));
  const [counts, setCounts] = useState<Record<string, number>>(() => getCacheValue<Record<string, number>>('tasbih_counts', {}));
  const [dailyCount, setDailyCount] = useState<number>(() => getCacheValue<number>(`tasbih_daily/${todayKey()}`, 0));
  const [showStats, setShowStats] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const controls = useAnimation();
  const [isPressing, setIsPressing] = useState(false);

  const totalsRef = useRef(totals);
  const countsRef = useRef(counts);
  const dailyRef  = useRef(dailyCount);
  useEffect(() => { totalsRef.current = totals; }, [totals]);
  useEffect(() => { countsRef.current = counts; }, [counts]);
  useEffect(() => { dailyRef.current  = dailyCount; }, [dailyCount]);

  const currentType = TASBIH_TYPES[typeIndex];
  const count = counts[currentType.id] ?? 0;
  const total = totals[currentType.id] ?? 0;

  function getUid() { return getCurrentUid() || localStorage.getItem('noor_uid') || getOrCreateLocalUid(); }

  useEffect(() => { return () => { flushRTDB(); }; }, []);

  const handleTypeChange = (idx: number) => {
    setTypeIndex(idx);
    queueTasbihSync(getUid(), totalsRef.current, countsRef.current, dailyRef.current);
  };

  const handleTap = () => {
    controls.start({ scale: [1, 0.94, 1], transition: { duration: 0.18 } });

    const newCounts = { ...countsRef.current, [currentType.id]: (countsRef.current[currentType.id] ?? 0) + 1 };
    const newTotals = { ...totalsRef.current, [currentType.id]: (totalsRef.current[currentType.id] ?? 0) + 1 };
    const newDaily  = dailyRef.current + 1;

    setCounts(newCounts);
    setTotals(newTotals);
    setDailyCount(newDaily);

    queueTasbihSync(getUid(), newTotals, newCounts, newDaily);
  };

  const handleResetConfirm = () => {
    const newCounts = { ...countsRef.current, [currentType.id]: 0 };
    setCounts(newCounts);
    setShowResetDialog(false);
    queueTasbihSync(getUid(), totalsRef.current, newCounts, dailyRef.current);
  };

  const shown = count % currentType.limit || (count > 0 ? currentType.limit : 0);

  return (
    <div className="pb-28 px-4 h-[100dvh] flex flex-col max-w-lg mx-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }} dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs text-muted-foreground">اليوم: <span className="font-bold text-primary tabular-nums">{dailyCount.toLocaleString('ar-EG')}</span> تسبيحة</p>
          <h1 className="font-display text-[1.8rem] leading-tight">السبحة</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowStats(!showStats)} aria-label="الإحصائيات" className="press w-11 h-11 surface rounded-2xl flex items-center justify-center text-primary">
            <BarChart2 className="w-5 h-5" />
          </button>
          <button onClick={() => setShowResetDialog(true)} aria-label="تصفير" className="press w-11 h-11 surface rounded-2xl flex items-center justify-center text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {showStats && (
        <div className="surface rounded-[22px] p-4 mb-3 animate-fade-up">
          <h3 className="font-bold mb-3 text-sm text-primary">المجموع الكلي لكل ذكر</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {TASBIH_TYPES.filter(t => (totals[t.id] ?? 0) > 0).map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground/80 text-sm truncate flex-1 ml-2 font-quran">{t.text}</span>
                <span className="font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs tabular-nums">{totals[t.id]?.toLocaleString('ar-EG')}</span>
              </div>
            ))}
            {Object.keys(totals).length === 0 && <p className="text-muted-foreground text-sm text-center">لا توجد إحصائيات بعد</p>}
          </div>
        </div>
      )}

      {/* Dhikr selector */}
      <div className="no-scrollbar -mx-4 px-4 flex gap-2 overflow-x-auto shrink-0 pb-1">
        {TASBIH_TYPES.map((t, idx) => {
          const on = typeIndex === idx;
          return (
            <button key={t.id} onClick={() => handleTypeChange(idx)}
              className={`press shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${on ? 'bg-gradient-gold shadow-gold' : 'surface text-muted-foreground'}`}
              style={on ? { color: 'hsl(var(--primary-foreground))' } : undefined}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Dhikr text */}
      <div className="text-center mt-5 min-h-[72px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p key={currentType.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="font-quran text-[1.7rem] leading-[1.9] text-foreground px-4">{currentType.text}</motion.p>
        </AnimatePresence>
        <p className="text-[11px] text-muted-foreground mt-1">المجموع الكلي <span className="font-bold text-primary tabular-nums">{total.toLocaleString('ar-EG')}</span></p>
      </div>

      {/* Tap ring — the whole ring is the button */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <motion.button
          animate={controls}
          onPointerDown={() => setIsPressing(true)}
          onPointerUp={() => { setIsPressing(false); handleTap(); vibrateLight().catch(() => {}); }}
          onPointerLeave={() => setIsPressing(false)}
          aria-label="سبّح"
          className="relative aspect-square w-full max-w-[320px] max-h-full rounded-full select-none touch-none outline-none"
        >
          <BeadsSVG count={count} limit={currentType.limit} />
          <span className="absolute inset-[22%] rounded-full flex flex-col items-center justify-center transition-shadow"
            style={{
              background: 'radial-gradient(circle at 35% 30%, hsl(var(--card)), hsl(var(--secondary)))',
              boxShadow: isPressing ? 'inset 0 6px 18px hsl(0 0% 0% / 0.18)' : 'var(--shadow-lift)',
              border: '1px solid hsl(var(--primary) / 0.2)',
            }}>
            <motion.span key={count} initial={{ scale: 0.86, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
              className="block font-bold tabular-nums text-[3.4rem] leading-none text-primary">{shown}</motion.span>
            <span className="text-[11px] text-muted-foreground mt-1">من {currentType.limit.toLocaleString('ar-EG')}</span>
          </span>
        </motion.button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground mt-2">اضغط في أي مكان على السبحة</p>

      <AnimatePresence>
        {showResetDialog && (
          <ResetConfirmDialog onConfirm={handleResetConfirm} onCancel={() => setShowResetDialog(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
