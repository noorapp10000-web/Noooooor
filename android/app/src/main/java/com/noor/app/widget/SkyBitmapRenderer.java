package com.noor.app.widget;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

import java.util.Calendar;

public class SkyBitmapRenderer {

    private static final long   KNOWN_NEW_MOON_MS = 1704974220000L;
    private static final double SYNODIC_MS        = 29.530588853 * 24.0 * 3600.0 * 1000.0;

    private static float fsin(int i, double k) {
        return (float)(Math.sin(i * k) * 0.5 + 0.5);
    }

    /* ─────────────────────────────────────────────
       Entry point — called every second by the service
    ───────────────────────────────────────────── */
    public static Bitmap render(int w, int h,
                                long fajrMs, long sunriseMs, long dhuhrMs,
                                long asrMs, long maghribMs, long ishaMs) {
        if (w <= 0 || h <= 0) return null;

        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c   = new Canvas(bmp);

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

        boolean isNight   = sec >= ishaS || sec < fajrS;
        boolean isFajr    = sec >= fajrS && sec < sunriseS;
        boolean isSunrise = sec >= sunriseS && sec < sunriseS + 55 * 60;
        boolean isSunset  = sec >= maghribS - 55 * 60 && sec < ishaS;

        /* 1 — Sky gradient */
        drawGradient(c, w, h, sec, fajrS, sunriseS, dhuhrS, asrS, maghribS, ishaS);

        /* 2 — Stars + Moon (night / fajr) */
        if (isNight || isFajr) {
            float starOpacity = isNight ? 1.0f
                    : 0.55f * (1f - (float)(sec - fajrS) / (sunriseS - fajrS));
            drawStars(c, w, h, starOpacity, sec);
            drawMoon(c, w, h, sec, maghribS, ishaS, moonPhase);
        }

        /* 3 — Sun (daytime) */
        if (!isNight) {
            drawSun(c, w, h, sec, sunriseS, maghribS);
        }

        /* 4 — Clouds (dawn through dusk) */
        if (!isNight) {
            float goldenTint = 0f;
            if (isSunrise) goldenTint = 1f - (float)(sec - sunriseS) / (55 * 60f);
            else if (isSunset) goldenTint = (float)(sec - (maghribS - 55 * 60)) / (55 * 60f);
            goldenTint = Math.max(0f, Math.min(1f, goldenTint));
            drawClouds(c, w, h, sec, fajrS, sunriseS, maghribS, ishaS, goldenTint);
        }

        /* 5 — Vignette (edges + bottom darkness for text readability) */
        drawVignette(c, w, h);

        /* 6 — Bake rounded corners into the bitmap itself */
        return applyRoundedCorners(bmp, w, h);
    }

    /* ── Rounded-corner clipping ── */
    private static Bitmap applyRoundedCorners(Bitmap src, int w, int h) {
        Bitmap rounded = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas canvas  = new Canvas(rounded);
        Paint  paint   = new Paint(Paint.ANTI_ALIAS_FLAG);
        float  radius  = Math.min(w, h) * 0.085f;
        canvas.drawRoundRect(new RectF(0, 0, w, h), radius, radius, paint);
        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(src, 0, 0, paint);
        src.recycle();
        return rounded;
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
        double phase   = (elapsed % SYNODIC_MS) / SYNODIC_MS;
        if (phase < 0) phase += 1.0;
        return phase;
    }

    /* ── Linear interpolation between two ARGB colors ── */
    private static int lerpColor(int c1, int c2, float t) {
        float s = Math.max(0f, Math.min(1f, t));
        int a1=(c1>>24)&0xFF, r1=(c1>>16)&0xFF, g1=(c1>>8)&0xFF, b1=c1&0xFF;
        int a2=(c2>>24)&0xFF, r2=(c2>>16)&0xFF, g2=(c2>>8)&0xFF, b2=c2&0xFF;
        return Color.argb(
            (int)(a1+(a2-a1)*s), (int)(r1+(r2-r1)*s),
            (int)(g1+(g2-g1)*s), (int)(b1+(b2-b1)*s));
    }

