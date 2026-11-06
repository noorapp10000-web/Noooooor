import { TASBIH_TYPES } from '@/lib/constants';
import {
  queueTasbihSync,
  flushRTDB,
  getCacheValue,
  getCurrentUid,
  getOrCreateLocalUid,
  todayKey,
} from '@/lib/rtdb';
import { BarChart2, RotateCcw, ChevronDown, Vibrate, Check } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, memo } from 'react';
import { vibrateLight, vibrateReset } from '@/lib/haptics';
import { useUserSetting } from '@/hooks/use-user-setting';
import { NoorImg, Sheet, ProgressRing, arNum, GoldBadge } from '@/components/noor/kit';
import { cn } from '@/lib/utils';

const BEAD_COUNT = 33;

/* ── 3D golden bead ring around the counter ── */
const BeadsRing = memo(function BeadsRing({ count, limit }: { count: number; limit: number }) {
  const beadsToShow = Math.min(BEAD_COUNT, limit);
  const inRound = count % limit;
  const progress = count > 0 && inRound === 0 ? 1 : inRound / limit;
  const filled = Math.round(progress * beadsToShow);
  const c = 150, r = 130;
  const circ = 2 * Math.PI * (r - 20);

  return (
    <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="tsbArc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(44 88% 78%)" />
          <stop offset="55%" stopColor="hsl(37 56% 56%)" />
          <stop offset="100%" stopColor="hsl(160 52% 38%)" />
        </linearGradient>
        <radialGradient id="tsbBeadOn" cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="hsl(46 100% 90%)" />
          <stop offset="40%" stopColor="hsl(38 65% 58%)" />
          <stop offset="100%" stopColor="hsl(26 50% 24%)" />
        </radialGradient>
        <radialGradient id="tsbBeadOff" cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="hsl(160 30% 26%)" />
          <stop offset="100%" stopColor="hsl(168 50% 6%)" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r - 20} fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="4" />
      <circle cx={c} cy={c} r={r - 20} fill="none" stroke="url(#tsbArc)" strokeWidth="4.5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dashoffset .35s cubic-bezier(.22,1,.36,1)', filter: 'drop-shadow(0 0 6px hsl(40 80% 60% / .45))' }} />
      <circle cx={c} cy={c} r={r} fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
      {Array.from({ length: beadsToShow }, (_, i) => {
        const ang = (i / beadsToShow) * 2 * Math.PI - Math.PI / 2;
        const x = c + r * Math.cos(ang), y = c + r * Math.sin(ang);
        const on = i < filled;
        const big = i % 11 === 0;
        return (
          <g key={i}>
            <circle cx={x + 1.2} cy={y + 1.8} r={big ? 9.5 : 7.5} fill="hsl(0 0% 0% / .35)" />
            <circle cx={x} cy={y} r={big ? 9.5 : 7.5} fill={on ? 'url(#tsbBeadOn)' : 'url(#tsbBeadOff)'}
              stroke={on ? 'hsl(30 50% 30% / .6)' : 'hsl(var(--primary) / .25)'} strokeWidth="0.8" />
            <circle cx={x - 2.4} cy={y - 2.6} r={big ? 2.6 : 2} fill="hsl(0 0% 100% / .55)" opacity={on ? 1 : 0.25} />
          </g>
        );
      })}
      <circle cx={c} cy={c - r - 4} r={12} fill="url(#tsbBeadOn)" />
      <circle cx={c - 3.5} cy={c - r - 8} r={3.4} fill="hsl(0 0% 100% / .6)" />
    </svg>
  );
});

