import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Sunset() {
  return (
    <div style={{ minHeight:'100vh', background:'#120810', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #070420 0%, #160830 12%, #360B36 24%, #6C1226 38%, #A61E0E 52%, #CC4608 65%, #E56C18 76%, #F09828 86%, #F8C040 94%, #FCE070 100%)',
        sun: { cx:14, cy:75, r:24, glow:'#E06818' },
        clouds: [
          { color:'#CC6028', color2:'#B84020', baseFreqX:0.010, baseFreqY:0.014, numOctaves:6, seed:7,  yRange:[16,62], opacity:0.72 },
          { color:'#E08038', baseFreqX:0.013, baseFreqY:0.018, numOctaves:5, seed:31, yRange:[26,70], opacity:0.56 },
          { color:'#B64C28', baseFreqX:0.009, baseFreqY:0.012, numOctaves:5, seed:53, yRange:[36,78], opacity:0.44 },
          { color:'#6C2848', baseFreqX:0.012, baseFreqY:0.016, numOctaves:4, seed:67, yRange:[8,46],  opacity:0.38 },
        ],
        hazeColor: '#CC3C0C',
        hazeOpacity: 0.50,
        nextPrayer: 'العشاء',
      }} />
    </div>
  );
}
