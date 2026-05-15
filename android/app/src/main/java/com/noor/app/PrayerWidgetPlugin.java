package com.noor.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin bridge — called by the React app.
 *
 * Methods:
 *  updateWidget(lat, lng)                     — update location, recalc widget + notifications
 *  updateNotificationSettings(enabled, minutesBefore, prayers[6])
 *                                              — sync notification settings from JS to Android
 *  isSupported()                              — returns {supported: true}
 */
@CapacitorPlugin(name = "PrayerWidget")
public class PrayerWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidget(PluginCall call) {
        Context           context = getContext();
        SharedPreferences prefs   = context.getSharedPreferences(
            PrayerWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE
        );

        Double lat = call.getDouble("lat");
        Double lng = call.getDouble("lng");

        if (lat != null && lng != null) {
            prefs.edit()
                .putLong("widget_lat", Double.doubleToLongBits(lat))
                .putLong("widget_lng", Double.doubleToLongBits(lng))
                .apply();
        }

        // Recalculate widget + reschedule notifications
        WidgetUpdateReceiver.recalcAndUpdate(context);
        WidgetAlarmManager.scheduleNext(context);
        // Also reschedule notifications from fresh prefs (location may have changed)
        PrayerNotificationScheduler.scheduleAllFromPrefs(context);

        call.resolve();
    }

    /**
     * Called from Settings page whenever notification settings change.
     * Persists to SharedPreferences and immediately reschedules alarms.
     *
     * Expected call params:
     *   enabled       boolean
     *   minutesBefore int
     *   prayers       [boolean × 6]  index 0=Fajr 1=Sunrise 2=Dhuhr 3=Asr 4=Maghrib 5=Isha
     */
    @PluginMethod
    public void updateNotificationSettings(PluginCall call) {
        Context context = getContext();

        Boolean enabled       = call.getBoolean("enabled", true);
        Integer minutesBefore = call.getInt("minutesBefore", 10);

        boolean[] prayerEnabled = { true, false, true, true, true, true }; // defaults
        try {
            JSArray prayers = call.getArray("prayers");
            if (prayers != null) {
                for (int i = 0; i < Math.min(6, prayers.length()); i++) {
                    prayerEnabled[i] = prayers.toList().get(i) instanceof Boolean
                        ? (Boolean) prayers.toList().get(i)
                        : Boolean.parseBoolean(String.valueOf(prayers.toList().get(i)));
                }
            }
        } catch (Exception ignored) {}

        PrayerNotificationScheduler.saveSettings(
            context,
            enabled  != null && enabled,
            minutesBefore != null ? minutesBefore : 10,
            prayerEnabled
        );

        // Reschedule (or cancel) alarms immediately
        if (enabled != null && enabled) {
            PrayerNotificationScheduler.scheduleAllFromPrefs(context);
        } else {
            PrayerNotificationScheduler.cancelAll(context);
        }

        call.resolve();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true);
        call.resolve(result);
    }
}
