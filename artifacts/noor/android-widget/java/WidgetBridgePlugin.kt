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
 * Capacitor plugin that bridges JavaScript prayer time data into Android SharedPreferences
 * so the home screen widget can read it without the app being open.
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
        val lat = call.getFloat("lat") ?: 30f
        val lng = call.getFloat("lng") ?: 31f

        val prefs = context.getSharedPreferences(
            PrayerWidgetService.PREFS_NAME, Context.MODE_PRIVATE
        )
        prefs.edit()
            .putString(PrayerWidgetService.KEY_PRAYERS, prayers.toString())
            .putFloat("lat", lat)
            .putFloat("lng", lng)
            .putLong("savedAt", System.currentTimeMillis())
            .apply()

        // Kick the widget to re-draw immediately
        val awm = AppWidgetManager.getInstance(context)
        val ids = awm.getAppWidgetIds(ComponentName(context, PrayerWidget::class.java))
        if (ids.isNotEmpty()) {
            PrayerWidgetService.start(context)
        }

        call.resolve()
    }
}
