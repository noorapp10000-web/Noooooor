import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useUserSetting } from '@/hooks/use-user-setting';
import { useAppSettings } from '@/contexts/AppSettingsContext';

/* ─── Vintage woodgrain background pattern ───────────────── */
function WoodBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.04, zIndex: 0 }}>
      <defs>
        <pattern id="woodGrain" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          {/* Horizontal grain lines */}
          {[5,10,15,20,25,30,35,40,45,50,55].map(y => (
            <line key={y} x1="0" y1={y} x2="60" y2={y + (y % 3 === 0 ? 2 : -1)}
              stroke="#8B5E2A" strokeWidth={y % 5 === 0 ? 0.8 : 0.4} opacity="0.7" />
          ))}
          {/* Knot circles */}
          <ellipse cx="30" cy="30" rx="12" ry="8" fill="none" stroke="#7A4F1E" strokeWidth="0.5" opacity="0.4" />
          <ellipse cx="30" cy="30" rx="6" ry="4" fill="none" stroke="#7A4F1E" strokeWidth="0.4" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#woodGrain)" />
    </svg>
  );
}

/* ─── Islamic geometric overlay ──────────────────────────── */
function IslamicOverlay() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.035, zIndex: 0 }}>
      <defs>
        <pattern id="islamicTile" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M40 4 L44 20 L60 16 L56 32 L72 36 L56 40 L60 56 L44 52 L40 68 L36 52 L20 56 L24 40 L8 36 L24 32 L20 16 L36 20 Z"
            fill="none" stroke="#C8991A" strokeWidth="0.7"/>
          <circle cx="40" cy="40" r="8" fill="none" stroke="#C8991A" strokeWidth="0.4"/>
          <circle cx="40" cy="40" r="2" fill="#C8991A" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamicTile)" />
    </svg>
  );
}

/* ─── Vintage frequency display bar ─────────────────────── */
function FrequencyDisplay({ activeId, isDark }: { activeId: number | null; isDark: boolean }) {
  const stations = [88, 92, 96, 100, 104, 108];
  const activePos = activeId !== null ? ((activeId - 1) / 5) * 100 : null;

  /* Phosphor display: always dark (VFD style) regardless of page theme */
  const phosphorGreen = isDark ? '#4ade80' : '#22c55e';
  const displayBg = isDark
    ? 'linear-gradient(180deg, #0a1f0a 0%, #0d2a0d 100%)'
    : 'linear-gradient(180deg, #0d2a0d 0%, #0a1f0a 100%)';
  const displayBorder = isDark ? '#2a4a1a' : '#1a3a10';

  return (
    <div className="relative mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{
        background: displayBg,
        border: `2px solid ${displayBorder}`,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,200,0.08)',
        padding: '10px 14px 8px',
      }}
    >
      {/* Green phosphor glow */}
      <div className="absolute inset-0 rounded-2xl"
        style={{ background: 'radial-gradient(ellipse at center, rgba(80,200,80,0.06) 0%, transparent 70%)' }} />

      {/* FM label */}
      <div className="flex items-center justify-between mb-1.5 relative z-10">
        <span style={{ fontFamily: '"Courier New", monospace', fontSize: '9px', color: phosphorGreen, opacity: 0.75, letterSpacing: '2px' }}>
          FM RADIO · قرآن كريم
        </span>
        <span style={{ fontFamily: '"Courier New", monospace', fontSize: '9px', color: phosphorGreen, opacity: 0.5 }}>
          MHz
        </span>
      </div>

      {/* Frequency band */}
      <div className="relative h-4 mb-1.5" style={{ zIndex: 10 }}>
        {/* Band line */}
        <div className="absolute inset-y-1/2 inset-x-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, #2a5a2a 10%, ${phosphorGreen}55 50%, #2a5a2a 90%, transparent)` }} />

        {/* Tick marks */}
        {stations.map((freq, i) => (
          <div key={freq} className="absolute top-0 bottom-0 flex flex-col items-center justify-between"
            style={{ left: `${(i / 5) * 100}%`, transform: 'translateX(-50%)' }}>
            <div style={{ width: 1, height: 6, background: '#3a7a3a', opacity: 0.7 }} />
            <span style={{ fontFamily: '"Courier New", monospace', fontSize: '7px', color: phosphorGreen, opacity: 0.45 }}>
              {freq}
            </span>
          </div>
        ))}

        {/* Needle */}
        {activePos !== null && (
          <div className="absolute top-0 bottom-0 transition-all duration-500"
            style={{ left: `${activePos}%`, transform: 'translateX(-50%)' }}>
            <div style={{ width: 2, height: '100%', background: '#f59e0b', boxShadow: '0 0 4px #f59e0b', borderRadius: 1 }} />
          </div>
        )}
      </div>

      {/* Currently playing */}
      <div className="flex items-center gap-2 relative z-10">
        <div style={{ width: 5, height: 5, borderRadius: '50%',
          background: activeId ? '#4ade80' : '#1a4a1a',
          boxShadow: activeId ? '0 0 6px #4ade80' : 'none',
          animation: activeId ? 'pulse 2s infinite' : 'none' }} />
        <span style={{ fontFamily: '"Courier New", monospace', fontSize: '8px',
          color: activeId ? '#4ade80' : '#2a4a2a', letterSpacing: '1px' }}>
          {activeId ? 'ON AIR · بث مباشر' : 'STANDBY · في الانتظار'}
        </span>
      </div>
    </div>
  );
}

