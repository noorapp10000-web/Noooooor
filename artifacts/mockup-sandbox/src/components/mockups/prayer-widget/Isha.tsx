import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Isha() {
  return (
    <div style={{ minHeight:'100vh', background:'#060810', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #020508 0%, #04081A 20%, #080E2C 40%, #0C1438 56%, #0F1A45 72%, #0C1638 100%)',
        stars: 0.78,
        moon: { cx:73, cy:15, r:20, phase:0.50, tilt:-15 },
        clouds: [
          { color:'#141E3C', baseFreqX:0.009, baseFreqY:0.013, numOctaves:5, seed:11, yRange:[28,70], opacity:0.11 },
          { color:'#0E1828', baseFreqX:0.012, baseFreqY:0.016, numOctaves:4, seed:43, yRange:[44,80], opacity:0.13 },
        ],
        hazeColor: '#040B20',
        hazeOpacity: 0.58,
        nextPrayer: 'الفجر',
      }} />
    </div>
  );
}
