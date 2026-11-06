import { useAudio } from '@/contexts/AudioContext';
import { useLocation } from 'wouter';
import { X, Moon } from 'lucide-react';
import { WaveBars, arNum } from '@/components/noor/kit';

function fmtTime(s: number) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

// Full-screen tools with their own bottom controls or audio keep the screen clear.
const HIDE_FLOATING = new Set(['/wudu', '/learn-prayer', '/speed-reader', '/radio', '/tv', '/hifz-test']);

/** Persistent mini player — stays visible while navigating; tap to open the full-screen player. */
export function MiniPlayer({ floating = false }: { floating?: boolean }) {
  const audio = useAudio();
  const [path, navigate] = useLocation();

  if (!audio.surahNum || path === '/reciters' || (floating && HIDE_FLOATING.has(path))) return null;

  const progress = audio.duration ? audio.currentTime / audio.duration : 0;

  return (
    <div
      className="fixed left-0 right-0 z-40 px-3 max-w-lg mx-auto"
      style={{ bottom: floating ? 'max(12px, env(safe-area-inset-bottom))' : '86px' }}
      dir="rtl"
    >
      <div
        className="relative rounded-[22px] overflow-hidden cursor-pointer shadow-lift noor-card-hero"
        style={{ color: 'hsl(var(--brand-foreground))' }}
        onClick={() => navigate('/reciters')}
      >
        <div className="flex items-center gap-3 p-2 pe-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border border-primary/30">
            <img src={`${import.meta.env.BASE_URL}images/art/cover-listen.webp`} alt="" className={`w-full h-full object-cover ${audio.isPlaying ? 'animate-[float_6s_ease-in-out_infinite]' : ''}`} />
            <span className="absolute inset-x-0 bottom-1 flex justify-center">
              <WaveBars active={audio.isPlaying} bars={4} height={12} />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-[14px] truncate font-quran">سورة {audio.surahName}</p>
            <p className="text-[11px] truncate opacity-70 flex items-center gap-1">
              <span className="truncate">{audio.reciterName}</span>
              <span className="tabular-nums">· {fmtTime(audio.currentTime)}</span>
              {audio.rate !== 1 && <span className="text-primary font-bold">· {arNum(audio.rate)}×</span>}
              {(audio.sleepEndsAt || audio.sleepAtEnd) && <Moon className="w-3 h-3 text-primary" />}
            </p>
          </div>

          <button onClick={e => { e.stopPropagation(); audio.seekPrev(); }} aria-label="السورة السابقة"
            className="press w-8 h-8 rounded-full flex items-center justify-center opacity-80">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" /></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); audio.togglePlay(); }} aria-label={audio.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            className="press w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 noor-btn-gold">
            {audio.isLoading ? (
              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : audio.isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button onClick={e => { e.stopPropagation(); audio.seekNext(); }} aria-label="السورة التالية"
            className="press w-8 h-8 rounded-full flex items-center justify-center opacity-80">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); audio.stop(); }} aria-label="إغلاق المشغل"
            className="press w-7 h-7 rounded-full flex items-center justify-center opacity-60">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-[3px] w-full relative bg-primary/10">
          <div className="absolute top-0 right-0 h-full bg-gradient-gold transition-all duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
