import { useAudio } from '@/contexts/AudioContext';
import { useLocation } from 'wouter';
import { X } from 'lucide-react';

function fmtTime(s: number) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export function MiniPlayer() {
  const audio = useAudio();
  const [, navigate] = useLocation();

  if (!audio.surahNum) return null;

  const progress = audio.duration ? audio.currentTime / audio.duration : 0;

  return (
    <div className="fixed bottom-[86px] left-0 right-0 z-40 px-3 max-w-lg mx-auto" dir="rtl">
      <div
        className="relative rounded-[22px] overflow-hidden cursor-pointer shadow-lift bg-gradient-brand"
        style={{ border: '1px solid hsl(var(--primary) / 0.28)', color: 'hsl(var(--brand-foreground))' }}
        onClick={() => navigate('/reciters')}
      >
        <div className="flex items-center gap-3 p-2 pe-3">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
            <img src="/images/art/cover-quran.webp" alt="" className={`w-full h-full object-cover ${audio.isPlaying ? 'animate-[float_6s_ease-in-out_infinite]' : ''}`} />
            {audio.isPlaying && (
              <span className="absolute bottom-1 left-1 flex items-end gap-[2px] h-3">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-[3px] rounded-full animate-pulse" style={{ height: `${6 + i * 3}px`, background: 'hsl(var(--gold-soft))', animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-[14px] truncate">سورة {audio.surahName}</p>
            <p className="text-[11px] truncate opacity-70">{audio.reciterName} · <span className="tabular-nums">{fmtTime(audio.currentTime)}</span></p>
          </div>

          <button
            onClick={e => { e.stopPropagation(); audio.seekPrev(); }}
            aria-label="السابق"
            className="press w-8 h-8 rounded-full flex items-center justify-center opacity-80"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16 18h2V6h-2zM6 18l8.5-6L6 6z" /></svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); audio.togglePlay(); }}
            aria-label={audio.isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            className="press w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-gold shadow-gold"
            style={{ color: 'hsl(var(--primary-foreground))' }}
          >
            {audio.isLoading ? (
              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : audio.isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 -translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button
            onClick={e => { e.stopPropagation(); audio.seekNext(); }}
            aria-label="التالي"
            className="press w-8 h-8 rounded-full flex items-center justify-center opacity-80"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); audio.stop(); }}
            aria-label="إغلاق"
            className="press w-7 h-7 rounded-full flex items-center justify-center opacity-60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-[3px] w-full relative" style={{ background: 'hsl(0 0% 100% / 0.08)' }}>
          <div className="absolute top-0 right-0 h-full bg-gradient-gold transition-all duration-300" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
