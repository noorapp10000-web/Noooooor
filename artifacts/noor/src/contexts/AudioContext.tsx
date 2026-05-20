import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from 'react';

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

/* ─────────────────────────────────────────────────────────────────────────
   Artwork generator — produces a 512×512 Islamic disc matching the
   in-app player design. Returns a data: URL so Android's system
   notification service can fetch it without needing localhost access.
───────────────────────────────────────────────────────────────────────── */
function buildArtwork(surahName: string, reciterName: string): string {
  try {
    const SIZE = 512;
    const cx = SIZE / 2;   // 256
    const cy = 210;        // disc centre (slightly above middle)

    const canvas = document.createElement('canvas');
    canvas.width  = SIZE;
    canvas.height = SIZE;
    const c = canvas.getContext('2d');
    if (!c) return '';

    /* ── background gradient ── */
    const bg = c.createLinearGradient(0, 0, SIZE, SIZE);
    bg.addColorStop(0,   '#0d0b07');
    bg.addColorStop(0.5, '#1a1308');
    bg.addColorStop(1,   '#0d0b07');
    c.fillStyle = bg;
    c.fillRect(0, 0, SIZE, SIZE);

    /* ── outer decorative ring ── */
    c.strokeStyle = 'rgba(193,154,107,0.18)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, 195, 0, Math.PI * 2);
    c.stroke();

    /* ── disc glow fill ── */
    const glow = c.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, 155);
    glow.addColorStop(0,   'rgba(193,154,107,0.13)');
    glow.addColorStop(0.6, 'rgba(193,154,107,0.06)');
    glow.addColorStop(1,   'rgba(193,154,107,0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(cx, cy, 155, 0, Math.PI * 2);
    c.fill();

    /* ── 16 radial spokes (Islamic geometric pattern) ── */
    const SPOKES = 16;
    for (let i = 0; i < SPOKES; i++) {
      const angle = (i * Math.PI * 2) / SPOKES;
      const alpha = i % 2 === 0 ? 0.55 : 0.28;
      c.strokeStyle = `rgba(193,154,107,${alpha})`;
      c.lineWidth   = i % 2 === 0 ? 1.2 : 0.7;
      c.beginPath();
      c.moveTo(cx + Math.cos(angle) * 52,  cy + Math.sin(angle) * 52);
      c.lineTo(cx + Math.cos(angle) * 148, cy + Math.sin(angle) * 148);
      c.stroke();
    }

    /* ── concentric rings ── */
    const rings = [
      { r: 50,  alpha: 0.55, w: 1.8 },
      { r: 100, alpha: 0.35, w: 1.2 },
      { r: 130, alpha: 0.28, w: 1.0 },
      { r: 150, alpha: 0.50, w: 2.0 },
    ];
    rings.forEach(({ r, alpha, w }) => {
      c.strokeStyle = `rgba(193,154,107,${alpha})`;
      c.lineWidth   = w;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();
    });

    /* ── 8-petal inner rosette ── */
    c.strokeStyle = 'rgba(193,154,107,0.4)';
    c.lineWidth   = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const bx = cx + Math.cos(a) * 50;
      const by = cy + Math.sin(a) * 50;
      c.beginPath();
      c.arc(bx, by, 26, 0, Math.PI * 2);
      c.stroke();
    }

    /* ── centre dot ── */
    c.fillStyle = '#C19A6B';
    c.beginPath();
    c.arc(cx, cy, 6, 0, Math.PI * 2);
    c.fill();

    /* ── "نُور" label in centre ── */
    c.fillStyle    = 'rgba(193,154,107,0.9)';
    c.font         = 'bold 28px serif';
    c.textAlign    = 'center';
    c.textBaseline = 'middle';
    c.fillText('نُور', cx, cy);

    /* ── bottom separator line ── */
    const sepY = 382;
    c.strokeStyle = 'rgba(193,154,107,0.25)';
    c.lineWidth   = 1;
    c.beginPath();
    c.moveTo(cx - 160, sepY);
    c.lineTo(cx + 160, sepY);
    c.stroke();

    /* ── surah name ── */
    c.fillStyle    = '#e8d9b8';
    c.font         = 'bold 40px serif';
    c.textBaseline = 'alphabetic';
    const title = surahName ? `سورة ${surahName}` : 'القرآن الكريم';
    c.fillText(title, cx, 430);

    /* ── reciter name ── */
    c.fillStyle = 'rgba(193,154,107,0.78)';
    c.font      = '26px sans-serif';
    // Truncate long names so they fit
    let rName = reciterName || 'تطبيق نُور';
    if (c.measureText(rName).width > 420) {
      while (c.measureText(rName + '…').width > 420 && rName.length > 0) {
        rName = rName.slice(0, -1);
      }
      rName += '…';
    }
    c.fillText(rName, cx, 475);

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

/* Cache last artwork so we don't regenerate on every tick */
let cachedArtworkKey = '';
let cachedArtworkUrl = '';

function getArtwork(surahName: string, reciterName: string): string {
  const key = `${surahName}|${reciterName}`;
  if (key !== cachedArtworkKey) {
    cachedArtworkKey = key;
    cachedArtworkUrl = buildArtwork(surahName, reciterName);
  }
  return cachedArtworkUrl;
}

/* ── MediaSession helpers ── */
function updateMediaSession(surahName: string, reciterName: string): void {
  if (!('mediaSession' in navigator)) return;
  try {
    const artworkDataUrl = getArtwork(surahName, reciterName);
    const artworkList: MediaImage[] = artworkDataUrl
      ? [{ src: artworkDataUrl, sizes: '512x512', type: 'image/png' }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title:   surahName ? `سورة ${surahName}` : 'القرآن الكريم',
      artist:  reciterName || 'تطبيق نُور',
      album:   'القرآن الكريم',
      artwork: artworkList,
    });
  } catch {}
}

