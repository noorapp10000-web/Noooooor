import { registerPlugin } from '@capacitor/core';

export interface NoorGuardPlugin {
  setEnabled(options: { enabled: boolean }): Promise<void>;
  isEnabled(): Promise<{ enabled: boolean }>;
  setPrayedStatus(options: { date: string; prayer: string; prayed: boolean }): Promise<void>;
  checkPermissions(): Promise<{ overlay: boolean; accessibility: boolean }>;
  requestOverlayPermission(): Promise<void>;
  requestAccessibilityPermission(): Promise<void>;
}

const NoorGuard = registerPlugin<NoorGuardPlugin>('NoorGuard', {
  web: {
    async setEnabled() {},
    async isEnabled() { return { enabled: false }; },
    async setPrayedStatus() {},
    async checkPermissions() { return { overlay: false, accessibility: false }; },
    async requestOverlayPermission() {},
    async requestAccessibilityPermission() {},
  } as NoorGuardPlugin,
});

export default NoorGuard;
