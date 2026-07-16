---
name: Android prayer widget service throttling
description: Why the widget's 1-second tick loop was split into light/full updates, and the Android 14 FGS timeout risk for long-running widget services.
---

The widget's foreground service (`PrayerWidgetService`) ticks every 1 second to show a live countdown. Two real defects existed here:

1. **Full sky re-render every tick.** `SkyBitmapRenderer.render()` redraws the entire canvas (thousands of draw calls) on every call, even though it already caches astronomical positions per-minute internally. Calling it every second (rather than relying on that internal per-minute cache) wasted CPU/battery and churned large ARGB_8888 bitmaps constantly. Fix: the service now only does a full `performUpdate()` (sky redraw + prayer-time recalculation) every 15s (`FULL_UPDATE_INTERVAL_MS`), and every other second does a cheap `performLightTick()` that just recomputes the countdown from a cached `PrayerState` and calls `partiallyUpdateAppWidget` with only the counter text views.
   **Why:** any future change to the sky renderer or tick loop must preserve this split, or the battery/perf regression comes back.

2. **Android 14+ (API 34) foreground service timeout.** `foregroundServiceType="dataSync"` services get force-stopped by the system after ~6 hours in a rolling 24h window via `Service.onTimeout(int, int)` — if unhandled, the widget silently stops updating until the app is reopened. Fix: override `onTimeout()` (`@RequiresApi(UPSIDE_DOWN_CAKE)`) to call `WidgetRefreshReceiver.schedule()` (the AlarmManager fallback) and `stopSelf()`, so the service cleanly restarts within 30s instead of dying silently.
   **How to apply:** any Android 14+ long-running FGS in this app needs an `onTimeout` handler if it can run longer than a few hours — don't assume `START_STICKY` alone keeps it alive.

Also fixed: `SkyBitmapRenderer.refractionCorrection()` used a naive `1.02/(60*tan(alt))` formula with a hard cutoff at 0.5° that caused a visible jump in sun/moon position near the horizon. Replaced with Bennett's formula (continuous, no discontinuity).
