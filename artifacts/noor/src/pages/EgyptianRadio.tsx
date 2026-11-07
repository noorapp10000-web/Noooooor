import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Tv, Radio as RadioIcon, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { PageHeader, GoldBadge, FooterAyah, WaveBars, Spinner, NoorImg, type NoorIconName } from '@/components/noor/kit';
import { cn } from '@/lib/utils';
import { vibrateLight } from '@/lib/haptics';

type Station = { id: number; name: string; subtitle: string; freq: string; badge: string; urls: string[]; icon: NoorIconName };

const STATIONS: Station[] = [
  { id: 1, name: 'إذاعة القرآن الكريم', subtitle: 'بث مباشر من القاهرة • الإذاعة المصرية', freq: '98.8 FM', badge: 'القاهرة', icon: 'radio',
    urls: ['https://stream.radiojar.com/8s5u5tpdtwzuv', 'https://n01.radiojar.com/8s5u5tpdtwzuv', 'https://radio.mp3islam.com/listen/quran_radio/radio.mp3', 'https://n03.radiojar.com/8s5u5tpdtwzuv'] },
  { id: 2, name: 'محمد صديق المنشاوي', subtitle: 'التلاوة الكلاسيكية الأصيلة', freq: '100.6 FM', badge: 'ترتيل', icon: 'quran',
    urls: ['https://radio.mp3islam.com/listen/minshawi/radio.mp3', 'https://n01.radiojar.com/minshawi', 'https://stream.zeno.fm/yn60hqkp6yzuv'] },
  { id: 3, name: 'إذاعة مكة المكرمة', subtitle: 'بث مباشر من الحرم المكي الشريف', freq: '107.9 FM', badge: 'الحرم', icon: 'mosque',
    urls: ['https://stream.radiojar.com/0tpy1h0kxtzuv', 'https://n01.radiojar.com/0tpy1h0kxtzuv', 'https://edge.mixlr.com/channel/rwumx'] },
  { id: 4, name: 'مشاري العفاسي', subtitle: 'تلاوات وأناشيد إسلامية', freq: '95.1 FM', badge: 'مرتل', icon: 'headphones',
    urls: ['https://stream.zeno.fm/ud3z16g0hkquv', 'https://n01.radiojar.com/mishary', 'https://stream.zeno.fm/4d6rdunvgn8uv'] },
  { id: 5, name: 'ماهر المعيقلي', subtitle: 'تلاوات خاشعة مؤثرة', freq: '92.4 FM', badge: 'خاشع', icon: 'star',
    urls: ['https://stream.zeno.fm/xqcd0h4fp9zuv', 'https://n01.radiojar.com/maher', 'https://stream.zeno.fm/0r0xa792kwzuv'] },
  { id: 6, name: 'ياسر الدوسري', subtitle: 'صوت يخشع له القلب', freq: '103.7 FM', badge: 'ندي', icon: 'dua',
    urls: ['https://radio.mp3islam.com/listen/yaser/radio.mp3', 'https://n01.radiojar.com/yasser', 'https://stream.zeno.fm/2uvzm99qf08uv'] },
];

type Status = 'idle' | 'loading' | 'playing' | 'error';

