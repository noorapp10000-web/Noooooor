import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Fajr() {
  return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        topColor: '#0D0620',
        midColor: '#3D1050',
        bottomColor: '#7B2D6E',
        stars: true,
        sunOrMoon: { x: 50, y: 88, size: 40, color: 'radial-gradient(circle, #FFD580 0%, #FF8C42 50%, transparent 75%)', glow: '0 0 30px 12px rgba(255,160,60,0.5), 0 0 70px 30px rgba(255,100,20,0.25)' },
        label: 'الفجر',
        labelColor: 'rgba(255,180,150,0.9)',
        timeLabel: '3:50 ص',
        primaryText: 'الفجر',
        secondaryText: 'متبقي 0:10',
      }} />
    </div>
  );
}
