package YOUR_PACKAGE_NAME.widget

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

/**
 * Restarts the PrayerWidgetService after device reboot.
 * Requires RECEIVE_BOOT_COMPLETED permission in AndroidManifest.xml
 *
 * REPLACE "YOUR_PACKAGE_NAME" with your actual package name.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            val awm = AppWidgetManager.getInstance(context)
            val ids = awm.getAppWidgetIds(
                ComponentName(context, PrayerWidget::class.java)
            )
            if (ids.isNotEmpty()) {
                PrayerWidgetService.start(context)
            }
        }
    }
}
