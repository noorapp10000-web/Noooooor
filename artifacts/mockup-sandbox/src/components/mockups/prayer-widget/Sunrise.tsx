import { PrayerWidget } from './WidgetBase';
import './_group.css';

export function Sunrise() {
  return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PrayerWidget sky={{
        topColor: '#1A3A5C',
        midColor: '#C05820',
        bottomColor: '#F4A040',
        sunOrMoon: { x: 50, y: 72, size: 48, color: 'radial-gradient(circle, #FFFDE0 0%, #FFD060 40%, #FF8030 70%, transparent 100%)', glow: '0 0 40px 18px rgba(255,200,80,0.6), 0 0 90px 40px rgba(255,120,30,0.35)' },
        label: 'الشروق',
        labelColor: 'rgba(255,220,120,0.95)',
        timeLabel: '4:05 ص',
        primaryText: 'الضحى',
        secondaryText: 'بعد 45 دقيقة',
      }} />
    </div>
  );
}
