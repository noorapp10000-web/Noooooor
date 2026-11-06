import { useState, useEffect, useMemo } from 'react';
import { MapPin, ChevronLeft, ChevronRight, X, Check, Copy, Share2 } from 'lucide-react';
import { usePrayerTimes } from '@/hooks/use-api';
import { HomeTracker } from '@/components/HomeTracker';
import { getProfileCache, updateProfileInRTDB, getCurrentUid } from '@/lib/rtdb';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { Coordinates, PrayerTimes } from 'adhan';
import { getCalcParams } from '@/lib/prayer-calc';
import NoorWidget from '@/lib/widget-bridge';
import { getTodayAyah, type DailyAyah } from '@/lib/daily-ayahs';
import { Link } from 'wouter';
import { QiblaCompassIcon, HadithIcon, HeadphonesIcon, RadioIcon, PrayerStepsIcon, IslamicStarIcon, HifzIcon, DuaHandsIcon } from '@/components/NoorIcons';

const QUICK_LINKS = [
  { path: '/qibla',        label: 'القبلة',        Icon: QiblaCompassIcon },
  { path: '/reciters',     label: 'القرّاء',       Icon: HeadphonesIcon },
  { path: '/hadith',       label: 'الأحاديث',      Icon: HadithIcon },
  { path: '/radio',        label: 'الإذاعة',       Icon: RadioIcon },
  { path: '/learn-prayer', label: 'تعلم الصلاة',   Icon: PrayerStepsIcon },
  { path: '/asma',         label: 'الأسماء الحسنى', Icon: IslamicStarIcon },
  { path: '/hifz-test',    label: 'اختبر حفظك',    Icon: HifzIcon },
  { path: '/sunnah',       label: 'السنن',         Icon: DuaHandsIcon },
];

async function shareDailyAyah(ayah: DailyAyah) {
  const text = `${ayah.surah} — الآية ${ayah.ayah}\n\n${ayah.text}\n\n📱 من تطبيق نور`;
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text, dialogTitle: 'مشاركة آية اليوم' });
      return;
    } catch {}
  }
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch {}
  }
  try { await navigator.clipboard.writeText(text); } catch {}
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

