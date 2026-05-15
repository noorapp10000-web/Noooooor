import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, BookOpen, Flame, MapPin } from 'lucide-react';
import { TasbihIcon } from '@/components/NoorIcons';
import { getCacheValue, getProfileCache, getFullCache, todayKey } from '@/lib/rtdb';
import { TASBIH_TYPES } from '@/lib/constants';
import { HISN_ITEMS } from '@/lib/hisnData';

const MORNING_CAT_ID_R = 27;
const EVENING_CAT_ID_R = 9001;
const TASBIH_DAILY_GOAL_R = 500;
const MORNING_ITEMS_R = HISN_ITEMS[MORNING_CAT_ID_R] ?? [];
const EVENING_ITEMS_R = HISN_ITEMS[EVENING_CAT_ID_R] ?? MORNING_ITEMS_R;

function getDayScoreR(dateKey: string): number {
  let score = 0;
  try {
    const t = getCacheValue<{ prayers?: Record<string, boolean>; quranWird?: boolean }>(`daily_tracker/${dateKey}`, {});
    score += Object.values(t.prayers || {}).filter(Boolean).length;
    if (t.quranWird) score += 1;
  } catch {}
  try {
    const pm = getCacheValue<Record<number, number>>(`azkar/${dateKey}/${MORNING_CAT_ID_R}`, {});
    if (MORNING_ITEMS_R.length > 0 && MORNING_ITEMS_R.every(z => (pm[z.id] ?? 0) >= z.count)) score += 1;
  } catch {}
  try {
    const pe = getCacheValue<Record<number, number>>(`azkar/${dateKey}/${EVENING_CAT_ID_R}`, {});
    if (EVENING_ITEMS_R.length > 0 && EVENING_ITEMS_R.every(z => (pe[z.id] ?? 0) >= z.count)) score += 1;
  } catch {}
  try {
    if (getCacheValue<number>(`tasbih_daily/${dateKey}`, 0) >= TASBIH_DAILY_GOAL_R) score += 1;
  } catch {}
  return score;
}

function cellColorR(score: number, isToday: boolean): string {
  if (isToday && score === 0) return 'rgba(197,160,89,0.14)';
  if (score === 0) return 'rgba(197,160,89,0.06)';
  if (score <= 2) return '#6b4a20';
  if (score <= 4) return '#a0702e';
  if (score <= 6) return '#c5922a';
  if (score <= 7) return '#c5b060';
  return '#c5a059';
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function OrnamentDivider({ isDark }: { isDark: boolean }) {
  return (
    <svg viewBox="0 0 200 30" className="w-48" style={{ opacity: isDark ? 0.4 : 0.55 }} fill="#C19A6B">
      <polygon points="100,2 104,10 113,10 106,15 109,24 100,19 91,24 94,15 87,10 96,10" />
      <line x1="0" y1="15" x2="75" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6" />
      <line x1="125" y1="15" x2="200" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6" />
      <circle cx="77" cy="15" r="2" fill="#C19A6B" opacity="0.5" />
      <circle cx="123" cy="15" r="2" fill="#C19A6B" opacity="0.5" />
    </svg>
  );
}

function StatCard({ icon, label, value, sub, isDark, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  isDark: boolean; delay?: number;
}) {
  const gold = isDark ? '#E8C98A' : '#7A4F1E';
  const cardBg = isDark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)';
  const cardBorder = `rgba(193,154,107,${isDark ? '0.2' : '0.3'})`;
  const subText = isDark ? 'rgba(232,217,184,0.55)' : '#8B5E3C';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl p-4 flex flex-col items-center gap-2"
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.15)' }}>
        {icon}
      </div>
      <span className="text-2xl font-black" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>
        {typeof value === 'number' ? value.toLocaleString('ar-EG') : value}
      </span>
      <span className="text-sm font-bold text-center leading-tight" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>{label}</span>
      {sub && <span className="text-[11px] text-center" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>{sub}</span>}
    </motion.div>
  );
}

