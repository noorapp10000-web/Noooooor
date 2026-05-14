import { useCompass } from '@/hooks/use-compass';
import { useGeolocation, calculateQibla } from '@/hooks/use-geolocation';
import { getProfileCache } from '@/lib/rtdb';
import { ArrowLeft, MapPin, RotateCcw } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect, useRef } from 'react';
import kaabaImg from '@assets/Picsart_26-03-30_10-52-34-641_1774860779806.png';


/* ── Islamic Geometric Background ───────────────────────────── */
function IslamicBg() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.07, zIndex: 0 }}
    >
      <defs>
        <pattern id="islamicTile" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
          <path
            d="M45 6 L50 22 L66 18 L61 34 L77 39 L61 44 L66 60 L50 56 L45 72 L40 56 L24 60 L29 44 L13 39 L29 34 L24 18 L40 22 Z"
            fill="none" stroke="#C8991A" strokeWidth="0.9"
          />
          <circle cx="45" cy="45" r="10" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <rect x="38" y="38" width="14" height="14" transform="rotate(45 45 45)" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="45" cy="45" r="2.5" fill="#C8991A" opacity="0.4"/>
          <line x1="45" y1="0"  x2="45" y2="90" stroke="#C8991A" strokeWidth="0.3" opacity="0.3"/>
          <line x1="0"  y1="45" x2="90" y2="45" stroke="#C8991A" strokeWidth="0.3" opacity="0.3"/>
          <circle cx="0"  cy="0"  r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="90" cy="0"  r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="0"  cy="90" r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="90" cy="90" r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamicTile)"/>
    </svg>
  );
}