function DailyAyah() {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const ayah = getTodayAyah();

  const S = useMemo(() => ({
    card: {
      background: isDark
        ? 'linear-gradient(135deg, rgba(30,20,5,0.95) 0%, rgba(50,32,8,0.9) 100%)'
        : 'linear-gradient(135deg, rgba(255,248,235,0.98) 0%, rgba(244,234,210,0.95) 100%)',
      border: `1px solid rgba(193,154,107,${isDark ? '0.3' : '0.25'})`,
      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(193,154,107,0.12)',
    },
    header: {
      background: isDark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.1)',
      borderBottom: `1px solid rgba(193,154,107,${isDark ? '0.2' : '0.15'})`,
    },
    titleColor: isDark ? '#C19A6B' : '#7A4F1E',
    badgeBg: isDark ? 'rgba(193,154,107,0.18)' : 'rgba(193,154,107,0.15)',
    badgeColor: isDark ? '#E8C98A' : '#8B5E2A',
    ayahColor: isDark ? 'rgba(255,248,230,0.93)' : 'rgba(25,15,5,0.9)',
    shareBg: isDark ? 'rgba(193,154,107,0.18)' : 'rgba(193,154,107,0.15)',
    shareColor: isDark ? '#E8C98A' : '#6B4218',
  }), [isDark]);

  async function handleCopy() {
    const text = `${ayah.surah} — الآية ${ayah.ayah}\n\n${ayah.text}`;
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-3xl overflow-hidden" style={S.card} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={S.header}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 16 }}>📖</span>
          <span className="text-xs font-bold" style={{ fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif', color: S.titleColor }}>
            آية اليوم
          </span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
          fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif', background: S.badgeBg, color: S.badgeColor,
        }}>
          {ayah.surah} : {ayah.ayah}
        </span>
      </div>

      {/* Ayah text */}
      <div className="px-5 pt-5 pb-3">
        <p className="text-center leading-loose" style={{
          fontFamily: '"Scheherazade New", "Amiri", serif',
          fontSize: '1.25rem', lineHeight: '2.4rem', color: S.ayahColor,
        }}>
          {ayah.text}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{
            fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif',
            background: copied ? (isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)') : (isDark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.1)'),
            border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(193,154,107,0.3)'}`,
            color: copied ? '#16a34a' : S.titleColor,
          }}
        >
          {copied ? <span>✓</span> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'تم النسخ' : 'نسخ'}
        </button>
        <button
          onClick={() => shareDailyAyah(ayah)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
          style={{ fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif', background: S.shareBg, border: '1px solid rgba(193,154,107,0.4)', color: S.shareColor }}
        >
          <Share2 className="w-3.5 h-3.5" />
          مشاركة
        </button>
      </div>
    </div>
  );
}

const WIDGET_PRAYERS: Array<{ key: keyof PrayerTimes; name: string }> = [
  { key: 'fajr',    name: 'الفجر'  },
  { key: 'dhuhr',   name: 'الظهر'  },
  { key: 'asr',     name: 'العصر'  },
  { key: 'maghrib', name: 'المغرب' },
  { key: 'isha',    name: 'العشاء' },
];

function buildWidgetPayload(lat: number, lng: number) {
  const coords = new Coordinates(lat, lng);
  const params = getCalcParams();
  const entries: Array<{ name: string; timeMs: number; timeStr: string }> = [];
  for (let offset = 0; offset <= 2; offset++) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const pt = new PrayerTimes(coords, d, params);
    for (const { key, name } of WIDGET_PRAYERS) {
      const t = pt[key] as Date;
      if (!(t instanceof Date)) continue;
      const h = t.getHours(), m = t.getMinutes();
      const h12 = h % 12 || 12;
      const ampm = h < 12 ? 'ص' : 'م';
      entries.push({ name, timeMs: t.getTime(), timeStr: `${h12}:${String(m).padStart(2, '0')} ${ampm}` });
    }
  }
  return entries.sort((a, b) => a.timeMs - b.timeMs);
}

const PRAYERS = [
  { id: 'Fajr',    name: 'الفجر'  },
  { id: 'Sunrise', name: 'الشروق' },
  { id: 'Dhuhr',   name: 'الظهر'  },
  { id: 'Asr',     name: 'العصر'  },
  { id: 'Maghrib', name: 'المغرب' },
  { id: 'Isha',    name: 'العشاء' },
];

