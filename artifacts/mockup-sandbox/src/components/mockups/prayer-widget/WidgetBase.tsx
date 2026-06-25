import './_group.css';

interface SkyConfig {
  topColor: string;
  midColor: string;
  bottomColor: string;
  sunOrMoon?: { x: number; y: number; size: number; color: string; glow: string };
  stars?: boolean;
  label: string;
  labelColor: string;
  timeLabel: string;
  primaryText: string;
  secondaryText: string;
}

const GOLDEN = '#C19A6B';

function Stars() {
  const pts = [
    [12,18],[45,8],[78,22],[110,6],[142,19],[175,11],[208,25],[240,5],[272,15],[305,9],
    [338,21],[28,42],[61,35],[94,48],[127,31],[160,44],[193,38],[226,52],[258,28],[291,41],
    [324,34],[357,47],[8,68],[41,61],[74,75],[107,58],[140,71],[173,65],[206,78],[238,55],
    [271,68],[304,62],[337,75],[22,95],[55,88],[88,102],[121,85],[154,98],[187,92],[220,105],
  ];
  return (
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.85 }}>
      {pts.map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={Math.random()<0.3?1.2:0.7} fill="white" opacity={0.5+Math.random()*0.5} />
      ))}
    </svg>
  );
}

function SunOrMoon({ cfg }: { cfg: NonNullable<SkyConfig['sunOrMoon']> }) {
  return (
    <div style={{
      position:'absolute',
      left: `${cfg.x}%`,
      top: `${cfg.y}%`,
      width: cfg.size,
      height: cfg.size,
      borderRadius:'50%',
      background: cfg.color,
      boxShadow: cfg.glow,
      transform:'translate(-50%,-50%)',
      pointerEvents:'none',
    }} />
  );
}

export function PrayerWidget({ sky }: { sky: SkyConfig }) {
  const gradient = `linear-gradient(180deg, ${sky.topColor} 0%, ${sky.midColor} 55%, ${sky.bottomColor} 100%)`;

  return (
    <div style={{ background: gradient, borderRadius:22, width:340, height:470, position:'relative', overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.5)', border:'1px solid rgba(193,154,107,0.3)' }}>

      {sky.stars && <Stars />}
      {sky.sunOrMoon && <SunOrMoon cfg={sky.sunOrMoon} />}

      <div style={{ position:'relative', zIndex:2, padding:'12px 14px', height:'100%', display:'flex', flexDirection:'column' }}>

        {/* HEADER */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>نُور</span>
            <div style={{ width:24, height:24, borderRadius:6, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>◑</div>
          </div>
          <div style={{ textAlign:'left', display:'flex', alignItems:'center', gap:4 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill={GOLDEN}><path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2zM12,11.5c-1.38,0-2.5,-1.12-2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5-1.12,2.5-2.5,2.5z"/></svg>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.85)' }}>بورسعيد</span>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:8.5, color:GOLDEN+'AA' }}>SEIF KAMEL</span>
          <span style={{ fontSize:8.5, color:GOLDEN+'AA' }}>الصلاة الحالية: العشاء</span>
        </div>

        {/* SKY LABEL */}
        <div style={{ textAlign:'center', marginBottom:4 }}>
          <span style={{ fontSize:8, color:sky.labelColor, fontWeight:600, letterSpacing:1, textTransform:'uppercase', background:'rgba(0,0,0,0.18)', borderRadius:20, padding:'2px 10px' }}>
            {sky.label}
          </span>
        </div>

        {/* MAIN CARD */}
        <div style={{ flex:1, background:'rgba(0,0,0,0.22)', backdropFilter:'blur(8px)', borderRadius:14, border:'1px solid rgba(255,255,255,0.1)', padding:'10px 12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
          <span style={{ fontSize:9, color:GOLDEN+'99' }}>الصلاة القادمة</span>
          <span style={{ fontSize:26, fontWeight:700, color:'#fff', textShadow:'0 2px 12px rgba(0,0,0,0.5)' }}>الفجر</span>
          <span style={{ fontSize:8, color:GOLDEN+'88', marginTop:-4 }}>متبقي على الأذان</span>

          <div style={{ display:'flex', gap:8, alignItems:'center', direction:'ltr' }}>
            {['05','48','31'].map((v,i) => (
              <>
                <div key={i} style={{ width:44, height:44, borderRadius:10, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff' }}>{v}</div>
                {i<2 && <span style={{ color:GOLDEN+'CC', fontSize:20, fontWeight:700 }}>:</span>}
              </>
            ))}
          </div>

          <div style={{ display:'flex', gap:14, fontSize:7.5, color:GOLDEN+'88', marginTop:-2 }}>
            {['ساعة','دقيقة','ثانية'].map(l => <span key={l} style={{ width:44, textAlign:'center' }}>{l}</span>)}
          </div>

          <span style={{ fontSize:9, color:'rgba(255,255,255,0.8)', marginTop:2 }}>وقت الأذان 4:00 ص</span>

          {/* Progress bar */}
          <div style={{ width:'100%', height:5, background:'rgba(255,255,255,0.12)', borderRadius:999, marginTop:4, overflow:'hidden' }}>
            <div style={{ width:'9%', height:'100%', background:`linear-gradient(90deg, ${GOLDEN}, ${GOLDEN}CC)`, borderRadius:999 }} />
          </div>
        </div>

        {/* PRAYERS ROW */}
        <div style={{ display:'flex', gap:3, marginTop:8 }}>
          {[
            {n:'الفجر',t:'4:00',active:true},
            {n:'الظهر',t:'12:54',active:false},
            {n:'العصر',t:'4:32',active:false},
            {n:'المغرب',t:'7:59',active:false},
            {n:'العشاء',t:'9:34',active:false},
          ].map(p => (
            <div key={p.n} style={{ flex:1, borderRadius:8, background: p.active ? `${GOLDEN}30` : 'rgba(255,255,255,0.08)', border: p.active ? `1px solid ${GOLDEN}60` : '1px solid rgba(255,255,255,0.08)', padding:'5px 2px', textAlign:'center' }}>
              <div style={{ fontSize:7, color:'rgba(255,255,255,0.75)', marginBottom:2 }}>{p.n}</div>
              <div style={{ fontSize:8, fontWeight:700, color: p.active ? GOLDEN : 'rgba(255,255,255,0.6)' }}>{p.t}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
