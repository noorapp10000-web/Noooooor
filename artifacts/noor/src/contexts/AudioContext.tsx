import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

interface AudioState {
  reciterId: string;
  reciterName: string;
  serverUrl: string;
  surahNum: number | null;
  surahName: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
}

interface AudioContextType extends AudioState {
  play: (opts: { reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string }) => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (fraction: number) => void;
  seekNext: () => void;
  seekPrev: () => void;
  stop: () => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

const audioEl = new Audio();
audioEl.preload = 'auto';

/* ── MediaSession: تحكم في شاشة القفل وسماعات البلوتوث ── */
function updateMediaSession(surahName: string, reciterName: string): void {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: surahName ? `سورة ${surahName}` : 'القرآن الكريم',
      artist: reciterName || 'تطبيق نُور',
      album: 'القرآن الكريم',
      artwork: [
        { src: '/logo.png',    sizes: '192x192', type: 'image/png' },
        { src: '/logo.png',    sizes: '512x512', type: 'image/png' },
      ],
    });
  } catch {}
}

function registerMediaSessionHandlers(
  onPlay: () => void,
  onPause: () => void,
  onNext: () => void,
  onPrev: () => void,
  onSeek: (details: MediaSessionActionDetails) => void,
): void {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler('play',          onPlay);
    navigator.mediaSession.setActionHandler('pause',         onPause);
    navigator.mediaSession.setActionHandler('stop',          onPause);
    navigator.mediaSession.setActionHandler('nexttrack',     onNext);
    navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    navigator.mediaSession.setActionHandler('seekto',        onSeek);
  } catch {}
}

function setMediaSessionState(state: 'playing' | 'paused' | 'none'): void {
  if (!('mediaSession' in navigator)) return;
  try { navigator.mediaSession.playbackState = state; } catch {}
}

function updateMediaPositionState(): void {
  if (!('mediaSession' in navigator)) return;
  if (!audioEl.duration || isNaN(audioEl.duration)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration:     audioEl.duration,
      playbackRate: audioEl.playbackRate,
      position:     audioEl.currentTime,
    });
  } catch {}
}

/* ── Provider ── */
export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioState>({
    reciterId: '',
    reciterName: '',
    serverUrl: '',
    surahNum: null,
    surahName: '',
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
  });

  const rafRef = useRef<number>(0);
  // Keep latest state in a ref for MediaSession handlers (avoid stale closures)
  const stateRef = useRef(state);
  stateRef.current = state;

  const tick = useCallback(() => {
    setState(s => ({ ...s, currentTime: audioEl.currentTime, duration: audioEl.duration || 0 }));
    updateMediaPositionState();
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startTick = () => { rafRef.current = requestAnimationFrame(tick); };
  const stopTick  = () => cancelAnimationFrame(rafRef.current);

  audioEl.onplay = () => {
    setState(s => ({ ...s, isPlaying: true, isLoading: false }));
    setMediaSessionState('playing');
    startTick();
  };
  audioEl.onpause = () => {
    setState(s => ({ ...s, isPlaying: false }));
    setMediaSessionState('paused');
    stopTick();
  };
  audioEl.onended = () => {
    setState(s => ({ ...s, isPlaying: false, currentTime: 0 }));
    setMediaSessionState('paused');
    stopTick();
  };
  audioEl.onwaiting         = () => setState(s => ({ ...s, isLoading: true }));
  audioEl.oncanplay         = () => setState(s => ({ ...s, isLoading: false }));
  audioEl.ondurationchange  = () => setState(s => ({ ...s, duration: audioEl.duration || 0 }));

  // ── play ─────────────────────────────────────────────────────────
  const play = useCallback(({ reciterId, reciterName, serverUrl, surahNum, surahName }: {
    reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string;
  }) => {
    const surahPad = surahNum.toString().padStart(3, '0');
    audioEl.src = `${serverUrl}${surahPad}.mp3`;
    audioEl.load();
    audioEl.play().catch(() => {});
    setState(s => ({ ...s, reciterId, reciterName, serverUrl, surahNum, surahName, isLoading: true, currentTime: 0 }));

    // شاشة القفل / سماعات البلوتوث
    updateMediaSession(surahName, reciterName);
    registerMediaSessionHandlers(
      () => audioEl.play().catch(() => {}),
      () => audioEl.pause(),
      // next/prev: شغّل السورة التالية/السابقة
      () => {
        const cur = stateRef.current;
        if (!cur.surahNum || cur.surahNum >= 114) return;
        play({ reciterId: cur.reciterId, reciterName: cur.reciterName, serverUrl: cur.serverUrl,
               surahNum: cur.surahNum + 1, surahName: '' });
      },
      () => {
        const cur = stateRef.current;
        if (!cur.surahNum || cur.surahNum <= 1) return;
        play({ reciterId: cur.reciterId, reciterName: cur.reciterName, serverUrl: cur.serverUrl,
               surahNum: cur.surahNum - 1, surahName: '' });
      },
      (details) => {
        if (details.seekTime !== undefined) {
          audioEl.currentTime = details.seekTime;
        }
      },
    );
  }, []);

  const togglePlay = useCallback(() => {
    if (audioEl.paused) audioEl.play().catch(() => {});
    else audioEl.pause();
  }, []);

  const pause = useCallback(() => { audioEl.pause(); }, []);

  const seek = useCallback((fraction: number) => {
    if (!audioEl.duration) return;
    audioEl.currentTime = fraction * audioEl.duration;
  }, []);

  // next/prev سورة (للأزرار داخل التطبيق)
  const seekNext = useCallback(() => {
    const cur = stateRef.current;
    if (!cur.surahNum || cur.surahNum >= 114) return;
    play({ reciterId: cur.reciterId, reciterName: cur.reciterName, serverUrl: cur.serverUrl,
           surahNum: cur.surahNum + 1, surahName: '' });
  }, [play]);

  const seekPrev = useCallback(() => {
    const cur = stateRef.current;
    if (!cur.surahNum || cur.surahNum <= 1) return;
    play({ reciterId: cur.reciterId, reciterName: cur.reciterName, serverUrl: cur.serverUrl,
           surahNum: cur.surahNum - 1, surahName: '' });
  }, [play]);

  const stop = useCallback(() => {
    audioEl.pause();
    audioEl.src = '';
    stopTick();
    setMediaSessionState('none');
    setState(s => ({ ...s, isPlaying: false, surahNum: null, currentTime: 0, duration: 0 }));
  }, []);

  return (
    <AudioCtx.Provider value={{ ...state, play, togglePlay, pause, seek, seekNext, seekPrev, stop }}>
      {children}
    </AudioCtx.Provider>
  );
}

export const useAudio = () => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
};
