import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback } from "react";
import NotFound from "@/pages/not-found";

import { BottomNav } from "@/components/layout/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { AudioProvider } from "@/contexts/AudioContext";
import { AppSettingsProvider, useAppSettings } from "@/contexts/AppSettingsContext";
import { SplashScreen } from "@/components/SplashScreen";

import { Login } from "@/pages/Login";
import { Home } from "@/pages/Home";
import { Quran } from "@/pages/Quran";
import { Azkar } from "@/pages/Azkar";
import { Tasbih } from "@/pages/Tasbih";
import { Rankings } from "@/pages/Rankings";
import { MoreMenu } from "@/pages/MoreMenu";
import { Settings } from "@/pages/Settings";
import { Asma } from "@/pages/Asma";
import { Reciters } from "@/pages/Reciters";
import { SpeedReader } from "@/pages/SpeedReader";
import { EgyptianRadio } from "@/pages/EgyptianRadio";
import { Qibla } from "@/pages/Qibla";
import { Hadith } from "@/pages/Hadith";
import { IslamicHistory } from "@/pages/IslamicHistory";
import { ProphetStories } from "@/pages/ProphetStories";
import { IslamicQuizzes } from "@/pages/IslamicQuizzes";
import { Sunnah } from "@/pages/Sunnah";
import { IslamicTV } from "@/pages/IslamicTV";
import { VoiceComparison } from "@/pages/VoiceComparison";
import { HifzTest } from "@/pages/HifzTest";

import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";
import { initUserSyncFast, clearSyncState, getSettingCache } from "@/lib/rtdb";
import { requestAllPermissionsOnce } from "@/lib/permissions";

const queryClient = new QueryClient();

function GlobalBackground() {
  const { activeBgSrc } = useAppSettings();
  if (!activeBgSrc) return null;
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: `url(${activeBgSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.28)' }}
      />
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { hasBg } = useAppSettings();
  return (
    <div className={`min-h-[100dvh] ${hasBg ? 'bg-transparent' : 'bg-background'} text-foreground selection:bg-primary/30 relative`}>
      <div className="relative z-10">
        {children}
      </div>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}

function FullScreenShell({ children }: { children: React.ReactNode }) {
  const { hasBg } = useAppSettings();
  return (
    <div className={`min-h-[100dvh] ${hasBg ? 'bg-transparent' : 'bg-background'} text-foreground selection:bg-primary/30 relative`}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AppShell><Home /></AppShell>
      </Route>
      <Route path="/quran">
        <AppShell><Quran /></AppShell>
      </Route>
      <Route path="/azkar">
        <AppShell><Azkar /></AppShell>
      </Route>
      <Route path="/tasbih">
        <AppShell><Tasbih /></AppShell>
      </Route>
      <Route path="/ranking">
        <AppShell><Rankings /></AppShell>
      </Route>
      <Route path="/more">
        <AppShell><MoreMenu /></AppShell>
      </Route>
      <Route path="/settings">
        <AppShell><Settings /></AppShell>
      </Route>
      <Route path="/asma">
        <FullScreenShell><Asma /></FullScreenShell>
      </Route>
      <Route path="/reciters">
        <FullScreenShell><Reciters /></FullScreenShell>
      </Route>
      <Route path="/speed-reader">
        <FullScreenShell><SpeedReader /></FullScreenShell>
      </Route>
      <Route path="/radio">
        <FullScreenShell><EgyptianRadio /></FullScreenShell>
      </Route>
      <Route path="/qibla">
        <FullScreenShell><Qibla /></FullScreenShell>
      </Route>
      <Route path="/hadith">
        <FullScreenShell><Hadith /></FullScreenShell>
      </Route>
      <Route path="/history">
        <FullScreenShell><IslamicHistory /></FullScreenShell>
      </Route>
      <Route path="/prophets">
        <FullScreenShell><ProphetStories /></FullScreenShell>
      </Route>
      <Route path="/quizzes">
        <FullScreenShell><IslamicQuizzes /></FullScreenShell>
      </Route>
      <Route path="/sunnah">
        <FullScreenShell><Sunnah /></FullScreenShell>
      </Route>
      <Route path="/tv">
        <FullScreenShell><IslamicTV /></FullScreenShell>
      </Route>
      <Route path="/voice-comparison">
        <FullScreenShell><VoiceComparison /></FullScreenShell>
      </Route>
      <Route path="/hifz-test">
        <FullScreenShell><HifzTest /></FullScreenShell>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  return (
    <>
      <GlobalBackground />
      <Router />
    </>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
    document.documentElement.dir = 'rtl';
  }, []);

  const handleLoginComplete = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
  }, []);

  // Firebase Auth state observer — source of truth for login state
  useEffect(() => {
    // Global fallback: if Firebase auth never fires (extreme offline), unblock UI after 2.5s
    const globalTimer = setTimeout(() => {
      setIsLoggedIn(prev => {
        if (prev === null) return false;
        return prev;
      });
    }, 2500);

    const unsub = onAuthStateChanged(auth, async (user) => {
      clearTimeout(globalTimer);
      if (user) {
        // Check profile — with 4-second timeout for offline resilience
        const profileExists = await (async () => {
          try {
            const timeoutPromise = new Promise<boolean>((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 4000)
            );
            const rtdbPromise = get(ref(rtdb, `users/${user.uid}/profile`)).then(snap => snap.exists());
            return await Promise.race([rtdbPromise, timeoutPromise]);
          } catch {
            // Offline or timeout — check localStorage cache for profile
            try {
              const raw = localStorage.getItem(`noor_rtdb_cache_${user.uid}`);
              if (raw) {
                const cache = JSON.parse(raw);
                return !!(cache?.profile);
              }
            } catch {}
            return false;
          }
        })();

        if (profileExists) {
          // تحميل سريع من localStorage — بدون انتظار RTDB حتى لا تظهر شاشة التحميل
          initUserSyncFast(user.uid);
          const theme = getSettingCache<'light' | 'dark'>('theme', 'light');
          document.documentElement.classList.toggle('dark', theme === 'dark');
          setIsLoggedIn(true);
          requestAllPermissionsOnce();
        } else {
          setIsLoggedIn(false);
        }
      } else {
        clearSyncState();
        setIsLoggedIn(false);
      }
    });
    return () => { unsub(); clearTimeout(globalTimer); };
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      {splashDone && isLoggedIn === null && (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #F8EDD8 0%, #EAD9B5 50%, #F5ECD0 100%)' }}>
          <div className="text-center flex flex-col items-center gap-4">
            <div
              className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #F5E6CC, #E8D4A8)',
                boxShadow: '0 0 32px rgba(193,154,107,0.4)',
                border: '1.5px solid rgba(193,154,107,0.5)',
              }}
            >
              <img src="/logo.png" alt="نور" className="w-full h-full object-contain" style={{ padding: '4px' }} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl font-bold" style={{ fontFamily: '"Amiri", serif', background: 'linear-gradient(135deg, #e8c98a, #C19A6B, #a07840)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>نُور</span>
              <div className="w-8 h-8 border-[3px] border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin" />
            </div>
          </div>
        </div>
      )}

      {splashDone && isLoggedIn === false && (
        <QueryClientProvider client={queryClient}>
          <Login onComplete={handleLoginComplete} />
        </QueryClientProvider>
      )}

      {splashDone && isLoggedIn === true && (
        <QueryClientProvider client={queryClient}>
          <AppSettingsProvider>
            <AudioProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <AppContent />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </AudioProvider>
          </AppSettingsProvider>
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;
