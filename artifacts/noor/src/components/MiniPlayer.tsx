import { useAudio } from '@/contexts/AudioContext';
import { useLocation } from 'wouter';

function fmtTime(s: number) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

const STAR8_PTS = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 === 0 ? 12 : 7;
  const a = (i * 22.5 - 90) * Math.PI / 180;
  return `${(20 + r * Math.cos(a)).toFixed(2)},${(20 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

export function MiniPlayer() {
  const audio = useAudio();
  const [, navigate] = useLocation();

  if (!audio.surahNum) return null;

  const progress = audio.duration ? audio.currentTime / audio.duration : 0;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3 pb-1 max-w-lg mx-auto" dir="rtl">
      <div
        className="rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #1a1208 0%, #130e06 100%)',
          border: '1px solid rgba(193,154,107,0.3)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
        onClick={() => navigate('/reciters')}
      >
        {/* RTL progress bar — fills from right to left */}
        <div className="h-0.5 w-full relative" style={{ background: 'rgba(193,154,107,0.15)' }}>
          <div
            className="absolute top-0 right-0 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%`, background: 'linear-gradient(to left, #C19A6B, #8a6a3a)' }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Mini Islamic disc icon */}
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)', border: '1px solid rgba(193,154,107,0.25)' }}>
            <svg viewBox="0 0 40 40" width="28" height="28">
              <circle cx="20" cy="20" r="20" fill="#1a1208" />
              <circle cx="20" cy="20" r="18" fill="none" stroke="#C19A6B" strokeWidth="0.8" opacity="0.4" />
              <polygon points={STAR8_PTS} fill="rgba(193,154,107,0.15)" stroke="#C19A6B" strokeWidth="0.8" opacity="0.7" />
              <circle cx="20" cy="20" r="6" fill="rgba(193,154,107,0.2)" stroke="#C19A6B" strokeWidth="0.8" />
              <text x="20" y="22" textAnchor="middle" dominantBaseline="middle"
                style={{ fontFamily: 'serif', fontSize: '7px', fill: '#d4b483' }}>ق</text>
            </svg>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: '#e8d9b8', fontFamily: '"Tajawal", sans-serif' }}>
              سورة {audio.surahName}
            </p>
            <p className="text-xs truncate" style={{ color: 'rgba(193,154,107,0.6)', fontFamily: '"Tajawal", sans-serif' }}>
              {audio.reciterName}
            </p>
          </div>

          {/* Current time */}
          <p className="text-xs flex-shrink-0" style={{ color: 'rgba(193,154,107,0.5)', fontFamily: '"Tajawal", sans-serif' }}>
            {fmtTime(audio.currentTime)}
          </p>

          {/* Play/Pause */}
          <button
            onClick={e => { e.stopPropagation(); audio.togglePlay(); }}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C19A6B, #7a5020)', boxShadow: '0 2px 8px rgba(193,154,107,0.3)' }}
          >
            {audio.isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : audio.isPlaying ? (
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 translate-x-0.5"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
