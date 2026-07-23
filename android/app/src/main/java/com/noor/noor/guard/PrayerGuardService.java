package com.noor.noor.guard;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.view.accessibility.AccessibilityEvent;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.util.Date;
import java.util.List;

public class PrayerGuardService extends AccessibilityService {

    private static final String OUR_PACKAGE = "com.noor.noor";

    private static final String[] PRAYER_KEYS     = {"fajr", "dhuhr", "asr", "maghrib", "isha"};
    private static final String[] PRAYER_NAMES_AR = {"الفجر", "الظهر", "العصر", "المغرب", "العشاء"};

    private PrayerGuardOverlay overlay;
    private String             launcherPkg  = "";
    private String             lastShownPkg = "";

    @Override
    public void onServiceConnected() {
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes          = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType        = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.notificationTimeout = 200;
        setServiceInfo(info);

        launcherPkg = detectLauncherPackage();

        overlay = new PrayerGuardOverlay(this, (prayerKey, dateKey) -> {
            PrayerGuardPrefs.setPrayed(PrayerGuardService.this, dateKey, prayerKey, true);
            lastShownPkg = "";
        });
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        // If overlay is already visible — do nothing at all, let it stay
        if (overlay != null && overlay.isShowing()) return;

        // Do not access the foreground app identity unless the optional feature
        // is enabled and a prayer reminder is currently needed.
        if (!PrayerGuardPrefs.isEnabled(this)) return;

        PrayerWindowInfo window = getCurrentPrayerWindow();
        if (window == null) return;

        String dateKey = PrayerGuardPrefs.todayKey();
        if (PrayerGuardPrefs.hasPrayed(this, dateKey, window.key)) return;

        CharSequence pkgSeq = event.getPackageName();
        if (pkgSeq == null) return;
        String pkg = pkgSeq.toString();

        // Ignore our own app, the launcher, and anything that is not a real app window
        if (pkg.equals(OUR_PACKAGE)) return;
        if (pkg.equals(launcherPkg)) return;
        if (isSystemPackage(pkg)) return;

        // Same app still in foreground — don't re-trigger
        if (pkg.equals(lastShownPkg)) return;

        // A genuinely new app was opened — check once
        lastShownPkg = pkg;

        overlay.show(window.nameAr, window.key, dateKey);
    }

    private boolean isSystemPackage(String pkg) {
        if (pkg.startsWith("android")) return true;
        if (pkg.startsWith("com.android.")) return true;
        if (pkg.startsWith("com.google.android.inputmethod")) return true;
        if (pkg.startsWith("com.samsung.android.inputmethod")) return true;
        return false;
    }

    private String detectLauncherPackage() {
        try {
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            List<ResolveInfo> list = getPackageManager()
                .queryIntentActivities(homeIntent, PackageManager.MATCH_DEFAULT_ONLY);
            if (list != null && !list.isEmpty() && list.get(0).activityInfo != null) {
                return list.get(0).activityInfo.packageName;
            }
        } catch (Exception ignored) {}
        return "";
    }

    private PrayerWindowInfo getCurrentPrayerWindow() {
        try {
            SharedPreferences prefs = getSharedPreferences("NoorWidget", MODE_PRIVATE);
            float lat = prefs.getFloat("lat", Float.MIN_VALUE);
            float lng = prefs.getFloat("lng", Float.MIN_VALUE);
            if (lat == Float.MIN_VALUE) return null;

            Coordinates coords = new Coordinates(lat, lng);
            CalculationParameters params = CalculationMethod.EGYPTIAN.getParameters();
            PrayerTimes pt = new PrayerTimes(coords, DateComponents.from(new Date()), params);

            long now = System.currentTimeMillis();
            Date[] times = {pt.fajr, pt.dhuhr, pt.asr, pt.maghrib, pt.isha};

            for (int i = 0; i < times.length; i++) {
                long start = times[i].getTime();
                long end   = start + PrayerGuardPrefs.PRAYER_WINDOW_MS;
                if (now >= start && now < end) {
                    return new PrayerWindowInfo(PRAYER_KEYS[i], PRAYER_NAMES_AR[i]);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Override
    public void onInterrupt() {
        if (overlay != null) overlay.hide();
    }

    @Override
    public void onDestroy() {
        if (overlay != null) overlay.hide();
        super.onDestroy();
    }

    private static class PrayerWindowInfo {
        final String key, nameAr;
        PrayerWindowInfo(String k, String n) { key = k; nameAr = n; }
    }
}
