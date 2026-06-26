package com.noor.app.widget;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RadialGradient;
import android.graphics.Shader;

import java.util.Calendar;

public class SkyBitmapRenderer {

    private static final long KNOWN_NEW_MOON_MS = 1704974220000L;
    private static final double SYNODIC_MS = 29.530588853 * 24.0 * 3600.0 * 1000.0;

    private static final int[] STAR_SEED = new int[85];
    static {
        for (int i = 0; i < 85; i++) STAR_SEED[i] = i;
    }

    private static float fsin(int i, double k) {
        return (float)(Math.sin(i * k) * 0.5 + 0.5);
    }

    public static Bitmap render(int w, int h,
                                long fajrMs, long sunriseMs, long dhuhrMs,
                                long asrMs, long maghribMs, long ishaMs) {
        if (w <= 0 || h <= 0) return null;
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);

        Calendar cal = Calendar.getInstance();
        int sec = cal.get(Calendar.HOUR_OF_DAY) * 3600
                + cal.get(Calendar.MINUTE)       * 60
                + cal.get(Calendar.SECOND);

        int fajrS    = msToSec(fajrMs);
        int sunriseS = msToSec(sunriseMs);
        int dhuhrS   = msToSec(dhuhrMs);
        int asrS     = msToSec(asrMs);
        int maghribS = msToSec(maghribMs);
        int ishaS    = msToSec(ishaMs);

        double moonPhase = calcMoonPhase();

        drawGradient(c, w, h, sec, fajrS, sunriseS, dhuhrS, asrS, maghribS, ishaS);

        boolean isNight = sec >= ishaS || sec < fajrS;
        boolean isFajr  = sec >= fajrS && sec < sunriseS;

        if (isNight || isFajr) {
            float starOpacity = isNight ? 0.90f : 0.45f * (1f - (float)(sec - fajrS) / (sunriseS - fajrS));
            drawStars(c, w, h, starOpacity);
            drawMoon(c, w, h, sec, maghribS, ishaS, moonPhase);
        }
        if (!isNight) {
            drawSun(c, w, h, sec, sunriseS, maghribS, isNight, isFajr);
        }