function registerMediaSessionHandlers(
  onPlay:  () => void,
  onPause: () => void,
  onNext:  () => void,
  onPrev:  () => void,
  onSeek:  (details: MediaSessionActionDetails) => void,
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
    reciterId: '', reciterName: '', serverUrl: '',
    surahNum: null, surahName: '',
    isPlaying: false, currentTime: 0, duration: 0, isLoading: false,
    autoPlay: initAutoPlay,
  });

  const rafRef      = useRef<number>(0);
  const stateRef    = useRef(state);
  stateRef.current  = state;

  const autoPlayRef   = useRef<boolean>(initAutoPlay);
  const playRef       = useRef<((opts: { reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string }) => void) | null>(null);
  const userPausedRef = useRef<boolean>(false);

  const tick = useCallback(() => {
    setState(s => ({ ...s, currentTime: audioEl.currentTime, duration: audioEl.duration || 0 }));
    updateMediaPositionState();
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startTick = () => { rafRef.current = requestAnimationFrame(tick); };
  const stopTick  = () => cancelAnimationFrame(rafRef.current);

  audioEl.onplay = () => {
    userPausedRef.current = false;
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

  /* ── play ── */
  const play = useCallback(({ reciterId, reciterName, serverUrl, surahNum, surahName }: {
    reciterId: string; reciterName: string; serverUrl: string; surahNum: number; surahName: string;
  }) => {
    userPausedRef.current = false;
    const pad = surahNum.toString().padStart(3, '0');
    audioEl.src = `${serverUrl}${pad}.mp3`;
    audioEl.load();
    audioEl.play().catch(() => {});
    setState(s => ({ ...s, reciterId, reciterName, serverUrl, surahNum, surahName, isLoading: true, currentTime: 0 }));

    updateMediaSession(surahName, reciterName);
    registerMediaSessionHandlers(
      () => { userPausedRef.current = false; audioEl.play().catch(() => {}); },
      () => { userPausedRef.current = true;  audioEl.pause(); },
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

  playRef.current = play;

  /* ── onended: auto-play or stop ── */
  audioEl.onended = () => {
    const cur = stateRef.current;
    if (autoPlayRef.current && cur.surahNum && cur.surahNum < 114 && playRef.current) {
      playRef.current({
        reciterId: cur.reciterId, reciterName: cur.reciterName, serverUrl: cur.serverUrl,
        surahNum: cur.surahNum + 1, surahName: '',
      });
    } else {
      setState(s => ({ ...s, isPlaying: false, currentTime: 0 }));
      setMediaSessionState('paused');
      stopTick();
    }
  };

  const togglePlay = useCallback(() => {
    if (audioEl.paused) { userPausedRef.current = false; audioEl.play().catch(() => {}); }
    else                { userPausedRef.current = true;  audioEl.pause(); }
  }, []);

  const pause = useCallback(() => {
    userPausedRef.current = true;
    audioEl.pause();
  }, []);

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
    userPausedRef.current = true;
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

  /* ── Keep audio alive in background / lock screen ── */
  useEffect(() => {
    (window as any).__noorKeepPlaying = () => {
      if (!userPausedRef.current && audioEl.paused && stateRef.current.surahNum) {
        audioEl.play().catch(() => {});
      }
    };

    let wasPlayingOnHide = false;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasPlayingOnHide = !audioEl.paused;
      } else if (wasPlayingOnHide && audioEl.paused && !userPausedRef.current) {
        audioEl.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      delete (window as any).__noorKeepPlaying;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
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
