import { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { usePrayerTimes } from '@/hooks/use-api';
import { HomeTracker } from '@/components/HomeTracker';
import { getProfileCache, updateProfileInRTDB, getCurrentUid } from '@/lib/rtdb';
import { syncPrayerNotifications, getNotificationSettings } from '@/lib/notifications';
import { updatePrayerWidget } from '@/lib/widget';
import { EGYPT_GOVERNORATES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

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

export function Home() {
  const [dateOffset, setDateOffset] = useState(0);
  const [showGovPicker, setShowGovPicker] = useState(false);

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

  const { data: tomorrowResult } = usePrayerTimes(activeLat, activeLng, 1);

  const [nextPrayer, setNextPrayer] = useState<{ name: string; time24: string } | null>(null);
  const [countdown, setCountdown] = useState('');

  // ── Schedule prayer notifications whenever timings load or settings change ──
  useEffect(() => {
    if (!times) return;
    const settings = getNotificationSettings();
    if (!settings.enabled) return;
    syncPrayerNotifications(times, tomorrowResult?.timings);
  }, [times, tomorrowResult]);

  // Re-schedule when notification settings change from the Settings page
  useEffect(() => {
    const handler = () => {
      if (!times) return;
      syncPrayerNotifications(times, tomorrowResult?.timings);
    };
    window.addEventListener('noor:notif-settings-changed', handler);
    return () => window.removeEventListener('noor:notif-settings-changed', handler);
  }, [times, tomorrowResult]);

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
    if (nextName && nextTime) {
      updatePrayerWidget(nextName, fmt12(nextTime), '--:--', activeLat ?? undefined, activeLng ?? undefined);
    }
  }, [times, dateOffset]);

  useEffect(() => {
    if (!nextPrayer || dateOffset !== 0) return;
    let lastWidgetMinute = -1;
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
      // Update the home-screen widget once per minute (avoids flooding native bridge)
      const currentMinute = Math.floor(diff / 60);
      if (currentMinute !== lastWidgetMinute) {
        lastWidgetMinute = currentMinute;
        updatePrayerWidget(nextPrayer.name, fmt12(nextPrayer.time24), `${hh}:${mm}`, activeLat ?? undefined, activeLng ?? undefined);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextPrayer, dateOffset]);

  const displayDate = offsetDate(dateOffset);
  const displayHijriLabel = hijri
    ? `${hijri.day} ${hijri.month?.ar ?? ''} ${hijri.year} هـ`
    : new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(displayDate);

  const displayGregorianLabel = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(displayDate);

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto space-y-5" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-5 text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -ml-8 -mb-8" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-0.5">
            <button onClick={() => setDateOffset(d => d - 1)} className="p-1.5 bg-white/15 rounded-full hover:bg-white/25 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-primary-foreground/90 font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>{displayHijriLabel}</p>
            <button onClick={() => setDateOffset(d => d + 1)} className="p-1.5 bg-white/15 rounded-full hover:bg-white/25 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <p className="text-primary-foreground/55 text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {displayGregorianLabel}
          </p>
          {dateOffset !== 0 && (
            <button onClick={() => setDateOffset(0)} className="text-xs text-white/60 underline mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {dateOffset > 0 ? `+${dateOffset} أيام` : `${dateOffset} أيام`} — العودة لليوم
            </button>
          )}

          <h1 className="text-3xl mb-3" style={{ fontFamily: '"Amiri", "Scheherazade New", serif' }}>تطبيق نُـور</h1>

          {dateOffset === 0 && nextPrayer ? (
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 w-full border border-white/10">
              <p className="text-xs text-primary-foreground/60 mb-1 tracking-widest" style={{ fontFamily: '"Tajawal", sans-serif' }}>الصلاة القادمة</p>
              <p className="text-2xl font-bold mb-2" style={{ fontFamily: '"Amiri", serif', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>{nextPrayer.name}</p>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ direction: 'ltr' }}>
                {(countdown || '00:00:00').split(':').map((seg, i, arr) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="bg-black/30 rounded-xl px-3 py-1.5 min-w-[52px] text-center">
                      <span className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: '"Tajawal", monospace', letterSpacing: '-0.02em' }}>{seg}</span>
                    </div>
                    {i < arr.length - 1 && <span className="text-white/60 text-2xl font-bold mb-1">:</span>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary-foreground/60" style={{ fontFamily: '"Tajawal", sans-serif' }}>{fmt12(nextPrayer.time24)}</p>
            </div>
          ) : dateOffset !== 0 ? (
            <div className="bg-black/20 rounded-2xl p-3 w-full border border-white/10">
              <p className="text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {dateOffset > 0 ? `مواقيت بعد ${dateOffset} ${dateOffset === 1 ? 'يوم' : 'أيام'}` : `مواقيت قبل ${Math.abs(dateOffset)} ${Math.abs(dateOffset) === 1 ? 'يوم' : 'أيام'}`}
              </p>
            </div>
          ) : (
            <div className="animate-pulse bg-black/10 rounded-2xl h-28 w-full" />
          )}
        </div>
      </div>

      {/* Prayer Times Grid */}
      <div className="bg-card rounded-3xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            <span className="text-primary">
              <Clock3DIcon size={22} />
            </span>
            مواقيت الصلاة
          </h2>
          {userProfile?.governorateName && (
            <button
              onClick={() => setShowGovPicker(true)}
              className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
              style={{ fontFamily: '"Tajawal", sans-serif' }}
            >
              <MapPin className="w-3 h-3" />
              {userProfile.governorateName}
            </button>
          )}
        </div>

        {times ? (
          <div className="grid grid-cols-2 gap-2.5">
            {PRAYERS.map(p => {
              const t24 = (times[p.id] ?? '').substring(0, 5);
              const isNext = dateOffset === 0 && nextPrayer?.name === p.name;
              return (
                <div
                  key={p.id}
                  className={`flex justify-between items-center px-4 py-3 rounded-2xl border transition-all ${
                    isNext ? 'bg-primary/15 border-primary/50 shadow-sm shadow-primary/10' : 'bg-secondary/40 border-border/40'
                  }`}
                >
                  <span className={`font-medium text-sm ${isNext ? 'text-primary font-bold' : 'text-foreground/70'}`} style={{ fontFamily: '"Tajawal", sans-serif' }}>{p.name}</span>
                  <span className={`font-bold text-base tabular-nums ${isNext ? 'text-primary' : 'text-foreground/90'}`} style={{ fontFamily: '"Tajawal", sans-serif' }}>{fmt12(t24)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {!lat ? (
              <div>
                <p>لم يتم تحديد الموقع</p>
                <p className="text-xs mt-1">اذهب للمزيد وحدد محافظتك</p>
              </div>
            ) : (
              <div className="animate-pulse">جاري تحميل المواقيت...</div>
            )}
          </div>
        )}
      </div>

      {/* Daily Tracker */}
      <HomeTracker />

      {/* Dhikr Footer */}
      <div className="mt-6 mb-4 mx-4 text-center">
        <div className="h-px mb-4 opacity-20" style={{ background: 'linear-gradient(to left, transparent, currentColor, transparent)' }} />
        <p className="text-sm leading-loose text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ ۝ البقرة: 201
        </p>
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
                <h3 className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}>
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
                        <span className="text-[10px] font-bold text-center leading-tight" style={{ fontFamily: '"Tajawal", sans-serif', color: active ? '#8B6340' : 'var(--foreground)' }}>
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
