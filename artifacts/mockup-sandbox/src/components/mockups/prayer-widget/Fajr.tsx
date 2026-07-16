import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Fajr() {
  return (
    <div style={{ minHeight:'100vh', background:'#100818', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #05030E 0%, #140828 18%, #300C45 35%, #5E1242 52%, #962545 66%, #C04058 78%, #D87070 90%, #EFA080 100%)',
        stars: 0.45,
        moon: { cx:77, cy:12, r:14, phase:0.22, tilt:-30 },
        clouds: [
          { color:'#C06070', baseFreqX:0.010, baseFreqY:0.013, numOctaves:6, seed:8,  yRange:[45,85], opacity:0.58 },
          { color:'#884058', baseFreqX:0.013, baseFreqY:0.017, numOctaves:5, seed:23, yRange:[55,90], opacity:0.40 },
          { color:'#DFA090', baseFreqX:0.008, baseFreqY:0.011, numOctaves:4, seed:41, yRange:[65,95], opacity:0.30 },
        ],
        hazeColor: '#CC5050',
        hazeOpacity: 0.32,
        nextPrayer: 'الفجر',
      }} />
    </div>
  );
}
