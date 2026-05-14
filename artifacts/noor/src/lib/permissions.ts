/**
 * Noor App — Startup Permissions Handler
 * Requests all required Android permissions after first login.
 * Silently skipped in browser / dev mode.
 */

import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission } from './notifications';

/**
 * Request notification and location permissions.
 * Called once after login — shows dialogs if not yet granted.
 * Uses a localStorage flag so dialogs only show ONCE per install.
 */
export async function requestAllPermissionsOnce(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const PERM_KEY = 'noor_permissions_v2';
  const done = localStorage.getItem(PERM_KEY) === '1';
  if (done) return;

  // Small delay so the app UI is visible before dialogs appear
  await new Promise<void>(r => setTimeout(r, 1800));

  // 1. Notification permission (Android 13+ = API 33+)
  try {
    await requestNotificationPermission();
  } catch {}

  // 2. Location permission — handled properly by @capacitor/geolocation
  // The Qibla/prayer pages call requestLocation() themselves.
  // We just mark as done so we don't spam the user on every open.

  localStorage.setItem(PERM_KEY, '1');
  console.log('[Permissions] Startup permissions requested');
}

/**
 * Force re-request permissions on next app open.
 * Call this from Settings when the user taps "طلب الإذن مجدداً".
 */
export function resetPermissionsFlag(): void {
  localStorage.removeItem('noor_permissions_v2');
}