    /* ══════════════════════════════════════════════════════════
       SKY GRADIENT — 9 distinct time phases with smooth lerps
    ══════════════════════════════════════════════════════════ */
    private static void drawGradient(Canvas c, int w, int h,
                                     int sec, int fajrS, int sunriseS, int dhuhrS,
                                     int asrS, int maghribS, int ishaS) {
        int[]   colors;
        float[] positions;

        if (sec >= ishaS || sec < fajrS) {
            /* ── Deep night: midnight indigo ── */
            colors    = new int[]{ 0xFF000308, 0xFF010614, 0xFF020A22, 0xFF040C2C };
            positions = new float[]{ 0f, 0.32f, 0.68f, 1f };

        } else if (sec < fajrS + 25 * 60) {
            /* ── Early Fajr: deep violet predawn ── */
            float t = (float)(sec - fajrS) / (25 * 60f);
            colors    = new int[]{
                0xFF020310, lerpColor(0xFF060520, 0xFF1A0535, t),
                lerpColor(0xFF1A0535, 0xFF380A58, t),
                lerpColor(0xFF280848, 0xFF7A1860, t) };
            positions = new float[]{ 0f, 0.28f, 0.58f, 1f };

        } else if (sec < sunriseS) {
            /* ── Late Fajr: purple→pink horizon ── */
            float t = (float)(sec - fajrS - 25 * 60) / (sunriseS - fajrS - 25 * 60);
            colors    = new int[]{
                0xFF06030F, lerpColor(0xFF1A0535, 0xFF380D5A, t),
                lerpColor(0xFF7A1860, 0xFFC03060, t),
                lerpColor(0xFFD05070, 0xFFEF8060, t),
                lerpColor(0xFFEFA080, 0xFFFDC878, t) };
            positions = new float[]{ 0f, 0.28f, 0.54f, 0.78f, 1f };

        } else if (sec < sunriseS + 40 * 60) {
            /* ── Sunrise: spectacular golden orange ── */
            float t = (float)(sec - sunriseS) / (40 * 60f);
            colors    = new int[]{
                lerpColor(0xFF14254A, 0xFF0A2070, t),
                lerpColor(0xFF285595, 0xFF1845A0, t),
                lerpColor(0xFF7B4520, 0xFF4A7AC0, t),
                lerpColor(0xFFE89428, 0xFFA8C0F0, t),
                lerpColor(0xFFFDD870, 0xFFD8EEFF, t) };
            positions = new float[]{ 0f, 0.25f, 0.48f, 0.74f, 1f };

        } else if (sec < dhuhrS) {
            /* ── Morning: crisp clear blue ── */
            float t = (float)(sec - sunriseS - 40 * 60) / (dhuhrS - sunriseS - 40 * 60);
            colors    = new int[]{
                lerpColor(0xFF0C2478, 0xFF0A1E6C, t),
                lerpColor(0xFF1E58C4, 0xFF1648B8, t),
                lerpColor(0xFF3A8EE8, 0xFF2878E0, t),
                lerpColor(0xFFAED8F8, 0xFF88C8F8, t),
                0xFFD8EEFF };
            positions = new float[]{ 0f, 0.22f, 0.48f, 0.76f, 1f };

        } else if (sec < asrS) {
            /* ── Midday: vivid deep blue zenith ── */
            colors    = new int[]{ 0xFF081D60, 0xFF103EB8, 0xFF2878E0, 0xFF78C0F8, 0xFFB8DAFF };
            positions = new float[]{ 0f, 0.20f, 0.48f, 0.76f, 1f };

        } else if (sec < maghribS - 50 * 60) {
            /* ── Afternoon: slightly warmer blue ── */
            colors    = new int[]{ 0xFF0A2270, 0xFF1E58C4, 0xFF4888E0, 0xFF8CC4F8, 0xFFC8E6FF };
            positions = new float[]{ 0f, 0.22f, 0.50f, 0.76f, 1f };

        } else if (sec < maghribS) {
            /* ── Pre-sunset: blue→amber transition ── */
            float t = (float)(sec - (maghribS - 50 * 60)) / (50 * 60f);
            colors    = new int[]{
                lerpColor(0xFF0A2270, 0xFF1E0838, t),
                lerpColor(0xFF1E58C4, 0xFF501870, t),
                lerpColor(0xFF4888E0, 0xFFB83C30, t),
                lerpColor(0xFF8CC4F8, 0xFFEB7028, t),
                lerpColor(0xFFC8E6FF, 0xFFFBDE58, t) };
            positions = new float[]{ 0f, 0.20f, 0.44f, 0.70f, 1f };

        } else {
            /* ── Sunset/Isha: deep crimson-purple ── */
            float t = Math.min(1f, (float)(sec - maghribS) / Math.max(1, ishaS - maghribS));
            colors    = new int[]{
                lerpColor(0xFF1E0838, 0xFF080318, t),
                lerpColor(0xFF501870, 0xFF200535, t),
                lerpColor(0xFFB83C30, 0xFF6A1010, t),
                lerpColor(0xFFEB7028, 0xFF9A2808, t),
                lerpColor(0xFFFBDE58, 0xFFC05018, t) };
            positions = new float[]{ 0f, 0.22f, 0.48f, 0.74f, 1f };
        }

        Paint p = new Paint();
        p.setShader(new LinearGradient(0, 0, 0, h, colors, positions, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h, p);
    }

    /* ══════════════════════════════════════════════════════════
       CLOUDS — procedural fluffy clouds with golden-hour tint
    ══════════════════════════════════════════════════════════ */
    private static void drawClouds(Canvas c, int w, int h,
                                   int sec, int fajrS, int sunriseS,
                                   int maghribS, int ishaS, float goldenTint) {
        float opacity;
        if (sec < sunriseS) {
            opacity = 0.45f * ((float)(sec - fajrS) / Math.max(1, sunriseS - fajrS));
        } else if (sec > maghribS) {
            opacity = 0.60f * (1f - (float)(sec - maghribS) / Math.max(1, ishaS - maghribS));
        } else {
            opacity = 0.78f;
        }
        if (opacity < 0.03f) return;

        /* Slow rightward drift: 1 full width every ~90 min */
        float drift = (sec / 5400f) * w;

        /* 5 cloud formations at various heights and speeds */
        drawCloudFormation(c, w, h, wrapX(0.08f * w + drift * 1.00f, w), h * 0.11f, w * 0.23f, opacity,          goldenTint, 0);
        drawCloudFormation(c, w, h, wrapX(0.52f * w + drift * 0.65f, w), h * 0.18f, w * 0.18f, opacity * 0.82f, goldenTint, 1);
        drawCloudFormation(c, w, h, wrapX(0.82f * w + drift * 1.30f, w), h * 0.07f, w * 0.14f, opacity * 0.68f, goldenTint, 2);
        drawCloudFormation(c, w, h, wrapX(0.30f * w + drift * 0.45f, w), h * 0.28f, w * 0.11f, opacity * 0.50f, goldenTint, 3);
        drawCloudFormation(c, w, h, wrapX(0.70f * w + drift * 0.80f, w), h * 0.22f, w * 0.09f, opacity * 0.42f, goldenTint, 4);
    }

    private static float wrapX(float x, int w) {
        return ((x % w) + w) % w;
    }

    /* One cloud = many overlapping soft radial-gradient circles */
    private static void drawCloudFormation(Canvas c, int w, int h,
                                           float cx, float cy, float base,
                                           float opacity, float golden, int variant) {
        /* Puff layout: {dx, dy, sizeFactor} */
        float[][] puffs;
        switch (variant % 4) {
            case 0:
                puffs = new float[][]{
                    { 0,          0,            1.00f },
                    { -base*.56f, base*.13f,    0.76f },
                    {  base*.54f, base*.09f,    0.73f },
                    { -base*.26f, -base*.22f,   0.66f },
                    {  base*.26f, -base*.19f,   0.61f },
                    {  base*.82f, base*.16f,    0.54f },
                    { -base*.84f, base*.19f,    0.50f },
                    {  base*.10f, -base*.10f,   0.48f },
                };
                break;
            case 1:
                puffs = new float[][]{
                    { 0,          0,            1.00f },
                    { -base*.46f, base*.14f,    0.80f },
                    {  base*.43f, base*.10f,    0.77f },
                    { -base*.20f, -base*.20f,   0.68f },
                    {  base*.68f, base*.18f,    0.56f },
                    { -base*.60f, -base*.08f,   0.50f },
                };
                break;
            case 2:
                puffs = new float[][]{
                    { 0,          0,            1.00f },
                    { -base*.42f, base*.12f,    0.74f },
                    {  base*.40f, base*.08f,    0.70f },
                    { -base*.16f, -base*.16f,   0.62f },
                    {  base*.55f, base*.14f,    0.52f },
                };
                break;
            default:
                puffs = new float[][]{
                    { 0,          0,            1.00f },
                    { -base*.38f, base*.10f,    0.72f },
                    {  base*.36f, base*.07f,    0.68f },
                    {  base*.62f, base*.13f,    0.52f },
                };
                break;
        }

        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        /* Cloud base color shifts from pure white → warm apricot during golden hour */
        int cR = 255;
        int cG = (int)(255 - golden * 72);
        int cB = (int)(255 - golden * 135);

        for (float[] puff : puffs) {
            float px = cx + puff[0];
            float py = cy + puff[1];
            float r  = base * puff[2];

            /* Wrap horizontally so clouds seamlessly re-enter the frame */
            if (px + r < 0) px += w;
            if (px - r > w) px -= w;

            int alphaTop  = (int)(opacity * 210);
            int alphaMid  = (int)(opacity * 140);

            /* Top highlight — bright and soft */
            paint.setShader(new RadialGradient(
                px, py - r * 0.18f, r,
                new int[]{
                    Color.argb(alphaTop, cR, cG, cB),
                    Color.argb(alphaMid, (int)(cR*.98f), (int)(cG*.95f), (int)(cB*.92f)),
                    Color.argb(0,        cR, cG, cB)
                },
                new float[]{ 0f, 0.58f, 1f },
                Shader.TileMode.CLAMP));
            c.drawCircle(px, py, r, paint);

            /* Bottom shadow — darker blue-grey to give depth */
            int shadowA = (int)(opacity * 55);
            paint.setShader(new RadialGradient(
                px, py + r * 0.30f, r * 0.68f,
                new int[]{ Color.argb(shadowA, 140, 155, 195),
                           Color.argb(0, 140, 155, 195) },
                new float[]{ 0f, 1f },
                Shader.TileMode.CLAMP));
            c.drawCircle(px, py + r * 0.32f, r * 0.68f, paint);
        }
    }

    /* ══════════════════════════════════════════════════════════
       STARS — twinkling with size classes and colour temperature
    ══════════════════════════════════════════════════════════ */
    private static void drawStars(Canvas c, int w, int h, float opacity, int sec) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        long  now = System.currentTimeMillis();

        for (int i = 0; i < 130; i++) {
            float x  = fsin(i, 563.1)  * w;
            float y  = fsin(i, 291.3)  * h * 0.80f;
            float sz = fsin(i, 127.1)  > 0.90f ? 1.9f
                     : fsin(i, 127.1)  > 0.68f ? 1.1f : 0.55f;

            /* Per-star twinkle at different rates */
            double twinkleSpeed = 600 + (i % 7) * 150.0;
            float  twinkle      = 0.70f + 0.30f * (float)Math.sin(now / twinkleSpeed + i * 2.31);
            float  alp          = (0.20f + fsin(i, 311.7) * 0.72f) * opacity * twinkle;

            int colSel = (int)(fsin(i, 193.7) * 5);
            int col = colSel >= 4 ? 0xFFFFE8D0   /* warm orange */
                    : colSel == 3 ? 0xFFE8EEFF   /* cool blue   */
                    : colSel == 2 ? 0xFFFFF0E0   /* pale yellow */
                    : colSel == 1 ? 0xFFEEF4FF   /* icy white   */
                    :               0xFFFFFFFF;

            p.setColor(col);
            p.setAlpha(Math.min(255, (int)(alp * 255)));

            /* Big stars get a glow halo */
            if (sz > 1.5f) {
                int glowA = Math.min(255, (int)(alp * 140));
                p.setShader(new RadialGradient(x, y, sz * 3.5f,
                    new int[]{ (col & 0x00FFFFFF) | (glowA << 24), Color.TRANSPARENT },
                    new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
                c.drawCircle(x, y, sz * 3.5f, p);
                p.setShader(null);
                p.setAlpha(Math.min(255, (int)(alp * 255)));
            }
            c.drawCircle(x, y, sz, p);
        }
    }

    /* ══════════════════════════════════════════════════════════
       SUN — arc from right to left (RTL), golden glow
    ══════════════════════════════════════════════════════════ */
    private static void drawSun(Canvas c, int w, int h,
                                int sec, int sunriseS, int maghribS) {
        if (sec < sunriseS || sec > maghribS) return;
        int   dayLen = maghribS - sunriseS;
        float t      = (float)(sec - sunriseS) / dayLen;

        /* Arc path: rises from left (East) sets to right (West), RTL reversed */
        float sx = (0.10f + t * 0.80f) * w;
        float sy = (0.88f - (float)Math.sin(t * Math.PI) * 0.80f) * h;

        boolean isGolden = (t < 0.10f || t > 0.90f);
        int  glowColor   = isGolden ? 0xFFE86820 : 0xFFFFD020;
        float sunR       = isGolden ? w * 0.060f  : w * 0.048f;

        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        /* Outer atmospheric haze */
        p.setShader(new RadialGradient(sx, sy, sunR * 8f,
            new int[]{ (glowColor & 0x00FFFFFF) | 0x48000000, 0x00000000 },
            new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(sx, sy, sunR * 8f, p);

        /* Inner glow ring */
        p.setShader(new RadialGradient(sx, sy, sunR * 2.8f,
            new int[]{ (glowColor & 0x00FFFFFF) | 0x95000000, 0x00000000 },
            new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(sx, sy, sunR * 2.8f, p);

        /* Sun disk with off-centre 3-D highlight */
        p.setShader(new RadialGradient(sx - sunR * 0.24f, sy - sunR * 0.30f, sunR,
            new int[]{ 0xFFFFFEF8, 0xFFFFF0B0, 0xFFFFC840, glowColor },
            new float[]{ 0f, 0.28f, 0.62f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(sx, sy, sunR, p);
    }

    /* ══════════════════════════════════════════════════════════
       MOON — phase-accurate crescent with rim light
    ══════════════════════════════════════════════════════════ */
    private static void drawMoon(Canvas c, int w, int h,
                                 int sec, int maghribS, int ishaS,
                                 double moonPhase) {
        int moonriseSec = ishaS + 30 * 60;
        int moonsetSec  = 24 * 3600 + (int)(4.5 * 3600);
        int totalNight  = moonsetSec - moonriseSec;

        float t;
        if (sec >= moonriseSec) t = (float)(sec - moonriseSec) / totalNight;
        else                    t = (float)(sec + 24 * 3600 - moonriseSec) / totalNight;
        t = Math.max(0f, Math.min(1f, t));

        float mx = (0.88f - t * 0.78f) * w;
        float my = (0.78f - (float)Math.sin(t * Math.PI) * 0.66f) * h;
        float r  = w * 0.058f;

        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        /* Moonlight glow */
        p.setShader(new RadialGradient(mx, my, r * 4.5f,
            new int[]{ 0x38B8CCFF, 0x00B8CCFF },
            new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(mx, my, r * 4.5f, p);

        /* Dark base disc */
        p.setShader(null);
        p.setColor(Color.argb(240, 6, 12, 28));
        c.drawCircle(mx, my, r, p);

        /* Phase-accurate surface + shadow */
        float phaseNorm = (float)((moonPhase % 1.0 + 1.0) % 1.0);
        boolean waning  = phaseNorm > 0.5f;
        float   pv      = waning ? 1f - phaseNorm : phaseNorm;
        float   shadowX_off = r * (1f - pv * 2f);

        int savedLayer = c.saveLayer(mx - r * 2.5f, my - r * 2.5f,
                                     mx + r * 2.5f, my + r * 2.5f, null);

        /* Lunar surface */
        p.setShader(new RadialGradient(mx + r * 0.24f, my - r * 0.24f, r,
            new int[]{ 0xFFFEFDF8, 0xFFECF4FF, 0xFFBBC8DE },
            new float[]{ 0f, 0.48f, 1f }, Shader.TileMode.CLAMP));
        p.setXfermode(null);
        c.drawCircle(mx, my, r, p);

        /* Shadow to carve the crescent */
        p.setShader(null);
        p.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));
        float shadowX = waning ? mx + shadowX_off : mx - shadowX_off;
        c.drawCircle(shadowX, my, r, p);
        p.setXfermode(null);
        c.restoreToCount(savedLayer);

        /* Thin rim highlight */
        p.setColor(Color.argb(110, 255, 254, 245));
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(r * 0.055f);
        c.drawCircle(mx, my, r, p);
        p.setStyle(Paint.Style.FILL);
    }

    /* ══════════════════════════════════════════════════════════
       VIGNETTE — edges + bottom gradient for text readability
    ══════════════════════════════════════════════════════════ */
    private static void drawVignette(Canvas c, int w, int h) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        /* Radial edge darkening */
        p.setShader(new RadialGradient(w / 2f, h / 2f, Math.max(w, h) * 0.72f,
            new int[]{ 0x00000000, 0x35000000, 0x65000000 },
            new float[]{ 0f, 0.68f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h, p);

        /* Bottom scrim so text rows are always legible */
        p.setShader(new LinearGradient(0, h * 0.50f, 0, h,
            new int[]{ 0x00000000, 0x48000000 },
            new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.50f, w, h, p);
    }
}
