import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Sunset() {
  return (
    <div style={{ minHeight:'100vh', background:'#120810', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #080520 0%, #180A30 12%, #380C38 24%, #6E1428 38%, #A82010 52%, #D04810 64%, #E87020 76%, #F5A030 86%, #FAC840 94%, #FDE878 100%)',
        sun: { cx:16, cy:73, size:46, core:'#FFF0C0', glow:'#E87020' },
        clouds: [
          { color:'#D06830', color2:'#C04828', baseFreqX:0.010, baseFreqY:0.014, numOctaves:6, seed:7, yRange:[18,65], opacity:0.70 },
          { color:'#E08840', baseFreqX:0.013, baseFreqY:0.018, numOctaves:5, seed:31, yRange:[28,72], opacity:0.55 },
          { color:'#B85030', baseFreqX:0.009, baseFreqY:0.012, numOctaves:5, seed:53, yRange:[38,80], opacity:0.42 },
          { color:'#703050', baseFreqX:0.012, baseFreqY:0.016, numOctaves:4, seed:67, yRange:[10,50], opacity:0.35 },
        ],
        hazeColor: '#D04010',
        hazeOpacity: 0.48,
        nextPrayer: 'العشاء',
      }} />
    </div>
  );
}
