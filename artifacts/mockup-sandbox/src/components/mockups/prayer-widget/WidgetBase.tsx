import './_group.css';

const GOLDEN = '#C19A6B';

/* ─── Utility: unique SVG IDs ───────────────────────────────────── */
let _uid = 0;
const uid = () => `pw-${++_uid}`;

/* ─── Stars ─────────────────────────────────────────────────────── */
const STARS = Array.from({ length: 90 }, (_, i) => {
  const h = Math.sin(i * 127.1) * 0.5 + 0.5;
  const k = Math.sin(i * 311.7) * 0.5 + 0.5;
  const m = Math.sin(i * 74.3) * 0.5 + 0.5;
  return {
    x: (Math.sin(i * 563.1) * 0.5 + 0.5) * 100,
    y: (Math.sin(i * 291.3) * 0.5 + 0.5) * 100,
    r: h > 0.85 ? 1.5 : h > 0.6 ? 1.0 : 0.55,
    op: 0.35 + k * 0.6,
    twinkle: m > 0.7,
  };
});

function Stars({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
      preserveAspectRatio="xMidYMid slice"
      opacity={opacity}
    >
      {STARS.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill={s.twinkle ? '#E8F0FF' : '#FFFFFF'} opacity={s.op} />
      ))}
    </svg>
  );
}

/* ─── Clouds via SVG turbulence ─────────────────────────────────── */
interface CloudLayerProps {
  color: string;
  color2?: string;
  baseFreqX?: number;
  baseFreqY?: number;
  numOctaves?: number;
  seed?: number;
  yRange?: [number, number];
  opacity?: number;
  blendMode?: string;
}

function CloudLayer({
  color, color2,
  baseFreqX = 0.012, baseFreqY = 0.018,
  numOctaves = 5, seed = 1,
  yRange = [0, 55],
  opacity = 0.55,
  blendMode = 'normal',
}: CloudLayerProps) {
  const filterId = uid();
  const maskId = uid();
  const [y1, y2] = yRange;
  return (
    <svg
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', mixBlendMode: blendMode as any, opacity }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={`${baseFreqX} ${baseFreqY}`}
            numOctaves={numOctaves} seed={seed} result="noise" />
          <feColorMatrix type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 3 -1.2"
            result="cloud" />
          <feComposite in="cloud" in2="SourceGraphic" operator="in" />
        </filter>
        <linearGradient id={maskId} x1="0" y1="0" x2="0" y2="1">
          <stop offset={`${y1}%`} stopColor="black" stopOpacity="1" />
          <stop offset={`${y2}%`} stopColor="black" stopOpacity="1" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%"
        fill={color}
        filter={`url(#${filterId})`}
        mask={`url(#${maskId})`}
      />
      {color2 && (
        <rect width="100%" height="100%"
          fill={color2} opacity={0.5}
          filter={`url(#${filterId})`}
          mask={`url(#${maskId})`}
        />
      )}
    </svg>
  );
}

/* ─── Sun ────────────────────────────────────────────────────────── */
function Sun({ cx, cy, size, core, glow }: {
  cx:number; cy:number; size:number; core:string; glow:string;
}) {
  const g1 = uid(); const g2 = uid(); const g3 = uid();
  const glowR = size * 2.8;
  return (
    <svg
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={g1} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.5" />
          <stop offset="40%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g2} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.35" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g3} cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFEF5" />
          <stop offset="45%" stopColor={core} />
          <stop offset="100%" stopColor={glow} />
        </radialGradient>
      </defs>
      <ellipse cx={`${cx}%`} cy={`${cy}%`} rx={glowR * 1.6} ry={glowR * 1.4} fill={`url(#${g1})`} />
      <ellipse cx={`${cx}%`} cy={`${cy}%`} rx={glowR} ry={glowR * 0.9} fill={`url(#${g2})`} />
      <circle cx={`${cx}%`} cy={`${cy}%`} r={size / 2} fill={`url(#${g3})`} />
    </svg>
  );
}