export function EgyptianRadio() {
  const [active, setActive] = useState<Station>(STATIONS[0]);
  const [status, setStatus] = useState<Status>('idle');
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tokenRef = useRef(0);

  const play = useCallback((station: Station, idx = 0) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    const token = ++tokenRef.current;
    audio.pause();
    setActive(station);
    setStatus('loading');
    audio.src = station.urls[idx];
    audio.onplaying = () => { if (token === tokenRef.current) setStatus('playing'); };
    audio.onwaiting = () => { if (token === tokenRef.current) setStatus('loading'); };
    const fail = () => {
      if (token !== tokenRef.current) return;
      if (idx + 1 < station.urls.length) play(station, idx + 1);
      else setStatus('error');
    };
    audio.onerror = fail;
    audio.play().catch(fail);
  }, []);

  const stop = useCallback(() => {
    tokenRef.current++;
    audioRef.current?.pause();
    setStatus('idle');
  }, []);

  const toggle = () => { vibrateLight(); if (status === 'playing' || status === 'loading') stop(); else play(active); };

  useEffect(() => () => { tokenRef.current++; if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; } }, []);
  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);

  const live = status === 'playing';

  return (
    <div className="min-h-screen pb-28" dir="rtl">
      <PageHeader title="إذاعات القرآن الكريم" subtitle="بث مباشر على مدار الساعة" icon="radio" />
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="noor-card-hero rounded-[32px] p-6 relative overflow-hidden mb-6">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, hsl(38 72% 55%), transparent 70%)' }} />
          <div className="flex items-center justify-between relative">
            <GoldBadge><RadioIcon className="w-3.5 h-3.5" /> {active.freq}</GoldBadge>
            <GoldBadge tone={live ? 'emerald' : 'muted'}>
              <span className={cn('w-1.5 h-1.5 rounded-full', live ? 'bg-primary animate-pulse' : 'bg-muted-foreground')} />
              {live ? 'على الهواء' : status === 'loading' ? 'جارٍ الاتصال…' : status === 'error' ? 'غير متاح' : 'جاهز'}
            </GoldBadge>
          </div>
          <div className="flex flex-col items-center text-center mt-5 relative">
            <div className={cn('w-28 h-28 rounded-full noor-card flex items-center justify-center border border-primary/25', live && 'noor-glow')}>
              <NoorImg name={active.icon} size={72} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mt-4" style={{ fontFamily: '"Amiri", serif' }}>{active.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{active.subtitle}</p>
            <div className="h-10 flex items-center mt-4"><WaveBars active={live && !muted} bars={14} height={34} /></div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 relative">
            <button onClick={() => setMuted(m => !m)} aria-label="كتم الصوت" className="press w-12 h-12 rounded-2xl noor-btn-ghost flex items-center justify-center">
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={toggle} aria-label={live ? 'إيقاف' : 'تشغيل'} className="press w-16 h-16 rounded-full noor-gold-orb flex items-center justify-center text-background noor-glow">
              {status === 'loading' ? <Spinner /> : live ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-0.5" />}
            </button>
            <button onClick={() => play(active)} aria-label="إعادة الاتصال" className="press w-12 h-12 rounded-2xl noor-btn-ghost flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          {status === 'error' && <p className="text-center text-xs text-destructive mt-3 relative">تعذّر الاتصال بالمحطة، جرّب محطة أخرى أو أعد المحاولة</p>}
        </div>

        <h2 className="font-bold text-primary text-sm mb-3 px-1 flex items-center gap-2"><Sparkles className="w-4 h-4" /> المحطات</h2>
        <div className="flex flex-col gap-2.5 mb-6">
          {STATIONS.map(st => {
            const on = st.id === active.id;
            return (
              <button key={st.id} onClick={() => { vibrateLight(); if (on && live) stop(); else play(st); }}
                className={cn('press w-full text-right rounded-2xl p-4 flex items-center gap-3.5 noor-card', on && 'noor-card-active')}>
                <div className="w-12 h-12 rounded-2xl noor-btn-ghost flex items-center justify-center flex-shrink-0"><NoorImg name={st.icon} size={32} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground truncate">{st.name}</p>
                    {on && live && <WaveBars bars={4} height={14} />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{st.subtitle}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <GoldBadge className="text-[10px]">{st.freq}</GoldBadge>
                  <span className="text-[10px] text-primary/80">{st.badge}</span>
                </div>
              </button>
            );
          })}
        </div>

        <Link href="/tv" className="press w-full rounded-2xl p-4 noor-card flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl noor-emerald-orb flex items-center justify-center flex-shrink-0"><Tv className="w-5 h-5 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">القنوات الإسلامية المباشرة</p>
            <p className="text-xs text-muted-foreground">بث حي من المسجد الحرام والمسجد النبوي</p>
          </div>
        </Link>

        <FooterAyah text="وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا" source="الأعراف: ٢٠٤" />
      </div>
    </div>
  );
}
