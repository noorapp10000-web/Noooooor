import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function vibrateLight() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  } else if ('vibrate' in navigator) {
    navigator.vibrate(15);
  }
}

export async function vibrateReset() {
  if (Capacitor.isNativePlatform()) {
    await Haptics.notification({ type: NotificationType.Warning });
  } else if ('vibrate' in navigator) {
    navigator.vibrate([30, 20, 30]);
  }
}
