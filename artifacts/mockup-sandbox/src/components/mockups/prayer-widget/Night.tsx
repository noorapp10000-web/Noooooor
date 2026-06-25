import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Night() {
  return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        topColor: '#020408',
        midColor: '#050C18',
        bottomColor: '#080E1E',
        stars: true,
        sunOrMoon: { x: 72, y: 18, size: 26, color: 'radial-gradient(circle, #FFFDE7 0%, #FFF9C4 40%, transparent 70%)', glow: '0 0 18px 6px rgba(255,253,220,0.5), 0 0 40px 15px rgba(255,253,220,0.2)' },
        label: 'ليل',
        labelColor: 'rgba(200,210,255,0.7)',
        timeLabel: '2:30 ص',
        primaryText: 'الفجر',
        secondaryText: 'متبقي 1:28',
      }} />
    </div>
  );
}
