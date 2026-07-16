import './_group.css';

const GOLDEN = '#C19A6B';

let _uid = 0;
const uid = () => `pw${++_uid}`;

/* ══════════════════════════════════════════════════════
   STARS
══════════════════════════════════════════════════════ */
const STARS = Array.from({ length: 95 }, (_, i) => {
  const a = Math.sin(i * 127.1) * 0.5 + 0.5;
  const b = Math.sin(i * 311.7) * 0.5 + 0.5;
  const c = Math.sin(i * 74.3)  * 0.5 + 0.5;
  const d = Math.sin(i * 193.7) * 0.5 + 0.5;
  return {
    x:  (Math.sin(i * 563.1) * 0.5 + 0.5) * 100,
    y:  (Math.sin(i * 291.3) * 0.5 + 0.5) * 100,
    r:  a > 0.88 ? 1.6 : a > 0.65 ? 1.0 : 0.5,
    op: 0.3 + b * 0.65,
    col: d > 0.8 ? '#FFE8D0' : d > 0.6 ? '#E8EEFF' : '#FFFFFF',
  };
});

function Stars({ opacity = 1 }: { opacity?: number }) {
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
         preserveAspectRatio="xMidYMid slice" opacity={opacity}>
      {STARS.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill={s.col} opacity={s.op} />
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   SUN — disk + rays + corona
══════════════════════════════════════════════════════ */
function Sun({ cx, cy, r, glow }: { cx: number; cy: number; r: number; glow: string }) {
  const g1 = uid(), g2 = uid(), g3 = uid(), f1 = uid();

  /* rays: 16 spokes, alternating long/short */
  const RAY_COUNT = 16;
  const rays = Array.from({ length: RAY_COUNT }, (_, i) => {
    const angle   = (i / RAY_COUNT) * 2 * Math.PI;
    const isLong  = i % 2 === 0;
    const inner   = r * 1.18;
    const outer   = isLong ? r * (2.6 + Math.sin(i * 1.7) * 0.5) : r * (1.7 + Math.sin(i * 2.3) * 0.3);
    const width   = isLong ? 1.2 : 0.7;
    const opacity = isLong ? 0.30 : 0.18;
    return { angle, inner, outer, width, opacity };
  });

  /* in SVG user-units we use the viewBox 0 0 340 490 */
  const SX = (cx / 100) * 340;
  const SY = (cy / 100) * 490;

  return (
    <svg viewBox="0 0 340 490"
         style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
         preserveAspectRatio="xMidYMid slice">
      <defs>
        {/* corona blur filter */}
        <filter id={f1} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {/* outer atmosphere */}
        <radialGradient id={g1} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={glow} stopOpacity="0.55" />
          <stop offset="35%"  stopColor={glow} stopOpacity="0.18" />
          <stop offset="70%"  stopColor={glow} stopOpacity="0.06" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        {/* inner corona */}
        <radialGradient id={g2} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="30%"  stopColor={glow}    stopOpacity="0.55" />
          <stop offset="100%" stopColor={glow}    stopOpacity="0" />
        </radialGradient>
        {/* disk */}
        <radialGradient id={g3} cx="42%" cy="38%" r="65%">
          <stop offset="0%"   stopColor="#FFFEF5" />
          <stop offset="40%"  stopColor="#FFF8D0" />
          <stop offset="80%"  stopColor={glow} />
          <stop offset="100%" stopColor={glow} />
        </radialGradient>
      </defs>

      {/* atmosphere */}
      <circle cx={SX} cy={SY} r={r * 4.5} fill={`url(#${g1})`} />

      {/* corona rings */}
      <circle cx={SX} cy={SY} r={r * 2.0} fill="none"
              stroke={glow} strokeWidth={r * 0.6} strokeOpacity="0.10" filter={`url(#${f1})`} />
      <circle cx={SX} cy={SY} r={r * 1.5} fill="none"
              stroke={glow} strokeWidth={r * 0.4} strokeOpacity="0.18" filter={`url(#${f1})`} />

      {/* rays */}
      {rays.map((ray, i) => {
        const cos = Math.cos(ray.angle);
        const sin = Math.sin(ray.angle);
        return (
          <line key={i}
            x1={SX + cos * ray.inner} y1={SY + sin * ray.inner}
            x2={SX + cos * ray.outer} y2={SY + sin * ray.outer}
            stroke={glow} strokeWidth={ray.width} strokeOpacity={ray.opacity}
            strokeLinecap="round"
          />
        );
      })}

      {/* inner glow */}
      <circle cx={SX} cy={SY} r={r * 1.35} fill={`url(#${g2})`} />

      {/* disk */}
      <circle cx={SX} cy={SY} r={r} fill={`url(#${g3})`} />

      {/* limb darkening ring */}
      <circle cx={SX} cy={SY} r={r} fill="none"
              stroke={glow} strokeWidth={r * 0.12} strokeOpacity="0.25" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   MOON — real crescent + lunar texture + earthshine
══════════════════════════════════════════════════════ */
function Moon({
  cx, cy, r,
  phase,       /* 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter */
  tilt = -20,  /* degrees */
}: {
  cx: number; cy: number; r: number;
  phase: number;
  tilt?: number;
}) {
  const MX = (cx / 100) * 340;
  const MY = (cy / 100) * 490;

  const gAtm   = uid(), gDisk  = uid(), gEarth = uid();
  const fTex   = uid(), fGlow  = uid();
  const maskId = uid(), clipId = uid();

  /* Crescent geometry:
     Illuminated limb = right side of moon disk.
     The terminator is a second circle whose x-offset
     determines phase:
     phase 0   → new moon (fully dark)
     phase 0.5 → full moon (fully lit)
     phase 1   → back to new moon
  */
  const phaseNorm = ((phase % 1) + 1) % 1;
  const isWaning  = phaseNorm > 0.5;
  const p         = isWaning ? 1 - phaseNorm : phaseNorm;   /* 0..0.5 */
  /* shadow circle offset: at p=0 it's at center → full dark; p=0.5 → off to side → full light */
  const shadowOffset = r * (1 - p * 2);   /* ranges from r (new) to -r (full) */

  const SX = uid(), SY = uid();   /* dummy, not used; we compute real coords */

  return (
    <svg viewBox="0 0 340 490"
         style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
         preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id={fGlow} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id={fTex} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.5 0.5" numOctaves="5" seed="12" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="textured" />
          <feComposite in="textured" in2="SourceGraphic" operator="in" />
        </filter>

        {/* moon disk gradient — bright limb right side */}
        <radialGradient id={gDisk} cx="68%" cy="36%" r="70%">
          <stop offset="0%"   stopColor="#FEFDF5" />
          <stop offset="30%"  stopColor="#E8EFF8" />
          <stop offset="65%"  stopColor="#C0CCDF" />
          <stop offset="100%" stopColor="#8898B8" />
        </radialGradient>

        {/* dark side earthshine — very faint blue */}
        <radialGradient id={gEarth} cx="30%" cy="55%" r="65%">
          <stop offset="0%"   stopColor="#3A5A90" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3A5A90" stopOpacity="0" />
        </radialGradient>

        {/* atmosphere glow */}
        <radialGradient id={gAtm} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#B8CCFF" stopOpacity="0.30" />
          <stop offset="60%"  stopColor="#B8CCFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#B8CCFF" stopOpacity="0" />
        </radialGradient>

        {/* clip to moon disk */}
        <clipPath id={clipId}>
          <circle cx={MX} cy={MY} r={r} />
        </clipPath>

        {/* crescent mask:
            white = visible (lit), black = hidden (shadow)
            shadow = circle offset to the left by shadowOffset
        */}
        <mask id={maskId}>
          <circle cx={MX} cy={MY} r={r} fill="white" />
          <circle
            cx={isWaning ? MX + shadowOffset : MX - shadowOffset}
            cy={MY} r={r}
            fill="black"
          />
        </mask>
      </defs>

      <g transform={`rotate(${tilt},${MX},${MY})`}>
        {/* outer glow */}
        <circle cx={MX} cy={MY} r={r * 3.8} fill={`url(#${gAtm})`} />
        <circle cx={MX} cy={MY} r={r * 2.0} fill="none"
                stroke="#C0D4FF" strokeWidth={r * 0.3} strokeOpacity="0.12" filter={`url(#${fGlow})`} />

        {/* dark side (whole disk, dark) with earthshine */}
        <circle cx={MX} cy={MY} r={r} fill="#101828" opacity="0.92" />
        <circle cx={MX} cy={MY} r={r} fill={`url(#${gEarth})`} />

        {/* lit crescent with texture */}
        <g mask={`url(#${maskId})`}>
          <circle cx={MX} cy={MY} r={r} fill={`url(#${gDisk})`} filter={`url(#${fTex})`} />
          {/* subtle craters as ellipses */}
          <ellipse cx={MX + r*0.18} cy={MY - r*0.25} rx={r*0.09} ry={r*0.07}
                   fill="none" stroke="#A0B0C8" strokeWidth="0.7" strokeOpacity="0.35" clipPath={`url(#${clipId})`} />
          <ellipse cx={MX + r*0.35} cy={MY + r*0.15} rx={r*0.06} ry={r*0.05}
                   fill="none" stroke="#A0B0C8" strokeWidth="0.5" strokeOpacity="0.28" clipPath={`url(#${clipId})`} />
          <ellipse cx={MX - r*0.05} cy={MY + r*0.35} rx={r*0.12} ry={r*0.10}
                   fill="none" stroke="#909DC0" strokeWidth="0.6" strokeOpacity="0.22" clipPath={`url(#${clipId})`} />
          {/* limb brightening */}
          <circle cx={MX} cy={MY} r={r} fill="none"
                  stroke="#FFFEF5" strokeWidth={r * 0.06} strokeOpacity="0.55" />
        </g>
      </g>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   CLOUDS (SVG turbulence)
══════════════════════════════════════════════════════ */
interface CloudLayerProps {
  color: string;
  color2?: string;
  baseFreqX?: number;
  baseFreqY?: number;
  numOctaves?: number;
  seed?: number;
  yRange?: [number, number];
  opacity?: number;
}

function CloudLayer({
  color, color2,
  baseFreqX = 0.012, baseFreqY = 0.018,
  numOctaves = 5, seed = 1,
  yRange = [0, 60],
  opacity = 0.55,
}: CloudLayerProps) {
  const fId = uid(), mId = uid(), g2 = uid();
  const [y1pct, y2pct] = yRange;

  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity }}
         preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id={fId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise"
            baseFrequency={`${baseFreqX} ${baseFreqY}`}
            numOctaves={numOctaves} seed={seed} result="noise" />
          <feColorMatrix type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 3.5 -1.4"
            result="cloud" />
          <feComposite in="cloud" in2="SourceGraphic" operator="in" />
        </filter>
        <linearGradient id={mId} x1="0" y1="0" x2="0" y2="1">
          <stop offset={`${y1pct}%`} stopColor="black" stopOpacity="0" />
          <stop offset={`${Math.min(y2pct, 100) * 0.55}%`} stopColor="black" stopOpacity="1" />
          <stop offset={`${y2pct}%`} stopColor="black" stopOpacity="1" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </linearGradient>
        {color2 && (
          <radialGradient id={g2} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color2} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      <rect width="100%" height="100%" fill={color} filter={`url(#${fId})`} mask={`url(#${mId})`} />
      {color2 && (
        <rect width="100%" height="100%" fill={`url(#${g2})`} filter={`url(#${fId})`} mask={`url(#${mId})`} />
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   HORIZON GLOW
══════════════════════════════════════════════════════ */
function HorizonGlow({ color, opacity = 0.35 }: { color: string; opacity?: number }) {
  const g = uid();
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
         preserveAspectRatio="none">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity={opacity} />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${g})`} />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════ */
export interface SkyConfig {
  sky: string;
  stars?: number;
  sun?: { cx: number; cy: number; r: number; glow: string };
  moon?: { cx: number; cy: number; r: number; phase: number; tilt?: number };
  clouds?: CloudLayerProps[];
  hazeColor?: string;
  hazeOpacity?: number;
  nextPrayer: string;
}

/* ══════════════════════════════════════════════════════
   WIDGET
══════════════════════════════════════════════════════ */
export function PrayerWidget({ sky }: { sky: SkyConfig }) {
  return (
    <div style={{
      width: 340, height: 490,
      borderRadius: 26,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 20px 70px rgba(0,0,0,0.72)',
      border: '1px solid rgba(255,255,255,0.1)',
      fontFamily: "'Tajawal', sans-serif",
    }}>
      <div style={{ position:'absolute', inset:0, background: sky.sky }} />

      {sky.stars !== undefined && <Stars opacity={sky.stars} />}
      {sky.moon && <Moon {...sky.moon} />}
      {sky.sun  && <Sun  {...sky.sun}  />}
      {sky.clouds?.map((c, i) => <CloudLayer key={i} {...c} />)}
      {sky.hazeColor && <HorizonGlow color={sky.hazeColor} opacity={sky.hazeOpacity} />}

      {/* vignette */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 110% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.30) 100%)', pointerEvents:'none' }} />

      {/* ── CONTENT ── */}
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
          flex:1, borderRadius:18,
          background:'rgba(8,12,32,0.35)',
          backdropFilter:'blur(18px)',
          WebkitBackdropFilter:'blur(18px)',
          border:'1px solid rgba(255,255,255,0.13)',
          boxShadow:'inset 0 1px 0 rgba(255,255,255,0.11), 0 6px 28px rgba(0,0,0,0.28)',
          padding:'12px 16px',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
        }}>
          <span style={{ fontSize:9, color:GOLDEN+'99', letterSpacing:1 }}>الصلاة القادمة</span>
          <span style={{ fontSize:30, fontWeight:900, color:'#fff', textShadow:'0 3px 18px rgba(0,0,0,0.55)', lineHeight:1.05 }}>
            {sky.nextPrayer}
          </span>
          <span style={{ fontSize:8.5, color:'rgba(255,255,255,0.5)' }}>متبقي على الأذان</span>

          <div style={{ display:'flex', gap:8, alignItems:'flex-start', direction:'ltr', marginTop:3 }}>
            {[['05','ساعة'], ['48','دقيقة'], ['31','ثانية']].map(([v, l], i, arr) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <span style={{
                    width:50, height:50, borderRadius:13,
                    background:'rgba(255,255,255,0.09)',
                    border:'1px solid rgba(255,255,255,0.15)',
                    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.07)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:22, fontWeight:800, color:'#fff',
                    textShadow:'0 2px 8px rgba(0,0,0,0.4)',
                  }}>{v}</span>
                  <span style={{ fontSize:7.5, color:GOLDEN+'88' }}>{l}</span>
                </span>
                {i < arr.length - 1 && (
                  <span style={{ color:GOLDEN, fontSize:22, fontWeight:700, alignSelf:'center', marginBottom:14 }}>:</span>
                )}
              </span>
            ))}
          </div>

          <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.7)', marginTop:1 }}>وقت الأذان 4:00 ص</span>

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
              background: p.a ? 'rgba(193,154,107,0.20)' : 'rgba(255,255,255,0.07)',
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
