import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Sunset() {
  return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        topColor: '#1A1040',
        midColor: '#8B2010',
        bottomColor: '#E8601A',
        sunOrMoon: { x: 18, y: 68, size: 44, color: 'radial-gradient(circle, #FFE0A0 0%, #FF9030 45%, #E03000 75%, transparent 100%)', glow: '0 0 35px 14px rgba(255,120,30,0.65), 0 0 80px 35px rgba(200,60,10,0.35)' },
        label: 'الغروب',
        labelColor: 'rgba(255,200,130,0.95)',
        timeLabel: '7:59 م',
        primaryText: 'العشاء',
        secondaryText: 'متبقي 1:35',
      }} />
    </div>
  );
}
