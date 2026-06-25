import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Noon() {
  return (
    <div style={{ minHeight:'100vh', background:'#081830', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        sky: 'linear-gradient(180deg, #092070 0%, #1238A8 12%, #1C52C4 26%, #2A70D8 42%, #3C8EE8 58%, #58A8F0 72%, #80C4F8 86%, #B0DCF8 100%)',
        sun: { cx:52, cy:11, size:52, core:'#FFFEF0', glow:'#FFE840' },
        clouds: [
          { color:'#F8FAFF', color2:'#E8F0FF', baseFreqX:0.010, baseFreqY:0.014, numOctaves:7, seed:2, yRange:[15,62], opacity:0.80 },
          { color:'#ECF4FF', baseFreqX:0.013, baseFreqY:0.018, numOctaves:6, seed:29, yRange:[25,70], opacity:0.62 },
          { color:'#DDEEFF', baseFreqX:0.008, baseFreqY:0.012, numOctaves:5, seed:47, yRange:[40,78], opacity:0.45 },
          { color:'#F0F6FF', baseFreqX:0.016, baseFreqY:0.021, numOctaves:4, seed:61, yRange:[50,82], opacity:0.35 },
        ],
        hazeColor: '#A8D0F0',
        hazeOpacity: 0.22,
        nextPrayer: 'العصر',
      }} />
    </div>
  );
}
