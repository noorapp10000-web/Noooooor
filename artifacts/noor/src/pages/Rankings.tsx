import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Headphones, Sun, Moon, Trophy, Flame, Lock, MapPin, Award, Star } from 'lucide-react';
import { TasbihIcon } from '@/components/NoorIcons';
import { getCacheValue, getProfileCache, getFullCache, todayKey } from '@/lib/rtdb';
import { TASBIH_TYPES } from '@/lib/constants';
import { HISN_ITEMS } from '@/lib/hisnData';
import { lastNDays, daySeries } from '@/lib/stats';
import { NoorImg, ProgressRing, GoldBar, ChipTabs, GoldBadge, arNum } from '@/components/noor/kit';
import { cn } from '@/lib/utils';

const MORNING_CAT_ID = 27;
const EVENING_CAT_ID = 9001;
const TASBIH_DAILY_GOAL = 500;
const AYAH_DAILY_GOAL = 50;
const LISTEN_DAILY_GOAL_MIN = 30;
const MORNING_ITEMS = HISN_ITEMS[MORNING_CAT_ID] ?? [];
const EVENING_ITEMS = HISN_ITEMS[EVENING_CAT_ID] ?? MORNING_ITEMS;

function azkarDone(dateKey: string, catId: number, items: { id: number; count: number }[]): boolean {
  try {
    const p = getCacheValue<Record<number, number>>(`azkar/${dateKey}/${catId}`, {});
    return items.length > 0 && items.every(z => (p[z.id] ?? 0) >= z.count);
  } catch { return false; }
}

function azkarProgress(dateKey: string, catId: number, items: { id: number; count: number }[]): number {
  if (!items.length) return 0;
  const p = getCacheValue<Record<number, number>>(`azkar/${dateKey}/${catId}`, {});
  const need = items.reduce((a, z) => a + z.count, 0);
  const got = items.reduce((a, z) => a + Math.min(z.count, p[z.id] ?? 0), 0);
  return need ? got / need : 0;
}

function getDayScore(dateKey: string): number {
  let score = 0;
  try {
    const t = getCacheValue<{ prayers?: Record<string, boolean>; quranWird?: boolean }>(`daily_tracker/${dateKey}`, {});
    score += Object.values(t.prayers || {}).filter(Boolean).length;
    if (t.quranWird) score += 1;
  } catch { /* empty */ }
  if (azkarDone(dateKey, MORNING_CAT_ID, MORNING_ITEMS)) score += 1;
  if (azkarDone(dateKey, EVENING_CAT_ID, EVENING_ITEMS)) score += 1;
  if (getCacheValue<number>(`tasbih_daily/${dateKey}`, 0) >= TASBIH_DAILY_GOAL) score += 1;
  return score;
}

function heatCell(score: number): string {
  if (score < 0) return 'transparent';
  if (score === 0) return 'hsl(var(--primary) / 0.06)';
  if (score <= 2) return 'hsl(160 45% 22%)';
  if (score <= 4) return 'hsl(160 50% 32%)';
  if (score <= 6) return 'hsl(40 55% 45%)';
  return 'hsl(42 75% 62%)';
}

const DAY_SHORT = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

