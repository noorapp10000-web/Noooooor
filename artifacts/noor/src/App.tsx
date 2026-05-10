import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";

import { BottomNav } from "@/components/layout/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { AudioProvider } from "@/contexts/AudioContext";
import { AppSettingsProvider, useAppSettings } from "@/contexts/AppSettingsContext";
import { SplashScreen } from "@/components/SplashScreen";

import { Login } from "@/pages/Login";

import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";
import { initUserSync, clearSyncState, getSettingCache } from "@/lib/rtdb";

// ── Lazy-loaded pages — each becomes its own JS chunk ────────────────────────
const Home           = lazy(() => import("@/pages/Home").then(m => ({ default: m.Home })));
const Quran          = lazy(() => import("@/pages/Quran").then(m => ({ default: m.Quran })));
const Azkar          = lazy(() => import("@/pages/Azkar").then(m => ({ default: m.Azkar })));
const Tasbih         = lazy(() => import("@/pages/Tasbih").then(m => ({ default: m.Tasbih })));
const Rankings       = lazy(() => import("@/pages/Rankings").then(m => ({ default: m.Rankings })));
const MoreMenu       = lazy(() => import("@/pages/MoreMenu").then(m => ({ default: m.MoreMenu })));
const Settings       = lazy(() => import("@/pages/Settings").then(m => ({ default: m.Settings })));
const Asma           = lazy(() => import("@/pages/Asma").then(m => ({ default: m.Asma })));
const Reciters       = lazy(() => import("@/pages/Reciters").then(m => ({ default: m.Reciters })));
const SpeedReader    = lazy(() => import("@/pages/SpeedReader").then(m => ({ default: m.SpeedReader })));
const EgyptianRadio  = lazy(() => import("@/pages/EgyptianRadio").then(m => ({ default: m.EgyptianRadio })));
const Qibla          = lazy(() => import("@/pages/Qibla").then(m => ({ default: m.Qibla })));
const Hadith         = lazy(() => import("@/pages/Hadith").then(m => ({ default: m.Hadith })));
const IslamicHistory = lazy(() => import("@/pages/IslamicHistory").then(m => ({ default: m.IslamicHistory })));
const ProphetStories = lazy(() => import("@/pages/ProphetStories").then(m => ({ default: m.ProphetStories })));
const IslamicQuizzes = lazy(() => import("@/pages/IslamicQuizzes").then(m => ({ default: m.IslamicQuizzes })));
const Sunnah         = lazy(() => import("@/pages/Sunnah").then(m => ({ default: m.Sunnah })));
const IslamicTV      = lazy(() => import("@/pages/IslamicTV").then(m => ({ default: m.IslamicTV })));
const VoiceComparison= lazy(() => import("@/pages/VoiceComparison").then(m => ({ default: m.VoiceComparison })));
const HifzTest       = lazy(() => import("@/pages/HifzTest").then(m => ({ default: m.HifzTest })));
// ─────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50dvh]">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileSnap = await get(ref(rtdb, `users/${user.uid}/profile`));
          if (profileSnap.exists()) {
            await initUserSync(user.uid);
            const theme = getSettingCache<'light' | 'dark'>('theme', 'light');
            document.documentElement.classList.toggle('dark', theme === 'dark');
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        } catch {
          setIsLoggedIn(false);
        }
      } else {
        clearSyncState();
        setIsLoggedIn(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      {splashDone && isLoggedIn === null && (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin mx-auto mb-4" />
            <span className="text-[#C19A6B] text-3xl" style={{ fontFamily: '"Amiri", serif' }}>نُور</span>
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
