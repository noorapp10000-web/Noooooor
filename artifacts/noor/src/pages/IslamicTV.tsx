import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Play, WifiOff, Volume2, VolumeX, Maximize2, RotateCcw, Radio as RadioIcon } from 'lucide-react';
import { PageHeader, GoldBadge, FooterAyah, WaveBars, Spinner, NoorImg } from '@/components/noor/kit';
import { cn } from '@/lib/utils';

type Channel = { id: number; name: string; place: string; url: string; description: string; art: string };

const CHANNELS: Channel[] = [
  {
    id: 1, name: 'قناة القرآن الكريم', place: 'مكة المكرمة — المسجد الحرام',
    url: 'https://win.holol.com/live/quran/playlist.m3u8',
    description: 'بث حي على مدار الساعة من رحاب المسجد الحرام مع التلاوات والصلوات',
    art: 'images/kaaba-3d.webp',
  },
  {
    id: 2, name: 'قناة السنة النبوية', place: 'المدينة المنورة — المسجد النبوي',
    url: 'https://win.holol.com/live/sunnah/playlist.m3u8',
    description: 'بث حي من المسجد النبوي الشريف مع الدروس والمحاضرات من السنة',
    art: 'images/art/hero-mosque.webp',
  },
];

type Status = 'loading' | 'playing' | 'error';

function LivePlayer({ channel }: { channel: Channel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [muted, setMuted] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setStatus('loading');
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const native = video.canPlayType('application/vnd.apple.mpegurl');
      if (channel.url.includes('.m3u8') && !native) {
        try {
          const { default: Hls } = await import('hls.js');
          if (cancelled) return;
          if (!Hls.isSupported()) { setStatus('error'); return; }
          const inst = new Hls({ enableWorker: false, lowLatencyMode: true });
          hls = inst;
          inst.loadSource(channel.url);
          inst.attachMedia(video);
          inst.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => setStatus('error')); });
          inst.on(Hls.Events.ERROR, (_e: unknown, data: { fatal?: boolean }) => { if (data.fatal) setStatus('error'); });
        } catch { setStatus('error'); }
      } else {
        video.src = channel.url;
        video.play().catch(() => setStatus('error'));
      }
    })();

    const onPlaying = () => setStatus('playing');
    const onError = () => setStatus('error');
    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);
    return () => {
      cancelled = true;
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [channel.url, attempt]);

  return (
    <div className="noor-card-hero rounded-[28px] overflow-hidden">
      <div className="relative aspect-video bg-background">
        <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay muted={muted} controls={status === 'playing'} />
        {status !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
            style={{ backgroundImage: `linear-gradient(180deg, hsl(168 40% 5% / .55), hsl(168 50% 4% / .9)), url(${import.meta.env.BASE_URL}${channel.art})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {status === 'loading' ? (
              <><Spinner /><p className="text-sm text-foreground/80 mt-3">جارٍ الاتصال بالبث المباشر…</p></>
            ) : (
              <>
                <WifiOff className="w-8 h-8 text-primary mb-2" />
                <p className="font-bold text-foreground">تعذّر تشغيل البث</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">قد يكون البث غير متاح حالياً أو أن الاتصال ضعيف</p>
                <button onClick={() => setAttempt(a => a + 1)} className="press px-5 h-10 rounded-2xl noor-btn-gold flex items-center gap-2 text-sm"><RotateCcw className="w-4 h-4" /> إعادة المحاولة</button>
              </>
            )}
          </div>
        )}
        <div className="absolute top-3 right-3">
          <GoldBadge className={cn(status === 'playing' ? '!bg-destructive/80 !text-foreground !border-destructive' : '')}>
            <span className={cn('w-1.5 h-1.5 rounded-full', status === 'playing' ? 'bg-foreground animate-pulse' : 'bg-primary')} />
            {status === 'playing' ? 'مباشر' : status === 'loading' ? 'جارٍ التحميل' : 'غير متاح'}
          </GoldBadge>
        </div>
      </div>
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground">{channel.name}</p>
          <p className="text-xs text-muted-foreground truncate">{channel.place}</p>
        </div>
        <WaveBars active={status === 'playing' && !muted} bars={6} height={22} />
        <button onClick={() => setMuted(m => !m)} aria-label="الصوت" className="press w-10 h-10 rounded-2xl noor-btn-ghost flex items-center justify-center">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button onClick={() => videoRef.current?.requestFullscreen?.().catch(() => {})} aria-label="ملء الشاشة" className="press w-10 h-10 rounded-2xl noor-btn-ghost flex items-center justify-center">
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function IslamicTV() {
  const [active, setActive] = useState<Channel>(CHANNELS[0]);
  const [started, setStarted] = useState(false);

  return (
    <div className="min-h-screen pb-28" dir="rtl">
      <PageHeader title="القنوات الإسلامية" subtitle="بث مباشر من الحرمين الشريفين" icon="mosque" />

      <div className="max-w-lg mx-auto px-4 pt-4">
        {started ? (
          <LivePlayer key={active.id} channel={active} />
        ) : (
          <button onClick={() => setStarted(true)} className="press relative w-full aspect-video rounded-[28px] overflow-hidden noor-card-hero text-right">
            <img src={`${import.meta.env.BASE_URL}${active.art}`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-hero-fade" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-16 h-16 rounded-full noor-gold-orb flex items-center justify-center text-background noor-glow"><Play className="w-7 h-7 translate-x-0.5" /></span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4">
              <p className="font-bold text-lg text-foreground">{active.name}</p>
              <p className="text-xs text-foreground/75">{active.place}</p>
            </div>
          </button>
        )}

        <h2 className="font-bold text-primary mt-6 mb-3 px-1">القنوات</h2>
        <div className="flex flex-col gap-3">
          {CHANNELS.map(ch => {
            const on = ch.id === active.id;
            return (
              <button key={ch.id} onClick={() => { setActive(ch); setStarted(true); }}
                className={cn('press w-full text-right rounded-3xl overflow-hidden flex items-stretch noor-card', on && 'noor-card-active')}>
                <div className="relative w-28 flex-shrink-0">
                  <img src={`${import.meta.env.BASE_URL}${ch.art}`} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/60" />
                </div>
                <div className="flex-1 min-w-0 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground truncate">{ch.name}</p>
                    {on && started && <WaveBars bars={4} height={14} />}
                  </div>
                  <p className="text-[11px] text-primary truncate">{ch.place}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ch.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Link href="/radio" className="press mt-4 w-full rounded-3xl p-4 noor-card flex items-center gap-3">
          <NoorImg name="radio" size={40} />
          <div className="flex-1">
            <p className="font-bold text-sm text-foreground">إذاعة القرآن الكريم من القاهرة</p>
            <p className="text-[11px] text-muted-foreground">ومحطات التلاوات المباشرة</p>
          </div>
          <RadioIcon className="w-5 h-5 text-primary" />
        </Link>

        <FooterAyah text="وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ" source="المائدة: ٢" />
      </div>
    </div>
  );
}