/* ─── Station Icons (vintage style) ──────────────────────── */
const VintageQuranIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <path d="M8 6 L8 26 L24 26 L24 6 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.06"/>
    <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <path d="M8 6 L16 3 L24 6" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <line x1="11" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
    <line x1="11" y1="13" x2="21" y2="13" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
    <line x1="11" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
    <line x1="11" y1="23" x2="19" y2="23" stroke="currentColor" strokeWidth="0.8" opacity="0.5"/>
    <path d="M16 3 L16 6" stroke="currentColor" strokeWidth="1" opacity="0.6"/>
  </svg>
);

const VintageMicIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <rect x="12" y="4" width="8" height="14" rx="4" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <path d="M8 16 Q8 25 16 25 Q24 25 24 16" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <line x1="16" y1="25" x2="16" y2="29" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="12" y1="29" x2="20" y2="29" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="14" y1="9" x2="18" y2="9" stroke="currentColor" strokeWidth="0.7" opacity="0.5"/>
    <line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="0.7" opacity="0.5"/>
  </svg>
);

const VintageStarIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <polygon points="16,4 18.5,11.5 26.5,11.5 20,16.5 22.5,24 16,19 9.5,24 12,16.5 5.5,11.5 13.5,11.5"
      stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.4"/>
  </svg>
);

const VintageMosqueIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <path d="M16 5 Q12 5 10 9 L10 20 L22 20 L22 9 Q20 5 16 5Z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <circle cx="16" cy="11" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="12" y="20" width="8" height="7" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <line x1="5" y1="27" x2="27" y2="27" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <rect x="4" y="10" width="4" height="17" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
    <rect x="24" y="10" width="4" height="17" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
    <circle cx="6" cy="9" r="1.5" fill="currentColor" opacity="0.6"/>
    <circle cx="26" cy="9" r="1.5" fill="currentColor" opacity="0.6"/>
  </svg>
);

const VintageMoonIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <path d="M22 16 Q18 15 16 11 Q14 16 16 21 Q20 24 24 22 Q21 22 19 20 Q20 18 22 16Z"
      stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    <polygon points="25,5 26.5,9 31,9 27.5,11.5 29,16 25,13 21,16 22.5,11.5 19,9 23.5,9"
      stroke="currentColor" strokeWidth="0.9" fill="none"/>
    <circle cx="11" cy="8" r="1.2" fill="currentColor" opacity="0.4"/>
    <circle cx="8" cy="16" r="0.8" fill="currentColor" opacity="0.3"/>
    <circle cx="12" cy="22" r="0.9" fill="currentColor" opacity="0.35"/>
  </svg>
);

const VintageKaabaIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <polygon points="10,14 16,9 22,14 22,27 16,29 10,27" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <polygon points="10,14 16,9 16,16 10,21" fill="currentColor" fillOpacity="0.08" stroke="none"/>
    <line x1="10" y1="18" x2="22" y2="18" stroke="currentColor" strokeWidth="0.9" opacity="0.5"/>
    <line x1="10" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="0.9" opacity="0.5"/>
    <rect x="13" y="22" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.1" fill="none"/>
    <line x1="16" y1="9" x2="16" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <path d="M14 6 Q16 4.5 18 6" stroke="currentColor" strokeWidth="0.9" fill="none"/>
  </svg>
);

/* ─── Station Data ────────────────────────────────────────── */
const STATIONS = [
  {
    id: 1, name: 'إذاعة القرآن الكريم',
    subtitle: 'الإذاعة المصرية',
    freq: '98.8 FM',
    urls: [
      'https://stream.radiojar.com/8s5u5tpdtwzuv',
      'https://n01.radiojar.com/8s5u5tpdtwzuv',
      'https://radio.mp3islam.com/listen/quran_radio/radio.mp3',
      'https://n03.radiojar.com/8s5u5tpdtwzuv',
    ],
    Icon: VintageQuranIcon,
  },
  {
    id: 2, name: 'ماهر المعيقلي',
    subtitle: 'تلاوات خاشعة مؤثرة',
    freq: '92.4 FM',
    urls: [
      'https://stream.zeno.fm/xqcd0h4fp9zuv',
      'https://n01.radiojar.com/maher',
      'https://stream.zeno.fm/0r0xa792kwzuv',
    ],
    Icon: VintageMicIcon,
  },
  {
    id: 3, name: 'مشاري العفاسي',
    subtitle: 'تلاوات وأناشيد إسلامية',
    freq: '95.1 FM',
    urls: [
      'https://stream.zeno.fm/ud3z16g0hkquv',
      'https://n01.radiojar.com/mishary',
      'https://stream.zeno.fm/4d6rdunvgn8uv',
    ],
    Icon: VintageStarIcon,
  },
  {
    id: 4, name: 'محمد صديق المنشاوي',
    subtitle: 'التلاوة الكلاسيكية الأصيلة',
    freq: '100.6 FM',
    urls: [
      'https://radio.mp3islam.com/listen/minshawi/radio.mp3',
      'https://n01.radiojar.com/minshawi',
      'https://stream.zeno.fm/yn60hqkp6yzuv',
    ],
    Icon: VintageMosqueIcon,
  },
  {
    id: 5, name: 'ياسر الدوسري',
    subtitle: 'صوت يخشع له القلب',
    freq: '103.7 FM',
    urls: [
      'https://radio.mp3islam.com/listen/yaser/radio.mp3',
      'https://n01.radiojar.com/yasser',
      'https://stream.zeno.fm/2uvzm99qf08uv',
    ],
    Icon: VintageMoonIcon,
  },
  {
    id: 6, name: 'إذاعة مكة المكرمة',
    subtitle: 'بث مباشر من الحرم المكي الشريف',
    freq: '107.9 FM',
    urls: [
      'https://stream.radiojar.com/0tpy1h0kxtzuv',
      'https://n01.radiojar.com/0tpy1h0kxtzuv',
      'https://edge.mixlr.com/channel/rwumx',
    ],
    Icon: VintageKaabaIcon,
  },
];

type Status = 'idle' | 'loading' | 'playing' | 'error';

/* ── Animated analog EQ bars ────────────────────────────── */
function AnalogEq() {
  return (
    <div className="flex gap-[2px] items-end h-5 flex-shrink-0">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i}
          style={{
            width: 3,
            background: `linear-gradient(to top, #f59e0b, #fcd34d)`,
            borderRadius: 1,
            animation: `eqbar ${0.35 + i * 0.09}s ease-in-out infinite alternate`,
            height: `${10 + (i % 3) * 6}px`,
            boxShadow: '0 0 3px rgba(245,158,11,0.6)',
          }}
        />
      ))}
    </div>
  );
}

