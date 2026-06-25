import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Sunrise() {
  return (
    <div style={{ minHeight:'100vh', background:'#1a1005', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #152848 0%, #1E3D6E 15%, #2B5898 30%, #8B5020 50%, #D07818 66%, #E89830 78%, #F5BE50 88%, #FADED8 100%)',
        sun: { cx:50, cy:78, size:50, core:'#FFFDE4', glow:'#F5C020' },
        clouds: [
          { color:'#F0D090', color2:'#E8B870', baseFreqX:0.011, baseFreqY:0.015, numOctaves:6, seed:5, yRange:[10,58], opacity:0.72 },
          { color:'#E8C878', baseFreqX:0.014, baseFreqY:0.019, numOctaves:5, seed:19, yRange:[20,65], opacity:0.50 },
          { color:'#D8A858', baseFreqX:0.009, baseFreqY:0.013, numOctaves:5, seed:33, yRange:[30,72], opacity:0.38 },
        ],
        hazeColor: '#F09020',
        hazeOpacity: 0.45,
        nextPrayer: 'الضحى',
      }} />
    </div>
  );
}
