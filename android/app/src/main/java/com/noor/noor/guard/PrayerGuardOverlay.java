package com.noor.noor.guard;

import android.content.Context;
import android.graphics.PixelFormat;
import android.os.Build;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import com.noor.noor.R;

public class PrayerGuardOverlay {

    private final Context       ctx;
    private final WindowManager wm;
    private View                overlayView;
    private boolean             showing = false;

    private OnOathClickedListener oathListener;

    public interface OnOathClickedListener {
        void onOathClicked(String prayer, String dateKey);
    }

    public PrayerGuardOverlay(Context ctx, OnOathClickedListener listener) {
        this.ctx          = ctx;
        this.wm           = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
        this.oathListener = listener;
    }

    public void show(String prayerNameAr, String prayerKey, String dateKey) {
        if (showing) {
            updatePrayerName(prayerNameAr);
            return;
        }

        overlayView = LayoutInflater.from(ctx).inflate(R.layout.overlay_prayer_guard, null);

        updatePrayerName(prayerNameAr);

        overlayView.findViewById(R.id.btn_oath).setOnClickListener(v -> {
            if (oathListener != null) oathListener.onOathClicked(prayerKey, dateKey);
            hide();
        });

        WindowManager.LayoutParams params = buildLayoutParams();

        overlayView.setFocusableInTouchMode(true);
        overlayView.setFocusable(true);
        overlayView.requestFocus();

        overlayView.setOnKeyListener((v, keyCode, event) -> {
            if (keyCode == KeyEvent.KEYCODE_BACK ||
                keyCode == KeyEvent.KEYCODE_HOME ||
                keyCode == KeyEvent.KEYCODE_APP_SWITCH ||
                keyCode == KeyEvent.KEYCODE_MENU) {
                return true;
            }
            return false;
        });

        try {
            wm.addView(overlayView, params);
            showing = true;
        } catch (Exception ignored) {}
    }

    public void hide() {
        if (!showing || overlayView == null) return;
        try {
            wm.removeViewImmediate(overlayView);
        } catch (Exception ignored) {}
        overlayView = null;
        showing     = false;
    }

    public boolean isShowing() {
        return showing;
    }

    private void updatePrayerName(String prayerNameAr) {
        if (overlayView == null) return;
        TextView tvPrayer = overlayView.findViewById(R.id.tv_prayer_name);
        if (tvPrayer != null) tvPrayer.setText(prayerNameAr);
    }

    private WindowManager.LayoutParams buildLayoutParams() {
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        int flags =
            WindowManager.LayoutParams.FLAG_FULLSCREEN                  |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN            |
            WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS|
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON              |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type,
            flags,
            PixelFormat.TRANSLUCENT
        );

        params.systemUiVisibility =
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY    |
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE        |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN    |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION      |
            View.SYSTEM_UI_FLAG_FULLSCREEN;

        return params;
    }
}
