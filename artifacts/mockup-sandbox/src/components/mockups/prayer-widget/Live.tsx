import { useState, useEffect } from 'react';
import { PrayerWidget, SkyConfig } from './WidgetBase';
import './_group.css';

const PRAYER_TIMES = {
  fajr:    4 * 60 + 0,
  sunrise: 5 * 60 + 5,
  dhuhr:   12 * 60 + 54,
  asr:     16 * 60 + 32,
  maghrib: 19 * 60 + 59,
  isha:    21 * 60 + 34,
  nextFajr: 28 * 60 + 0,
};

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function sunPosition(minutes: number): { cx: number; cy: number } {
  const { sunrise, maghrib } = PRAYER_TIMES;
  if (minutes < sunrise || minutes > maghrib) {
    return { cx: -20, cy: 110 };
  }
  const dayLen = maghrib - sunrise;
  const t = (minutes - sunrise) / dayLen;
  const smooth = easeInOut(t);
  const cx = 5 + smooth * 90;
  const peakY = 8;
  const horizY = 88;
  const cy = horizY - Math.sin(t * Math.PI) * (horizY - peakY);
  return { cx, cy };
}

function moonPosition(minutes: number): { cx: number; cy: number } {
  const { maghrib, nextFajr, isha } = PRAYER_TIMES;
  const moonrise = isha + 30;
  const moonset  = nextFajr - 60;
  if (minutes < moonrise && minutes > PRAYER_TIMES.fajr - 30) {
    return { cx: -20, cy: 110 };
  }
  const totalNight = moonset - moonrise;
  let t: number;
  if (minutes >= moonrise) {
    t = (minutes - moonrise) / totalNight;
  } else {
    t = (minutes + 24 * 60 - moonrise) / totalNight;
  }
  t = Math.max(0, Math.min(1, t));
  const cx = 5 + t * 85;
  const cy = 80 - Math.sin(t * Math.PI) * 68;
  return { cx, cy };
}

