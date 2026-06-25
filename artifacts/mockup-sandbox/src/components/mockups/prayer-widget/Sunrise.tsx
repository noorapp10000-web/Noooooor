import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Sunrise() {
  return (
    <div style={{ minHeight:'100vh', background:'#1a1005', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #142545 0%, #1C3868 14%, #285595 30%, #8B4E1A 52%, #CC7010 68%, #E89428 80%, #F5B840 90%, #FDD870 100%)',
        sun: { cx:50, cy:80, r:26, glow:'#F5C020' },
        clouds: [
          { color:'#F0D090', color2:'#E8B060', baseFreqX:0.011, baseFreqY:0.015, numOctaves:6, seed:5,  yRange:[8,55],  opacity:0.75 },
          { color:'#E8C070', baseFreqX:0.014, baseFreqY:0.019, numOctaves:5, seed:19, yRange:[18,62], opacity:0.52 },
          { color:'#D89850', baseFreqX:0.009, baseFreqY:0.013, numOctaves:5, seed:33, yRange:[28,70], opacity:0.40 },
        ],
        hazeColor: '#EE8C18',
        hazeOpacity: 0.48,
        nextPrayer: 'الضحى',
      }} />
    </div>
  );
}
