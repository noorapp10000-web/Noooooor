import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Night() {
  return (
    <div style={{ minHeight:'100vh', background:'#04060E', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #010308 0%, #020510 30%, #040A1C 65%, #060D22 100%)',
        stars: 0.92,
        moon: { cx:70, cy:16, r:18, phase:0.10, tilt:-25 },
        clouds: [
          { color:'#101828', baseFreqX:0.009, baseFreqY:0.013, numOctaves:5, seed:4,  yRange:[30,72], opacity:0.08 },
          { color:'#0C1422', baseFreqX:0.011, baseFreqY:0.016, numOctaves:4, seed:17, yRange:[48,82], opacity:0.10 },
        ],
        hazeColor: '#030810',
        hazeOpacity: 0.65,
        nextPrayer: 'الفجر',
      }} />
    </div>
  );
}