export function Tasbih() {
  const [typeIndex, setTypeIndex] = useState<number>(() => getCacheValue<number>('tasbih_type_idx', 0));
  const [totals, setTotals] = useState<Record<string, number>>(() => getCacheValue<Record<string, number>>('tasbih_totals', {}));
  const [counts, setCounts] = useState<Record<string, number>>(() => getCacheValue<Record<string, number>>('tasbih_counts', {}));
  const [dailyCount, setDailyCount] = useState<number>(() => getCacheValue<number>(`tasbih_daily/${todayKey()}`, 0));
  const [showStats, setShowStats] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [haptics, setHaptics] = useUserSetting<boolean>('tasbih_haptics', true);
  const [roundDone, setRoundDone] = useState(false);

  const controls = useAnimation();
  const [isPressing, setIsPressing] = useState(false);

  const totalsRef = useRef(totals);
  const countsRef = useRef(counts);
  const dailyRef = useRef(dailyCount);
  useEffect(() => { totalsRef.current = totals; }, [totals]);
  useEffect(() => { countsRef.current = counts; }, [counts]);
  useEffect(() => { dailyRef.current = dailyCount; }, [dailyCount]);

  const currentType = TASBIH_TYPES[typeIndex] ?? TASBIH_TYPES[0];
  const count = counts[currentType.id] ?? 0;
  const total = totals[currentType.id] ?? 0;
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  function getUid() { return getCurrentUid() || localStorage.getItem('noor_uid') || getOrCreateLocalUid(); }

  useEffect(() => () => { flushRTDB(); }, []);

  const handleTypeChange = (idx: number) => {
    setTypeIndex(idx);
    setShowPicker(false);
    queueTasbihSync(getUid(), totalsRef.current, countsRef.current, dailyRef.current);
  };

  const handleTap = () => {
    controls.start({ scale: [1, 0.95, 1], transition: { duration: 0.18 } });
    const nextCount = (countsRef.current[currentType.id] ?? 0) + 1;
    const newCounts = { ...countsRef.current, [currentType.id]: nextCount };
    const newTotals = { ...totalsRef.current, [currentType.id]: (totalsRef.current[currentType.id] ?? 0) + 1 };
    const newDaily = dailyRef.current + 1;
    setCounts(newCounts);
    setTotals(newTotals);
    setDailyCount(newDaily);
    queueTasbihSync(getUid(), newTotals, newCounts, newDaily);

    const completedRound = nextCount % currentType.limit === 0;
    if (haptics) (completedRound ? vibrateReset() : vibrateLight()).catch(() => {});
    if (completedRound) { setRoundDone(true); setTimeout(() => setRoundDone(false), 1400); }
  };

  const handleResetConfirm = () => {
    const newCounts = { ...countsRef.current, [currentType.id]: 0 };
    setCounts(newCounts);
    setShowResetDialog(false);
    if (haptics) vibrateReset().catch(() => {});
    queueTasbihSync(getUid(), totalsRef.current, newCounts, dailyRef.current);
  };

  const shown = count % currentType.limit || (count > 0 ? currentType.limit : 0);
  const rounds = Math.floor(count / currentType.limit);

  return (
    <div className="pb-28 px-4 h-[100dvh] flex flex-col max-w-lg mx-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }} dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <NoorImg name="tasbih" size={44} />
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.7rem] leading-tight text-gold-gradient">المسبحة الإلكترونية</h1>
          <p className="text-xs text-muted-foreground">اليوم <span className="font-bold text-primary tabular-nums">{arNum(dailyCount.toLocaleString('en'))}</span> تسبيحة</p>
        </div>
        <button onClick={() => setHaptics(!haptics)} aria-label="الاهتزاز"
          className={cn('press w-11 h-11 rounded-2xl flex items-center justify-center', haptics ? 'noor-btn-gold' : 'noor-btn-ghost')}>
          <Vibrate className="w-5 h-5" />
        </button>
        <button onClick={() => setShowStats(true)} aria-label="الإحصائيات" className="press w-11 h-11 rounded-2xl flex items-center justify-center noor-btn-ghost">
          <BarChart2 className="w-5 h-5" />
        </button>
      </div>

      {/* Dhikr selector */}
      <button onClick={() => setShowPicker(true)} className="press noor-card rounded-3xl px-4 py-3 flex items-center gap-3 text-right">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground">الذكر الحالي · الهدف {arNum(currentType.limit)}</p>
          <AnimatePresence mode="wait">
            <motion.p key={currentType.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="font-quran text-[1.45rem] leading-[1.9] text-foreground truncate">{currentType.text}</motion.p>
          </AnimatePresence>
        </div>
        <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
      </button>

      {/* Tap orb */}
      <div className="flex-1 flex items-center justify-center min-h-0 py-4">
        <motion.button
          animate={controls}
          onPointerDown={() => setIsPressing(true)}
          onPointerUp={() => { setIsPressing(false); handleTap(); }}
          onPointerLeave={() => setIsPressing(false)}
          aria-label="سبّح"
          className="relative aspect-square w-full max-w-[320px] max-h-full rounded-full select-none touch-none outline-none"
        >
          <BeadsRing count={count} limit={currentType.limit} />
          <span
            className="absolute inset-[19%] rounded-full flex flex-col items-center justify-center noor-gold-orb transition-transform duration-150"
            style={{ transform: isPressing ? 'scale(0.96)' : 'scale(1)' }}
          >
            <span className="absolute inset-[9%] rounded-full noor-emerald-orb flex flex-col items-center justify-center">
              <motion.span key={count} initial={{ scale: 0.82, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }}
                className="block font-black tabular-nums text-[3.6rem] leading-none text-gold-gradient">{arNum(shown)}</motion.span>
              <span className="text-[11px] text-muted-foreground mt-1">من {arNum(currentType.limit)}</span>
              {rounds > 0 && <span className="mt-1.5"><GoldBadge>دورة × {arNum(rounds)}</GoldBadge></span>}
            </span>
          </span>
          <AnimatePresence>
            {roundDone && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute -top-1 left-1/2 -translate-x-1/2 noor-btn-gold rounded-full px-3 py-1 text-xs flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> اكتملت الدورة
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Footer controls */}
      <div className="grid grid-cols-3 gap-2">
        <div className="noor-card rounded-2xl py-2.5 text-center">
          <p className="text-[10px] text-muted-foreground">مجموع الذكر</p>
          <p className="font-bold text-primary tabular-nums">{arNum(total.toLocaleString('en'))}</p>
        </div>
        <button onClick={() => setShowResetDialog(true)} className="press noor-btn-ghost rounded-2xl py-2.5 flex flex-col items-center justify-center">
          <RotateCcw className="w-4 h-4" />
          <span className="text-[11px] mt-0.5">تصفير</span>
        </button>
        <div className="noor-card rounded-2xl py-2.5 text-center">
          <p className="text-[10px] text-muted-foreground">الإجمالي الكلي</p>
          <p className="font-bold text-primary tabular-nums">{arNum(grandTotal.toLocaleString('en'))}</p>
        </div>
      </div>

      {/* Dhikr picker */}
      <Sheet open={showPicker} onClose={() => setShowPicker(false)} title="اختر الذكر">
        <div className="flex flex-col gap-2">
          {TASBIH_TYPES.map((t, idx) => {
            const on = idx === typeIndex;
            const c = counts[t.id] ?? 0;
            return (
              <button key={t.id} onClick={() => handleTypeChange(idx)}
                className={cn('press w-full noor-card rounded-2xl p-3 flex items-center gap-3 text-right', on && 'noor-card-active')}>
                <ProgressRing value={(c % t.limit) / t.limit} size={44} stroke={4}>
                  <span className="text-[11px] font-bold text-primary tabular-nums">{arNum(c % t.limit)}</span>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <p className="font-quran text-lg leading-relaxed truncate">{t.text}</p>
                  <p className="text-[11px] text-muted-foreground">{t.label} · الهدف {arNum(t.limit)} · المجموع {arNum((totals[t.id] ?? 0).toLocaleString('en'))}</p>
                </div>
                {on && <Check className="w-5 h-5 text-primary" />}
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* Stats */}
      <Sheet open={showStats} onClose={() => setShowStats(false)} title="إحصائيات التسبيح">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="noor-card rounded-2xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground">تسبيحات اليوم</p>
            <p className="text-2xl font-black text-gold-gradient tabular-nums">{arNum(dailyCount.toLocaleString('en'))}</p>
          </div>
          <div className="noor-card rounded-2xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground">الإجمالي الكلي</p>
            <p className="text-2xl font-black text-gold-gradient tabular-nums">{arNum(grandTotal.toLocaleString('en'))}</p>
          </div>
        </div>
        <div className="space-y-3">
          {TASBIH_TYPES.filter(t => (totals[t.id] ?? 0) > 0)
            .sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0))
            .map(t => {
              const v = totals[t.id] ?? 0;
              const max = Math.max(1, ...Object.values(totals));
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-quran truncate flex-1 ml-2">{t.text}</span>
                    <span className="font-bold text-primary tabular-nums text-xs">{arNum(v.toLocaleString('en'))}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-gold" style={{ width: `${(v / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          {grandTotal === 0 && <p className="text-muted-foreground text-sm text-center py-6">ابدأ التسبيح لتظهر إحصائياتك هنا</p>}
        </div>
      </Sheet>

      {/* Reset confirm */}
      <Sheet open={showResetDialog} onClose={() => setShowResetDialog(false)} title="تصفير العداد">
        <p className="text-sm text-muted-foreground mb-5 text-center">سيتم تصفير عدّاد «{currentType.label}» فقط، ويبقى المجموع الكلي محفوظاً.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowResetDialog(false)} className="press flex-1 py-3 rounded-2xl noor-btn-ghost">إلغاء</button>
          <button onClick={handleResetConfirm} className="press flex-1 py-3 rounded-2xl noor-btn-gold">تصفير</button>
        </div>
      </Sheet>
    </div>
  );
}
