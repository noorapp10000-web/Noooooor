import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getSettingCache, queueSettingSync, getCurrentUid, getOrCreateLocalUid } from '@/lib/rtdb';

import bg1 from '@assets/IMG-20260401-WA0004_1775009490731.jpg';
import bg2 from '@assets/the-most-important-religious-and-historical-monuments-in-medin_1775009490792.jpg';
import bg3 from '@assets/206_1775009490804.jpg';
import bg4 from '@assets/a578a280e7356a625fd94fc7da3b31dd_1775009490816.jpg';
import bg5 from '@assets/masjid_haram_1775009490829.jpg';
import bg6 from '@assets/558c82d32c077684789946b614f3d9e5_1775009490844.jpg';

export const PRESET_BACKGROUNDS = [
  { id: 'bg1', src: bg1, label: 'قبة الصخرة' },
  { id: 'bg2', src: bg2, label: 'المسجد النبوي' },
  { id: 'bg3', src: bg3, label: 'مكة الليل' },
  { id: 'bg4', src: bg4, label: 'الكعبة المشرفة' },
  { id: 'bg5', src: bg5, label: 'المسجد الحرام' },
  { id: 'bg6', src: bg6, label: 'ساعة مكة' },
] as const;

export type BgType = 'none' | 'preset' | 'custom';

interface AppSettings {
  bgType: BgType; bgPreset: string; bgCustom: string;
  appFontScale: number; cardOpacity: number;
  setBgType: (v: BgType) => void; setBgPreset: (v: string) => void;
  setBgCustom: (v: string) => void; setAppFontScale: (v: number) => void;
  setCardOpacity: (v: number) => void;
  activeBgSrc: string | null; hasBg: boolean;
}

const AppSettingsContext = createContext<AppSettings | null>(null);

function getUid() {
  return getCurrentUid() || localStorage.getItem('noor_uid') || getOrCreateLocalUid();
}

function saveSetting(key: string, value: unknown) {
  const uid = getUid();
  if (uid) queueSettingSync(uid, key, value);
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [bgType, setBgTypeState] = useState<BgType>(() => getSettingCache<BgType>('app_bg_type', 'none'));
  const [bgPreset, setBgPresetState] = useState<string>(() => getSettingCache<string>('app_bg_preset', 'bg1'));
  const [bgCustom, setBgCustomState] = useState<string>(() => {
    try { return localStorage.getItem('app_bg_custom') ?? ''; } catch { return ''; }
  });
  const [appFontScale, setAppFontScaleState] = useState<number>(() => getSettingCache<number>('app_font_scale', 1));
  const [cardOpacity, setCardOpacityState] = useState<number>(() => getSettingCache<number>('app_card_opacity', 0.92));

  const setBgType = (v: BgType) => { setBgTypeState(v); saveSetting('app_bg_type', v); };
  const setBgPreset = (v: string) => { setBgPresetState(v); saveSetting('app_bg_preset', v); };
  const setBgCustom = (v: string) => {
    setBgCustomState(v);
    try { localStorage.setItem('app_bg_custom', v); } catch {}
  };
  const setAppFontScale = (v: number) => { setAppFontScaleState(v); saveSetting('app_font_scale', v); };
  const setCardOpacity = (v: number) => { setCardOpacityState(v); saveSetting('app_card_opacity', v); };

  const activeBgSrc: string | null = (() => {
    if (bgType === 'preset') return PRESET_BACKGROUNDS.find(b => b.id === bgPreset)?.src ?? null;
    if (bgType === 'custom' && bgCustom) return bgCustom;
    return null;
  })();

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-scale', String(appFontScale));
    document.documentElement.style.fontSize = `${appFontScale}rem`;
    return () => { document.documentElement.style.fontSize = ''; };
  }, [appFontScale]);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-card-opacity', String(cardOpacity));
  }, [cardOpacity]);

  const hasBg = activeBgSrc !== null;

  return (
    <AppSettingsContext.Provider value={{ bgType, bgPreset, bgCustom, appFontScale, cardOpacity, setBgType, setBgPreset, setBgCustom, setAppFontScale, setCardOpacity, activeBgSrc, hasBg }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used inside AppSettingsProvider');
  return ctx;
}
