/**
 * Noor App — Startup Permissions Handler
 * Requests all required Android permissions on first launch after login.
 * Silently skipped in browser / dev mode.
 */

import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission } from './notifications';

const PERMISSIONS_REQUESTED_KEY = 'noor_permissions_requested';

/**
 * Request all app permissions upfront on first login.
 * Subsequent calls are skipped (once per install).
 */
export async function requestAllPermissionsOnce(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Only show the permissions dialog once per installation
  const alreadyRequested = localStorage.getItem(PERMISSIONS_REQUESTED_KEY) === '1';
  if (alreadyRequested) return;

  // Small delay so the UI is visible before dialogs appear
  await new Promise<void>(r => setTimeout(r, 1500));

  // 1. Notification permission (Android 13+ = API 33+)
  await requestNotificationPermission();

  // 2. Geolocation (for prayer times & Qibla) — triggers browser dialog
  try {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        { timeout: 8000 },
      );
    }
  } catch {}

  localStorage.setItem(PERMISSIONS_REQUESTED_KEY, '1');
  console.log('[Permissions] All permissions requested');
}

/** Force re-request permissions (call from settings if user denied before). */
export function resetPermissionsFlag(): void {
  localStorage.removeItem(PERMISSIONS_REQUESTED_KEY);
}