        drawVignette(c, w, h);
        return bmp;
    }

    private static int msToSec(long ms) {
        Calendar tmp = Calendar.getInstance();
        tmp.setTimeInMillis(ms);
        return tmp.get(Calendar.HOUR_OF_DAY) * 3600
             + tmp.get(Calendar.MINUTE)       * 60
             + tmp.get(Calendar.SECOND);
    }

    private static double calcMoonPhase() {
        double elapsed = (double)(System.currentTimeMillis() - KNOWN_NEW_MOON_MS);
        double phase = (elapsed % SYNODIC_MS) / SYNODIC_MS;
        if (phase < 0) phase += 1.0;
        return phase;
    }

    /* ── Gradient sky background ── */
    private static void drawGradient(Canvas c, int w, int h,
                                     int sec, int fajrS, int sunriseS, int dhuhrS,
                                     int asrS, int maghribS, int ishaS) {
        int[] colors;
        float[] positions;

        if (sec >= ishaS || sec < fajrS) {
            colors    = new int[]{ 0xFF010308, 0xFF020510, 0xFF040A1C, 0xFF060D22 };
            positions = new float[]{ 0f, 0.30f, 0.65f, 1f };
        } else if (sec < sunriseS) {
            float t = (float)(sec - fajrS) / (sunriseS - fajrS);
            int bottomColor = t > 0.6f ? 0xFFE07070 : 0xFFC85060;
            colors    = new int[]{ 0xFF06030F, 0xFF340D48, 0xFF9B2848, bottomColor, 0xFFEFA080 };
            positions = new float[]{ 0f, 0.35f, 0.66f, 0.90f, 1f };
        } else if (sec < sunriseS + 45 * 60) {
            colors    = new int[]{ 0xFF142545, 0xFF285595, 0xFF8B4E1A, 0xFFE89428, 0xFFFDD870 };
            positions = new float[]{ 0f, 0.30f, 0.52f, 0.80f, 1f };
        } else if (sec < dhuhrS) {
            float t = (float)(sec - sunriseS - 45*60) / (dhuhrS - sunriseS - 45*60);
            int topColor = t > 0.5f ? 0xFF0A2270 : 0xFF142545;
            colors    = new int[]{ topColor, 0xFF1E58C4, 0xFF3A8EE8, 0xFFAED8F8 };
            positions = new float[]{ 0f, 0.30f, 0.65f, 1f };
        } else if (sec < asrS) {
            colors    = new int[]{ 0xFF0A2270, 0xFF1E58C4, 0xFF3A8EE8, 0xFFAED8F8 };
            positions = new float[]{ 0f, 0.26f, 0.58f, 1f };
        } else if (sec < maghribS - 30 * 60) {
            colors    = new int[]{ 0xFF0A2270, 0xFF1E58C4, 0xFF5090D8, 0xFFC8E4F8 };
            positions = new float[]{ 0f, 0.26f, 0.58f, 1f };
        } else {
            colors    = new int[]{ 0xFF070420, 0xFF360B36, 0xFFA61E0E, 0xFFE56C18, 0xFFFCE070 };
            positions = new float[]{ 0f, 0.24f, 0.52f, 0.76f, 1f };
        }

        Paint p = new Paint();
        p.setShader(new LinearGradient(0, 0, 0, h, colors, positions, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h, p);
    }

    /* ── Stars ── */
    private static void drawStars(Canvas c, int w, int h, float opacity) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        for (int i = 0; i < 85; i++) {
            float x   = fsin(i, 563.1) * w;
            float y   = fsin(i, 291.3) * h * 0.75f;
            float r   = fsin(i, 127.1) > 0.88f ? 1.6f : fsin(i, 127.1) > 0.65f ? 1.0f : 0.5f;
            float alp = (0.3f + fsin(i, 311.7) * 0.65f) * opacity;

            int colSel = (int)(fsin(i, 193.7) * 3);
            int col = colSel == 2 ? 0xFFFFE8D0 : colSel == 1 ? 0xFFE8EEFF : 0xFFFFFFFF;
            p.setColor(col);
            p.setAlpha(Math.min(255, (int)(alp * 255)));
            c.drawCircle(x, y, r, p);
        }
    }

    /* ── Sun ── */
    private static void drawSun(Canvas c, int w, int h,
                                 int sec, int sunriseS, int maghribS,
                                 boolean isNight, boolean isFajr) {
        if (isNight || sec < sunriseS || sec > maghribS) return;
        int dayLen = maghribS - sunriseS;
        float t  = (float)(sec - sunriseS) / dayLen;
        float sx = (0.05f + t * 0.90f) * w;
        float sy = (0.88f - (float)Math.sin(t * Math.PI) * 0.80f) * h;

        float phase = (float)(sec - sunriseS) / dayLen;
        int glowColor;
        float sunR;
        if (phase < 0.08f || phase > 0.92f) {
            glowColor = 0xFFE06818; sunR = w * 0.065f;
        } else {
            glowColor = 0xFFFFE020; sunR = w * 0.075f;
        }

        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setShader(new RadialGradient(sx, sy, sunR * 5f,
            new int[]{ glowColor & 0x55FFFFFF, 0x00000000 },
            new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(sx, sy, sunR * 5f, p);

        p.setShader(new RadialGradient(sx - sunR * 0.2f, sy - sunR * 0.3f, sunR,
            new int[]{ 0xFFFFFEF5, 0xFFFFF8D0, glowColor },
            new float[]{ 0f, 0.4f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(sx, sy, sunR, p);
    }

    /* ── Moon ── */
    private static void drawMoon(Canvas c, int w, int h,
                                  int sec, int maghribS, int ishaS,
                                  double moonPhase) {
        int moonriseSec = ishaS + 30 * 60;
        int moonsetSec  = 24 * 3600 + (int)(4.5 * 3600);
        int totalNight  = moonsetSec - moonriseSec;

        float t;
        if (sec >= moonriseSec) {
            t = (float)(sec - moonriseSec) / totalNight;
        } else {
            t = (float)(sec + 24 * 3600 - moonriseSec) / totalNight;
        }
        t = Math.max(0f, Math.min(1f, t));

        float mx = (0.05f + t * 0.85f) * w;
        float my = (0.80f - (float)Math.sin(t * Math.PI) * 0.68f) * h;
        float r  = w * 0.055f;

        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        p.setShader(new RadialGradient(mx, my, r * 3.5f,
            new int[]{ 0x30B8CCFF, 0x00B8CCFF },
            new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(mx, my, r * 3.5f, p);

        p.setShader(null);
        p.setColor(Color.argb(235, 16, 24, 40));
        c.drawCircle(mx, my, r, p);

        float phaseNorm = (float)((moonPhase % 1.0 + 1.0) % 1.0);
        boolean waning  = phaseNorm > 0.5f;
        float pv        = waning ? 1f - phaseNorm : phaseNorm;
        float shadowOff = r * (1f - pv * 2f);

        int savedLayer = c.saveLayer(mx - r * 2, my - r * 2, mx + r * 2, my + r * 2, null);
        p.setShader(new RadialGradient(mx + r * 0.25f, my - r * 0.2f, r,
            new int[]{ 0xFFFEFDF5, 0xFFE8EFF8, 0xFFC0CCDF },
            new float[]{ 0f, 0.45f, 1f }, Shader.TileMode.CLAMP));
        p.setXfermode(null);
        c.drawCircle(mx, my, r, p);

        p.setShader(null);
        p.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));
        float shadowX = waning ? mx + shadowOff : mx - shadowOff;
        c.drawCircle(shadowX, my, r, p);
        p.setXfermode(null);
        c.restoreToCount(savedLayer);

        p.setColor(Color.argb(140, 255, 254, 245));
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(r * 0.06f);
        c.drawCircle(mx, my, r, p);
        p.setStyle(Paint.Style.FILL);
    }

    /* ── Vignette ── */
    private static void drawVignette(Canvas c, int w, int h) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setShader(new RadialGradient(w / 2f, h / 2f, Math.max(w, h) * 0.65f,
            new int[]{ 0x00000000, 0x55000000 },
            new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h, p);
    }
}
