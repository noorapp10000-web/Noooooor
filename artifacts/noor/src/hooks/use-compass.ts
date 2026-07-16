import { useState, useEffect, useRef } from 'react';

const LPF = 0.25;

function blendAngles(prev: number, next: number, alpha: number): number {
  let diff = next - prev;
  if (diff >  180) diff -= 360;
  if (diff < -180) diff += 360;
  return (prev + alpha * diff + 360) % 360;
}

function screenOrientationOffset(): number {
  if (window.screen?.orientation?.angle !== undefined) return window.screen.orientation.angle;
  const wo = (window as any).orientation;
  return typeof wo === 'number' ? ((wo % 360) + 360) % 360 : 0;
}

/** 'absolute' = معايَر على الشمال | 'relative' = نسبي | 'none' = لا يوجد */
export type CompassMode = 'absolute' | 'relative' | 'none';

export function useCompass() {
  const [heading,     setHeading]     = useState<number | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [mode,        setMode]        = useState<CompassMode>('none');

  const smoothed      = useRef<number | null>(null);
  const hasAbsolute   = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setIsSupported(false);
      setError('حساس البوصلة غير مدعوم في جهازك');
      return;
    }

    function applyAndSet(raw: number) {
      const next = smoothed.current === null ? raw : blendAngles(smoothed.current, raw, LPF);
      smoothed.current = next;
      setHeading(Math.round(next * 10) / 10);
    }

    /**
     * deviceorientationabsolute — Android/Chrome.
     * نقبل أي حدث من هذا النوع بـ alpha صالح (حتى لو absolute=false)
     * لأن اسم الحدث نفسه يعني أنه مرتبط بالشمال على Android.
     */
    const handleAbsolute = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || isNaN(e.alpha as number)) return;

      hasAbsolute.current = true;
      if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
      setMode('absolute');
      setError(null);

      if ((e as any).webkitCompassHeading != null) {
        applyAndSet(((e as any).webkitCompassHeading + screenOrientationOffset()) % 360);
        return;
      }
      // alpha قياس CCW من الشمال → نعكسه لـ CW
      applyAndSet((360 - (e.alpha as number) + screenOrientationOffset()) % 360);
    };

    /**
     * deviceorientation — كل المنصات.
     * نستخدمه فقط لـ iOS webkitCompassHeading هنا.
     * الـ fallback للـ relative alpha يُعالَج في activateRelativeFallback.
     */
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (hasAbsolute.current) return;
      if ((e as any).webkitCompassHeading != null) {
        hasAbsolute.current = true;
        if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }
        setMode('absolute');
        setError(null);
        applyAndSet(((e as any).webkitCompassHeading + screenOrientationOffset()) % 360);
      }
    };

    /**
     * Fallback بعد 3 ثواني: لو لم يصل أي absolute heading،
     * نستخدم alpha النسبي مع تحذير للمستخدم.
     */
    const activateRelativeFallback = () => {
      if (hasAbsolute.current) return;

      const handleRelative = (e: DeviceOrientationEvent) => {
        if (hasAbsolute.current) return;
        if (e.alpha === null || isNaN(e.alpha as number)) return;
        setMode('relative');
        applyAndSet((360 - (e.alpha as number) + screenOrientationOffset()) % 360);
      };

      setError('البوصلة في وضع تقريبي — حرّك الجهاز على شكل 8 لمعايرة المغناطيس');
      window.addEventListener('deviceorientation', handleRelative as EventListener, true);
    };

    fallbackTimer.current = setTimeout(activateRelativeFallback, 3000);

    window.addEventListener('deviceorientationabsolute', handleAbsolute    as EventListener, true);
    window.addEventListener('deviceorientation',         handleOrientation  as EventListener, true);

    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      window.removeEventListener('deviceorientationabsolute', handleAbsolute   as EventListener, true);
      window.removeEventListener('deviceorientation',         handleOrientation as EventListener, true);
    };
  }, []);

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        if (result !== 'granted') setError('لم يتم منح الإذن للوصول للبوصلة');
      } catch {
        setError('حدث خطأ أثناء طلب الإذن');
      }
    }
  };

  return { heading, error, isSupported, mode, requestPermission };
}
