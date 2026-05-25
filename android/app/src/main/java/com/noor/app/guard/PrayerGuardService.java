package com.noor.app.guard;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;

import com.batoulapps.adhan.CalculationMethod;
import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.util.Date;

public class PrayerGuardService extends AccessibilityService {

    private static final String OUR_PACKAGE = "com.noor.app";

    private static final String[] PRAYER_KEYS    = {"fajr", "dhuhr", "asr", "maghrib", "isha"};
    private static final String[] PRAYER_NAMES_AR = {"الفجر", "الظهر", "العصر", "المغرب", "العشاء"};

    private PrayerGuardOverlay overlay;
    private String             lastPkg = "";

    @Override
    public void onServiceConnected() {
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes   = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags        = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS |
                            AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        info.notificationTimeout = 100;
        setServiceInfo(info);

        overlay = new PrayerGuardOverlay(this, (prayerKey, dateKey) -> {
            PrayerGuardPrefs.setPrayed(PrayerGuardService.this, dateKey, prayerKey, true);
        });
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        CharSequence pkgSeq = event.getPackageName();
        if (pkgSeq == null) return;
        String pkg = pkgSeq.toString();

        if (pkg.equals(lastPkg)) return;
        lastPkg = pkg;

        if (pkg.equals(OUR_PACKAGE)) {
            overlay.hide();
            return;
        }

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

    @Override
    public void onInterrupt() {
        if (overlay != null) overlay.hide();
    }

    @Override
    public void onDestroy() {
        if (overlay != null) overlay.hide();
        super.onDestroy();
    }

    private PrayerWindowInfo getCurrentPrayerWindow() {
        try {
            SharedPreferences widgetPrefs = getSharedPreferences("NoorWidget", MODE_PRIVATE);
            float lat = widgetPrefs.getFloat("lat", Float.MIN_VALUE);
            float lng = widgetPrefs.getFloat("lng", Float.MIN_VALUE);
            if (lat == Float.MIN_VALUE) return null;

            Coordinates coords = new Coordinates(lat, lng);
            CalculationParameters params = CalculationMethod.EGYPTIAN.getParameters();
            DateComponents dc = DateComponents.from(new Date());
            PrayerTimes pt = new PrayerTimes(coords, dc, params);

            long now = System.currentTimeMillis();
            Date[] times = {pt.fajr, pt.dhuhr, pt.asr, pt.maghrib, pt.isha};

            for (int i = 0; i < times.length; i++) {
                long prayerMs  = times[i].getTime();
                long windowEnd = prayerMs + PrayerGuardPrefs.PRAYER_WINDOW_MS;
                if (now >= prayerMs && now < windowEnd) {
                    return new PrayerWindowInfo(PRAYER_KEYS[i], PRAYER_NAMES_AR[i]);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static class PrayerWindowInfo {
        final String key;
        final String nameAr;
        PrayerWindowInfo(String key, String nameAr) {
            this.key    = key;
            this.nameAr = nameAr;
        }
    }
}
