import { useState, useEffect, type ReactElement } from 'react';
import { SURAH_NAMES } from '@/lib/constants';
import { HISN_ITEMS } from '@/lib/hisnData';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'wouter';
import { queueDailyTrackerSync, getCurrentUid, getCacheValue, getSettingCache } from '@/lib/rtdb';
import { getOrCreateLocalUid } from '@/lib/rtdb';

const MORNING_CAT_ID = 27;
const EVENING_CAT_ID = 9001;
const MORNING_ITEMS = HISN_ITEMS[MORNING_CAT_ID] ?? [];
const EVENING_ITEMS = HISN_ITEMS[EVENING_CAT_ID] ?? MORNING_ITEMS;

const TASBIH_DAILY_GOAL = 500;

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface TrackerState {
  prayers: Record<PrayerKey, boolean>;
  quranWird: boolean;
}

const DEFAULT_STATE: TrackerState = {
  prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
  quranWird: false,
};


function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── 3D Prayer icons ────────────────────────────────────────────── */
function FajrIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="fajrGrad" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#ffe4a0'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#c5a059'} />
        </radialGradient>
      </defs>
      {/* Horizon line */}
      <line x1="2" y1="20" x2="26" y2="20" stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
      {/* Sun peeking (half circle) */}
      <circle cx="14" cy="20" r="5.5" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.9" />
      <circle cx="14" cy="20" r="5.5" fill="url(#fajrGrad)" />
      <path d="M 8.5 20 A 5.5 5.5 0 0 0 19.5 20" fill="white" fillOpacity="0.15" />
      <circle cx="12.5" cy="18.5" r="1.8" fill="white" fillOpacity="0.35" />
      {/* Dawn rays */}
      {[-40, -20, 0, 20, 40].map((a, i) => {
        const rad = (a - 90) * Math.PI / 180;
        return (
          <line key={i}
            x1={14 + 7.5 * Math.cos(rad)} y1={20 + 7.5 * Math.sin(rad)}
            x2={14 + 9.5 * Math.cos(rad)} y2={20 + 9.5 * Math.sin(rad)}
            stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />
        );
      })}
      {/* Stars */}
      <circle cx="6" cy="10" r="1" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.6" />
      <circle cx="5.5" cy="9.6" r="0.4" fill="white" fillOpacity="0.7" />
      <circle cx="22" cy="8" r="0.7" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.5" />
    </svg>
  );
}

function DhuhrIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="dhuhrGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#fff0b0'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#c5a059'} />
        </radialGradient>
      </defs>
      {/* Glow */}
      <circle cx="14" cy="14" r="8" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.08" />
      {/* Shadow */}
      <circle cx="14.5" cy="14.5" r="5.5" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.2" />
      {/* Sun */}
      <circle cx="14" cy="14" r="5.5" fill="url(#dhuhrGrad)" />
      <circle cx="12" cy="12" r="2.2" fill="white" fillOpacity="0.35" />
      <circle cx="12.5" cy="12.5" r="1" fill="white" fillOpacity="0.45" />
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = deg * Math.PI / 180;
        return (
          <line key={i}
            x1={14 + 6.8 * Math.cos(rad)} y1={14 + 6.8 * Math.sin(rad)}
            x2={14 + (i % 2 === 0 ? 8.8 : 8) * Math.cos(rad)} y2={14 + (i % 2 === 0 ? 8.8 : 8) * Math.sin(rad)}
            stroke={done ? '#22c55e' : '#c5a059'} strokeWidth={i % 2 === 0 ? 1.8 : 1.2} strokeOpacity="0.75" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

function AsrIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="asrGrad" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#ffd580'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#b08030'} />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="5.5" fill="url(#asrGrad)" />
      <circle cx="12" cy="12" r="2" fill="white" fillOpacity="0.3" />
      {/* Afternoon slanted rays */}
      {[20, 65, 110, 155, 200, 245].map((deg, i) => {
        const rad = deg * Math.PI / 180;
        return (
          <line key={i}
            x1={14 + 6.5 * Math.cos(rad)} y1={14 + 6.5 * Math.sin(rad)}
            x2={14 + 8.5 * Math.cos(rad)} y2={14 + 8.5 * Math.sin(rad)}
            stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />
        );
      })}
      {/* Shadow on ground */}
      <ellipse cx="14" cy="24" rx="6" ry="1.5" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.15" />
      <line x1="14" y1="19.5" x2="20" y2="24" stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

function MaghribIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="maghribGrad" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#ffb060'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#8b4a1a'} />
        </radialGradient>
      </defs>
      {/* Sky gradient band */}
      <rect x="0" y="14" width="28" height="6" rx="0" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.06" />
      {/* Horizon */}
      <line x1="2" y1="20" x2="26" y2="20" stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      {/* Setting sun — partly below horizon */}
      <clipPath id="aboveHorizon">
        <rect x="0" y="0" width="28" height="20" />
      </clipPath>
      <circle cx="14" cy="20" r="6" fill="url(#maghribGrad)" clipPath="url(#aboveHorizon)" />
      <path d="M 8 20 A 6 6 0 0 0 20 20" fill="white" fillOpacity="0.15" />
      {/* Warm glow */}
      <ellipse cx="14" cy="20" rx="10" ry="3" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.12" />
      {/* Horizon rays */}
      {[-50, -25, 0, 25, 50].map((a, i) => {
        const rad = (a - 90) * Math.PI / 180;
        return (
          <line key={i}
            x1={14 + 7.5 * Math.cos(rad)} y1={20 + 7.5 * Math.sin(rad)}
            x2={14 + 10 * Math.cos(rad)} y2={20 + 10 * Math.sin(rad)}
            stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.2" strokeOpacity="0.55" strokeLinecap="round"
            clipPath="url(#aboveHorizon)" />
        );
      })}
    </svg>
  );
}

function IshaIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="ishaGrad" cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#c8b0ff'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#6b4fa0'} />
        </radialGradient>
      </defs>
      {/* Moon shadow */}
      <path d="M 20 14.5 A 9 9 0 1 1 11 5 7 7 0 0 0 20 14.5 Z"
        fill={done ? '#22c55e' : '#6b4fa0'} fillOpacity="0.2" transform="translate(0.4,0.4)" />
      {/* Moon */}
      <path d="M 20 14.5 A 9 9 0 1 1 11 5 7 7 0 0 0 20 14.5 Z"
        fill="url(#ishaGrad)" />
      {/* Highlight */}
      <path d="M 11 5 Q 7 7 5 11 Q 5 8 8 5 Z" fill="white" fillOpacity="0.25" />
      {/* Stars */}
      {[{ cx: 21, cy: 7, r: 1.1 }, { cx: 24, cy: 12, r: 0.75 }, { cx: 19, cy: 4.5, r: 0.75 }].map((s, i) => (
        <g key={i}>
          <circle cx={s.cx} cy={s.cy} r={s.r} fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.9" />
          <circle cx={s.cx - s.r * 0.35} cy={s.cy - s.r * 0.35} r={s.r * 0.45} fill="white" fillOpacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

type PrayerIconComp = ({ done }: { done: boolean }) => ReactElement;
const PRAYER_ICONS: Record<PrayerKey, PrayerIconComp> = {
  fajr: FajrIcon,
  dhuhr: DhuhrIcon,
  asr: AsrIcon,
  maghrib: MaghribIcon,
  isha: IshaIcon,
};

/* ── Card icons ────────────────────────────────────────────── */
function MosqueIcon3D() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <g opacity="0.2" transform="translate(0.4, 0.4)">
        <path d="M5 10 Q5 4 12 4 Q19 4 19 10" fill="currentColor" />
        <rect x="5" y="10" width="14" height="10" rx="0.5" fill="currentColor" />
      </g>
      <path d="M5 10 Q5 4 12 4 Q19 4 19 10" fill="currentColor" fillOpacity="0.85" />
      <path d="M6.5 9 Q7 5.5 12 4.5" stroke="white" strokeWidth="0.9" strokeOpacity="0.4" fill="none" strokeLinecap="round" />
      <rect x="5" y="10" width="14" height="10" rx="0.5" fill="currentColor" fillOpacity="0.7" />
      <path d="M10 20 L10 15 Q12 13 14 15 L14 20" fill="currentColor" fillOpacity="0.5" />
      <rect x="2" y="8" width="2.5" height="12" rx="0.5" fill="currentColor" fillOpacity="0.75" />
      <path d="M2 8 Q3.25 5.5 4.5 8" fill="currentColor" fillOpacity="0.9" />
      <circle cx="3.25" cy="5" r="0.6" fill="currentColor" />
      <rect x="19.5" y="8" width="2.5" height="12" rx="0.5" fill="currentColor" fillOpacity="0.65" />
      <path d="M19.5 8 Q20.75 5.5 22 8" fill="currentColor" fillOpacity="0.8" />
      <circle cx="9" cy="13" r="0.9" fill="white" fillOpacity="0.35" />
      <circle cx="15" cy="13" r="0.9" fill="white" fillOpacity="0.25" />
      <path d="M11.2 3.5 Q12 2.2 13 3.5" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function QuranBookIcon3D() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <g opacity="0.2" transform="translate(0.4,0.4)">
        <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17" fill="currentColor" />
        <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17" fill="currentColor" />
      </g>
      <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17" fill="currentColor" fillOpacity="0.75" />
      <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17" fill="currentColor" fillOpacity="0.55" />
      <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.9" />
      <line x1="12" y1="4" x2="12" y2="17" stroke="white" strokeWidth="0.7" strokeOpacity="0.4" />
      {[9, 11, 13, 15].map(y => (
        <line key={y} x1="5.5" y1={y} x2="10.5" y2={y} strokeWidth="0.8" stroke="currentColor" strokeOpacity="0.55" />
      ))}
      {[9, 11, 13, 15].map(y => (
        <line key={y} x1="13.5" y1={y} x2="18.5" y2={y} strokeWidth="0.8" stroke="currentColor" strokeOpacity="0.4" />
      ))}
    </svg>
  );
}

function TasbihIcon3D() {
  const cx = 12, cy = 14, r = 6.5;
  const beads = Array.from({ length: 12 }, (_, i) => {
    const deg = 15 + i * 30;
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  });
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <circle cx={cx} cy={cy + 0.4} r={r} stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" fill="none" />
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="1" fill="none" />
      <path d={`M ${cx - r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}`}
        stroke="white" strokeWidth="0.7" strokeOpacity="0.35" fill="none" strokeLinecap="round" />
      {beads.map((b, i) => {
        const br = i === 5 ? 1.6 : 1.1;
        return (
          <g key={i}>
            <circle cx={b.x + 0.2} cy={b.y + 0.2} r={br} fill="currentColor" fillOpacity="0.2" />
            <circle cx={b.x} cy={b.y} r={br} fill="currentColor" />
            <circle cx={b.x - br * 0.35} cy={b.y - br * 0.35} r={br * 0.35} fill="white" fillOpacity="0.45" />
          </g>
        );
      })}
      <circle cx={12} cy={5.5} r={2.1} fill="currentColor" fillOpacity="0.25" />
      <circle cx={12} cy={5.5} r={1.8} fill="currentColor" />
      <circle cx={11.2} cy={4.7} r={0.7} fill="white" fillOpacity="0.5" />
      <line x1="12" y1="20.5" x2="12" y2="22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="23" r="0.8" fill="currentColor" />
    </svg>
  );
}

