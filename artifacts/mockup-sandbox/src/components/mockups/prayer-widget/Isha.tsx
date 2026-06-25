import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Isha() {
  return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        topColor: '#060818',
        midColor: '#0F1A40',
        bottomColor: '#1E1060',
        stars: true,
        sunOrMoon: { x: 28, y: 25, size: 30, color: 'radial-gradient(circle, #F0F4FF 0%, #C8D8FF 45%, transparent 72%)', glow: '0 0 20px 8px rgba(180,200,255,0.45), 0 0 50px 20px rgba(100,130,255,0.2)' },
        label: 'العشاء',
        labelColor: 'rgba(160,180,255,0.85)',
        timeLabel: '9:34 م',
        primaryText: 'الفجر',
        secondaryText: 'متبقي 6:26',
      }} />
    </div>
  );
}
