import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Fajr() {
  return (
    <div style={{ minHeight:'100vh', background:'#100818', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #06030F 0%, #160828 18%, #340D48 36%, #621545 52%, #9B2848 66%, #C84458 78%, #E07070 90%, #F0A080 100%)',
        stars: 0.5,
        moon: { cx:76, cy:13, size:22, phase:'quarter' },
        clouds: [
          { color:'#C06878', baseFreqX:0.010, baseFreqY:0.013, numOctaves:6, seed:8, yRange:[48,88], opacity:0.55 },
          { color:'#904060', baseFreqX:0.013, baseFreqY:0.017, numOctaves:5, seed:23, yRange:[55,92], opacity:0.38 },
          { color:'#E09090', baseFreqX:0.008, baseFreqY:0.011, numOctaves:4, seed:41, yRange:[65,95], opacity:0.28 },
        ],
        hazeColor: '#D05050',
        hazeOpacity: 0.3,
        nextPrayer: 'الفجر',
      }} />
    </div>
  );
}