function fmt12(time: string): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = (mStr ?? '00').substring(0, 2);
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function offsetDate(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

/* 3D Clock SVG icon */
function Clock3DIcon({ size = 20 }: { size?: number }) {
  const c = size / 2;
  const r = size * 0.42;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <defs>
        <radialGradient id="clockFace" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
        </radialGradient>
      </defs>
      {/* Shadow */}
      <circle cx={c + size * 0.04} cy={c + size * 0.05} r={r} fill="currentColor" fillOpacity="0.12" />
      {/* Face */}
      <circle cx={c} cy={c} r={r} fill="url(#clockFace)" stroke="currentColor" strokeWidth={size * 0.07} strokeOpacity="0.9" />
      {/* Top highlight arc */}
      <path
        d={`M ${c - r * 0.55} ${c - r * 0.55} A ${r * 0.85} ${r * 0.85} 0 0 1 ${c + r * 0.45} ${c - r * 0.65}`}
        stroke="white" strokeWidth={size * 0.045} strokeOpacity="0.38" fill="none" strokeLinecap="round"
      />
      {/* Hour marks */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        const len = i % 3 === 0 ? size * 0.09 : size * 0.05;
        const x1 = c + (r - size * 0.03) * Math.cos(rad);
        const y1 = c + (r - size * 0.03) * Math.sin(rad);
        const x2 = c + (r - size * 0.03 - len) * Math.cos(rad);
        const y2 = c + (r - size * 0.03 - len) * Math.sin(rad);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor" strokeWidth={i % 3 === 0 ? size * 0.055 : size * 0.03}
            strokeOpacity={i % 3 === 0 ? 0.8 : 0.45} strokeLinecap="round" />
        );
      })}
      {/* Hour hand (pointing to ~10) */}
      <line x1={c} y1={c}
        x2={c + r * 0.5 * Math.cos((300 - 90) * Math.PI / 180)}
        y2={c + r * 0.5 * Math.sin((300 - 90) * Math.PI / 180)}
        stroke="currentColor" strokeWidth={size * 0.09} strokeLinecap="round" strokeOpacity="0.95" />
      {/* Minute hand (pointing to ~12) */}
      <line x1={c} y1={c}
        x2={c + r * 0.7 * Math.cos((-90) * Math.PI / 180)}
        y2={c + r * 0.7 * Math.sin((-90) * Math.PI / 180)}
        stroke="currentColor" strokeWidth={size * 0.06} strokeLinecap="round" strokeOpacity="0.85" />
      {/* Center dot */}
      <circle cx={c} cy={c} r={size * 0.07} fill="currentColor" />
      <circle cx={c - size * 0.02} cy={c - size * 0.02} r={size * 0.03} fill="white" fillOpacity="0.6" />
    </svg>
  );
}

const HIJRI_ADJUST_KEY = 'noor_hijri_adjust';

