package YOUR_PACKAGE_NAME

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import YOUR_PACKAGE_NAME.widget.PrayerWidget
import YOUR_PACKAGE_NAME.widget.PrayerWidgetService

/**
 * Capacitor plugin that bridges JavaScript prayer data into Android SharedPreferences.
 *
 * Call from JavaScript:
 *   import { Plugins } from '@capacitor/core';
 *   const { NoorWidget } = Plugins;
 *
 *   await NoorWidget.setPrayerTimes({
 *     prayers: [
 *       { name: "الفجر",  timeMs: 1700000000000, timeStr: "04:35" },
 *       { name: "الظهر",  timeMs: 1700043600000, timeStr: "12:05" },
 *       ...  // pass 3 days of prayers
 *     ],
 *     city: "القاهرة",   // displayed in widget header
 *     lat: 30.0,
 *     lng: 31.2,
 *   });
 *
 * REPLACE "YOUR_PACKAGE_NAME" with your actual package name.
 *
 * Register in MainActivity.kt:
 *   override fun onCreate(savedInstanceState: Bundle?) {
 *       registerPlugin(WidgetBridgePlugin::class.java)
 *       super.onCreate(savedInstanceState)
 *   }
 */
@CapacitorPlugin(name = "NoorWidget")
class WidgetBridgePlugin : Plugin() {

    @PluginMethod
    fun setPrayerTimes(call: PluginCall) {
        val prayers = call.getArray("prayers")
            ?: return call.reject("missing 'prayers' array")

        val city = call.getString("city") ?: ""
        val lat  = call.getFloat("lat")   ?: 30f
        val lng  = call.getFloat("lng")   ?: 31f

        val prefs = context.getSharedPreferences(
            PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE
        )
        prefs.edit()
            .putString(PrayerWidgetService.KEY_PRAYERS, prayers.toString())
            .putString(PrayerWidgetService.KEY_CITY,    city)
            .putFloat("lat",     lat)
            .putFloat("lng",     lng)
            .putLong("savedAt",  System.currentTimeMillis())
            .apply()

        // Kick the widget to redraw immediately
        val awm = AppWidgetManager.getInstance(context)
        val ids = awm.getAppWidgetIds(ComponentName(context, PrayerWidget::class.java))
        if (ids.isNotEmpty()) {
            PrayerWidgetService.start(context)
        }

        call.resolve()
    }
}
