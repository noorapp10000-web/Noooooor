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
 * Capacitor bridge plugin — receives lat/lng and theme from the web layer and stores them in
 * SharedPreferences so the widget's foreground service can calculate prayer times
 * natively using the adhan library, independent of the app being open.
 */
@CapacitorPlugin(name = "NoorWidget")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void setPrayerTimes(PluginCall call) {
        Float lat = call.getFloat("lat");
        Float lng = call.getFloat("lng");

        if (lat == null || lng == null) {
            call.reject("Missing lat/lng coordinates");
            return;
        }

        SharedPreferences prefs = getContext().getSharedPreferences(
            PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE
        );
        prefs.edit()
            .putFloat(PrayerWidgetService.KEY_LAT, lat)
            .putFloat(PrayerWidgetService.KEY_LNG, lng)
            .putLong("savedAt", System.currentTimeMillis())
            .apply();

        triggerWidgetUpdate();
        call.resolve();
    }

    @PluginMethod
    public void setTheme(PluginCall call) {
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
