import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Night() {
  return (
    <div style={{ minHeight:'100vh', background:'#06080F', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #020408 0%, #03070F 30%, #050B18 60%, #070D1E 100%)',
        stars: 0.92,
        moon: { cx:71, cy:17, size:34, phase:'crescent' },
        clouds: [
          { color:'#2030508', baseFreqX:0.009, baseFreqY:0.014, numOctaves:5, seed:4, yRange:[25,70], opacity:0.06 },
          { color:'#151C35', baseFreqX:0.011, baseFreqY:0.016, numOctaves:4, seed:17, yRange:[40,80], opacity:0.08 },
        ],
        hazeColor: '#040918',
        hazeOpacity: 0.6,
        nextPrayer: 'الفجر',
      }} />
    </div>
  );
}
