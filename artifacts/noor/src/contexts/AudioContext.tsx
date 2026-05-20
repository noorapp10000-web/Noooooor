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
  autoPlay: boolean;
}

interface AudioContextType extends AudioState {
  play: (opts: { reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string }) => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (fraction: number) => void;
  seekNext: () => void;
  seekPrev: () => void;
  stop: () => void;
  toggleAutoPlay: () => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

const audioEl = new Audio();
audioEl.preload = 'auto';

/* ── MediaSession: تحكم في شاشة القفل وسماعات البلوتوث ── */
function updateMediaSession(surahName: string, reciterName: string): void {
  if (!('mediaSession' in navigator)) return;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.mediaSession.metadata = new MediaMetadata({
      title: surahName ? `سورة ${surahName}` : 'القرآن الكريم',
      artist: reciterName || 'تطبيق نُور',
      album: 'القرآن الكريم',
      artwork: [
        { src: `${base}/logo.png`, sizes: '192x192', type: 'image/png' },
        { src: `${base}/logo.png`, sizes: '512x512', type: 'image/png' },
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

function readAutoPlayPref(): boolean {
  try { return localStorage.getItem('noor_autoplay') !== 'false'; } catch { return true; }
}

/* ── Provider ── */
export function AudioProvider({ children }: { children: ReactNode }) {
  const initAutoPlay = readAutoPlayPref();

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
    autoPlay: initAutoPlay,
  });

  const rafRef      = useRef<number>(0);
  const stateRef    = useRef(state);
  stateRef.current  = state;

  // Stable ref so onended can call play() without stale-closure issues
  const autoPlayRef = useRef<boolean>(initAutoPlay);
  const playRef     = useRef<((opts: { reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string }) => void) | null>(null);

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
  audioEl.onwaiting        = () => setState(s => ({ ...s, isLoading: true }));
  audioEl.oncanplay        = () => setState(s => ({ ...s, isLoading: false }));
  audioEl.ondurationchange = () => setState(s => ({ ...s, duration: audioEl.duration || 0 }));

  // ── play ─────────────────────────────────────────────────────────
  const play = useCallback(({ reciterId, reciterName, serverUrl, surahNum, surahName }: {
    reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string;
  }) => {
    const surahPad = surahNum.toString().padStart(3, '0');
    audioEl.src = `${serverUrl}${surahPad}.mp3`;
    audioEl.load();
    audioEl.play().catch(() => {});
    setState(s => ({ ...s, reciterId, reciterName, serverUrl, surahNum, surahName, isLoading: true, currentTime: 0 }));

    updateMediaSession(surahName, reciterName);
    registerMediaSessionHandlers(
      () => audioEl.play().catch(() => {}),
      () => audioEl.pause(),
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
        if (details.seekTime !== undefined) audioEl.currentTime = details.seekTime;
      },
    );
  }, []);

  // Keep playRef up to date so onended can always call the latest play()
  playRef.current = play;

  // ── onended: auto-play next surah or stop ─────────────────────────
  audioEl.onended = () => {
    const cur = stateRef.current;
    if (autoPlayRef.current && cur.surahNum && cur.surahNum < 114 && playRef.current) {
      const nextNum = cur.surahNum + 1;
      playRef.current({
        reciterId:   cur.reciterId,
        reciterName: cur.reciterName,
        serverUrl:   cur.serverUrl,
        surahNum:    nextNum,
        surahName:   '',
      });
    } else {
      setState(s => ({ ...s, isPlaying: false, currentTime: 0 }));
      setMediaSessionState('paused');
      stopTick();
    }
  };

  const togglePlay = useCallback(() => {
    if (audioEl.paused) audioEl.play().catch(() => {});
    else audioEl.pause();
  }, []);

  const pause = useCallback(() => { audioEl.pause(); }, []);

  const seek = useCallback((fraction: number) => {
    if (!audioEl.duration) return;
    audioEl.currentTime = fraction * audioEl.duration;
  }, []);

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

  const toggleAutoPlay = useCallback(() => {
    setState(s => {
      const next = !s.autoPlay;
      autoPlayRef.current = next;
      try { localStorage.setItem('noor_autoplay', String(next)); } catch {}
      return { ...s, autoPlay: next };
    });
  }, []);

  return (
    <AudioCtx.Provider value={{ ...state, play, togglePlay, pause, seek, seekNext, seekPrev, stop, toggleAutoPlay }}>
      {children}
    </AudioCtx.Provider>
  );
}

export const useAudio = () => {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
};