/* ── Record/vinyl spin animation for playing state ─────── */
function VinylDisc({ spinning }: { spinning: boolean }) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: 48, height: 48,
        animation: spinning ? 'vinylSpin 3s linear infinite' : 'none',
      }}
    >
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full"
        style={{ background: 'linear-gradient(135deg, #1a0a00, #2d1500)', border: '1px solid #4a2a00' }} />
      {/* Grooves */}
      {[14, 18, 22].map(r => (
        <div key={r} className="absolute rounded-full border"
          style={{
            inset: `${24 - r}px`,
            borderColor: 'rgba(255,200,100,0.12)',
          }} />
      ))}
      {/* Label */}
      <div className="absolute inset-0 m-auto rounded-full flex items-center justify-center"
        style={{
          width: 22, height: 22,
          background: 'linear-gradient(135deg, #8B4513, #D2691E)',
          border: '1px solid rgba(255,200,100,0.3)',
        }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#1a0a00', border: '1px solid #4a2a00' }} />
      </div>
    </div>
  );
}

/* ── Vintage play/stop button ──────────────────────────── */
function VintageBtn({ status }: { status: Status | 'inactive' }) {
  const isActive = status !== 'inactive';
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: isActive
          ? 'radial-gradient(circle at 35% 35%, #8B4513, #5c2c00)'
          : 'radial-gradient(circle at 35% 35%, #C8860A, #8B5E00)',
        boxShadow: isActive
          ? 'inset 2px 2px 6px rgba(0,0,0,0.5), inset -1px -1px 4px rgba(255,200,100,0.2)'
          : '3px 3px 8px rgba(0,0,0,0.4), -1px -1px 5px rgba(255,220,120,0.3)',
        border: `1px solid ${isActive ? '#3a1a00' : '#6B4500'}`,
      }}
    >
      {status === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FCD34D' }} />
      ) : status === 'error' ? (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#FCD34D" strokeWidth="2">
          <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      ) : status === 'playing' ? (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#FCD34D">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ marginRight: '-1px' }}>
          <path d="M8 5v14l11-7z" fill="#FCD34D" />
        </svg>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export function EgyptianRadio() {
  const [activeId, setActiveId]   = useState<number | null>(null);
  const [status,   setStatus]     = useState<Status>('idle');
  const audioRef                  = useRef<HTMLAudioElement | null>(null);
  const retryTimerRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [theme]                   = useUserSetting<'light' | 'dark'>('theme', 'light');
  const isDark                    = theme === 'dark';

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;

    const onPlaying = () => setStatus('playing');
    const onError   = () => setStatus('error');
    const onCanPlay = () => { a.play().catch(() => setStatus('error')); };

    a.addEventListener('playing',  onPlaying);
    a.addEventListener('error',    onError);
    a.addEventListener('canplay',  onCanPlay);

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      a.pause(); a.src = '';
      a.removeEventListener('playing',  onPlaying);
      a.removeEventListener('error',    onError);
      a.removeEventListener('canplay',  onCanPlay);
    };
  }, []);

  const playStation = useCallback((station: typeof STATIONS[0], idx = 0) => {
    const a = audioRef.current;
    if (!a) return;
    if (idx >= station.urls.length) { setStatus('error'); return; }
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    setStatus('loading');
    a.pause();
    a.src = station.urls[idx];
    a.load();
    const onErr = () => {
      a.removeEventListener('error', onErr);
      retryTimerRef.current = setTimeout(() => playStation(station, idx + 1), 600);
    };
    a.addEventListener('error', onErr, { once: true });
  }, []);

  const toggle = useCallback((station: typeof STATIONS[0]) => {
    const a = audioRef.current;
    if (!a) return;
    if (activeId === station.id) {
      if (status === 'playing' || status === 'loading') {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        a.pause(); a.src = '';
        setStatus('idle'); setActiveId(null);
      } else {
        playStation(station, 0);
      }
      return;
    }
    setActiveId(station.id);
    playStation(station, 0);
  }, [activeId, status, playStation]);

  /* Theme-aware colors */
  const pageBg = isDark
    ? 'linear-gradient(170deg, #2C1A06 0%, #1A0D02 40%, #0F0800 100%)'
    : 'linear-gradient(170deg, #FAF4E4 0%, #F5EDD5 50%, #EDE2C4 100%)';
  const cardBg = (active: boolean) => isDark
    ? active ? 'linear-gradient(135deg, #3a1f00 0%, #2a1500 50%, #1f0f00 100%)' : 'linear-gradient(135deg, #2a1500 0%, #1e0e00 100%)'
    : active ? 'linear-gradient(135deg, #FFF8E8 0%, #FDF2D4 100%)' : 'linear-gradient(135deg, #FDFBF0 0%, #F8F2DC 100%)';
  const cardBorder = (active: boolean) => isDark
    ? active ? 'rgba(200,153,26,0.5)' : 'rgba(200,153,26,0.15)'
    : active ? 'rgba(193,154,107,0.7)' : 'rgba(193,154,107,0.3)';
  const stationNameColor = (active: boolean) => isDark
    ? active ? '#E8C060' : '#C8991A'
    : active ? '#8B6340' : '#6B4A20';
  const stationSubColor = (active: boolean) => isDark
    ? active ? '#a08040' : '#5a4020'
    : active ? '#7a5a30' : '#9a7a50';
  const freqColor = isDark ? '#6B4500' : '#B08050';
  const sectionLabelColor = isDark ? '#7a6030' : '#8B6340';
  const brandPlateStyle = isDark
    ? { background: 'linear-gradient(135deg, #2a1500 0%, #1a0d00 100%)', border: '1px solid rgba(200,153,26,0.25)', boxShadow: 'inset 0 1px 0 rgba(255,220,100,0.08), 0 2px 8px rgba(0,0,0,0.4)' }
    : { background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)', border: '1px solid rgba(193,154,107,0.35)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
  const brandTitleColor = isDark ? '#E8C060' : '#6B4A20';
  const brandSubColor   = isDark ? '#7a6030' : '#9a7050';
  const backBtnStyle    = isDark
    ? { background: 'rgba(200,153,26,0.15)', border: '1px solid rgba(200,153,26,0.3)' }
    : { background: 'rgba(193,154,107,0.12)', border: '1px solid rgba(193,154,107,0.35)' };
  const backBtnColor    = isDark ? '#C8991A' : '#8B6340';

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto relative" dir="rtl"
      style={{ background: pageBg }}>

      <style>{`
        @keyframes eqbar {
          from { transform: scaleY(0.3); transform-origin: bottom; }
          to   { transform: scaleY(1);   transform-origin: bottom; }
        }
        @keyframes vinylSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #4ade80; }
          50% { opacity: 0.4; box-shadow: none; }
        }
      `}</style>

      {/* Woodgrain + islamic watermarks */}
      <WoodBg />
      <IslamicOverlay />

      {/* ── Vintage Radio Header ────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0">
        {/* Top bar: back + brand */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <Link href="/more">
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
              style={backBtnStyle}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: backBtnColor }} />
            </button>
          </Link>

          <div className="flex-1">
            {/* Brand plate */}
            <div className="rounded-xl px-4 py-2" style={brandPlateStyle}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-base leading-tight"
                    style={{ fontFamily: '"Tajawal", sans-serif', color: brandTitleColor,
                      textShadow: isDark ? '0 0 8px rgba(232,192,96,0.5)' : 'none' }}>
                    الإذاعات الإسلامية
                  </p>
                  <p className="text-[10px] leading-tight mt-0.5"
                    style={{ fontFamily: '"Courier New", monospace', color: brandSubColor, letterSpacing: '1px' }}>
                    ISLAMIC RADIO · استمع واخشع
                  </p>
                </div>
                {/* Vintage speaker icon */}
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 flex-shrink-0"
                  style={{ color: isDark ? '#C8991A' : '#8B6340', opacity: 0.7 }}>
                  <rect x="3" y="8" width="5" height="8" rx="0.5" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M8 8L17 4V20L8 16" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M19 9 Q22 12 19 15" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  <path d="M20.5 6.5 Q25 12 20.5 17.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Frequency display */}
        <FrequencyDisplay activeId={activeId} isDark={isDark} />

        {/* Section label */}
        <div className="flex items-center gap-3 px-5 mb-2">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,153,26,0.3))' }} />
          <span className="text-[9px] font-bold tracking-widest"
            style={{ color: sectionLabelColor, fontFamily: '"Courier New", monospace', letterSpacing: '3px' }}>
            اختر المحطة
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(200,153,26,0.3), transparent)' }} />
        </div>
      </div>

      {/* ── Station cards ──────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-28">
        <div className="flex flex-col gap-3">
          {STATIONS.map(s => {
            const isActive  = activeId === s.id;
            const stStatus: Status | 'inactive' = isActive ? status : 'inactive';
            const isPlaying = isActive && status === 'playing';

            return (
              <button
                key={s.id}
                onClick={() => toggle(s)}
                data-testid={`button-station-${s.id}`}
                className="w-full text-right transition-all duration-200 active:scale-[0.985]"
                style={{
                  borderRadius: 18,
                  background: cardBg(isActive),
                  border: `1px solid ${cardBorder(isActive)}`,
                  boxShadow: isActive
                    ? isDark ? '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,100,0.1)' : '0 4px 16px rgba(0,0,0,0.12)'
                    : isDark ? '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,200,80,0.06)' : '0 2px 6px rgba(0,0,0,0.07)',
                  outline: 'none',
                }}
              >
                <div className="flex items-center gap-3 p-3.5">

                  {/* Left: vintage play btn */}
                  <VintageBtn status={stStatus} />

                  {/* Center: name + subtitle + freq */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isPlaying && <AnalogEq />}
                      <p className="font-bold text-base leading-tight truncate"
                        style={{ fontFamily: '"Tajawal", sans-serif', color: stationNameColor(isActive) }}>
                        {s.name}
                      </p>
                    </div>
                    <p className="text-xs mt-0.5"
                      style={{ fontFamily: '"Tajawal", sans-serif', color: stationSubColor(isActive), opacity: 0.9 }}>
                      {s.subtitle}
                    </p>
                    <p className="text-[9px] mt-1"
                      style={{ fontFamily: '"Courier New", monospace', color: freqColor, letterSpacing: '1px', opacity: isActive ? 0.85 : 0.5 }}>
                      {s.freq}
                    </p>
                  </div>

                  {/* Right: vinyl disc */}
                  <VinylDisc spinning={isPlaying} />
                </div>

                {/* Bottom glow bar when active */}
                {isActive && (
                  <div
                    className="h-px mx-3 mb-1 rounded-full"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(200,153,26,0.4), transparent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-16" style={{ background: 'rgba(200,153,26,0.2)' }} />
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" style={{ color: '#7a6030' }}>
              <path d="M12 2 Q8 2 6 6 L6 14 L18 14 L18 6 Q16 2 12 2Z" stroke="currentColor" strokeWidth="1" fill="none"/>
              <rect x="9" y="14" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none"/>
              <line x1="4" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="1"/>
            </svg>
            <div className="h-px w-16" style={{ background: 'rgba(200,153,26,0.2)' }} />
          </div>
          <p className="text-[10px]"
            style={{ color: '#5a4020', fontFamily: '"Courier New", monospace', letterSpacing: '1px', opacity: 0.6 }}>
            QURAN RADIO · بث مستمر ٢٤/٧
          </p>
        </div>
      </div>
    </div>
  );
}
