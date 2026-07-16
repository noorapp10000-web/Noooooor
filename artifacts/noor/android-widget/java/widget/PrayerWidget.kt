package YOUR_PACKAGE_NAME.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * نُور — Android Home Screen Widget
 * AppWidgetProvider: entry point for widget lifecycle events.
 *
 * REPLACE "YOUR_PACKAGE_NAME" with your actual package name everywhere in this file.
 * Example: com.noor.app
 */
class PrayerWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        PrayerWidgetService.start(context)
    }

    override fun onEnabled(context: Context) {
        PrayerWidgetService.start(context)
    }

    override fun onDisabled(context: Context) {
        context.stopService(Intent(context, PrayerWidgetService::class.java))
    }
}
