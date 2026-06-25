import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Noon() {
  return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        topColor: '#0B3A8A',
        midColor: '#1B6CC8',
        bottomColor: '#4A9EE8',
        sunOrMoon: { x: 52, y: 16, size: 52, color: 'radial-gradient(circle, #FFFEF0 0%, #FFF8C0 35%, #FFE060 65%, transparent 100%)', glow: '0 0 50px 22px rgba(255,240,100,0.7), 0 0 120px 55px rgba(255,220,50,0.3)' },
        label: 'الظهر',
        labelColor: 'rgba(200,230,255,0.9)',
        timeLabel: '12:54 م',
        primaryText: 'العصر',
        secondaryText: 'متبقي 3:38',
      }} />
    </div>
  );
}
