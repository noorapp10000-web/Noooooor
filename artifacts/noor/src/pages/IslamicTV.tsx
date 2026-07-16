import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Tv, Play, Wifi, WifiOff, X, Volume2, VolumeX } from 'lucide-react';
import { useLocation } from 'wouter';
import { useUserSetting } from '@/hooks/use-user-setting';

type Channel = {
  id: number;
  name: string;
  url: string;
  description: string;
  grad: string;
};

const CHANNELS: Channel[] = [
  {
    id: 1,
    name: 'قناة القرآن الكريم',
    url: 'https://win.holol.com/live/quran/playlist.m3u8',
    description: 'البث الحي لتلاوة القرآن الكريم على مدار اليوم',
    grad: 'linear-gradient(135deg,#1b4332,#0d2b1e)',
  },
  {
    id: 2,
    name: 'قناة السنة النبوية',
    url: 'https://win.holol.com/live/sunnah/playlist.m3u8',
    description: 'البث الحي للمحاضرات والدروس من السنة النبوية الشريفة',
    grad: 'linear-gradient(135deg,#3a1a5c,#1e0d30)',
  },
];

const DHIKR = 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ وَلَا تَعَاوَنُوا عَلَى الْإِثْمِ وَالْعُدْوَانِ ۝ المائدة: 2';

function VideoPlayer({
  channel,
  onClose,
  dark,
}: {
  channel: Channel;
  onClose: () => void;
  dark: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hlsInstance: unknown = null;

    const setupHls = async () => {
      const isHls = channel.url.includes('.m3u8');
      const canPlayHls = video.canPlayType('application/vnd.apple.mpegurl');

      if (isHls && !canPlayHls) {
        try {
          const { default: Hls } = await import('hls.js');
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: false, lowLatencyMode: true });
            hlsInstance = hls;
            hls.loadSource(channel.url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => setStatus('error'));
            });
            hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal?: boolean }) => {
              if (data.fatal) setStatus('error');
            });
          } else {
            setStatus('error');
          }
        } catch {
          setStatus('error');
        }
      } else {
        video.src = channel.url;
        video.play().catch(() => setStatus('error'));
      }
    };

    const onPlaying = () => setStatus('playing');
    const onError   = () => setStatus('error');
    const onWaiting = () => { if (status === 'playing') setStatus('loading'); };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('error',   onError);
    video.addEventListener('waiting', onWaiting);

    setupHls();

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error',   onError);
      video.removeEventListener('waiting', onWaiting);
      if (hlsInstance && typeof (hlsInstance as { destroy?: () => void }).destroy === 'function') {
        (hlsInstance as { destroy: () => void }).destroy();
      }
      video.src = '';
    };
  }, [channel.url]);

  const bg = dark ? '#0f0c07' : '#0a0a0a';

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: bg }} dir="rtl">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(193,154,107,0.15)' }}
        >
          <X size={18} className="text-[#C19A6B]" />
        </button>
        <div className="text-center">
          <p className="font-bold text-sm text-white" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {channel.name}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            {status === 'playing' ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400" style={{ fontFamily: '"Tajawal", sans-serif' }}>بث مباشر</span>
              </>
            ) : status === 'error' ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-xs text-red-400" style={{ fontFamily: '"Tajawal", sans-serif' }}>تعذّر التحميل</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs text-yellow-400" style={{ fontFamily: '"Tajawal", sans-serif' }}>جارٍ التحميل</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            if (videoRef.current) videoRef.current.muted = !muted;
            setMuted(m => !m);
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(193,154,107,0.15)' }}
        >
          {muted ? <VolumeX size={18} className="text-[#C19A6B]" /> : <Volume2 size={18} className="text-[#C19A6B]" />}
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          autoPlay
          controls={status === 'playing'}
        />

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: channel.grad }}>
              <Tv size={26} className="text-white" />
            </div>
            <div className="w-8 h-8 border-2 border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin mb-3" />
            <p className="text-sm text-white/60" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              جارٍ تحميل البث...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <WifiOff size={28} className="text-red-400" />
            </div>
            <p className="font-bold text-white mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              تعذّر تشغيل البث
            </p>
            <p className="text-sm text-white/50 mb-6" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              قد يكون البث غير متاح حالياً أو يتطلب اتصالاً أقوى
            </p>
            <button
              onClick={() => {
                setStatus('loading');
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => setStatus('error'));
                }
              }}
              className="px-6 py-3 rounded-2xl font-bold text-sm"
              style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg,#8B6340,#C19A6B)', color: '#fff' }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function IslamicTV() {
  const [, navigate] = useLocation();
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  const handleChannel = useCallback((ch: Channel) => setActiveChannel(ch), []);
  const handleClose = useCallback(() => setActiveChannel(null), []);

  const bg = dark ? '#0f0c07' : '#FDFBF0';
  const cardBg = dark ? '#1a1208' : '#fff';
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';
  const textPrimary = dark ? '#d4b483' : '#5D4037';
  const textSec = dark ? '#8B6B3D' : '#9E7B4A';

  return (
    <div className="min-h-screen pb-28" dir="rtl" style={{ background: bg }}>
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/more')}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(193,154,107,0.12)' }}
          >
            <ChevronLeft size={20} className="text-[#C19A6B]" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>
              القنوات الإسلامية
            </h1>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
              {CHANNELS.length} قنوات بث مباشر
            </p>
          </div>
          <Tv size={22} className="text-[#C19A6B] flex-shrink-0" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div
          className="mb-5 p-3 rounded-2xl flex items-center gap-3"
          style={{ background: dark ? 'rgba(193,154,107,0.07)' : 'rgba(193,154,107,0.1)', border: `1px solid ${border}` }}
        >
          <Wifi size={16} className="text-[#C19A6B] flex-shrink-0" />
          <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
            تأكد من الاتصال بالإنترنت لمشاهدة البث المباشر بجودة عالية
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleChannel(ch)}
              className="w-full text-right rounded-2xl overflow-hidden flex items-center gap-4 p-4 active:scale-[0.99] transition-transform"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: ch.grad }}
              >
                <Tv size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base leading-tight" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>
                  {ch.name}
                </p>
                <p className="text-xs mt-1 line-clamp-2" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
                  {ch.description}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-500" style={{ fontFamily: '"Tajawal", sans-serif' }}>بث مباشر</span>
                </div>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(193,154,107,0.12)' }}
              >
                <Play size={16} className="text-[#C19A6B]" style={{ transform: 'scaleX(-1)' }} />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 mb-4 text-center px-4">
          <div className="h-px mb-4" style={{ background: `linear-gradient(to left, transparent, ${border}, transparent)` }} />
          <p className="text-sm leading-loose" style={{ fontFamily: '"Amiri", serif', color: dark ? '#8B6B3D' : '#B8946A' }}>
            {DHIKR}
          </p>
        </div>
      </div>

      {activeChannel && (
        <VideoPlayer channel={activeChannel} onClose={handleClose} dark={dark} />
      )}
    </div>
  );
}