export function Home() {
  const [dateOffset, setDateOffset] = useState(0);
  const [hijriAdjust, setHijriAdjust] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(HIJRI_ADJUST_KEY) ?? '0', 10) || 0; } catch { return 0; }
  });
  const [showGovPicker, setShowGovPicker] = useState(false);

  function changeHijriAdjust(delta: number) {
    setHijriAdjust(prev => {
      const next = prev + delta;
      try { localStorage.setItem(HIJRI_ADJUST_KEY, String(next)); } catch {}
      return next;
    });
  }

  const [userProfile, setUserProfile] = useState(() => getProfileCache());

  // Re-read profile after mount — on APK the cache may load after first render
  useEffect(() => {
    const p = getProfileCache();
    if (p) setUserProfile(p);
    // Also listen for profile updates from Settings / Login
    const handler = () => setUserProfile(getProfileCache());
    window.addEventListener('noor:profile-updated', handler);
    return () => window.removeEventListener('noor:profile-updated', handler);
  }, []);

  const activeLat = userProfile?.lat ?? null;
  const activeLng = userProfile?.lng ?? null;
  const lat = userProfile?.lat ?? null;
  const lng = userProfile?.lng ?? null;

  const { data: prayerResult } = usePrayerTimes(activeLat, activeLng, dateOffset);
  const times = prayerResult?.timings;
  const hijri = prayerResult?.hijri;

  const [nextPrayer, setNextPrayer] = useState<{ name: string; time24: string } | null>(null);
  const [countdown, setCountdown] = useState('');

  // ── Android Widget Bridge ────────────────────────────────────────────────
  // Sends prayer times + city + username + hijri date to SharedPreferences so the
  // widget works even when the app is fully closed. Re-runs when any of these change.
  // NoorWidget is Android-only (home screen widget) — not available on iOS.
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    if (!lat || !lng) return;
    const prayers = buildWidgetPayload(lat, lng);
    const todayHijri = (() => {
      if (hijri && hijriAdjust === 0) {
        return `${hijri.day} ${hijri.month?.ar ?? ''} ${hijri.year} هـ`;
      }
      const d = new Date(Date.now() + hijriAdjust * 86400000);
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric', month: 'long', year: 'numeric',
      }).format(d);
    })();
    NoorWidget.setPrayerTimes({
      prayers,
      lat,
      lng,
      city: userProfile?.governorateName ?? '',
      username: userProfile?.name ?? '',
      hijriDate: todayHijri,
    }).catch(() => {});
  }, [lat, lng, userProfile?.governorateName, userProfile?.name, hijri, hijriAdjust]);

  useEffect(() => {
    if (!times || dateOffset !== 0) return;
    // Use Cairo timezone for current time comparison (all supported govs are Egypt)
    const nowCairo = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Cairo',
    }).format(new Date());
    const [nowH, nowM] = nowCairo.split(':').map(Number);
    const nowMins = (nowH === 24 ? 0 : nowH) * 60 + nowM;
    let found = false;
    let nextName = '';
    let nextTime = '';
    for (const p of PRAYERS) {
      const t24 = (times[p.id] ?? '').substring(0, 5);
      if (t24 && toMins(t24) > nowMins) {
        setNextPrayer({ name: p.name, time24: t24 });
        nextName = p.name;
        nextTime = t24;
        found = true;
        break;
      }
    }
    if (!found && times['Fajr']) {
      setNextPrayer({ name: 'الفجر', time24: times['Fajr'].substring(0, 5) });
      nextName = 'الفجر';
      nextTime = times['Fajr'].substring(0, 5);
    }
  }, [times, dateOffset]);

  useEffect(() => {
    if (!nextPrayer || dateOffset !== 0) return;
    const tick = () => {
      // Compute countdown entirely in Egypt timezone (handles UTC+2/UTC+3 DST)
      const nowCairoParts = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: 'Africa/Cairo',
      }).format(new Date()).split(':').map(Number);
      const nowCairoH = nowCairoParts[0] === 24 ? 0 : nowCairoParts[0];
      const nowSecs = nowCairoH * 3600 + nowCairoParts[1] * 60 + nowCairoParts[2];
      const [ph, pm] = nextPrayer.time24.split(':').map(Number);
      const targetSecs = ph * 3600 + pm * 60;
      let diff = targetSecs - nowSecs;
      if (diff < 0) diff += 86400; // prayer is tomorrow
      const hh = Math.floor(diff / 3600).toString().padStart(2, '0');
      const mm = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const ss = (diff % 60).toString().padStart(2, '0');
      setCountdown(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextPrayer, dateOffset]);

  const displayDate = offsetDate(dateOffset);

  const displayHijriLabel = (() => {
    const adjustedDate = new Date(displayDate.getTime() + hijriAdjust * 86400000);
    if (hijri && hijriAdjust === 0) {
      return `${hijri.day} ${hijri.month?.ar ?? ''} ${hijri.year} هـ`;
    }
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(adjustedDate);
  })();

  const displayGregorianLabel = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(displayDate);

  return (
    <div className="pb-32 max-w-lg mx-auto" dir="rtl">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-b-[36px] shadow-lift" style={{ minHeight: 470 }}>
        <img src="/images/art/hero-mosque.webp" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 70%' }} />
        <div className="absolute inset-0 bg-hero-fade" />

        <div className="relative z-10 px-5 flex flex-col" style={{ minHeight: 470, paddingTop: 'max(1.25rem, env(safe-area-inset-top))', color: 'hsl(var(--brand-foreground))' }}>
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] opacity-75">السلام عليكم{userProfile?.name ? `، ${userProfile.name}` : ''}</p>
              <h1 className="font-display text-[1.9rem] leading-tight text-gold-gradient">نُور</h1>
            </div>
            {userProfile?.governorateName && (
              <button
                onClick={() => setShowGovPicker(true)}
                className="press flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold"
                style={{ background: 'hsl(0 0% 100% / 0.12)', border: '1px solid hsl(0 0% 100% / 0.18)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {userProfile.governorateName}
              </button>
            )}
          </div>

          {/* Date strip */}
          <div className="mt-5 flex items-center gap-2">
            <button onClick={() => setDateOffset(d => d - 1)} aria-label="اليوم السابق" className="press w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(0 0% 100% / 0.12)' }}>
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <p className="font-bold text-[15px]">{displayHijriLabel}</p>
              <p className="text-[11px] opacity-65">{displayGregorianLabel}</p>
            </div>
            <button onClick={() => setDateOffset(d => d + 1)} aria-label="اليوم التالي" className="press w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(0 0% 100% / 0.12)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1">
            <span className="text-[10px] opacity-60 me-1">ضبط الهجري</span>
            {[-1, +1].map(d => (
              <button key={d} onClick={() => changeHijriAdjust(d)} className="text-[10px] font-bold w-7 h-5 rounded-md" style={{ background: 'hsl(0 0% 0% / 0.25)' }}>
                {d > 0 ? '+1' : '−1'}
              </button>
            ))}
            {hijriAdjust !== 0 && (
              <button onClick={() => { setHijriAdjust(0); try { localStorage.setItem(HIJRI_ADJUST_KEY, '0'); } catch {} }} className="text-[10px] font-bold px-2 h-5 rounded-md" style={{ background: 'hsl(var(--primary) / 0.5)' }}>
                {hijriAdjust > 0 ? `+${hijriAdjust}` : hijriAdjust} ✕
              </button>
            )}
          </div>
          {dateOffset !== 0 && (
            <button onClick={() => setDateOffset(0)} className="text-[11px] underline opacity-70 mt-1 self-center">العودة لليوم</button>
          )}

          <div className="flex-1" />

          {/* Next prayer */}
          {dateOffset === 0 && nextPrayer ? (
            <div className="pb-6 animate-fade-up">
              <p className="text-[12px] font-semibold tracking-wide" style={{ color: 'hsl(var(--gold-soft))' }}>الصلاة القادمة · {fmt12(nextPrayer.time24)}</p>
              <div className="flex items-end justify-between gap-3 mt-1">
                <h2 className="font-display text-[3.2rem] leading-none">{nextPrayer.name}</h2>
                <div className="text-left" style={{ direction: 'ltr' }}>
                  <p className="text-[10px] opacity-60 text-right mb-0.5">متبقٍ</p>
                  <p className="font-bold tabular-nums text-[2rem] leading-none tracking-tight">{countdown || '00:00:00'}</p>
                </div>
              </div>
            </div>
          ) : dateOffset !== 0 ? (
            <div className="pb-6">
              <h2 className="font-display text-2xl">
                {dateOffset > 0 ? `مواقيت بعد ${dateOffset} ${dateOffset === 1 ? 'يوم' : 'أيام'}` : `مواقيت قبل ${Math.abs(dateOffset)} ${Math.abs(dateOffset) === 1 ? 'يوم' : 'أيام'}`}
              </h2>
            </div>
          ) : (
            <div className="pb-6"><div className="animate-pulse rounded-2xl h-20" style={{ background: 'hsl(0 0% 100% / 0.08)' }} /></div>
          )}
        </div>
      </section>

      <div className="px-4 space-y-6 -mt-2">
      {/* ── Prayer times ── */}
      <section className="surface rounded-[26px] p-4 relative z-10 -mt-6 animate-fade-up">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-bold text-[15px] flex items-center gap-2">
            <span className="text-primary"><Clock3DIcon size={20} /></span>
            مواقيت الصلاة
          </h2>
          <span className="text-[11px] text-muted-foreground">حسب الهيئة المصرية</span>
        </div>
        {times ? (
          <div className="grid grid-cols-3 gap-2">
            {PRAYERS.map(p => {
              const t24 = (times[p.id] ?? '').substring(0, 5);
              const isNext = dateOffset === 0 && nextPrayer?.name === p.name;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl px-2 py-3 text-center transition-all ${isNext ? 'bg-gradient-gold shadow-gold' : ''}`}
                  style={isNext ? { color: 'hsl(var(--primary-foreground))' } : { background: 'hsl(var(--secondary) / 0.7)' }}
                >
                  <p className={`text-[12px] ${isNext ? 'font-bold opacity-95' : 'text-muted-foreground font-medium'}`}>{p.name}</p>
                  <p className="font-bold text-[15px] tabular-nums mt-0.5">{fmt12(t24)}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {!lat ? (
              <div>
                <p>لم يتم تحديد الموقع</p>
                <button onClick={() => setShowGovPicker(true)} className="text-xs mt-2 text-primary font-bold underline">اختر محافظتك</button>
              </div>
            ) : (
              <div className="animate-pulse">جاري تحميل المواقيت...</div>
            )}
          </div>
        )}
      </section>

      {/* ── Quick access ── */}
      <section className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-display text-xl">وصول سريع</h2>
          <Link href="/more" className="text-xs font-semibold text-primary">عرض الكل</Link>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_LINKS.map(({ path, label, Icon }) => (
            <Link key={path} href={path} className="press flex flex-col items-center gap-2">
              <span className="w-full aspect-square rounded-[22px] surface flex items-center justify-center text-primary">
                <Icon size={28} className="text-primary" />
              </span>
              <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* آية اليوم */}
      <DailyAyah />

      {/* Daily Tracker */}
      <HomeTracker />

      {/* Dhikr Footer */}
      <div className="mt-6 mb-4 mx-4 text-center">
        <div className="h-px mb-4 opacity-20" style={{ background: 'linear-gradient(to left, transparent, currentColor, transparent)' }} />
        <p className="text-sm leading-loose text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ ۝ البقرة: 201
        </p>
      </div>

      </div>

      {/* ── Governorate Picker Sheet ── */}
      <AnimatePresence>
        {showGovPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowGovPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
              style={{ background: 'var(--background)', border: '1px solid rgba(193,154,107,0.2)' }}
              dir="rtl"
            >
              <div className="p-4 pb-2 flex items-center justify-between border-b border-border/40">
                <h3 className="font-bold text-base" style={{ fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif', color: '#C19A6B' }}>
                  اختر محافظتك
                </h3>
                <button
                  onClick={() => setShowGovPicker(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(193,154,107,0.1)' }}
                >
                  <X className="w-4 h-4 text-primary" />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {EGYPT_GOVERNORATES.map(gov => {
                    const active = userProfile?.governorateId === gov.id;
                    return (
                      <button
                        key={gov.id}
                        onClick={() => {
                          const uid = getCurrentUid();
                          if (uid) {
                            updateProfileInRTDB(uid, {
                              governorateId: gov.id,
                              governorateName: gov.name,
                              lat: gov.lat,
                              lng: gov.lng,
                            });
                          }
                          setUserProfile(prev => prev
                            ? { ...prev, governorateId: gov.id, governorateName: gov.name, lat: gov.lat, lng: gov.lng }
                            : prev
                          );
                          window.dispatchEvent(new CustomEvent('noor:profile-updated'));
                          setShowGovPicker(false);
                        }}
                        className="relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all active:scale-95"
                        style={{
                          background: active ? 'rgba(193,154,107,0.18)' : 'rgba(193,154,107,0.05)',
                          border: `1.5px solid rgba(193,154,107,${active ? '0.6' : '0.15'})`,
                        }}
                      >
                        <div className="w-11 h-7 rounded overflow-hidden flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.08)' }}>
                          <img src={gov.flag} alt={gov.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <span className="text-[10px] font-bold text-center leading-tight" style={{ fontFamily: '"IBM Plex Sans Arabic", "Tajawal", sans-serif', color: active ? '#8B6340' : 'var(--foreground)' }}>
                          {gov.name}
                        </span>
                        {active && (
                          <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#C19A6B' }}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="h-safe-area-inset-bottom h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