/* ── Premium Compass Face ───────────────────────────────────── */
function PremiumCompassFace({ isAligned }: { isAligned: boolean }) {
  const cx = 150, cy = 150;
  const outerR     = 144;
  const decorBandR = 132;
  const tickOuterR = 124;
  const labelR     = 110;

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const angle   = i * 5;
    const isMajor = angle % 30 === 0;
    const isMed   = angle % 10 === 0 && !isMajor;
    const innerR  = isMajor ? 112 : isMed ? 116 : 120;
    const rad     = (angle * Math.PI) / 180;
    return {
      x1: cx + tickOuterR * Math.sin(rad), y1: cy - tickOuterR * Math.cos(rad),
      x2: cx + innerR     * Math.sin(rad), y2: cy - innerR     * Math.cos(rad),
      isMajor, isMed,
    };
  });

  const degLabels = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  const starPts = (rcx: number, rcy: number, r1: number, r2: number, n: number, offsetDeg = 0) =>
    Array.from({ length: n * 2 }, (_, i) => {
      const r   = i % 2 === 0 ? r1 : r2;
      const ang = (i * Math.PI) / n + (offsetDeg * Math.PI) / 180 - Math.PI / 2;
      return `${rcx + r * Math.cos(ang)},${rcy + r * Math.sin(ang)}`;
    }).join(' ');

  return (
    <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
      <defs>
        <radialGradient id="cBg" cx="50%" cy="42%" r="65%">
          <stop offset="0%"   stopColor="#1d2e1a"/>
          <stop offset="60%"  stopColor="#111c0f"/>
          <stop offset="100%" stopColor="#080e07"/>
        </radialGradient>
        <radialGradient id="cInner" cx="50%" cy="50%" r="55%">
          <stop offset="0%"   stopColor="#1e2e1b"/>
          <stop offset="100%" stopColor="#0e1a0c"/>
        </radialGradient>
        <filter id="glow4">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow6">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={outerR} fill="url(#cBg)"/>
      <circle cx={cx} cy={cy} r={outerR}       fill="none" stroke="#B8860B" strokeWidth="24" opacity="0.22"/>
      <circle cx={cx} cy={cy} r={outerR}       fill="none" stroke="#C8991A" strokeWidth="1.8" opacity="0.95"/>
      <circle cx={cx} cy={cy} r={outerR - 24}  fill="none" stroke="#C8991A" strokeWidth="1.2" opacity="0.7"/>
      <circle cx={cx} cy={cy} r={decorBandR}   fill="none" stroke="#E8C060" strokeWidth="0.6" opacity="0.35"/>

      {Array.from({ length: 24 }, (_, i) => {
        const ang    = (i * 15 * Math.PI) / 180;
        const x      = cx + decorBandR * Math.sin(ang);
        const y      = cy - decorBandR * Math.cos(ang);
        const isDiam = i % 2 === 0;
        return isDiam ? (
          <rect key={i}
            x={x - 4} y={y - 4} width="8" height="8"
            transform={`rotate(${i * 15 + 45}, ${x}, ${y})`}
            fill="#C8991A" opacity="0.85"
          />
        ) : (
          <circle key={i} cx={x} cy={y} r="2.8" fill="#8B6010" opacity="0.7"/>
        );
      })}

      {Array.from({ length: 24 }, (_, i) => {
        const ang = ((i * 15 + 7.5) * Math.PI) / 180;
        const r   = outerR - 6;
        return (
          <circle key={i}
            cx={cx + r * Math.sin(ang)}
            cy={cy - r * Math.cos(ang)}
            r="1.4" fill="#C8991A" opacity="0.5"
          />
        );
      })}

      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.isMajor ? '#D4A820' : t.isMed ? '#9A7828' : '#5a4010'}
          strokeWidth={t.isMajor ? 2.4 : t.isMed ? 1.3 : 0.7}
          opacity={t.isMajor ? 1 : t.isMed ? 0.75 : 0.4}
        />
      ))}

      {degLabels.map(deg => {
        const rad     = (deg * Math.PI) / 180;
        const x       = cx + labelR * Math.sin(rad);
        const y       = cy - labelR * Math.cos(rad);
        return (
          <text key={deg} x={x} y={y}
            textAnchor="middle" dominantBaseline="middle"
            fill="#C8991A"
            fontSize="8.5"
            fontFamily="monospace"
            opacity="0.95"
            transform={`rotate(${deg}, ${x}, ${y})`}
          >
            {deg}
          </text>
        );
      })}

      <circle cx={cx} cy={cy} r={98} fill="url(#cInner)"/>
      <circle cx={cx} cy={cy} r={98} fill="none" stroke="#C8991A" strokeWidth="1.3" opacity="0.6"/>
      <circle cx={cx} cy={cy} r={96} fill="none" stroke="#E8C060" strokeWidth="0.4" opacity="0.2"/>

      <polygon points={starPts(cx, cy, 88, 24, 4)}
        fill="#2b4228" stroke="#9A7820" strokeWidth="1" opacity="0.95"/>
      <polygon points={starPts(cx, cy, 62, 20, 4, 45)}
        fill="#223520" stroke="#7A5810" strokeWidth="0.8" opacity="0.85"/>
      <polygon points={starPts(cx, cy, 44, 15, 8, 22.5)}
        fill="#1b2a18" stroke="#5A4010" strokeWidth="0.6" opacity="0.7"/>

      <text x={cx}     y={cy - 68} textAnchor="middle" dominantBaseline="middle"
        fill={isAligned ? '#4ade80' : '#E8C060'} fontSize="11" fontWeight="bold"
        fontFamily="Tajawal,sans-serif" style={{ transition: 'fill 0.5s' }}>ش</text>
      <text x={cx + 68} y={cy}     textAnchor="middle" dominantBaseline="middle"
        fill="#C8991A" fontSize="9" fontFamily="Tajawal,sans-serif" opacity="0.9">ق</text>
      <text x={cx}     y={cy + 68} textAnchor="middle" dominantBaseline="middle"
        fill="#C8991A" fontSize="9" fontFamily="Tajawal,sans-serif" opacity="0.9">ج</text>
      <text x={cx - 68} y={cy}     textAnchor="middle" dominantBaseline="middle"
        fill="#C8991A" fontSize="9" fontFamily="Tajawal,sans-serif" opacity="0.9">غ</text>

      <circle cx={cx} cy={cy} r={25} fill="#141e12" stroke="#C8991A" strokeWidth="0.9" opacity="0.8"/>
      <circle cx={cx} cy={cy} r={19} fill="#0e160c" stroke="#8B6010" strokeWidth="0.6" opacity="0.7"/>
      <polygon points={starPts(cx, cy, 15, 7, 8)} fill="#1d2e1a" stroke="#C8991A" strokeWidth="0.5" opacity="0.6"/>

      {isAligned && (
        <>
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#4ade80"
            strokeWidth="3.5" opacity="0.3" filter="url(#glow6)"/>
          <circle cx={cx} cy={cy} r={98}     fill="none" stroke="#4ade80"
            strokeWidth="1.5" opacity="0.2" filter="url(#glow4)"/>
        </>
      )}
    </svg>
  );
}

