package com.noor.app.widget;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

import java.util.Random;

/**
 * محرك السماء الفلكي — سماء حقيقية بناءً على:
 * • موقع الشمس الفعلي (Solar Elevation & Azimuth) — USNO Simplified Algorithm
 * • طور القمر الحقيقي وموقعه (Jean Meeus)
 * • مواقع 30 نجماً من كتالوج IAU تظهر تدريجياً حسب الظلام
 * • كوكبا الزهرة والمشتري في مواقعهما التقريبية
 * • مراحل الشفق الثلاث: Civil (-6°) / Nautical (-12°) / Astronomical (-18°)
 * • تبعثر رايلي (Rayleigh Scattering) — أزرق داكن أعلى، فاتح عند الأفق
 * • Golden Hour وBlue Hour أثناء الفجر والمغرب
 * • سحاب بثلاث طبقات Parallax بسرعات مختلفة
 * • هالات حول الشمس والقمر وشهب عشوائية وتوهج نجمي غير متزامن
 */
public final class SkyBitmapRenderer {

    private SkyBitmapRenderer() {}

    // ─────────────────────────────────────────────────────────────────────────
    // كتالوج النجوم: { RA_hours, Dec_degrees, magnitude, twinkle_period_ms }
    // ─────────────────────────────────────────────────────────────────────────
    private static final double[][] STARS = {
        {  6.753, -16.716, -1.46, 2200 }, // Sirius
        {  6.399, -52.696, -0.74, 3100 }, // Canopus
        { 14.261,  19.182, -0.05, 2700 }, // Arcturus
        { 18.615,  38.783,  0.03, 1900 }, // Vega
        {  5.278,  45.998,  0.08, 3400 }, // Capella
        {  5.242,  -8.202,  0.13, 2500 }, // Rigel
        {  7.655,   5.225,  0.38, 2900 }, // Procyon
        {  1.628, -57.237,  0.46, 4100 }, // Achernar
        {  5.919,   7.407,  0.50, 3700 }, // Betelgeuse
        { 14.064, -60.373,  0.61, 2300 }, // Hadar
        { 19.847,   8.868,  0.77, 1800 }, // Altair
        { 12.443, -63.099,  0.77, 4300 }, // Acrux
        {  4.599,  16.509,  0.87, 2600 }, // Aldebaran
        { 16.490, -26.432,  0.96, 3900 }, // Antares
        { 13.420, -11.161,  0.98, 2100 }, // Spica
        {  7.755,  28.026,  1.16, 3300 }, // Pollux
        { 22.961, -29.622,  1.17, 2800 }, // Fomalhaut
        { 20.691,  45.280,  1.25, 4700 }, // Deneb
        { 12.795, -59.689,  1.25, 3600 }, // Mimosa
        { 10.140,  11.967,  1.36, 2400 }, // Regulus
        {  6.977, -28.972,  1.50, 5100 }, // Adhara
        {  7.577,  31.888,  1.58, 2000 }, // Castor
        { 17.560, -37.104,  1.62, 4400 }, // Shaula
        { 12.519, -57.113,  1.64, 3200 }, // Gacrux
        {  5.418,   6.350,  1.64, 2700 }, // Bellatrix
        {  5.438,  28.608,  1.68, 3800 }, // Elnath
        { 17.621, -43.239,  1.62, 4900 }, // Kaus Australis
        {  9.459, -65.072,  1.67, 3500 }, // Avior
        {  8.159, -47.337,  1.75, 2200 }, // Miaplacidus
        { 11.062, -61.685,  1.75, 4600 }, // Epsilon Carinae
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Cache فلكي — يُحدَّث مرة كل دقيقة
    // ─────────────────────────────────────────────────────────────────────────
    private static long     lastCalcMin  = -1;
    private static double   cSunAlt, cSunAz;
    private static double   cMoonAlt, cMoonAz, cMoonPhase;
    private static double   cVenusAlt, cVenusAz;
    private static double   cJupAlt,   cJupAz;
    private static double[][] cStarPos; // [alt, az] لكل نجم

    // ─────────────────────────────────────────────────────────────────────────
    // نقطة الدخول — تُستدعى كل ثانية من الـ Service
    // ─────────────────────────────────────────────────────────────────────────
    public static Bitmap render(int w, int h,
                                double lat, double lng,
                                long fajrMs, long sunriseMs, long dhuhrMs,
                                long asrMs,  long maghribMs, long ishaMs) {
        if (w <= 0 || h <= 0) return null;

        long now    = System.currentTimeMillis();
        long nowMin = now / 60_000L;

        // أعِد الحسابات الفلكية كل دقيقة فقط (مُكلفة)
        boolean hasGps = (lat != 0.0 || lng != 0.0);
        if (nowMin != lastCalcMin || cStarPos == null) {
            lastCalcMin = nowMin;
            double jd   = julianDate(now);

            if (hasGps) {
                double[] sun   = solarPosition(jd, lat, lng);
                cSunAlt = sun[0];  cSunAz = sun[1];

                double[] moon  = moonPosition(jd, lat, lng);
                cMoonAlt = moon[0]; cMoonAz = moon[1];

                double[] venus = planetPosition(jd, lat, lng, 181.979, 1.6021302, 0.723);
                cVenusAlt = venus[0]; cVenusAz = venus[1];

                double[] jup   = planetPosition(jd, lat, lng,  34.351, 0.0830853, 5.203);
                cJupAlt = jup[0]; cJupAz = jup[1];

                double gmst = greenwichSiderealTime(jd);
                cStarPos = new double[STARS.length][2];
                for (int i = 0; i < STARS.length; i++) {
                    double[] hp = raDecToAltAz(STARS[i][0], STARS[i][1], lat, lng, gmst);
                    cStarPos[i][0] = hp[0];
                    cStarPos[i][1] = hp[1];
                }
            } else {
                // فولباك: اخترع موقع الشمس من أوقات الصلاة
                cSunAlt = fallbackSunAlt(now, fajrMs, sunriseMs, dhuhrMs, asrMs, maghribMs, ishaMs);
                cSunAz  = fallbackSunAz(now, sunriseMs, maghribMs);
                cMoonAlt = 35; cMoonAz = 250;
                cVenusAlt = -1; cJupAlt = -1;
                // نجوم بمواقع تقريبية ثابتة
                cStarPos = new double[STARS.length][2];
                Random rnd = new Random(42);
                for (int i = 0; i < STARS.length; i++) {
                    cStarPos[i][0] = 10 + rnd.nextDouble() * 70;
                    cStarPos[i][1] = rnd.nextDouble() * 360;
                }
            }
            cMoonPhase = moonPhase(jd);
        }

        // ── الرسم ────────────────────────────────────────────────────────
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c   = new Canvas(bmp);
        Paint  p   = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);

        float sunX  = azToX(cSunAz,  w);
        float sunY  = altToY(cSunAlt, h);
        float moonX = azToX(cMoonAz,  w);
        float moonY = altToY(cMoonAlt, h);

        // 1. تدرج السماء الرئيسي (Rayleigh scattering)
        drawSkyGradient(c, w, h, p, cSunAlt);

        // 2. توهج الأفق عند الشروق / الغروب
        drawHorizonGlow(c, w, h, p, cSunAlt, sunX);

        // 3. النجوم بمواقعها الحقيقية
        drawStars(c, w, h, p, cSunAlt, cMoonPhase, now);

        // 4. كوكب الزهرة
        if (cVenusAlt > 2) drawPlanet(c, p, cVenusAlt, cVenusAz, w, h, 0xFFFFFFDD, 3.0f);
        // 5. كوكب المشتري
        if (cJupAlt   > 2) drawPlanet(c, p, cJupAlt,   cJupAz,   w, h, 0xFFFFEECC, 4.0f);

        // 6. شهاب عشوائي (ليلاً فقط)
        drawShootingStar(c, w, h, p, cSunAlt, now);

        // 7. القمر بطوره الحقيقي
        if (cMoonAlt > -5) drawMoon(c, p, moonX, moonY, h, cMoonPhase, cSunAlt);

        // 8. الشمس مع هالتها
        if (cSunAlt > -2) drawSun(c, p, sunX, sunY, h, cSunAlt);

        // 9. سحاب بطبقات Parallax
        drawClouds(c, w, h, p, cSunAlt, now);

        // 10. حواف دائرية (clip to RoundRect)
        applyRoundedCorners(bmp, w, h);

        return bmp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. تدرج السماء — Rayleigh Scattering
    // ─────────────────────────────────────────────────────────────────────────
    private static void drawSkyGradient(Canvas c, int w, int h, Paint p, double sunAlt) {
        int[] colors = skyColors(sunAlt);
        p.setShader(new LinearGradient(0, 0, 0, h,
            new int[]{ colors[0], colors[1], colors[2] },
            new float[]{ 0f, 0.55f, 1f },
            Shader.TileMode.CLAMP));
        p.setStyle(Paint.Style.FILL);
        c.drawRect(0, 0, w, h, p);
        p.setShader(null);
    }

    /** ألوان [سمت الرأس، منتصف، أفق] بناءً على ارتفاع الشمس بالدرجات */
    private static int[] skyColors(double a) {
        if (a >= 40)
            return new int[]{ 0xFF0B4DB8, 0xFF2575D8, 0xFF90C6FF };
        if (a >= 20) {
            float t = (float)((a - 20) / 20);
            return new int[]{
                lerpColor(0xFF163590, 0xFF0B4DB8, t),
                lerpColor(0xFF2A64C0, 0xFF2575D8, t),
                lerpColor(0xFFB5DCFF, 0xFF90C6FF, t) };
        }
        if (a >= 6) {
            float t = (float)((a - 6) / 14);
            return new int[]{
                lerpColor(0xFF192870, 0xFF163590, t),
                lerpColor(0xFF264EA8, 0xFF2A64C0, t),
                lerpColor(0xFFFFD8A0, 0xFFB5DCFF, t) };
        }
        if (a >= 0) {                         // Golden Hour
            float t = (float)(a / 6);
            return new int[]{
                lerpColor(0xFF0D1858, 0xFF192870, t),
                lerpColor(0xFF261470, 0xFF264EA8, t),
                lerpColor(0xFFFF6B10, 0xFFFFD8A0, t) };
        }
        if (a >= -6) {                        // Civil Twilight
            float t = (float)((a + 6) / 6);
            return new int[]{
                lerpColor(0xFF050820, 0xFF0D1858, t),
                lerpColor(0xFF120A3A, 0xFF261470, t),
                lerpColor(0xFF7A0C18, 0xFFFF6B10, t) };
        }
        if (a >= -12) {                       // Nautical Twilight
            float t = (float)((a + 12) / 6);
            return new int[]{
                lerpColor(0xFF020410, 0xFF050820, t),
                lerpColor(0xFF07051E, 0xFF120A3A, t),
                lerpColor(0xFF260520, 0xFF7A0C18, t) };
        }
        if (a >= -18) {                       // Astronomical Twilight
            float t = (float)((a + 18) / 6);
            return new int[]{
                lerpColor(0xFF010208, 0xFF020410, t),
                lerpColor(0xFF02020C, 0xFF07051E, t),
                lerpColor(0xFF090510, 0xFF260520, t) };
        }
        return new int[]{ 0xFF010208, 0xFF020210, 0xFF06040E }; // ليل تام
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. توهج الأفق (Golden / Blue Hour Glow)
    // ─────────────────────────────────────────────────────────────────────────
    private static void drawHorizonGlow(Canvas c, int w, int h, Paint p,
                                        double sunAlt, float sunX) {
        if (sunAlt < -10 || sunAlt > 25) return;
        float inten = (float)(sunAlt < 0
            ? 1.0 - Math.abs(sunAlt) / 10.0
            : 1.0 - sunAlt / 25.0);
        inten = Math.max(0, Math.min(1, inten));
        int a = (int)(200 * inten);

        int innerColor = sunAlt < 1 ? Color.argb(a, 255, 120, 10) : Color.argb(a, 255, 200, 80);
        p.setShader(new RadialGradient(sunX, h, w * 0.75f,
            new int[]{ innerColor, Color.argb(a / 3, 255, 80, 0), Color.argb(0, 0, 0, 0) },
            new float[]{ 0f, 0.4f, 1f }, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(sunX - w * 0.75f, h * 0.55f, sunX + w * 0.75f, h * 1.1f), p);
        p.setShader(null);

        // Blue Hour بعيد عن قرص الشمس
        if (sunAlt > -4 && sunAlt < 4) {
            int ba = (int)(80 * inten);
            p.setShader(new RadialGradient(w - sunX, h, w * 0.6f,
                new int[]{ Color.argb(ba, 40, 80, 200), Color.argb(0, 0, 0, 0) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(0, 0, w, h, p);
            p.setShader(null);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. النجوم — تظهر تدريجياً حسب الظلام، وتتلألأ بشكل غير متزامن
    // ─────────────────────────────────────────────────────────────────────────
    private static void drawStars(Canvas c, int w, int h, Paint p,
                                  double sunAlt, double moonPhase, long now) {
        if (sunAlt > -5) return;

        // حد الحجم الظاهري بناءً على الظلام
        double maxMag;
        if      (sunAlt > -12) maxMag = -0.3;  // شفق بحري
        else if (sunAlt > -18) maxMag =  1.6;  // شفق فلكي
        else                   maxMag =  3.0;  // ليل كامل

        // القمر المضيء يُضعف النجوم
        double moonIll = moonIllumination(moonPhase);
        if (moonIll > 0.4 && cMoonAlt > 10) maxMag -= (moonIll - 0.4) * 2.0;

        float dark = (float)(Math.min(1, (-sunAlt - 5) / 13.0));
        p.setStyle(Paint.Style.FILL);

        for (int i = 0; i < STARS.length && cStarPos != null; i++) {
            if (STARS[i][2] > maxMag) continue;
            double alt = cStarPos[i][0], az = cStarPos[i][1];
            if (alt < 2) continue;

            float sx = azToX(az, w), sy = altToY(alt, h);
            if (sx < -8 || sx > w + 8 || sy < -8 || sy > h + 8) continue;

            // لمعة بناءً على الحجم الظاهري
            float bright = (float)(1.0 - (STARS[i][2] + 1.5) / 4.8);
            bright = Math.max(0.08f, Math.min(1f, bright));

            // توهج غير متزامن (twinkle)
            double period = STARS[i][3];
            float twinkle = 0.78f + 0.22f * (float)Math.sin((now % (long)period) / period * 2 * Math.PI);
            bright *= twinkle * dark;

            float r = 0.6f + bright * 1.8f;
            int   a = (int)(255 * bright);
            // النجوم اللامعة جداً لها هالة صغيرة
            if (STARS[i][2] < 0.5) {
                p.setShader(new RadialGradient(sx, sy, r * 5,
                    new int[]{ Color.argb(a / 4, 210, 225, 255), Color.argb(0, 200, 220, 255) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(sx, sy, r * 5, p);
                p.setShader(null);
            }
            // جسم النجم مع لون بناءً على درجة الحرارة
            int starColor = STARS[i][2] < 0 ? 0xFFCCDDFF : (STARS[i][2] < 1 ? 0xFFFFFFFF : 0xFFFFEEDD);
            p.setColor(Color.argb(a, Color.red(starColor), Color.green(starColor), Color.blue(starColor)));
            c.drawCircle(sx, sy, r, p);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. كواكب
    // ─────────────────────────────────────────────────────────────────────────
    private static void drawPlanet(Canvas c, Paint p,
                                   double alt, double az, int w, int h,
                                   int color, float r) {
        float x = azToX(az, w), y = altToY(alt, h);
        p.setShader(new RadialGradient(x, y, r * 5,
            new int[]{ Color.argb(90, Color.red(color), Color.green(color), Color.blue(color)),
                       Color.argb(0, 0, 0, 0) }, null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r * 5, p);
        p.setShader(null);
        p.setColor(color);
        c.drawCircle(x, y, r, p);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. شهاب عشوائي ليلاً
    // ─────────────────────────────────────────────────────────────────────────
    private static long  sLastStart = 0, sNextDelay = 0;
    private static float sX1, sY1, sX2, sY2;

    private static void drawShootingStar(Canvas c, int w, int h, Paint p,
                                         double sunAlt, long now) {
        if (sunAlt > -12) return;
        if (sNextDelay == 0) sNextDelay = 75_000L;

        if (now - sLastStart > sNextDelay) {
            sLastStart  = now;
            Random rnd  = new Random(now / 1000L);
            sNextDelay  = 50_000L + (long)(rnd.nextFloat() * 90_000L);
            sX1 = rnd.nextFloat() * w;
            sY1 = rnd.nextFloat() * h * 0.45f;
            float angle = (float)(Math.PI / 5 + rnd.nextFloat() * Math.PI / 3);
            float len   = w * 0.12f + rnd.nextFloat() * w * 0.14f;
            sX2 = sX1 + (float)(Math.cos(angle) * len);
            sY2 = sY1 + (float)(Math.sin(angle) * len);
        }

        long dur = 1100L, elapsed = now - sLastStart;
        if (elapsed >= dur) return;

        float t  = elapsed / (float) dur;
        float fa = t < 0.15f ? t / 0.15f : 1f - (t - 0.15f) / 0.85f;
        int   a  = (int)(230 * fa);

        float cx = sX1 + (sX2 - sX1) * t;
        float cy = sY1 + (sY2 - sY1) * t;
        float tx = sX1 + (sX2 - sX1) * Math.max(0, t - 0.25f);
        float ty = sY1 + (sY2 - sY1) * Math.max(0, t - 0.25f);

        Paint trail = new Paint(Paint.ANTI_ALIAS_FLAG);
        trail.setColor(Color.argb(a, 255, 252, 240));
        trail.setStrokeWidth(1.8f);
        trail.setStyle(Paint.Style.STROKE);
        trail.setStrokeCap(Paint.Cap.ROUND);
        c.drawLine(tx, ty, cx, cy, trail);

        p.setShader(new RadialGradient(cx, cy, 5,
            new int[]{ Color.argb(a, 255, 255, 255), Color.argb(0, 255, 255, 255) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(cx, cy, 5, p);
        p.setShader(null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. القمر بطوره الحقيقي + هالة + تعتيم الجانب المظلم
    // ─────────────────────────────────────────────────────────────────────────
    private static void drawMoon(Canvas c, Paint p, float x, float y,
                                 int h, double phase, double sunAlt) {
        float yy = Math.min(y, h - 15);
        float r  = h * 0.072f;

        // هالة عند وجود إضاءة كافية
        double ill = moonIllumination(phase);
        if (ill > 0.1 && sunAlt < 0) {
            int haloA = (int)(55 * ill);
            p.setShader(new RadialGradient(x, yy, r * 4f,
                new int[]{ Color.argb(haloA, 240, 238, 200),
                           Color.argb(0, 200, 200, 180) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(x, yy, r * 4f, p);
            p.setShader(null);
        }

        // الجانب المظلم
        p.setColor(0xFF0B1220); p.setStyle(Paint.Style.FILL);
        c.drawCircle(x, yy, r, p);

        // الجانب المضيء — منحنى الطور
        if (ill > 0.015) {
            // زاوية الطور: terminator x على سطح القمر
            double phAngle = phase * 2 * Math.PI;
            float term = r * (float) Math.cos(phAngle);  // موضع حد الإضاءة
            boolean waning = (phase > 0.5);

            Path mp = new Path();
            RectF oval = new RectF(x - r, yy - r, x + r, yy + r);

            if (!waning) {
                // تزايد: الجانب الأيمن مضيء
                mp.addArc(oval, -90, 180);
                float absT = Math.abs(term);
                if (term >= 0) {
                    mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), 90, 180);
                } else {
                    mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), 90, -180);
                }
            } else {
                // تناقص: الجانب الأيسر مضيء
                mp.addArc(oval, 90, 180);
                float absT = Math.abs(term);
                if (term >= 0) {
                    mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), -90, 180);
                } else {
                    mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), -90, -180);
                }
            }
            mp.close();

            p.setShader(new RadialGradient(x, yy - r * 0.15f, r * 1.3f,
                new int[]{ 0xFFEEE8C8, 0xFFD8CCA0, 0xFFC0B87A },
                new float[]{ 0f, 0.65f, 1f }, Shader.TileMode.CLAMP));
            c.drawPath(mp, p);
            p.setShader(null);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. الشمس — هالة جوية + Corona + قرص
    // ─────────────────────────────────────────────────────────────────────────
    private static void drawSun(Canvas c, Paint p, float x, float y, int h, double sunAlt) {
        float r = h * 0.068f;
        float yy = Math.max(y, r + 4);

        // حدة اللون تبعاً للارتفاع (أحمر/برتقالي قرب الأفق)
        boolean lowSun = sunAlt < 8;
        int haloInner = lowSun ? Color.argb(110, 255, 130, 10) : Color.argb(90, 255, 210, 60);
        int haloOuter = lowSun ? Color.argb( 45, 255,  70,  0) : Color.argb(35, 255, 180, 0);

        // هالة خارجية كبيرة
        p.setShader(new RadialGradient(x, yy, r * 10,
            new int[]{ haloInner, haloOuter, Color.argb(0, 255, 140, 0) },
            new float[]{ 0f, 0.35f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(x, yy, r * 10, p);
        p.setShader(null);

        // Corona داخلية
        p.setShader(new RadialGradient(x, yy, r * 2.8f,
            new int[]{ Color.argb(170, 255, 255, 210),
                       Color.argb(55,  255, 210, 80),
                       Color.argb(0,   255, 160, 0) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, yy, r * 2.8f, p);
        p.setShader(null);

        // قرص الشمس
        int center = lowSun ? 0xFFFFE080 : 0xFFFFFFCC;
        int edge   = lowSun ? 0xFFFF9000 : 0xFFFFEC44;
        p.setShader(new RadialGradient(x - r * 0.2f, yy - r * 0.2f, r,
            new int[]{ center, edge }, null, Shader.TileMode.CLAMP));
        c.drawCircle(x, yy, r, p);
        p.setShader(null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. سحاب بثلاث طبقات Parallax
    // ─────────────────────────────────────────────────────────────────────────
    // { base_x[0..1], base_y[0..1], size[0..1], layer(0=بعيد،2=قريب), num_puffs }
    private static final float[][] CLOUD_SEEDS = {
        { 0.05f, 0.12f, 0.28f, 0, 7 }, { 0.55f, 0.10f, 0.23f, 0, 6 },
        { 0.82f, 0.16f, 0.26f, 0, 6 }, { 0.30f, 0.20f, 0.19f, 0, 5 },
        { 0.15f, 0.30f, 0.21f, 1, 6 }, { 0.62f, 0.27f, 0.25f, 1, 7 },
        { 0.88f, 0.25f, 0.17f, 1, 5 }, { 0.40f, 0.38f, 0.23f, 1, 5 },
        { 0.22f, 0.46f, 0.17f, 2, 5 }, { 0.68f, 0.42f, 0.21f, 2, 5 },
        { 0.48f, 0.52f, 0.15f, 2, 4 },
    };
    private static final float[] LAYER_SPEED = { 0.0035f, 0.007f, 0.013f };

    private static void drawClouds(Canvas c, int w, int h, Paint p,
                                   double sunAlt, long now) {
        int cBase, cShad;
        if      (sunAlt > 15) { cBase = Color.argb(195, 255, 255, 255); cShad = Color.argb(70, 130, 150, 195); }
        else if (sunAlt > 0)  {
            float t = (float)(sunAlt / 15);
            cBase = lerpColor(Color.argb(190, 255, 200, 160), Color.argb(195, 255, 255, 255), t);
            cShad = lerpColor(Color.argb( 70,  90,  40,  20), Color.argb( 70, 130, 150, 195), t);
        } else if (sunAlt > -6) { cBase = Color.argb(150, 190, 100,  90); cShad = Color.argb(55, 50, 20, 40); }
        else                    { cBase = Color.argb( 90,  25,  35,  65); cShad = Color.argb(40,  8, 12, 28); }

        float sec = now / 1000f;
        Random rnd = new Random(42);

        for (float[] s : CLOUD_SEEDS) {
            int   layer = (int) s[3];
            float drift = (sec * LAYER_SPEED[layer] * w) % (w * 1.5f);
            float cx = (s[0] * w - drift + w * 1.5f) % (w * 1.5f) - w * 0.25f;
            float cy = s[1] * h;
            float sz = s[2] * w;
            int   np = (int) s[4];
            drawCloudPuffs(c, p, cx, cy, sz, np, cBase, cShad, rnd);
        }
    }

    private static void drawCloudPuffs(Canvas c, Paint p, float cx, float cy,
                                       float sz, int n, int base, int shad, Random rnd) {
        for (int i = 0; i < n; i++) {
            float ox = (rnd.nextFloat() - 0.5f) * sz * 1.5f;
            float oy = (rnd.nextFloat() - 0.5f) * sz * 0.45f;
            float r  =  sz * (0.28f + rnd.nextFloat() * 0.26f);
            float px = cx + ox, py = cy + oy;

            // ظل تحت الغيمة
            p.setShader(new RadialGradient(px, py + r * 0.35f, r * 0.85f,
                new int[]{ shad, Color.argb(0, 0, 0, 0) }, null, Shader.TileMode.CLAMP));
            c.drawOval(new RectF(px - r, py, px + r, py + r * 1.2f), p);
            p.setShader(null);

            // جسم الغيمة
            int br = Color.red(base), bg = Color.green(base),
                bb = Color.blue(base), ba = Color.alpha(base);
            p.setShader(new RadialGradient(px, py - r * 0.12f, r,
                new int[]{
                    Color.argb(ba, Math.min(255, br + 28), Math.min(255, bg + 28), Math.min(255, bb + 28)),
                    Color.argb(ba, br, bg, bb),
                    Color.argb(0,  br, bg, bb)
                }, new float[]{ 0f, 0.62f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(px, py, r, p);
            p.setShader(null);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. حواف دائرية — clip الـ Bitmap بـ PorterDuff DST_IN
    // ─────────────────────────────────────────────────────────────────────────
    private static void applyRoundedCorners(Bitmap bmp, int w, int h) {
        Bitmap mask = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas mc   = new Canvas(mask);
        Paint  mp   = new Paint(Paint.ANTI_ALIAS_FLAG);
        mp.setColor(0xFFFFFFFF);
        float rad = w * 0.085f;
        mc.drawRoundRect(new RectF(0, 0, w, h), rad, rad, mp);

        Paint xfer = new Paint(Paint.ANTI_ALIAS_FLAG);
        xfer.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_IN));
        new Canvas(bmp).drawBitmap(mask, 0, 0, xfer);
        mask.recycle();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // الحسابات الفلكية
    // ─────────────────────────────────────────────────────────────────────────

    static double julianDate(long millis) {
        return millis / 86400000.0 + 2440587.5;
    }

    /** موقع الشمس بالدرجات [altitude, azimuth] — USNO Simplified */
    static double[] solarPosition(double jd, double lat, double lng) {
        double n  = jd - 2451545.0;
        double L  = normDeg(280.46   + 0.9856474 * n);
        double g  = Math.toRadians(normDeg(357.528 + 0.9856003 * n));
        double lam = Math.toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
        double eps = Math.toRadians(23.439 - 0.0000004 * n);

        double sinL = Math.sin(lam);
        double ra   = Math.atan2(Math.cos(eps) * sinL, Math.cos(lam));
        double dec  = Math.asin(Math.sin(eps) * sinL);
        double gmst = greenwichSiderealTime(jd);
        double lst  = normH(gmst + lng / 15.0);
        double ha   = Math.toRadians((lst - Math.toDegrees(ra) / 15.0) * 15.0);

        double lr = Math.toRadians(lat);
        double alt = Math.asin( Math.sin(lr)*Math.sin(dec) + Math.cos(lr)*Math.cos(dec)*Math.cos(ha));
        double az  = Math.atan2(-Math.cos(dec)*Math.sin(ha),
                                 Math.sin(lr)*Math.cos(dec)*Math.cos(ha) - Math.cos(lr)*Math.sin(dec));
        return new double[]{ Math.toDegrees(alt), normDeg(Math.toDegrees(az) + 180) };
    }

    /** موقع القمر [altitude, azimuth] — Jean Meeus مبسّط */
    static double[] moonPosition(double jd, double lat, double lng) {
        double n   = jd - 2451545.0;
        double Lm  = Math.toRadians(normDeg(218.316 + 13.176396 * n));
        double Mm  = Math.toRadians(normDeg(134.963 + 13.064993 * n));
        double F   = Math.toRadians(normDeg( 93.272 + 13.229350 * n));
        double eps = Math.toRadians(23.439 - 0.0000004 * n);

        double lam = Lm + Math.toRadians(6.289 * Math.sin(Mm));
        double bet = Math.toRadians(5.128 * Math.sin(F));

        double ra  = Math.atan2(Math.sin(lam)*Math.cos(eps) - Math.tan(bet)*Math.sin(eps), Math.cos(lam));
        double dec = Math.asin( Math.sin(bet)*Math.cos(eps) + Math.cos(bet)*Math.sin(eps)*Math.sin(lam));

        double gmst = greenwichSiderealTime(jd);
        double lst  = normH(gmst + lng / 15.0);
        double ha   = Math.toRadians((lst - Math.toDegrees(ra) / 15.0) * 15.0);

        double lr  = Math.toRadians(lat);
        double alt = Math.asin( Math.sin(lr)*Math.sin(dec) + Math.cos(lr)*Math.cos(dec)*Math.cos(ha));
        double az  = Math.atan2(-Math.cos(dec)*Math.sin(ha),
                                 Math.sin(lr)*Math.cos(dec)*Math.cos(ha) - Math.cos(lr)*Math.sin(dec));
        return new double[]{ Math.toDegrees(alt), normDeg(Math.toDegrees(az) + 180) };
    }

    /** طور القمر [0=جديد .. 0.5=بدر .. 1=جديد] */
    static double moonPhase(double jd) {
        double d = (jd - 2451550.26) % 29.530588853;
        return d < 0 ? (d + 29.530588853) / 29.530588853 : d / 29.530588853;
    }

    static double moonIllumination(double phase) {
        return (1.0 - Math.cos(phase * 2 * Math.PI)) / 2.0;
    }

    /** موقع كوكب تقريبي [altitude, azimuth] من عناصره المدارية المبسّطة */
    static double[] planetPosition(double jd, double lat, double lng,
                                   double L0, double rate, double sma) {
        double n   = jd - 2451545.0;
        double Lp  = Math.toRadians(normDeg(L0 + rate * n));
        double Ls  = Math.toRadians(normDeg(280.46 + 0.9856474 * n));
        double eps = Math.toRadians(23.439 - 0.0000004 * n);

        double lam = Lp + Math.sin(Lp - Ls) * 0.5 / sma;
        double ra  = Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam));
        double dec = Math.asin(Math.sin(eps) * Math.sin(lam));

        double gmst = greenwichSiderealTime(jd);
        double lst  = normH(gmst + lng / 15.0);
        double ha   = Math.toRadians((lst - Math.toDegrees(ra) / 15.0) * 15.0);

        double lr  = Math.toRadians(lat);
        double alt = Math.asin( Math.sin(lr)*Math.sin(dec) + Math.cos(lr)*Math.cos(dec)*Math.cos(ha));
        double az  = Math.atan2(-Math.cos(dec)*Math.sin(ha),
                                 Math.sin(lr)*Math.cos(dec)*Math.cos(ha) - Math.cos(lr)*Math.sin(dec));
        return new double[]{ Math.toDegrees(alt), normDeg(Math.toDegrees(az) + 180) };
    }

    /** RA/Dec → Altitude/Azimuth */
    static double[] raDecToAltAz(double raH, double decDeg, double lat, double lng, double gmst) {
        double lst = normH(gmst + lng / 15.0);
        double ha  = Math.toRadians((lst - raH) * 15.0);
        double dec = Math.toRadians(decDeg);
        double lr  = Math.toRadians(lat);

        double alt = Math.asin( Math.sin(lr)*Math.sin(dec) + Math.cos(lr)*Math.cos(dec)*Math.cos(ha));
        double az  = Math.atan2(-Math.cos(dec)*Math.sin(ha),
                                 Math.sin(lr)*Math.cos(dec)*Math.cos(ha) - Math.cos(lr)*Math.sin(dec));
        return new double[]{ Math.toDegrees(alt), normDeg(Math.toDegrees(az) + 180) };
    }

    /** وقت رصد غرينتش النجمي بالساعات */
    static double greenwichSiderealTime(double jd) {
        double T    = (jd - 2451545.0) / 36525.0;
        double gmst = 6.697374558 + 2400.0513369 * T + 0.0000258622 * T * T + (jd % 1) * 24.0;
        return normH(gmst);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // تحويل إحداثيات السماء ← الشاشة
    // ─────────────────────────────────────────────────────────────────────────

    /** الاتجاه (0°=N..360°) → X على عرض الشاشة (يعرض 240° حول الجنوب) */
    static float azToX(double az, int w) {
        double rel = az - 60;
        if (rel < 0) rel += 360;
        if (rel > 300) rel = 300;
        return (float)(rel / 300.0 * w);
    }

    /** الارتفاع (0°=أفق .. 90°=سمت) → Y على ارتفاع الشاشة */
    static float altToY(double alt, int h) {
        return h * (1f - (float)(alt / 90.0) * 0.88f);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // فولباك: موقع شمس تقريبي من أوقات الصلاة (عند غياب GPS)
    // ─────────────────────────────────────────────────────────────────────────
    private static double fallbackSunAlt(long now, long fajrMs, long sunriseMs,
                                         long dhuhrMs, long asrMs, long maghribMs, long ishaMs) {
        long n = now;
        if (n < fajrMs)    return -20;
        if (n < sunriseMs) return -8  + 8  * (n - fajrMs)    / (double)(sunriseMs - fajrMs);
        if (n < dhuhrMs)   return  0  + 60 * (n - sunriseMs) / (double)(dhuhrMs   - sunriseMs);
        if (n < asrMs)     return 60  - 20 * (n - dhuhrMs)   / (double)(asrMs     - dhuhrMs);
        if (n < maghribMs) return 40  - 40 * (n - asrMs)     / (double)(maghribMs - asrMs);
        if (n < ishaMs)    return  0  - 12 * (n - maghribMs) / (double)(ishaMs    - maghribMs);
        return -18;
    }

    private static double fallbackSunAz(long now, long sunriseMs, long maghribMs) {
        if (now <= sunriseMs) return 90;
        if (now >= maghribMs) return 270;
        double t = (now - sunriseMs) / (double)(maghribMs - sunriseMs);
        return 90 + 180 * t;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // دوال مساعدة
    // ─────────────────────────────────────────────────────────────────────────
    static double normDeg(double d) { d %= 360; return d < 0 ? d + 360 : d; }
    static double normH  (double h) { h %=  24; return h < 0 ? h +  24 : h; }

    static int lerpColor(int c1, int c2, float t) {
        t = Math.max(0f, Math.min(1f, t));
        return Color.argb(
            (int)(Color.alpha(c1) + (Color.alpha(c2) - Color.alpha(c1)) * t),
            (int)(Color.red(c1)   + (Color.red(c2)   - Color.red(c1))   * t),
            (int)(Color.green(c1) + (Color.green(c2) - Color.green(c1)) * t),
            (int)(Color.blue(c1)  + (Color.blue(c2)  - Color.blue(c1))  * t));
    }
}
