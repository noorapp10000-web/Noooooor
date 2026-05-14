import { useState, useCallback } from 'react';
import { getSettingCache, queueSettingSync, getCurrentUid, getOrCreateLocalUid } from '@/lib/rtdb';

export function useUserSetting<T>(
  key: string,
  defaultVal: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => getSettingCache<T>(key, defaultVal));

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue(prev => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        const uid = getCurrentUid() || localStorage.getItem('noor_uid') || getOrCreateLocalUid();
        if (uid) queueSettingSync(uid, key, next);
        return next;
      });
    },
    [key],
  );

  return [value, set];
}