function CompassNeedle({ isAligned, isSearching }: { isAligned: boolean; isSearching: boolean }) {
  const northColor = '#4ade80';
  const glowStr    = isAligned
    ? 'drop-shadow(0 0 10px rgba(74,222,128,1)) drop-shadow(0 0 24px rgba(74,222,128,0.7)) drop-shadow(0 0 40px rgba(74,222,128,0.35))'
    : 'drop-shadow(0 0 8px rgba(74,222,128,0.8)) drop-shadow(0 0 18px rgba(74,222,128,0.4))';

  return (
    <svg
      width="80"
      height="220"
      viewBox="0 0 80 220"
      style={{
        overflow: 'visible',
        filter: glowStr,
        transition: 'filter 0.5s',
      }}
    >
      <defs>
        <linearGradient id="nNorth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a7f3d0" stopOpacity="1"/>
          <stop offset="40%"  stopColor="#4ade80" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.6"/>
        </linearGradient>
        <linearGradient id="nSouth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#22c55e" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#166534" stopOpacity="0.4"/>
        </linearGradient>
        <filter id="needleGlow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <polygon
        points="40,4  58,106  40,112  22,106"
        fill="url(#nNorth)"
        filter="url(#needleGlow)"
      />
      <polygon
        points="40,6  30,70  40,112  22,106"
        fill="white" opacity="0.25"
      />
      <polygon
        points="40,110  58,114  40,216  22,114"
        fill="url(#nSouth)"
      />
      <polygon
        points="56,106  76,110  56,114"
        fill={northColor} opacity="0.55"
      />
      <polygon
        points="24,106  4,110  24,114"
        fill={northColor} opacity="0.55"
      />
      <circle cx="40" cy="110" r="6"
        fill="#0d150d" stroke={northColor} strokeWidth="1.5" opacity="0.9"
      />
      <circle cx="40" cy="110" r="3"
        fill={northColor} opacity="0.8"
      />
    </svg>
  );
}


