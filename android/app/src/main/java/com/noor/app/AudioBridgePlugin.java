package com.noor.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.os.Build;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioBridge")
public class AudioBridgePlugin extends Plugin {

    static final String CHANNEL_ID   = "noor_audio_v2";
    static final int    NOTIF_ID     = 7001;
    static final String ACTION_PLAY  = "com.noor.app.AUDIO_PLAY";
    static final String ACTION_PAUSE = "com.noor.app.AUDIO_PAUSE";
    static final String ACTION_NEXT  = "com.noor.app.AUDIO_NEXT";
    static final String ACTION_PREV  = "com.noor.app.AUDIO_PREV";
    static final String ACTION_STOP  = "com.noor.app.AUDIO_STOP";

    private MediaSessionCompat   mediaSession;
    private NotificationManager  notifMgr;
    private boolean   isPlaying     = false;
    private String    currentTitle  = "القرآن الكريم";
    private String    currentArtist = "تطبيق نُور";
    private Bitmap    artwork;

    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context ctx, Intent intent) {
            String action = intent.getAction();
            if (action == null) return;
            JSObject d = new JSObject();
            switch (action) {
                case ACTION_PLAY:
                    isPlaying = true;
                    syncState();
                    showNotif();
                    notifyListeners("mediaPlay", d);
                    break;
                case ACTION_PAUSE:
                    isPlaying = false;
                    syncState();
                    showNotif();
                    notifyListeners("mediaPause", d);
                    break;
                case ACTION_NEXT:
                    notifyListeners("mediaNext", d);
                    break;
                case ACTION_PREV:
                    notifyListeners("mediaPrev", d);
                    break;
                case ACTION_STOP:
                    isPlaying = false;
                    dismiss();
                    notifyListeners("mediaPause", d);
                    break;
            }
        }
    };

    @Override
    public void load() {
        notifMgr = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        createChannel();
        initMediaSession();
        IntentFilter f = new IntentFilter();
        f.addAction(ACTION_PLAY);
        f.addAction(ACTION_PAUSE);
        f.addAction(ACTION_NEXT);
        f.addAction(ACTION_PREV);
        f.addAction(ACTION_STOP);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(receiver, f, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(receiver, f);
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "تلاوة القرآن الكريم", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("التحكم في تشغيل التلاوة");
            ch.setShowBadge(false);
            notifMgr.createNotificationChannel(ch);
        }
    }

    private void initMediaSession() {
        mediaSession = new MediaSessionCompat(getContext(), "NoorAudio");
        mediaSession.setFlags(
            MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay()             { sendAction(ACTION_PLAY);  }
            @Override public void onPause()            { sendAction(ACTION_PAUSE); }
            @Override public void onSkipToNext()       { sendAction(ACTION_NEXT);  }
            @Override public void onSkipToPrevious()   { sendAction(ACTION_PREV);  }
            @Override public void onStop()             { sendAction(ACTION_STOP);  }
        });
        mediaSession.setActive(true);
    }

    private void sendAction(String action) {
        Intent i = new Intent(action);
        i.setPackage(getContext().getPackageName());
        getContext().sendBroadcast(i);
    }

    @PluginMethod
    public void updateMetadata(PluginCall call) {
        currentTitle  = call.getString("title",    "القرآن الكريم");
        currentArtist = call.getString("artist",   "تطبيق نُور");
        isPlaying     = Boolean.TRUE.equals(call.getBoolean("isPlaying", false));
        artwork = buildArtwork(currentTitle, currentArtist);
        updateMetaInSession();
        syncState();
        showNotif();
        call.resolve();
    }

    @PluginMethod
    public void setState(PluginCall call) {
        isPlaying = Boolean.TRUE.equals(call.getBoolean("playing", false));
        syncState();
        showNotif();
        call.resolve();
    }

    @PluginMethod
    public void dismiss(PluginCall call) {
        dismiss();
        call.resolve();
    }

    private void dismiss() {
        notifMgr.cancel(NOTIF_ID);
        if (mediaSession != null) mediaSession.setActive(false);
    }

    private void updateMetaInSession() {
        MediaMetadataCompat.Builder m = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE,  currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM,  "القرآن الكريم");
        if (artwork != null) m.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artwork);
        mediaSession.setMetadata(m.build());
    }

    private void syncState() {
        long actions =
            PlaybackStateCompat.ACTION_PLAY |
            PlaybackStateCompat.ACTION_PAUSE |
            PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
            PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
            PlaybackStateCompat.ACTION_STOP;
        mediaSession.setPlaybackState(new PlaybackStateCompat.Builder()
            .setState(
                isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1f)
            .setActions(actions)
            .build());
        if (!isPlaying) mediaSession.setActive(false);
        else            mediaSession.setActive(true);
    }

    private PendingIntent pi(String action, int code) {
        Intent i = new Intent(action);
        i.setPackage(getContext().getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT |
            (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(getContext(), code, i, flags);
    }

    private void showNotif() {
        PendingIntent prevPI  = pi(ACTION_PREV,  1);
        PendingIntent mainPI  = pi(isPlaying ? ACTION_PAUSE : ACTION_PLAY, 2);
        PendingIntent nextPI  = pi(ACTION_NEXT,  3);
        PendingIntent stopPI  = pi(ACTION_STOP,  4);

        Intent launch = getContext().getPackageManager()
            .getLaunchIntentForPackage(getContext().getPackageName());
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT |
            (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent openPI = PendingIntent.getActivity(getContext(), 0, launch, piFlags);

        int playIcon  = isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play;
        String playLbl = isPlaying ? "إيقاف" : "تشغيل";

        int smallIcon;
        try { smallIcon = R.drawable.ic_stat_icon_config_sample; }
        catch (Exception e) { smallIcon = android.R.drawable.ic_media_play; }

        NotificationCompat.Builder nb = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setSmallIcon(smallIcon)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setContentIntent(openPI)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(isPlaying)
            .setDeleteIntent(stopPI)
            .setStyle(new MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)
                .setShowCancelButton(true)
                .setCancelButtonIntent(stopPI))
            .addAction(android.R.drawable.ic_media_previous, "السابق", prevPI)
            .addAction(playIcon, playLbl, mainPI)
            .addAction(android.R.drawable.ic_media_next,     "التالي", nextPI);

        if (artwork != null) nb.setLargeIcon(artwork);

        notifMgr.notify(NOTIF_ID, nb.build());
    }

    private Bitmap buildArtwork(String title, String artist) {
        int S = 512;
        Bitmap bmp = Bitmap.createBitmap(S, S, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        p.setColor(Color.parseColor("#1a1208"));
        cv.drawRect(0, 0, S, S, p);

        float cx = S / 2f, cy = 200f;

        p.setStyle(Paint.Style.STROKE);
        p.setColor(Color.parseColor("#C19A6B"));
        p.setAlpha(80); p.setStrokeWidth(2);
        cv.drawCircle(cx, cy, 195, p);

        p.setAlpha(180); p.setStrokeWidth(2);
        Path star = new Path();
        for (int i = 0; i < 16; i++) {
            float r = (i % 2 == 0) ? 92f : 54f;
            double a = (i * 22.5 - 90) * Math.PI / 180;
            float x = cx + r * (float) Math.cos(a);
            float y = cy + r * (float) Math.sin(a);
            if (i == 0) star.moveTo(x, y); else star.lineTo(x, y);
        }
        star.close();
        cv.drawPath(star, p);

        p.setAlpha(200); p.setStrokeWidth(3);
        cv.drawCircle(cx, cy, 148, p);
        cv.drawCircle(cx, cy, 46, p);

        p.setStyle(Paint.Style.FILL);
        p.setColor(Color.parseColor("#C19A6B"));
        p.setAlpha(255); p.setTextSize(52); p.setTextAlign(Paint.Align.CENTER);
        cv.drawText("نُور", cx, cy + 18, p);

        p.setColor(Color.parseColor("#C19A6B"));
        p.setAlpha(50); p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(1);
        cv.drawLine(cx - 160, 390, cx + 160, 390, p);

        p.setStyle(Paint.Style.FILL);
        p.setColor(Color.parseColor("#e8d9b8"));
        p.setAlpha(255); p.setTextSize(40);
        String t = title.length() > 22 ? title.substring(0, 22) + "…" : title;
        cv.drawText(t, cx, 438, p);

        p.setColor(Color.parseColor("#C19A6B"));
        p.setAlpha(200); p.setTextSize(28);
        String a2 = artist.length() > 30 ? artist.substring(0, 30) + "…" : artist;
        cv.drawText(a2, cx, 482, p);

        return bmp;
    }

    @Override
    protected void handleOnDestroy() {
        try { getContext().unregisterReceiver(receiver); } catch (Exception ignored) {}
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }
        if (notifMgr != null) notifMgr.cancel(NOTIF_ID);
    }
}
