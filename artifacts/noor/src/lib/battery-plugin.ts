import { registerPlugin } from '@capacitor/core';

export interface BatteryOptPlugin {
  isIgnoring(): Promise<{ ignoring: boolean }>;
  requestIgnore(): Promise<void>;
  openBatterySettings(): Promise<void>;
}

const BatteryOpt = registerPlugin<BatteryOptPlugin>('BatteryOpt', {
  web: {
    async isIgnoring() { return { ignoring: true }; },
    async requestIgnore() {},
    async openBatterySettings() {},
  } as BatteryOptPlugin,
});

export default BatteryOpt;
