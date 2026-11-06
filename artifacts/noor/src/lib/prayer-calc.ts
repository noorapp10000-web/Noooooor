import { CalculationMethod, Madhab, type CalculationParameters } from 'adhan';
import { getSettingCache } from './rtdb';

export const CALC_METHODS = [
  { id: 'Egyptian', label: 'الهيئة المصرية العامة للمساحة' },
  { id: 'UmmAlQura', label: 'أم القرى — مكة المكرمة' },
  { id: 'MuslimWorldLeague', label: 'رابطة العالم الإسلامي' },
  { id: 'Karachi', label: 'جامعة العلوم الإسلامية — كراتشي' },
  { id: 'Dubai', label: 'دبي' },
  { id: 'Kuwait', label: 'الكويت' },
  { id: 'Qatar', label: 'قطر' },
  { id: 'Turkey', label: 'رئاسة الشؤون الدينية — تركيا' },
  { id: 'NorthAmerica', label: 'الجمعية الإسلامية لأمريكا الشمالية' },
] as const;

export type CalcMethodId = typeof CALC_METHODS[number]['id'];
export type MadhabId = 'shafi' | 'hanafi';

export const CALC_METHOD_KEY = 'prayer_calc_method';
export const MADHAB_KEY = 'prayer_madhab';

/** Prayer-time parameters chosen in Settings (Egyptian authority + Shafi'i Asr by default). */
export function getCalcParams(): CalculationParameters {
  const id = getSettingCache<CalcMethodId>(CALC_METHOD_KEY, 'Egyptian');
  const factory = (CalculationMethod as unknown as Record<string, () => CalculationParameters>)[id] ?? CalculationMethod.Egyptian;
  const params = factory();
  params.madhab = getSettingCache<MadhabId>(MADHAB_KEY, 'shafi') === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return params;
}

/** Drop cached daily prayer times so the next read recomputes them with the new method. */
export function clearPrayerTimesCache(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('noor_pt')) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}
