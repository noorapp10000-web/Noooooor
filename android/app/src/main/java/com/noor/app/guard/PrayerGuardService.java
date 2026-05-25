package com.noor.app.guard;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.os.Handler;
import android.os.Looper;
import android.view.accessibility.AccessibilityEvent;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class PrayerGuardService extends AccessibilityService {

    private static final String OUR_PACKAGE = "com.noor.app";

    private static final String[] PRAYER_KEYS     = {"fajr", "dhuhr", "asr", "maghrib", "isha"};
    private static final String[] PRAYER_NAMES_AR = {"الفجر", "الظهر", "العصر", "المغرب", "العشاء"};

    private static final Set<String> SYSTEM_PKGS = new HashSet<>(Arrays.asList(
        "android",
        "com.android.systemui",
        "com.android.settings",
        "com.android.packageinstaller",
        "com.google.android.permissioncontroller",
        "com.android.inputmethod.latin",
        "com.samsung.android.inputmethod",
        "com.google.android.inputmethod.latin"
    ));

    private PrayerGuardOverlay overlay;
    private String             lastForegroundPkg = "";
    private String             launcherPkg       = "";
    private final Handler      handler           = new Handler(Looper.getMainLooper());
    private Runnable           pendingEval;

    @Override
    public void onServiceConnected() {
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes          = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType        = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags               = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS |
                                   AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        info.notificationTimeout = 100;
        setServiceInfo(info);

        overlay = new PrayerGuardOverlay(this, (prayerKey, dateKey) -> {
            PrayerGuardPrefs.setPrayed(PrayerGuardService.this, dateKey, prayerKey, true);
        });

        launcherPkg = detectLauncherPackage();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        CharSequence pkgSeq = event.getPackageName();
        if (pkgSeq == null) return;
        String pkg = pkgSeq.toString();

        if (SYSTEM_PKGS.contains(pkg)) return;

        if (pkg.equals(OUR_PACKAGE)) {
            cancelPending();
            handler.post(() -> overlay.hide());
            lastForegroundPkg = pkg;
            return;
        }

        if (isLauncherPkg(pkg)) {
            cancelPending();
            lastForegroundPkg = pkg;
            return;
        }

        if (pkg.equals(lastForegroundPkg)) return;
        lastForegroundPkg = pkg;

        cancelPending();
        pendingEval = () -> evaluateFor(pkg);
        handler.postDelayed(pendingEval, 400);
    }

    private void evaluateFor(String pkg) {
        if (!PrayerGuardPrefs.isEnabled(this)) {
            overlay.hide();
            return;
        }

        PrayerWindowInfo window = getCurrentPrayerWindow();
        if (window == null) {
            overlay.hide();
            return;
        }

        String dateKey = PrayerGuardPrefs.todayKey();
        if (PrayerGuardPrefs.hasPrayed(this, dateKey, window.key)) {
            overlay.hide();
            return;
        }

        overlay.show(window.nameAr, window.key, dateKey);
    }

    private void cancelPending() {
        if (pendingEval != null) {
            handler.removeCallbacks(pendingEval);
            pendingEval = null;
        }
    }

    private boolean isLauncherPkg(String pkg) {
        if (pkg.equals(launcherPkg)) return true;
        if (launcherPkg.isEmpty()) launcherPkg = detectLauncherPackage();
        return pkg.equals(launcherPkg);
    }

    private String detectLauncherPackage() {
        try {
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            List<ResolveInfo> list = getPackageManager()
                .queryIntentActivities(homeIntent, PackageManager.MATCH_DEFAULT_ONLY);
            if (list != null && !list.isEmpty()) {
                ResolveInfo ri = list.get(0);
                if (ri.activityInfo != null) return ri.activityInfo.packageName;
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
            DateComponents dc = DateComponents.from(new Date());
            PrayerTimes pt = new PrayerTimes(coords, dc, params);

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
        cancelPending();
        if (overlay != null) overlay.hide();
        super.onDestroy();
    }

    private static class PrayerWindowInfo {
        final String key;
        final String nameAr;
        PrayerWindowInfo(String k, String n) { key = k; nameAr = n; }
    }
}