/* ─── Moon ───────────────────────────────────────────────────────── */
function Moon({ cx, cy, size, phase }: {
  cx:number; cy:number; size:number; phase:'full'|'crescent'|'quarter'
}) {
  const gId = uid(); const cId = uid();
  const r = size / 2;
  return (
    <svg
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={gId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(190,210,255,0.28)" />
          <stop offset="100%" stopColor="rgba(190,210,255,0)" />
        </radialGradient>
        <radialGradient id={cId} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#FEFCF4" />
          <stop offset="55%" stopColor="#EEF2FF" />
          <stop offset="100%" stopColor="#C4D0F0" />
        </radialGradient>
        <clipPath id={`clip-${cId}`}>
          <circle cx={`${cx}%`} cy={`${cy}%`} r={r} />
        </clipPath>
      </defs>
      <circle cx={`${cx}%`} cy={`${cy}%`} r={r * 3.5} fill={`url(#${gId})`} />
      <circle cx={`${cx}%`} cy={`${cy}%`} r={r} fill={`url(#${cId})`} />
      {phase === 'crescent' && (
        <circle
          cx={`${cx + r * 0.55}%`} cy={`${cy - r * 0.06}%`} r={r * 1.02}
          fill="#0B1535"
          clipPath={`url(#clip-${cId})`}
        />
      )}
      {phase === 'quarter' && (
        <rect
          x={`${cx}%`} y={`${cy - r}%`} width={`${r}%`} height={`${r * 2}%`}
          fill="#0B1535"
          clipPath={`url(#clip-${cId})`}
        />
      )}
    </svg>
  );
}

/* ─── Horizon glow ───────────────────────────────────────────────── */
function HorizonGlow({ color, opacity = 0.35 }: { color:string; opacity?:number }) {
  const g = uid();
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity={opacity} />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${g})`} />
    </svg>
  );
}

/* ─── Types ──────────────────────────────────────────────────────── */
export interface SkyConfig {
  sky: string;
  stars?: number;
  sun?: { cx:number; cy:number; size:number; core:string; glow:string };
  moon?: { cx:number; cy:number; size:number; phase:'full'|'crescent'|'quarter' };
  clouds?: CloudLayerProps[];
  hazeColor?: string;
  hazeOpacity?: number;
  nextPrayer: string;
}

/* ─── Widget ─────────────────────────────────────────────────────── */
export function PrayerWidget({ sky }: { sky: SkyConfig }) {
  return (
    <div style={{
      width:340, height:490,
      borderRadius:26,
      overflow:'hidden',
      position:'relative',
      boxShadow:'0 20px 70px rgba(0,0,0,0.7)',
      border:'1px solid rgba(255,255,255,0.1)',
      fontFamily:"'Tajawal', sans-serif",
    }}>
      {/* SKY */}
      <div style={{ position:'absolute', inset:0, background:sky.sky }} />

      {sky.stars !== undefined && <Stars opacity={sky.stars} />}
      {sky.moon && <Moon {...sky.moon} />}
      {sky.sun && <Sun {...sky.sun} />}
      {sky.clouds?.map((c, i) => <CloudLayer key={i} {...c} />)}
      {sky.hazeColor && <HorizonGlow color={sky.hazeColor} opacity={sky.hazeOpacity} />}

      {/* vignette */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 35%, rgba(0,0,0,0.32) 100%)', pointerEvents:'none' }} />

      {/* CONTENT */}
      <div style={{ position:'relative', zIndex:5, height:'100%', display:'flex', flexDirection:'column', padding:'13px 14px', direction:'rtl' }}>

        {/* Row 1 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:16, fontWeight:900, color:'#fff', textShadow:'0 1px 10px rgba(0,0,0,0.7)' }}>نُور</span>
            <div style={{ width:26, height:26, borderRadius:8, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#fff' }}>◑</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <svg width="8" height="11" viewBox="0 0 24 30" fill={GOLDEN}>
              <path d="M12 0C7.6 0 4 3.6 4 8c0 6 8 18 8 18s8-12 8-18c0-4.4-3.6-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
            </svg>
            <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.9)', textShadow:'0 1px 5px rgba(0,0,0,0.55)' }}>بورسعيد</span>
          </div>
        </div>
        {/* Row 2 */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:9, color:GOLDEN+'AA' }}>SEIF KAMEL</span>
          <span style={{ fontSize:9, color:GOLDEN+'AA' }}>الصلاة الحالية: العشاء</span>
        </div>

        {/* GLASS CARD */}
        <div style={{
          flex:1,
          borderRadius:18,
          background:'rgba(8,12,32,0.36)',
          backdropFilter:'blur(18px)',
          WebkitBackdropFilter:'blur(18px)',
          border:'1px solid rgba(255,255,255,0.14)',
          boxShadow:'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 28px rgba(0,0,0,0.3)',
          padding:'12px 16px',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
        }}>
          <span style={{ fontSize:9, color:GOLDEN+'99', letterSpacing:1 }}>الصلاة القادمة</span>
          <span style={{ fontSize:30, fontWeight:900, color:'#fff', textShadow:'0 3px 18px rgba(0,0,0,0.55)', lineHeight:1.05 }}>
            {sky.nextPrayer}
          </span>
          <span style={{ fontSize:8.5, color:'rgba(255,255,255,0.5)' }}>متبقي على الأذان</span>

          {/* Countdown */}
          <div style={{ display:'flex', gap:8, alignItems:'center', direction:'ltr', marginTop:3 }}>
            {[['05','ساعة'], ['48','دقيقة'], ['31','ثانية']].map(([v, l], i, arr) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <span style={{
                    width:50, height:50, borderRadius:13,
                    background:'rgba(255,255,255,0.09)',
                    border:'1px solid rgba(255,255,255,0.16)',
                    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.07)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:22, fontWeight:800, color:'#fff',
                    textShadow:'0 2px 8px rgba(0,0,0,0.4)',
                  }}>{v}</span>
                  <span style={{ fontSize:7.5, color:GOLDEN+'88' }}>{l}</span>
                </span>
                {i < arr.length - 1 && (
                  <span style={{ color:GOLDEN, fontSize:22, fontWeight:700, marginBottom:14 }}>:</span>
                )}
              </span>
            ))}
          </div>

          <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.7)', marginTop:1 }}>وقت الأذان 4:00 ص</span>

          {/* Progress bar */}
          <div style={{ width:'100%', height:4, background:'rgba(255,255,255,0.08)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ width:'9%', height:'100%', background:`linear-gradient(90deg,${GOLDEN}88,${GOLDEN})`, borderRadius:999 }} />
          </div>
        </div>

        {/* PRAYERS ROW */}
        <div style={{ display:'flex', gap:5, marginTop:9 }}>
          {[
            {n:'الفجر', t:'4:00', a:true},
            {n:'الظهر', t:'12:54', a:false},
            {n:'العصر', t:'4:32', a:false},
            {n:'المغرب', t:'7:59', a:false},
            {n:'العشاء', t:'9:34', a:false},
          ].map(p => (
            <div key={p.n} style={{
              flex:1, borderRadius:10, padding:'6px 2px', textAlign:'center',
              background: p.a ? `rgba(193,154,107,0.20)` : 'rgba(255,255,255,0.07)',
              border: p.a ? `1px solid ${GOLDEN}50` : '1px solid rgba(255,255,255,0.07)',
              backdropFilter:'blur(8px)',
            }}>
              <div style={{ fontSize:7.5, color:'rgba(255,255,255,0.65)', marginBottom:3 }}>{p.n}</div>
              <div style={{ fontSize:9, fontWeight:700, color: p.a ? GOLDEN : 'rgba(255,255,255,0.5)' }}>{p.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
