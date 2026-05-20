import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
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
import { BatteryOptPrompt } from "@/components/BatteryOptPrompt";
import { TutorialMascot } from "@/components/TutorialMascot";

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

import {
  initUserSyncFast,
  getSettingCache,
  getOrCreateLocalUid,
  getProfileCache,
} from "@/lib/rtdb";
import { scheduleAllNotifications, setupNotificationTapHandler } from "@/lib/notifications";
import { Capacitor } from "@capacitor/core";
import NoorWidget from "@/lib/widget-bridge";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.28)' }} />
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { hasBg } = useAppSettings();
  return (
    <div
      className={`min-h-[100dvh] ${hasBg ? 'bg-transparent' : 'bg-background'} text-foreground selection:bg-primary/30 relative`}
    >
      <div className="relative z-10">{children}</div>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}

function FullScreenShell({ children }: { children: React.ReactNode }) {
  const { hasBg } = useAppSettings();
  return (
    <div
      className={`min-h-[100dvh] ${hasBg ? 'bg-transparent' : 'bg-background'} text-foreground selection:bg-primary/30 relative`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function NotificationTapHandler() {
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    setupNotificationTapHandler((route) => navigate(route));
  }, [navigate]);
  return null;
}

function Router() {
  return (
    <>
    <NotificationTapHandler />
    <TutorialMascot />
    <Switch>
      <Route path="/"><AppShell><Home /></AppShell></Route>
      <Route path="/quran"><AppShell><Quran /></AppShell></Route>
      <Route path="/azkar"><AppShell><Azkar /></AppShell></Route>
      <Route path="/tasbih"><AppShell><Tasbih /></AppShell></Route>
      <Route path="/ranking"><AppShell><Rankings /></AppShell></Route>
      <Route path="/more"><AppShell><MoreMenu /></AppShell></Route>
      <Route path="/settings"><AppShell><Settings /></AppShell></Route>
      <Route path="/asma"><FullScreenShell><Asma /></FullScreenShell></Route>
      <Route path="/reciters"><FullScreenShell><Reciters /></FullScreenShell></Route>
      <Route path="/speed-reader"><FullScreenShell><SpeedReader /></FullScreenShell></Route>
      <Route path="/radio"><FullScreenShell><EgyptianRadio /></FullScreenShell></Route>
      <Route path="/qibla"><FullScreenShell><Qibla /></FullScreenShell></Route>
      <Route path="/hadith"><FullScreenShell><Hadith /></FullScreenShell></Route>
      <Route path="/history"><FullScreenShell><IslamicHistory /></FullScreenShell></Route>
      <Route path="/prophets"><FullScreenShell><ProphetStories /></FullScreenShell></Route>
      <Route path="/quizzes"><FullScreenShell><IslamicQuizzes /></FullScreenShell></Route>
      <Route path="/sunnah"><FullScreenShell><Sunnah /></FullScreenShell></Route>
      <Route path="/tv"><FullScreenShell><IslamicTV /></FullScreenShell></Route>
      <Route path="/voice-comparison"><FullScreenShell><VoiceComparison /></FullScreenShell></Route>
      <Route path="/hifz-test"><FullScreenShell><HifzTest /></FullScreenShell></Route>
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function syncWidgetTheme() {
  if (!Capacitor.isNativePlatform()) return;
  const isDark = document.documentElement.classList.contains('dark');
  NoorWidget.setTheme({ theme: isDark ? 'dark' : 'light' }).catch(() => {});
}

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Global error shield — prevent uncaught errors from crashing WebView
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      event.preventDefault();
      console.error('[noor] uncaught error:', event.error ?? event.message);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      console.error('[noor] unhandled rejection:', event.reason);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // Watch for dark-class changes on <html> and sync widget theme
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const observer = new MutationObserver(() => syncWidgetTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
    document.documentElement.dir = 'rtl';
  }, []);

  const handleLoginComplete = useCallback(() => {
    const uid = getOrCreateLocalUid();
    initUserSyncFast(uid);
    const theme = getSettingCache<'light' | 'dark'>('theme', 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setIsLoggedIn(true);
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => {
        syncWidgetTheme();
        const profile = getProfileCache();
        if (profile?.lat && profile?.lng) {
          scheduleAllNotifications(profile.lat, profile.lng).catch(() => {});
        }
      }, 2000);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
  }, []);

  useEffect(() => {
    const uid = localStorage.getItem('noor_uid');
    if (uid) {
      initUserSyncFast(uid);
      const profile = getProfileCache();
      if (profile?.governorateId) {
        const theme = getSettingCache<'light' | 'dark'>('theme', 'light');
        document.documentElement.classList.toggle('dark', theme === 'dark');
        setIsLoggedIn(true);
        if (Capacitor.isNativePlatform()) {
          setTimeout(() => {
            syncWidgetTheme();
            if (profile.lat && profile.lng) {
              scheduleAllNotifications(profile.lat, profile.lng).catch(() => {});
            }
          }, 3000);
        }
      } else {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Listen for governorate changes and reschedule notifications
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handler = () => {
      const profile = getProfileCache();
      if (profile?.lat && profile?.lng) {
        scheduleAllNotifications(profile.lat, profile.lng).catch(() => {});
      }
    };
    window.addEventListener('noor:profile-updated', handler);
    return () => window.removeEventListener('noor:profile-updated', handler);
  }, []);

  const LoadingScreen = (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #F8EDD8 0%, #EAD9B5 50%, #F5ECD0 100%)' }}
    >
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
          <span
            className="text-3xl font-bold"
            style={{
              fontFamily: '"Amiri", serif',
              background: 'linear-gradient(135deg, #e8c98a, #C19A6B, #a07840)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            نُور
          </span>
          <div className="w-8 h-8 border-[3px] border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      {splashDone && isLoggedIn === null && LoadingScreen}
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
                  <>
                    <GlobalBackground />
                    <Router />
                  </>
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </AudioProvider>
          </AppSettingsProvider>
          <BatteryOptPrompt />
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;