function BarChart({ values, labels, unit }: { values: number[]; labels: string[]; unit: string }) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <div className="flex items-end justify-between gap-2 h-32" style={{ direction: 'ltr' }}>
        {values.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span className="text-[9px] text-muted-foreground tabular-nums">{v ? arNum(v) : ''}</span>
            <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(4, (v / max) * 100)}%` }} transition={{ delay: i * 0.05, duration: 0.5 }}
              className={cn('w-full rounded-t-lg', i === values.length - 1 ? 'bg-gradient-gold shadow-gold' : '')}
              style={i === values.length - 1 ? undefined : { backgroundImage: 'linear-gradient(to top, hsl(164 50% 18%), hsl(160 52% 38%))' }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2 mt-1.5" style={{ direction: 'ltr' }}>
        {labels.map((l, i) => <span key={i} className={cn('flex-1 text-center text-[10px]', i === labels.length - 1 ? 'text-primary font-bold' : 'text-muted-foreground')}>{l}</span>)}
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">{unit}</p>
    </div>
  );
}

type Metric = 'ayahs' | 'tasbih' | 'listen';

export function Rankings() {
  const profile = getProfileCache();
  const today = todayKey();
  const [metric, setMetric] = useState<Metric>('ayahs');
  const [showAllDays, setShowAllDays] = useState(false);

  // Totals
  const totals = getCacheValue<Record<string, number>>('tasbih_totals', {});
  const totalTasbeeh = Object.values(totals).reduce((a, b) => a + b, 0);
  const quranCompletions = getCacheValue<number>('quran_completions', 0);
  const azkarStreak = getCacheValue<number>('azkar_streak', 0);
  const tadabburStreak = getCacheValue<number>('tadabbur_streak', 0);
  const ayahsTotal = getCacheValue<number>('ayahs_read_total', 0);
  const listenTotalSec = getCacheValue<number>('listen_seconds_total', 0);
  const sunnahTotal = getCacheValue<number>('sunnah_done_total', 0);
  const quizPlayed = getCacheValue<number>('quiz_played', 0);
  const quizBest = getCacheValue<number>('quiz_best_pct', 0);
  const hifzExcellent = Object.values((getFullCache()['hifz_results'] as Record<string, string> | undefined) ?? {}).filter(r => r === 'ممتاز').length;

  // Today
  const todayAyahs = getCacheValue<number>(`ayahs_read/${today}`, 0);
  const todayTasbeeh = getCacheValue<number>(`tasbih_daily/${today}`, 0);
  const todayListenMin = Math.round(getCacheValue<number>(`listen_seconds/${today}`, 0) / 60);
  const morningP = azkarProgress(today, MORNING_CAT_ID, MORNING_ITEMS);
  const eveningP = azkarProgress(today, EVENING_CAT_ID, EVENING_ITEMS);

  // Weekly series
  const days = lastNDays(7);
  const weekLabels = days.map(k => DAY_SHORT[new Date(k + 'T12:00:00').getDay()]);
  const series = metric === 'ayahs' ? daySeries('ayahs_read', days)
    : metric === 'tasbih' ? daySeries('tasbih_daily', days)
    : daySeries('listen_seconds', days).map(s => Math.round(s / 60));
  const unit = metric === 'ayahs' ? 'آيات مقروءة — آخر ٧ أيام' : metric === 'tasbih' ? 'تسبيحات — آخر ٧ أيام' : 'دقائق استماع — آخر ٧ أيام';

  // Achievements
  const badges = [
    { title: 'الختمة الأولى', desc: 'أتممت ختمة كاملة', ok: quranCompletions >= 1, icon: 'quran' as const },
    { title: 'قارئ مثابر', desc: '٥٠٠ آية مقروءة', ok: ayahsTotal >= 500, icon: 'quran' as const, p: ayahsTotal / 500 },
    { title: 'ذاكر لله', desc: '١٠٠٠ تسبيحة', ok: totalTasbeeh >= 1000, icon: 'tasbih' as const, p: totalTasbeeh / 1000 },
    { title: 'مستمع خاشع', desc: '٥ ساعات استماع', ok: listenTotalSec >= 18000, icon: 'headphones' as const, p: listenTotalSec / 18000 },
    { title: 'محافظ على الأذكار', desc: '٧ أيام متتالية', ok: azkarStreak >= 7, icon: 'dua' as const, p: azkarStreak / 7 },
    { title: 'محيي السنن', desc: '٣٠ سنة مطبّقة', ok: sunnahTotal >= 30, icon: 'mosque' as const, p: sunnahTotal / 30 },
    { title: 'حافظ متقن', desc: '٥ اختبارات بتقدير ممتاز', ok: hifzExcellent >= 5, icon: 'hifz' as const, p: hifzExcellent / 5 },
    { title: 'طالب علم', desc: '٥ مسابقات مكتملة', ok: quizPlayed >= 5, icon: 'star' as const, p: quizPlayed / 5 },
  ];
  const unlocked = badges.filter(b => b.ok).length;

  // Heatmap
  const { weeks } = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    let gridStart: Date; let totalCells: number;
    if (showAllDays) {
      const cache = getFullCache();
      const keys: string[] = [];
      for (const node of ['daily_tracker', 'tasbih_daily', 'azkar', 'ayahs_read']) {
        const n = cache[node] as Record<string, unknown> | undefined;
        if (n) keys.push(...Object.keys(n));
      }
      const valid = keys.filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
      let earliest = t;
      if (valid.length) { const e = new Date(valid[0]); e.setHours(0, 0, 0, 0); if (e < t) earliest = e; }
      gridStart = new Date(earliest); gridStart.setDate(gridStart.getDate() - earliest.getDay());
      totalCells = Math.ceil((Math.floor((t.getTime() - gridStart.getTime()) / 86400000) + 7) / 7) * 7;
    } else {
      totalCells = 91 + (6 - t.getDay());
      gridStart = new Date(t); gridStart.setDate(gridStart.getDate() - (totalCells - 1));
    }
    const cells: { key: string; score: number; isToday: boolean }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStart); d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      cells.push({ key, score: d > t ? -1 : getDayScore(key), isToday: d.getTime() === t.getTime() });
    }
    const w: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return { weeks: w };
  }, [showAllDays]);

  const topDhikr = TASBIH_TYPES.map(t => ({ label: t.label, text: t.text, count: totals[t.id] ?? 0 })).sort((a, b) => b.count - a.count)[0];

  const daily = [
    { label: 'الآيات المقروءة', value: todayAyahs, goal: AYAH_DAILY_GOAL, icon: <BookOpen className="w-5 h-5 text-primary" />, unit: 'آية' },
    { label: 'التسبيحات', value: todayTasbeeh, goal: TASBIH_DAILY_GOAL, icon: <TasbihIcon size={20} style={{ color: 'hsl(var(--primary))' }} />, unit: 'تسبيحة' },
    { label: 'أذكار الصباح', value: Math.round(morningP * 100), goal: 100, icon: <Sun className="w-5 h-5 text-primary" />, unit: '٪' },
    { label: 'أذكار المساء', value: Math.round(eveningP * 100), goal: 100, icon: <Moon className="w-5 h-5 text-primary" />, unit: '٪' },
    { label: 'الاستماع', value: todayListenMin, goal: LISTEN_DAILY_GOAL_MIN, icon: <Headphones className="w-5 h-5 text-primary" />, unit: 'دقيقة' },
  ];
  const dailyDone = daily.filter(d => d.value >= d.goal).length;

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto px-4" dir="rtl" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <NoorImg name="star" size={46} />
        <div className="flex-1 min-w-0">
          <h1 className="text-[1.7rem] leading-tight text-gold-gradient">إحصائياتي</h1>
          <p className="text-xs text-muted-foreground truncate">
            {profile?.name ?? 'رحلتك الإيمانية'}
            {profile?.governorateName && <span> · <MapPin className="w-3 h-3 inline" /> {profile.governorateName}</span>}
          </p>
        </div>
        <GoldBadge><Award className="w-3 h-3" /> {arNum(unlocked)}/{arNum(badges.length)}</GoldBadge>
      </div>

      {/* Today hero */}
      <div className="noor-card-hero rounded-[28px] p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 noor-pattern" />
        <div className="relative flex items-center gap-4 mb-4">
          <ProgressRing value={dailyDone / daily.length} size={84} stroke={7}>
            <div>
              <p className="text-xl font-black text-gold-gradient leading-none tabular-nums">{arNum(dailyDone)}/{arNum(daily.length)}</p>
              <p className="text-[9px] text-muted-foreground mt-1">أهداف</p>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <p className="font-bold text-foreground text-lg">تتبّع اليوم</p>
            <p className="text-xs text-muted-foreground mt-0.5">«أحب الأعمال إلى الله أدومها وإن قل»</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {azkarStreak > 0 && <GoldBadge><Flame className="w-3 h-3" /> أذكار {arNum(azkarStreak)} يوم</GoldBadge>}
              {tadabburStreak > 0 && <GoldBadge tone="emerald">تدبّر {arNum(tadabburStreak)} يوم</GoldBadge>}
            </div>
          </div>
        </div>
        <div className="relative space-y-3">
          {daily.map(d => (
            <div key={d.label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl noor-emerald-orb flex items-center justify-center flex-shrink-0">{d.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-foreground/90">{d.label}</span>
                  <span className={cn('tabular-nums', d.value >= d.goal ? 'text-success font-bold' : 'text-muted-foreground')}>
                    {arNum(d.value)}{d.unit === '٪' ? '٪' : ` / ${arNum(d.goal)} ${d.unit}`}
                  </span>
                </div>
                <GoldBar value={d.value / d.goal} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly chart */}
      <div className="noor-card rounded-3xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-primary">نشاط الأسبوع</h3>
        </div>
        <ChipTabs<Metric> className="mb-4" value={metric} onChange={setMetric}
          items={[{ id: 'ayahs', label: 'الآيات' }, { id: 'tasbih', label: 'التسبيح' }, { id: 'listen', label: 'الاستماع' }]} />
        <BarChart values={series} labels={weekLabels} unit={unit} />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'آيات مقروءة', value: ayahsTotal, icon: <BookOpen className="w-5 h-5 text-primary" /> },
          { label: 'إجمالي التسبيحات', value: totalTasbeeh, icon: <TasbihIcon size={20} style={{ color: 'hsl(var(--primary))' }} /> },
          { label: 'ساعات الاستماع', value: Math.round((listenTotalSec / 3600) * 10) / 10, icon: <Headphones className="w-5 h-5 text-primary" /> },
          { label: 'ختمات القرآن', value: quranCompletions, icon: <Star className="w-5 h-5 text-primary" /> },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="noor-card rounded-3xl p-4">
            <div className="w-10 h-10 rounded-2xl noor-emerald-orb flex items-center justify-center mb-3">{s.icon}</div>
            <p className="text-2xl font-black tabular-nums text-gold-gradient leading-none">{arNum(s.value.toLocaleString('en'))}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Badges */}
      <div className="noor-card rounded-3xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-primary flex-1">شارات التميّز</h3>
          <span className="text-xs text-muted-foreground">{arNum(unlocked)} من {arNum(badges.length)}</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {badges.map(b => (
            <div key={b.title} className="flex flex-col items-center text-center gap-1.5">
              <div className={cn('relative w-16 h-16 rounded-full flex items-center justify-center', b.ok ? 'noor-gold-orb' : 'noor-emerald-orb opacity-60')}>
                <NoorImg name={b.icon} size={34} className={b.ok ? '' : 'grayscale opacity-50'} />
                {!b.ok && <Lock className="absolute -bottom-0.5 -left-0.5 w-5 h-5 p-1 rounded-full bg-background text-muted-foreground border border-border" />}
              </div>
              <p className={cn('text-[10px] font-bold leading-tight', b.ok ? 'text-primary' : 'text-muted-foreground')}>{b.title}</p>
              {!b.ok && b.p !== undefined && <GoldBar value={b.p} className="w-12 h-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Top dhikr & quiz */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="noor-card rounded-3xl p-4">
          <p className="text-[11px] text-muted-foreground mb-1">أكثر ذكر</p>
          <p className="font-quran text-lg leading-relaxed truncate">{topDhikr && topDhikr.count > 0 ? topDhikr.text : '—'}</p>
          <p className="text-primary font-bold tabular-nums text-sm">{topDhikr ? arNum(topDhikr.count.toLocaleString('en')) : '٠'}</p>
        </div>
        <div className="noor-card rounded-3xl p-4">
          <p className="text-[11px] text-muted-foreground mb-1">المسابقات</p>
          <p className="text-2xl font-black text-gold-gradient tabular-nums">{arNum(quizPlayed)}</p>
          <p className="text-xs text-muted-foreground">أفضل نتيجة {arNum(quizBest)}٪</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="noor-card rounded-3xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-primary">سجل الأيام</h3>
          <button onClick={() => setShowAllDays(v => !v)} className="press noor-chip !h-7 !px-3 !text-[11px]">
            {showAllDays ? 'آخر ١٣ أسبوعاً' : 'كل الأيام'}
          </button>
        </div>
        <div className="overflow-x-auto no-scrollbar" style={{ direction: 'ltr' }}>
          <div className="inline-flex gap-[3px]">
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col gap-[3px]">
                {week.map(cell => (
                  <div key={cell.key} title={cell.score >= 0 ? `${cell.key}: ${cell.score}/8` : ''}
                    style={{
                      width: 13, height: 13, borderRadius: 3, background: heatCell(cell.score),
                      border: cell.isToday ? '1.5px solid hsl(var(--primary))' : '1px solid hsl(var(--primary) / .06)',
                      boxShadow: cell.score >= 7 ? '0 0 6px hsl(42 75% 62% / .7)' : 'none',
                    }} />
                ))}
              </div>
            ))}
            <div className="flex flex-col gap-[3px] pl-1">
              {DAY_SHORT.map(d => <div key={d} className="text-[9px] text-muted-foreground leading-[13px] h-[13px]">{d}</div>)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-primary/10" style={{ direction: 'ltr' }}>
          {[0, 2, 4, 6, 8].map(s => (
            <div key={s} className="flex items-center gap-1">
              <span style={{ width: 11, height: 11, borderRadius: 3, background: heatCell(s), display: 'inline-block' }} />
              <span className="text-[9px] text-muted-foreground">{s === 0 ? 'لا شيء' : s === 8 ? 'مثالي' : arNum(s)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