export function Rankings() {
  const isDark = useDarkMode();

  const profile = getProfileCache();
  const gold = isDark ? '#E8C98A' : '#7A4F1E';
  const subText = isDark ? 'rgba(232,217,184,0.55)' : '#8B5E3C';
  const cardBg = isDark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)';
  const cardBorder = `rgba(193,154,107,${isDark ? '0.2' : '0.3'})`;

  const bg = isDark
    ? 'radial-gradient(ellipse at center, #1a1208 0%, #0d0a05 60%, #080603 100%)'
    : 'radial-gradient(ellipse at center, #FAF4EA 0%, #F0E4CF 55%, #E6D5B5 100%)';

  // Gather local stats
  const totals = getCacheValue<Record<string, number>>('tasbih_totals', {});
  const totalTasbeeh = Object.values(totals).reduce((a, b) => a + b, 0);
  const todayTasbeeh = getCacheValue<number>(`tasbih_daily/${todayKey()}`, 0);
  const quranCompletions = getCacheValue<number>('quran_completions', 0);
  const lastSurah = getCacheValue<number>('last_surah', 1);
  const azkarStreak = getCacheValue<number>('azkar_streak', 0);
  const tadabburStreak = getCacheValue<number>('tadabbur_streak', 0);

  // Heatmap state
  const [showAllDays, setShowAllDays] = useState(false);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let gridStart: Date;
    let totalCells: number;

    if (showAllDays) {
      const cache = getFullCache();
      const allDateKeys: string[] = [];
      const dt = cache['daily_tracker'] as Record<string, unknown> | undefined;
      if (dt) allDateKeys.push(...Object.keys(dt));
      const td = cache['tasbih_daily'] as Record<string, unknown> | undefined;
      if (td) allDateKeys.push(...Object.keys(td));
      const az = cache['azkar'] as Record<string, unknown> | undefined;
      if (az) allDateKeys.push(...Object.keys(az));
      const validKeys = allDateKeys.filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
      let earliest = today;
      if (validKeys.length > 0) {
        const e = new Date(validKeys[0]);
        e.setHours(0, 0, 0, 0);
        if (e < today) earliest = e;
      }
      const startDow = earliest.getDay();
      gridStart = new Date(earliest);
      gridStart.setDate(gridStart.getDate() - startDow);
      const diffDays = Math.floor((today.getTime() - gridStart.getTime()) / 86400000) + 7;
      totalCells = Math.ceil(diffDays / 7) * 7;
    } else {
      const dayOfWeek = today.getDay();
      totalCells = 91 + (6 - dayOfWeek);
      gridStart = new Date(today);
      gridStart.setDate(gridStart.getDate() - (totalCells - 1));
    }

    const cells: { dateKey: string; score: number; isToday: boolean; date: Date }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isFuture = d > today;
      cells.push({ dateKey, score: isFuture ? -1 : getDayScoreR(dateKey), isToday: d.getTime() === today.getTime(), date: new Date(d) });
    }

    const numWeeks = Math.ceil(cells.length / 7);
    const weeksArr: typeof cells[] = [];
    for (let w = 0; w < numWeeks; w++) weeksArr.push(cells.slice(w * 7, w * 7 + 7));

    const months: { label: string; col: number }[] = [];
    weeksArr.forEach((week, col) => {
      const first = week[0];
      if (!first) return;
      if (col === 0 || first.date.getDate() <= 7) {
        const m = new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(first.date);
        if (!months.length || months[months.length - 1].label !== m) months.push({ label: m, col });
      }
    });

    return { weeks: weeksArr, monthLabels: months };
  }, [showAllDays]);

  // Top dhikr
  const topDhikrEntry = TASBIH_TYPES
    .map(t => ({ label: t.label, count: totals[t.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)[0];

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: bg }} dir="rtl">
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: isDark ? 0.05 : 0.07 }}
          viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid-stats" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C19A6B" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-stats)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center pt-10 pb-4 px-4">
        <div className="flex justify-center mb-3">
          <OrnamentDivider isDark={isDark} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: gold, fontFamily: '"Amiri", serif' }}>إحصائياتك الشخصية</h1>
        {profile && (
          <p className="text-sm mt-1" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>
            {profile.name}
            {profile.governorateName && (
              <span> · <MapPin size={11} className="inline" /> {profile.governorateName}</span>
            )}
          </p>
        )}
        <div className="flex justify-center mt-3">
          <OrnamentDivider isDark={isDark} />
        </div>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-28">

        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            isDark={isDark} delay={0.05}
            icon={<TasbihIcon size={20} style={{ color: '#C19A6B' }} />}
            label="إجمالي التسبيحات"
            value={totalTasbeeh}
            sub={`اليوم: ${todayTasbeeh.toLocaleString('ar-EG')}`}
          />
          <StatCard
            isDark={isDark} delay={0.1}
            icon={<BookOpen size={18} style={{ color: '#C19A6B' }} />}
            label="ختمات القرآن"
            value={quranCompletions}
            sub={quranCompletions === 0 ? 'في الطريق' : 'ماشاء الله'}
          />
          <StatCard
            isDark={isDark} delay={0.15}
            icon={<Flame size={18} style={{ color: '#C19A6B' }} />}
            label="أيام الأذكار"
            value={azkarStreak}
            sub="يوم متواصل"
          />
          <StatCard
            isDark={isDark} delay={0.2}
            icon={<Star size={18} style={{ color: '#C19A6B' }} />}
            label="تدبّر القرآن"
            value={tadabburStreak}
            sub={`آخر سورة: ${lastSurah}`}
          />
        </div>

        {/* Top dhikr */}
        {topDhikrEntry && topDhikrEntry.count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl p-4 mb-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={18} style={{ color: '#FFD700' }} />
              <p className="font-bold text-base" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>أكثر تسبيح</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: subText, fontFamily: '"Amiri", serif' }}>{topDhikrEntry.label}</span>
              <span className="font-black text-lg" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>
                {topDhikrEntry.count.toLocaleString('ar-EG')}
              </span>
            </div>
          </motion.div>
        )}

        {/* All tasbih breakdown */}
        {Object.keys(totals).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-4 mb-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <p className="font-bold text-sm mb-3" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>تفاصيل التسبيح</p>
            <div className="space-y-2">
              {TASBIH_TYPES.filter(t => (totals[t.id] ?? 0) > 0)
                .sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0))
                .map((t, i) => {
                  const cnt = totals[t.id] ?? 0;
                  const maxCnt = Math.max(...Object.values(totals));
                  const pct = maxCnt > 0 ? (cnt / maxCnt) * 100 : 0;
                  return (
                    <div key={t.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>{t.label}</span>
                        <span className="text-xs font-bold" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>
                          {cnt.toLocaleString('ar-EG')}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(193,154,107,0.12)' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #C19A6B, #a07840)' }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Day heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-4 mb-4"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>سجل الأيام</h3>
            <button
              onClick={() => setShowAllDays(v => !v)}
              className="text-xs px-2.5 py-1 rounded-full transition-all"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                background: showAllDays ? 'rgba(197,160,89,0.2)' : 'rgba(197,160,89,0.08)',
                color: '#c5a059',
                border: '1px solid rgba(197,160,89,0.25)',
              }}
            >
              {showAllDays ? 'آخر 13 أسبوع' : 'كل الأيام'}
            </button>
          </div>
          <div className="overflow-x-auto" style={{ direction: 'ltr' }}>
            <div style={{ display: 'inline-block' }}>
              <div style={{ display: 'flex', marginBottom: 4, paddingRight: 28 }}>
                {weeks.map((_, col) => {
                  const ml = monthLabels.find(m => m.col === col);
                  return (
                    <div key={col} style={{ width: 13, marginLeft: 2, flexShrink: 0 }}>
                      {ml && <span className="text-[8px] text-muted-foreground">{ml.label}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {weeks.map((week, col) => (
                  <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {week.map((cell, row) => (
                      <div key={row} style={{
                        width: 13, height: 13, borderRadius: 3,
                        background: cell.score < 0 ? 'transparent' : cellColorR(cell.score, cell.isToday),
                        border: cell.isToday ? '1.5px solid #c5a059' : '1px solid rgba(197,160,89,0.08)',
                        boxShadow: cell.score === 8 ? '0 0 5px rgba(197,160,89,0.7)' : 'none',
                        transition: 'background 0.2s',
                      }} title={cell.score >= 0 ? `${cell.dateKey}: ${cell.score}/8` : ''} />
                    ))}
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4 }}>
                  {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => (
                    <div key={d} style={{ height: 13, lineHeight: '13px' }} className="text-[9px] text-muted-foreground">{d}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <div className="flex items-end justify-center gap-3" style={{ direction: 'ltr' }}>
              {[
                { score: 0,  label: 'لا شيء' },
                { score: 2,  label: '١-٢' },
                { score: 4,  label: '٣-٥' },
                { score: 6,  label: '٦-٧' },
                { score: 8,  label: 'مثالي' },
              ].map(({ score, label }) => (
                <div key={score} className="flex flex-col items-center gap-1">
                  <div style={{
                    width: 13, height: 13, borderRadius: 3,
                    background: cellColorR(score, false),
                    border: '1px solid rgba(197,160,89,0.15)',
                    boxShadow: score === 8 ? '0 0 5px rgba(197,160,89,0.6)' : 'none',
                  }} />
                  <span className="text-[9px] text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Empty state */}
        {totalTasbeeh === 0 && quranCompletions === 0 && azkarStreak === 0 && (
          <div className="text-center py-8">
            <TasbihIcon size={40} style={{ color: '#C19A6B', opacity: 0.3, margin: '0 auto 12px' }} />
            <p className="text-sm" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>
              ابدأ بالذكر والتسبيح لتظهر إحصائياتك هنا
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
