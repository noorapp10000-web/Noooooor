import { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

// ─── Capacitor Geolocation (native Android/iOS) ────────────────────────────
async function getNativeGeo() {
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    return Geolocation;
  } catch {
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGeolocation(autoRequest = true) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoRequest);

  const capWatchId  = useRef<string | null>(null);   // Capacitor watch ID
  const webWatchId  = useRef<number | null>(null);   // Browser watch ID

  // ── Stop any active watches ──────────────────────────────────────────────
  const stopWatch = async () => {
    if (capWatchId.current !== null) {
      const Geo = await getNativeGeo();
      if (Geo) {
        try { await Geo.clearWatch({ id: capWatchId.current }); } catch {}
      }
      capWatchId.current = null;
    }
    if (webWatchId.current !== null) {
      navigator.geolocation?.clearWatch(webWatchId.current);
      webWatchId.current = null;
    }
  };

  // ── Main location request function ───────────────────────────────────────
  const requestLocation = async () => {
    setIsLoading(true);
    setError(null);

    if (Capacitor.isNativePlatform()) {
      // ── Native Android/iOS: use @capacitor/geolocation ─────────────────
      const Geo = await getNativeGeo();
      if (!Geo) {
        setError('خدمة الموقع غير متاحة');
        setIsLoading(false);
        return;
      }

      try {
        // 1. Request permission — shows Android permission dialog
        const perm = await Geo.requestPermissions({ permissions: ['location'] });
        const granted = perm.location === 'granted' || (perm.location as string) === 'limited';
        if (!granted) {
          setError('الرجاء السماح للتطبيق بالوصول للموقع من الإعدادات');
          setIsLoading(false);
          return;
        }

        // 2. Get a quick fix first (shows loading spinner briefly)
        const pos = await Geo.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 20000,
        });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);

        // 3. Keep watching for live updates (Qibla compass accuracy)
        await stopWatch();
        capWatchId.current = await Geo.watchPosition(
          { enableHighAccuracy: true },
          (position, err) => {
            if (err || !position) return;
            setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
        );
      } catch (e: any) {
        const msg = e?.message ?? '';
        if (msg.includes('denied') || msg.includes('permission')) {
          setError('تم رفض إذن الموقع. افتح الإعدادات وفعّل الموقع لتطبيق نُور.');
        } else if (msg.includes('timeout')) {
          setError('انتهت مهلة تحديد الموقع. تأكد من تفعيل GPS ثم حاول مجدداً.');
        } else {
          setError('لم نتمكن من تحديد موقعك. تأكد من تفعيل خدمة الموقع.');
        }
        setIsLoading(false);
      }
    } else {
      // ── Web browser: use navigator.geolocation ──────────────────────────
      if (!navigator.geolocation) {
        setError('خدمة الموقع غير مدعومة في متصفحك');
        setIsLoading(false);
        return;
      }

      await stopWatch();

      const onSuccess = (position: GeolocationPosition) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setError(null);
        setIsLoading(false);
      };

      const onError = (err: GeolocationPositionError) => {
        if (err.code === 1) {
          setError('تم رفض إذن الموقع. تأكد من إعدادات المتصفح.');
        } else if (err.code === 2) {
          setError('تعذّر تحديد موقعك. تأكد من تفعيل GPS.');
        } else {
          setError('انتهت مهلة تحديد الموقع. حاول مجدداً.');
        }
        setIsLoading(false);
      };

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      };

      webWatchId.current = navigator.geolocation.watchPosition(onSuccess, onError, options);
    }
  };

  useEffect(() => {
    if (autoRequest) requestLocation();
    return () => { stopWatch(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { coords, error, isLoading, requestLocation };
}

/* ── Great-circle distance (Haversine) — returns km ── */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Qibla bearing from (lat, lng) toward the Kaaba ── */
export function calculateQibla(lat: number, lng: number): number {
  const MAKKAH_LAT = 21.422487;
  const MAKKAH_LNG = 39.826206;
  const lat1  = (lat         * Math.PI) / 180;
  const lat2  = (MAKKAH_LAT  * Math.PI) / 180;
  const dLng  = ((MAKKAH_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
