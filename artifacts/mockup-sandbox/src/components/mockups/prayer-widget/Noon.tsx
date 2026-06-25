import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Noon() {
  return (
    <div style={{ minHeight:'100vh', background:'#081830', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #0A2270 0%, #1440AA 12%, #1E58C4 26%, #2872D8 42%, #3A8EE8 58%, #56A8F0 72%, #7EC4F8 86%, #AED8F8 100%)',
        sun: { cx:52, cy:10, r:28, glow:'#FFE020' },
        clouds: [
          { color:'#F8FAFE', color2:'#E5EFFF', baseFreqX:0.010, baseFreqY:0.014, numOctaves:7, seed:2,  yRange:[12,58], opacity:0.82 },
          { color:'#EAF2FF', baseFreqX:0.013, baseFreqY:0.018, numOctaves:6, seed:29, yRange:[22,66], opacity:0.65 },
          { color:'#DCEEFF', baseFreqX:0.008, baseFreqY:0.012, numOctaves:5, seed:47, yRange:[38,76], opacity:0.48 },
          { color:'#EEF5FF', baseFreqX:0.016, baseFreqY:0.021, numOctaves:4, seed:61, yRange:[50,82], opacity:0.36 },
        ],
        hazeColor: '#A5CCEE',
        hazeOpacity: 0.20,
        nextPrayer: 'العصر',
      }} />
    </div>
  );
}
