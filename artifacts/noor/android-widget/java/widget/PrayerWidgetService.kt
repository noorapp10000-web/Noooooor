package YOUR_PACKAGE_NAME.widget

import android.app.*
import android.appwidget.AppWidgetManager
import android.content.*
import android.os.*
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import YOUR_PACKAGE_NAME.MainActivity
import YOUR_PACKAGE_NAME.R

/**
 * نُور — Foreground Service for per-second widget countdown updates.
 *
 * Architecture:
 *   • Runs as a foreground service (START_STICKY) — Android OS restarts it if killed.
 *   • Handler posts every 1 second to update the 3 digit TextViews in RemoteViews.
 *   • Pauses ticking while screen is off (battery-friendly). Resumes instantly on screen on.
 *   • Stops itself when no widget instances remain on the home screen.
 *   • BootReceiver restarts it after device reboot.
 *
 * Prayer data is read from SharedPreferences (written by WidgetBridgePlugin when the
 * main app runs). Data covers the next 3 days so the widget stays accurate even if
 * the user hasn't opened the app for a couple of days.
 *
 * REPLACE "YOUR_PACKAGE_NAME" with your actual package name everywhere.
 */
class PrayerWidgetService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private var isScreenOn = true
    private var isRunning = false

    // ── Per-second tick ──────────────────────────────────────────────────────
    private val tickRunnable = object : Runnable {
        override fun run() {
            if (isScreenOn) performUpdate()
            handler.postDelayed(this, 1000L)
        }
    }

    // ── Screen on/off receiver (battery saving) ──────────────────────────────
    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                Intent.ACTION_SCREEN_OFF -> isScreenOn = false
                Intent.ACTION_SCREEN_ON  -> { isScreenOn = true; performUpdate() }
            }
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        registerReceiver(screenReceiver, IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_SCREEN_ON)
        })
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!isRunning) {
            isRunning = true
            startForeground(NOTIF_ID, buildNotification("نُور", "عداد الصلاة يعمل في الخلفية"))
            handler.post(tickRunnable)
        }
        return START_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        handler.removeCallbacks(tickRunnable)
        try { unregisterReceiver(screenReceiver) } catch (_: Exception) {}
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ── Core update logic ────────────────────────────────────────────────────
    private fun performUpdate() {
        val awm = AppWidgetManager.getInstance(this)
        val ids = awm.getAppWidgetIds(
            android.content.ComponentName(this, PrayerWidget::class.java)
        )
        if (ids.isEmpty()) {
            // No widgets on home screen — stop to save battery
            stopSelf()
            return
        }

        val prayer = readNextPrayer()
        val rv = RemoteViews(packageName, R.layout.widget_prayer)

        if (prayer != null) {
            val remaining = prayer.timeMs - System.currentTimeMillis()
            if (remaining < 0) {
                // This prayer just passed — next tick will pick the following one
                return
            }

            val h = (remaining / 3_600_000L).toInt()
            val m = ((remaining % 3_600_000L) / 60_000L).toInt()
            val s = ((remaining % 60_000L) / 1_000L).toInt()

            rv.setTextViewText(R.id.wg_prayer_name, prayer.name)
            rv.setTextViewText(R.id.wg_hours,   String.format("%02d", h))
            rv.setTextViewText(R.id.wg_minutes, String.format("%02d", m))
            rv.setTextViewText(R.id.wg_seconds, String.format("%02d", s))
            rv.setTextViewText(R.id.wg_prayer_time, prayer.timeStr)

            // Update the persistent notification with live countdown
            val nm = getSystemService(NotificationManager::class.java)
            nm.notify(NOTIF_ID,
                buildNotification(prayer.name, String.format("%02d:%02d:%02d", h, m, s))
            )
        } else {
            // No stored data yet — prompt user to open app
            rv.setTextViewText(R.id.wg_prayer_name, "افتح التطبيق")
            rv.setTextViewText(R.id.wg_hours,   "--")
            rv.setTextViewText(R.id.wg_minutes, "--")
            rv.setTextViewText(R.id.wg_seconds, "--")
            rv.setTextViewText(R.id.wg_prayer_time, "")
        }

        // Tap widget → open app
        val openIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        rv.setOnClickPendingIntent(R.id.wg_root, openIntent)

        // Push update to all widget instances
        awm.updateAppWidget(ids, rv)
    }

    // ── Read next prayer from SharedPreferences ───────────────────────────────
    private fun readNextPrayer(): PrayerData? {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val json  = prefs.getString(KEY_PRAYERS, null) ?: return null
        return try {
            val arr = JSONArray(json)
            val now = System.currentTimeMillis()
            (0 until arr.length())
                .map { arr.getJSONObject(it) }
                .filter { it.getLong("timeMs") > now }
                .minByOrNull { it.getLong("timeMs") }
                ?.let { obj ->
                    PrayerData(
                        name    = obj.getString("name"),
                        timeMs  = obj.getLong("timeMs"),
                        timeStr = obj.getString("timeStr")
                    )
                }
        } catch (e: Exception) { null }
    }

    // ── Foreground notification ───────────────────────────────────────────────
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "نُور — عداد الصلاة",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description       = "يُبقي عداد الصلاة القادمة يعمل في الخلفية"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_SECRET
                setSound(null, null)
                enableVibration(false)
                enableLights(false)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, content: String): Notification {
        val pi = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            },
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_stat_noor)   // see integration notes
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()
    }

    // ── Data model ────────────────────────────────────────────────────────────
    data class PrayerData(
        val name   : String,
        val timeMs : Long,
        val timeStr: String
    )

    // ── Static helpers ────────────────────────────────────────────────────────
    companion object {
        const val PREFS_NAME = "NoorWidget"
        const val KEY_PRAYERS = "prayerTimes"
        const val CHANNEL_ID  = "noor_widget_service"
        const val NOTIF_ID    = 9001

        fun start(context: Context) {
            val intent = Intent(context, PrayerWidgetService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }
}
