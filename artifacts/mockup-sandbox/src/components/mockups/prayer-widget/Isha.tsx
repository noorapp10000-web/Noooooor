import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Isha() {
  return (
    <div style={{ minHeight:'100vh', background:'#060810', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #030610 0%, #05091A 20%, #090F28 38%, #0D1535 55%, #101A40 72%, #0E1838 100%)',
        stars: 0.80,
        moon: { cx:74, cy:16, size:30, phase:'full' },
        clouds: [
          { color:'#182040', baseFreqX:0.009, baseFreqY:0.013, numOctaves:5, seed:11, yRange:[30,72], opacity:0.10 },
          { color:'#101828', baseFreqX:0.012, baseFreqY:0.016, numOctaves:4, seed:43, yRange:[45,82], opacity:0.12 },
        ],
        hazeColor: '#050C22',
        hazeOpacity: 0.55,
        nextPrayer: 'الفجر',
      }} />
    </div>
  );
}
