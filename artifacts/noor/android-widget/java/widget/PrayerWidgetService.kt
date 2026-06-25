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
 * Features:
 *   • Live countdown hh:mm:ss updated every second
 *   • Prayer time progress bar (elapsed ratio between prev and next prayer)
 *   • Hijri date (API 24+ via android.icu.util.IslamicCalendar)
 *   • City name display
 *   • Prayer emoji icons per prayer name
 *   • Size-aware layout: large (4×3+) / medium (4×2) / small (2×2)
 *   • Battery-friendly: pauses when screen is off
 *   • START_STICKY: Android restarts it if killed
 *
 * REPLACE "YOUR_PACKAGE_NAME" with your actual package name everywhere.
 */
class PrayerWidgetService : Service() {

    private val handler  = Handler(Looper.getMainLooper())
    private var isScreenOn = true
    private var isRunning  = false

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
        if (ids.isEmpty()) { stopSelf(); return }

        val now      = System.currentTimeMillis()
        val prayers  = readAllPrayers()
        val prefs    = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val cityName = prefs.getString(KEY_CITY, "") ?: ""

        val prevPrayer = prayers.lastOrNull  { it.timeMs <= now }
        val nextPrayer = prayers.firstOrNull { it.timeMs >  now }

        val progress: Int = if (prevPrayer != null && nextPrayer != null) {
            val total = nextPrayer.timeMs - prevPrayer.timeMs
            if (total > 0) ((now - prevPrayer.timeMs).toFloat() / total * 100).toInt().coerceIn(0, 100)
            else 0
        } else 0

        val hijriDate = getHijriDate()

        val openIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Update each widget individually so we can pick the right layout by size
        for (widgetId in ids) {
            val options = awm.getAppWidgetOptions(widgetId)
            val minW = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH,  250)
            val minH = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 160)

            val layoutId = when {
                minW < 180 || minH < 130 -> R.layout.widget_prayer_small
                minH < 155               -> R.layout.widget_prayer_medium
                else                     -> R.layout.widget_prayer
            }

            val rv = RemoteViews(packageName, layoutId)

            if (nextPrayer != null) {
                val remaining = nextPrayer.timeMs - now
                if (remaining < 0) return

                val h = (remaining / 3_600_000L).toInt()
                val m = ((remaining % 3_600_000L) / 60_000L).toInt()
                val s = ((remaining % 60_000L)    / 1_000L).toInt()

                val nextEmoji = prayerEmoji(nextPrayer.name)
                rv.setTextViewText(R.id.wg_prayer_name, "$nextEmoji ${nextPrayer.name}")
                rv.setTextViewText(R.id.wg_hours,   String.format("%02d", h))
                rv.setTextViewText(R.id.wg_minutes, String.format("%02d", m))

                // Seconds only available in large and medium layouts
                if (layoutId != R.layout.widget_prayer_small) {
                    rv.setTextViewText(R.id.wg_seconds, String.format("%02d", s))
                    rv.setProgressBar(R.id.wg_progress, 100, progress, false)
                }

                // Large-only: hijri date, city, progress labels
                if (layoutId == R.layout.widget_prayer) {
                    rv.setTextViewText(R.id.wg_hijri_date, hijriDate)
                    rv.setTextViewText(R.id.wg_city,
                        if (cityName.isNotEmpty()) "📍 $cityName" else "")
                    rv.setTextViewText(R.id.wg_prev_prayer,
                        if (prevPrayer != null) "${prayerEmoji(prevPrayer.name)} ${prevPrayer.name}"
                        else "")
                    rv.setTextViewText(R.id.wg_next_prayer,
                        "$nextEmoji ${nextPrayer.name}")
                }

                // Medium-only: city
                if (layoutId == R.layout.widget_prayer_medium) {
                    rv.setTextViewText(R.id.wg_city,
                        if (cityName.isNotEmpty()) "📍 $cityName" else "")
                }

                // Update persistent notification
                val nm = getSystemService(NotificationManager::class.java)
                nm.notify(NOTIF_ID,
                    buildNotification(
                        "$nextEmoji ${nextPrayer.name}",
                        String.format("%02d:%02d:%02d", h, m, s)
                    )
                )
            } else {
                // No data yet — prompt user to open the app
                rv.setTextViewText(R.id.wg_prayer_name, "🕌 افتح التطبيق")
                rv.setTextViewText(R.id.wg_hours,   "--")
                rv.setTextViewText(R.id.wg_minutes, "--")
                if (layoutId != R.layout.widget_prayer_small) {
                    rv.setTextViewText(R.id.wg_seconds, "--")
                }
            }

            rv.setOnClickPendingIntent(R.id.wg_root, openIntent)
            awm.updateAppWidget(widgetId, rv)
        }
    }

    // ── Read all prayers sorted by time ──────────────────────────────────────
    private fun readAllPrayers(): List<PrayerData> {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val json  = prefs.getString(KEY_PRAYERS, null) ?: return emptyList()
        return try {
            val arr = JSONArray(json)
            (0 until arr.length())
                .map { arr.getJSONObject(it) }
                .map { obj ->
                    PrayerData(
                        name    = obj.getString("name"),
                        timeMs  = obj.getLong("timeMs"),
                        timeStr = obj.getString("timeStr")
                    )
                }
                .sortedBy { it.timeMs }
        } catch (e: Exception) { emptyList() }
    }

    // ── Prayer name → emoji ───────────────────────────────────────────────────
    private fun prayerEmoji(name: String) = when {
        name.contains("فجر")              -> "🌅"
        name.contains("شروق")             -> "🌄"
        name.contains("ظهر")              -> "☀️"
        name.contains("عصر")              -> "🌤️"
        name.contains("مغرب")             -> "🌇"
        name.contains("عشاء")             -> "🌙"
        else                              -> "🕌"
    }

    // ── Hijri date string (API 24+, graceful fallback) ────────────────────────
    private fun getHijriDate(): String {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return ""
        return try {
            val cal      = android.icu.util.IslamicCalendar()
            val day      = cal.get(android.icu.util.Calendar.DATE)
            val monthIdx = cal.get(android.icu.util.Calendar.MONTH)
            val year     = cal.get(android.icu.util.Calendar.YEAR)
            val dowIdx   = cal.get(android.icu.util.Calendar.DAY_OF_WEEK) - 1
            val months   = listOf(
                "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
                "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
                "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
            )
            val days = listOf("الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت")
            "${days.getOrElse(dowIdx){""}}, $day ${months.getOrElse(monthIdx){""}} $year هـ"
        } catch (e: Exception) { "" }
    }

    // ── Foreground notification ───────────────────────────────────────────────
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "نُور — عداد الصلاة",
                NotificationManager.IMPORTANCE_MIN
            ).apply {
                description          = "يُبقي عداد الصلاة القادمة يعمل في الخلفية"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_SECRET
                setSound(null, null)
                enableVibration(false)
                enableLights(false)
            }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, content: String): Notification {
        val pi = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK },
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_stat_noor)
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
        const val PREFS_NAME  = "NoorWidget"
        const val KEY_PRAYERS = "prayerTimes"
        const val KEY_CITY    = "cityName"
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