/* ── Main Qibla Page ────────────────────────────────────────── */
export function Qibla() {
  const { heading, isSupported, mode, requestPermission } = useCompass();
  const { coords: geoCoords, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation(true);

  // Use live geolocation first; fall back to saved profile coordinates
  const profileCache = getProfileCache();
  const profileCoords = (profileCache?.lat && profileCache?.lng)
    ? { lat: profileCache.lat, lng: profileCache.lng }
    : null;
  const coords = geoCoords ?? profileCoords;
  const usingProfileCoords = !geoCoords && !!profileCoords;

  const qiblaAngle  = coords ? calculateQibla(coords.lat, coords.lng) : 0;
  const arrowAngle  = ((qiblaAngle - (heading ?? 0)) % 360 + 360) % 360;
  const isAligned   = heading !== null && coords !== null && (arrowAngle < 8 || arrowAngle > 352);
  const isSearching = heading === null || !coords;

  const wasAligned = useRef(false);
  useEffect(() => {
    if (isAligned && !wasAligned.current && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    wasAligned.current = isAligned;
  }, [isAligned]);

  const SIZE = 300;

  const KaabaImage = ({ cls = '' }: { cls?: string }) => (
    <img
      src={kaabaImg}
      alt="الكعبة المشرفة"
      className={cls}
      style={{
        width: 82,
        height: 82,
        objectFit: 'contain',
        filter: isAligned
          ? 'drop-shadow(0 0 14px rgba(74,222,128,0.9))'
          : 'drop-shadow(0 3px 10px rgba(0,0,0,0.9))',
        transition: 'filter 0.5s',
      }}
    />
  );

  const renderCompassContent = () => {
    // While geolocation loads, show compass using profile coords if available
    if (geoLoading && !coords) {
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 animate-spin"
            style={{ borderColor: 'rgba(200,153,26,0.3)', borderTopColor: '#C8991A' }}/>
          <p className="font-bold text-lg" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C8991A' }}>
            جاري تحديد موقعك...
          </p>
        </div>
      );
    }

    if (geoError || !coords) {
      return (
        <div className="flex flex-col items-center gap-6 text-center max-w-xs w-full">
          <KaabaImage/>
          <div className="rounded-3xl p-5 w-full border"
            style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(200,153,26,0.3)' }}>
            <p className="font-bold text-base mb-2"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
              تحديد اتجاه القبلة
            </p>
            {geoError && (
              <p className="text-sm mb-3"
                style={{ fontFamily: '"Tajawal", sans-serif', color: '#f87171' }}>{geoError}</p>
            )}
            <p className="text-sm mb-4"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B9070' }}>
              يحتاج التطبيق إلى موقعك لحساب اتجاه القبلة
            </p>
            <button onClick={requestLocation}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
              style={{ fontFamily: '"Tajawal", sans-serif', background: '#C8991A', color: '#0d0d0d' }}>
              <MapPin className="w-4 h-4"/>
              تحديد موقعي
            </button>
          </div>
        </div>
      );
    }

    if (!isSupported) {
      return (
        <div className="flex flex-col items-center gap-5 text-center max-w-xs">
          <KaabaImage/>
          <div className="rounded-3xl p-5 w-full border"
            style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(200,153,26,0.3)' }}>
            <p className="font-bold text-base mb-1"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>البوصلة غير مدعومة</p>
            <p className="text-sm mb-3"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B9070' }}>اتجاه القبلة من موقعك</p>
            <p className="text-5xl font-black" style={{ color: '#C8991A' }}>{Math.round(qiblaAngle)}°</p>
            <p className="text-sm mt-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B9070' }}>شمالاً</p>
          </div>
        </div>
      );
    }

    const needsIOSPermission =
      heading === null && typeof (DeviceOrientationEvent as any).requestPermission === 'function';

    if (needsIOSPermission) {
      return (
        <div className="flex flex-col items-center gap-5 w-full max-w-xs text-center">
          <KaabaImage/>
          <div className="rounded-3xl p-5 w-full border"
            style={{ background: 'rgba(200,153,26,0.08)', borderColor: 'rgba(200,153,26,0.3)' }}>
            <p className="font-bold mb-2"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>تفعيل البوصلة</p>
            <p className="text-sm"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B9070' }}>
              اضغط للسماح بالوصول لحساس الاتجاه
            </p>
          </div>
          <button onClick={requestPermission}
            className="w-full py-3.5 rounded-2xl font-bold text-sm"
            style={{ fontFamily: '"Tajawal", sans-serif', background: '#C8991A', color: '#0d0d0d' }}>
            تفعيل البوصلة
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div
          className="px-8 py-3 rounded-2xl text-center transition-all duration-500"
          style={{
            background: isAligned
              ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
              : 'rgba(22,101,52,0.35)',
            border: '1.5px solid',
            borderColor: isAligned ? '#22c55e' : 'rgba(34,197,94,0.4)',
            boxShadow: isAligned
              ? '0 0 20px rgba(74,222,128,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              : 'none',
          }}
        >
          {isAligned ? (
            <p className="font-bold text-base text-white" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              أنت في اتجاه القبلة ✓
            </p>
          ) : isSearching ? (
            <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#4ade80' }}>
              جاري البحث عن اتجاه القبلة...
            </p>
          ) : (
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#86efac' }}>
                وجّه هاتفك نحو الكعبة المشرفة
              </p>
              <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#4ade80', opacity: 0.7 }}>
                القبلة على بُعد {Math.round(qiblaAngle)}° من الشمال
              </p>
            </div>
          )}
        </div>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <PremiumCompassFace isAligned={isAligned}/>

          <div
            className="absolute pointer-events-none z-10"
            style={{ top: -38, left: '50%', transform: 'translateX(-50%)' }}
          >
            <KaabaImage/>
          </div>

          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 ${isSearching ? 'animate-spin' : ''}`}
            style={
              isSearching
                ? { animationDuration: '1.8s' }
                : {
                    transform: `rotate(${arrowAngle}deg)`,
                    transition: heading !== null ? 'transform 0.15s ease-out' : 'none',
                  }
            }
          >
            <CompassNeedle isAligned={isAligned} isSearching={isSearching}/>
          </div>
        </div>

        {/* تحذير وضع النسبي — يظهر لما الـ magnetometer يحتاج معايرة */}
        {mode === 'relative' && (
          <div className="px-4 py-2.5 rounded-2xl text-center w-full max-w-xs"
            style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.35)' }}>
            <p className="text-xs font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#FACC15' }}>
              ⚠️ البوصلة تحتاج معايرة
            </p>
            <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#CA8A04' }}>
              حرّك هاتفك على شكل 8 في الهواء لتحسين الدقة
            </p>
          </div>
        )}

        {coords && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" style={{ color: '#6B5030' }}/>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B5030' }}>
                موقعك: {coords.lat.toFixed(4)}°، {coords.lng.toFixed(4)}°
              </p>
            </div>
            {usingProfileCoords && (
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: 'rgba(200,153,26,0.55)' }}>
                (من إعدادات ملفك — يُنصح بالسماح بالموقع للدقة)
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #121b10 0%, #0c1309 50%, #080e06 100%)' }}
    >
      <IslamicBg/>

      {/* Header */}
      <div
        className="relative z-10 px-4 py-4 flex items-center gap-4 flex-shrink-0 border-b"
        style={{
          background: 'rgba(0,0,0,0.35)',
          borderColor: 'rgba(200,153,26,0.2)',
        }}
      >
        <Link href="/more">
          <button className="p-2 rounded-full" style={{ background: 'rgba(200,153,26,0.15)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: '#C8991A' }}/>
          </button>
        </Link>
        <h1 className="font-bold text-xl"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
          تحديد القبلة
        </h1>
        {(geoError || (!geoLoading && !coords)) && (
          <button
            onClick={requestLocation}
            className="mr-auto p-2 rounded-full"
            style={{ background: 'rgba(200,153,26,0.15)' }}
          >
            <RotateCcw className="w-4 h-4" style={{ color: '#C8991A' }}/>
          </button>
        )}
      </div>

      {/* ── Compass Content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {renderCompassContent()}
      </div>
    </div>
  );
}