function DuaIcon3D() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <g opacity="0.2" transform="translate(0.3,0.3)">
        <path d="M6 10V7a1 1 0 0 1 2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 11V9a1 1 0 0 1 2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 10V8a1 1 0 0 1 2 0v5.5c0 1.38-1.12 2.5-2.5 2.5H6A3 3 0 0 1 3 13v-2a1 1 0 0 1 2 0"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <path d="M6 10V7a1 1 0 0 1 2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 11V9a1 1 0 0 1 2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 10V8a1 1 0 0 1 2 0v5.5c0 1.38-1.12 2.5-2.5 2.5H6A3 3 0 0 1 3 13v-2a1 1 0 0 1 2 0"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 10V7a1 1 0 0 0-2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 11V9a1 1 0 0 0-2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10V8a1 1 0 0 0-2 0v5.5c0 1.38 1.12 2.5 2.5 2.5H18a3 3 0 0 0 3-3v-2a1 1 0 0 0-2 0"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: 'fajr',    label: 'الفجر'  },
  { key: 'dhuhr',   label: 'الظهر'  },
  { key: 'asr',     label: 'العصر'  },
  { key: 'maghrib', label: 'المغرب' },
  { key: 'isha',    label: 'العشاء' },
];

/* ── Main component ─────────────────────────────────────────── */
export function HomeTracker() {
  const [currentDateKey, setCurrentDateKey] = useState(getTodayDateKey);

  // Load from RTDB cache (populated at startup by initUserSync)
  const [state, setState] = useState<TrackerState>(() => {
    const cached = getCacheValue<TrackerState | null>(`daily_tracker/${currentDateKey}`, null);
    return cached ?? DEFAULT_STATE;
  });

  // أذكار الصباح progress
  const morningProgress = getCacheValue<Record<number, number>>(`azkar/${currentDateKey}/${MORNING_CAT_ID}`, {});
  const morningDoneCount = MORNING_ITEMS.filter(z => (morningProgress[z.id] ?? 0) >= z.count).length;
  const morningDone = MORNING_ITEMS.length > 0 && morningDoneCount === MORNING_ITEMS.length;

  // أذكار المساء progress
  const eveningProgress = getCacheValue<Record<number, number>>(`azkar/${currentDateKey}/${EVENING_CAT_ID}`, {});
  const eveningDoneCount = EVENING_ITEMS.filter(z => (eveningProgress[z.id] ?? 0) >= z.count).length;
  const eveningDone = EVENING_ITEMS.length > 0 && eveningDoneCount === EVENING_ITEMS.length;

  // Daily tasbih count — read from RTDB cache
  const dailyTasbihCount = getCacheValue<number>(`tasbih_daily/${currentDateKey}`, 0);

  const tasbih500Done = dailyTasbihCount >= TASBIH_DAILY_GOAL;
  const tasbihPct = Math.min(100, Math.round((dailyTasbihCount / TASBIH_DAILY_GOAL) * 100));
  const prayersDone = PRAYERS.filter(p => state.prayers[p.key]).length;
  const doneTasks = prayersDone + (morningDone ? 1 : 0) + (eveningDone ? 1 : 0) + (state.quranWird ? 1 : 0) + (tasbih500Done ? 1 : 0);
  const progressPct = Math.round((doneTasks / 9) * 100);

  const togglePrayer = (key: PrayerKey) => {
    setState(prev => {
      const next = { ...prev, prayers: { ...prev.prayers, [key]: !prev.prayers[key] } };
      const uid = getCurrentUid() || getOrCreateLocalUid();
      if (uid) queueDailyTrackerSync(uid, currentDateKey, next);
      return next;
    });
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const toggleQuranWird = () => {
    setState(prev => {
      const next = { ...prev, quranWird: !prev.quranWird };
      const uid = getCurrentUid() || getOrCreateLocalUid();
      if (uid) queueDailyTrackerSync(uid, currentDateKey, next);
      return next;
    });
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  useEffect(() => {
    const id = setInterval(() => {
      const k = getTodayDateKey();
      if (k !== currentDateKey) setCurrentDateKey(k);
    }, 30000);
    return () => clearInterval(id);
  }, [currentDateKey]);

  const bookmark = getSettingCache<{ surah: number; ayah: number } | null>('quran_bookmark', null);

  const progressColor = progressPct === 100 ? '#22c55e' : progressPct >= 60 ? '#c5a059' : '#a07a3a';

  return (
    <div className="space-y-4" dir="rtl">

      {/* ── Progress header ── */}
      <div className="rounded-3xl p-4 border border-primary/20 bg-card"
        style={{ boxShadow: '0 1px 6px rgba(197,160,89,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(197,160,89,0.2), rgba(197,160,89,0.08))' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor" fillOpacity="0.85" stroke="currentColor" strokeWidth="0.5" />
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="white" fillOpacity="0.15" clipPath="url(#starTopHalf)" />
                <defs><clipPath id="starTopHalf"><rect x="0" y="0" width="24" height="12" /></clipPath></defs>
              </svg>
            </div>
            <h2 className="font-bold text-base text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              المتتبع اليومي
            </h2>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: progressColor }}>
            {progressPct}%
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(197,160,89,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${progressColor}88, ${progressColor})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {doneTasks} / 9 مهام
          </span>
          <AnimatePresence>
            {progressPct === 100 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-green-500 flex items-center gap-1"
                style={{ fontFamily: '"Tajawal", sans-serif' }}
              >
                <Check className="w-3 h-3" /> يوم مثالي!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Prayer rows (table style) ── */}
      <div className="bg-card rounded-3xl border border-primary/15 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(197,160,89,0.12)' }}>
              <MosqueIcon3D />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              الصلوات الخمس
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {PRAYERS.map((p, i) => (
              <div key={p.key} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: state.prayers[p.key] ? '#c5a059' : 'rgba(197,160,89,0.2)' }} />
            ))}
            <span className="text-xs text-muted-foreground mr-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {prayersDone}/5
            </span>
          </div>
        </div>

        {/* Prayer grid — 5 columns side by side */}
        <div className="px-3 pb-3">
          <div className="grid grid-cols-5 gap-2">
            {PRAYERS.map((prayer) => {
              const done = state.prayers[prayer.key];
              const PrayerIcon = PRAYER_ICONS[prayer.key];
              return (
                <motion.button
                  key={prayer.key}
                  onClick={() => togglePrayer(prayer.key)}
                  whileTap={{ scale: 0.93 }}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300"
                  style={
                    done
                      ? { background: 'rgba(197,160,89,0.13)', border: '1.5px solid rgba(197,160,89,0.4)' }
                      : { background: 'rgba(197,160,89,0.04)', border: '1.5px solid rgba(197,160,89,0.1)' }
                  }
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                    style={{
                      background: done
                        ? 'linear-gradient(135deg, rgba(197,160,89,0.25), rgba(197,160,89,0.1))'
                        : 'rgba(197,160,89,0.08)',
                      boxShadow: done ? '0 2px 8px rgba(197,160,89,0.25)' : 'none',
                    }}
                  >
                    <PrayerIcon done={done} />
                  </div>

                  {/* Label */}
                  <span
                    className="font-bold text-[11px] leading-tight text-center"
                    style={{
                      fontFamily: '"Tajawal", sans-serif',
                      color: done ? '#c5a059' : 'var(--foreground)',
                    }}
                  >
                    {prayer.label}
                  </span>

                  {/* Check dot */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                    style={
                      done
                        ? { background: 'linear-gradient(135deg, #c5a059, #9a7430)', boxShadow: '0 2px 6px rgba(197,160,89,0.4)' }
                        : { border: '1.5px solid rgba(197,160,89,0.3)', background: 'transparent' }
                    }
                  >
                    {done && <Check className="w-3 h-3 text-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Task Cards ── */}
      <div className="space-y-3">

        {/* Morning azkar card */}
        <div className="rounded-2xl p-4 border transition-all duration-300"
          style={morningDone
            ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
            : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: morningDone ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}>
                <DuaIcon3D />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>أذكار الصباح</p>
                <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: 'var(--muted-foreground)' }}>
                  {morningDone ? 'مكتمل ✓' : morningDoneCount > 0
                    ? `${morningDoneCount} / ${MORNING_ITEMS.length} ذكر`
                    : 'لم يبدأ بعد'}
                </p>
              </div>
            </div>
            {morningDone ? (
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/30">
                <Check className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Link href="/azkar">
                <div className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg, #c5a059, #9a7430)', color: '#fff' }}>
                  ابدأ
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Evening azkar card */}
        <div className="rounded-2xl p-4 border transition-all duration-300"
          style={eveningDone
            ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
            : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: eveningDone ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}>
                <DuaIcon3D />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>أذكار المساء</p>
                <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: 'var(--muted-foreground)' }}>
                  {eveningDone ? 'مكتمل ✓' : eveningDoneCount > 0
                    ? `${eveningDoneCount} / ${EVENING_ITEMS.length} ذكر`
                    : 'لم يبدأ بعد'}
                </p>
              </div>
            </div>
            {eveningDone ? (
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/30">
                <Check className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Link href="/azkar">
                <div className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg, #c5a059, #9a7430)', color: '#fff' }}>
                  ابدأ
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Quran wird card */}
        <div className="rounded-2xl border transition-all duration-300"
          style={
            state.quranWird
              ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
              : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--color-card)' }
          }>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: state.quranWird ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}>
                  <QuranBookIcon3D />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>الورد القرآني</p>
                  {bookmark ? (
                    <p className="text-xs mt-0.5 text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      من: {SURAH_NAMES[bookmark.surah]} آية {bookmark.ayah}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      ضع علامة حفظ في المصحف أولاً
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                onClick={toggleQuranWird}
                whileTap={{ scale: 0.88 }}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                style={
                  state.quranWird
                    ? { background: '#22c55e', borderColor: '#22c55e' }
                    : { background: 'transparent', borderColor: 'rgba(197,160,89,0.35)' }
                }
              >
                {state.quranWird && <Check className="w-4 h-4 text-white" />}
              </motion.button>
            </div>

            {!state.quranWird && (
              <button onClick={toggleQuranWird} className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-center transition-all"
                style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg, #c5a059, #9a7430)', color: '#fff' }}>
                أكملت وردي ✓
              </button>
            )}

            {!bookmark && (
              <Link href="/quran">
                <div className="mt-3 py-2 rounded-xl text-xs font-bold text-center"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'rgba(197,160,89,0.1)', color: '#c5a059', border: '1px solid rgba(197,160,89,0.25)' }}>
                  اذهب للمصحف وضع علامة حفظ →
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* 500 Tasbih card */}
        <div className="rounded-2xl p-4 border transition-all duration-300"
          style={
            tasbih500Done
              ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
              : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--color-card)' }
          }>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: tasbih500Done ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}>
                <TasbihIcon3D />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>٥٠٠ تسبيحة يومياً</p>
                <p className="text-xs mt-0.5 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {tasbih500Done ? 'مكتمل ✓' : `${dailyTasbihCount.toLocaleString('ar-EG')} / ${TASBIH_DAILY_GOAL.toLocaleString('ar-EG')} تسبيحة`}
                </p>
              </div>
            </div>
            {tasbih500Done ? (
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/30">
                <Check className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Link href="/tasbih">
                <div className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg, #c5a059, #9a7430)', color: '#fff' }}>
                  سبّح
                </div>
              </Link>
            )}
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(197,160,89,0.12)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: tasbih500Done ? 'linear-gradient(90deg, #22c55e99, #22c55e)' : 'linear-gradient(90deg, #c5a05999, #c5a059)' }}
              initial={{ width: 0 }}
              animate={{ width: `${tasbihPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
