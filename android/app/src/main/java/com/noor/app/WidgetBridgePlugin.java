package com.noor.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.noor.app.widget.PrayerWidget;
import com.noor.app.widget.PrayerWidgetService;

/**
 * Capacitor bridge — receives lat/lng + city name from the JS layer and stores
 * them in SharedPreferences so the widget foreground service can:
 *   • Calculate prayer times via adhan (no internet needed)
 *   • Display the city name (📍 القاهرة)
 *
 * Call from JavaScript:
 *   const { NoorWidget } = Plugins;
 *   await NoorWidget.setPrayerTimes({ lat: 30.0, lng: 31.2, city: "القاهرة" });
 *
 * The setTheme() method is kept for backward compatibility but has no visual
 * effect — the widget now uses a fixed glassmorphism style.
 */
@CapacitorPlugin(name = "NoorWidget")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void setPrayerTimes(PluginCall call) {
        Float lat = call.getFloat("lat");
        Float lng = call.getFloat("lng");

        if (lat == null || lng == null) {
            call.reject("Missing required lat/lng coordinates");
            return;
        }

        String city = call.getString("city", "");

        SharedPreferences prefs = getContext().getSharedPreferences(
            PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE
        );
        prefs.edit()
            .putFloat(PrayerWidgetService.KEY_LAT,  lat)
            .putFloat(PrayerWidgetService.KEY_LNG,  lng)
            .putString(PrayerWidgetService.KEY_CITY, city != null ? city : "")
            .putLong("savedAt", System.currentTimeMillis())
            .apply();

        triggerWidgetUpdate();
        call.resolve();
    }

    @PluginMethod
    public void setTheme(PluginCall call) {
        // Kept for backward compatibility — glassmorphism style is fixed.
        String theme = call.getString("theme", "light");
        SharedPreferences prefs = getContext().getSharedPreferences(
            PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE
        );
        prefs.edit()
            .putString(PrayerWidgetService.KEY_THEME, theme)
            .apply();
        triggerWidgetUpdate();
        call.resolve();
    }

    private void triggerWidgetUpdate() {
        AppWidgetManager awm = AppWidgetManager.getInstance(getContext());
        int[] ids = awm.getAppWidgetIds(
            new ComponentName(getContext(), PrayerWidget.class)
        );
        if (ids.length > 0) {
            PrayerWidgetService.start(getContext());
        }
    }
}