function getSkyConfig(totalMinutes: number): SkyConfig {
  const { fajr, sunrise, dhuhr, asr, maghrib, isha } = PRAYER_TIMES;
  const { cx: sunCx, cy: sunCy } = sunPosition(totalMinutes);
  const { cx: moonCx, cy: moonCy } = moonPosition(totalMinutes);
  const moonPhase = 0.40;

  if (totalMinutes >= isha || totalMinutes < fajr) {
    return {
      sky: 'linear-gradient(180deg,#010308 0%,#020510 30%,#040A1C 65%,#060D22 100%)',
      stars: 0.92,
      moon: { cx: moonCx, cy: moonCy, r: 18, phase: moonPhase, tilt: -22 },
      clouds: [
        { color:'#101828', baseFreqX:0.009, baseFreqY:0.013, numOctaves:5, seed:4,  yRange:[30,72], opacity:0.08 },
      ],
      hazeColor: '#030810', hazeOpacity: 0.65,
      nextPrayer: totalMinutes >= isha ? 'الفجر' : 'الفجر',
    };
  }
  if (totalMinutes < sunrise) {
    const t = (totalMinutes - fajr) / (sunrise - fajr);
    return {
      sky: `linear-gradient(180deg,#06030F 0%,#340D48 35%,#9B2848 66%,${t > 0.6 ? '#E07070' : '#C85060'} 90%,#EFA080 100%)`,
      stars: 0.45 * (1 - t),
      moon: { cx: moonCx, cy: moonCy, r: 14, phase: moonPhase, tilt: -28 },
      clouds: [
        { color:'#C06070', baseFreqX:0.010, baseFreqY:0.013, numOctaves:6, seed:8, yRange:[48,88], opacity:0.55 },
      ],
      hazeColor: '#CC5050', hazeOpacity: 0.30,
      nextPrayer: 'الفجر',
    };
  }
  if (totalMinutes < sunrise + 45) {
    return {
      sky: 'linear-gradient(180deg,#142545 0%,#285595 30%,#8B4E1A 52%,#E89428 80%,#FDD870 100%)',
      sun: { cx: sunCx, cy: sunCy, r: 26, glow: '#F5C020' },
      clouds: [
        { color:'#F0D090', color2:'#E8B060', baseFreqX:0.011, baseFreqY:0.015, numOctaves:6, seed:5, yRange:[8,55], opacity:0.72 },
      ],
      hazeColor: '#EE8C18', hazeOpacity: 0.45,
      nextPrayer: 'الضحى',
    };
  }
  if (totalMinutes < dhuhr) {
    const t = (totalMinutes - sunrise - 45) / (dhuhr - sunrise - 45);
    return {
      sky: `linear-gradient(180deg,#${t > 0.5 ? '0A2270' : '142545'} 0%,#1E58C4 30%,#3A8EE8 65%,#AED8F8 100%)`,
      sun: { cx: sunCx, cy: sunCy, r: 24, glow: '#FFE020' },
      clouds: [
        { color:'#F0F8FF', baseFreqX:0.010, baseFreqY:0.014, numOctaves:6, seed:2, yRange:[15,58], opacity:0.65 },
      ],
      hazeColor: '#A5CCEE', hazeOpacity: 0.20,
      nextPrayer: 'الظهر',
    };
  }
  if (totalMinutes < asr) {
    return {
      sky: 'linear-gradient(180deg,#0A2270 0%,#1E58C4 26%,#3A8EE8 58%,#AED8F8 100%)',
      sun: { cx: sunCx, cy: sunCy, r: 28, glow: '#FFE020' },
      clouds: [
        { color:'#F8FAFE', color2:'#E5EFFF', baseFreqX:0.010, baseFreqY:0.014, numOctaves:7, seed:2, yRange:[12,58], opacity:0.82 },
        { color:'#EAF2FF', baseFreqX:0.013, baseFreqY:0.018, numOctaves:6, seed:29, yRange:[25,68], opacity:0.60 },
      ],
      hazeColor: '#A5CCEE', hazeOpacity: 0.18,
      nextPrayer: 'العصر',
    };
  }
  if (totalMinutes < maghrib - 30) {
    return {
      sky: 'linear-gradient(180deg,#0A2270 0%,#1E58C4 26%,#5090D8 58%,#C8E4F8 100%)',
      sun: { cx: sunCx, cy: sunCy, r: 26, glow: '#FFD040' },
      clouds: [
        { color:'#EAF2FF', baseFreqX:0.010, baseFreqY:0.014, numOctaves:6, seed:12, yRange:[15,62], opacity:0.70 },
      ],
      hazeColor: '#B8D8F0', hazeOpacity: 0.22,
      nextPrayer: 'المغرب',
    };
  }
  return {
    sky: 'linear-gradient(180deg,#070420 0%,#360B36 24%,#A61E0E 52%,#E56C18 76%,#FCE070 100%)',
    sun: { cx: sunCx, cy: sunCy, r: 24, glow: '#E06818' },
    clouds: [
      { color:'#CC6028', color2:'#B84020', baseFreqX:0.010, baseFreqY:0.014, numOctaves:6, seed:7, yRange:[16,62], opacity:0.72 },
      { color:'#6C2848', baseFreqX:0.012, baseFreqY:0.016, numOctaves:4, seed:67, yRange:[8,46], opacity:0.38 },
    ],
    hazeColor: '#CC3C0C', hazeOpacity: 0.50,
    nextPrayer: 'العشاء',
  };
}

function timeLabel(totalMinutes: number) {
  const h = Math.floor(totalMinutes % (24 * 60) / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? 'م' : 'ص';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function Live() {
  const now  = new Date();
  const init = now.getHours() * 60 + now.getMinutes();
  const [minutes, setMinutes] = useState(init);

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const sky = getSkyConfig(minutes);

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontFamily:'Tajawal,sans-serif', direction:'rtl' }}>
        ⏱ الوقت الحالي: {timeLabel(minutes)} — الشمس والقمر في موضعهم الحقيقي
      </div>
      <PrayerWidget sky={sky} />
    </div>
  );
}
