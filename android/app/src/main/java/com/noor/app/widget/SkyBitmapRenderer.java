package com.noor.app.widget;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

import java.util.Random;

/**
 * محرك السماء الفلكي المتقدم — النسخة الشاملة v3.0
 *
 * المميزات الجديدة:
 *  • اتجاه منير القمر حسب موقع الشمس الفعلي (sun-relative terminator)
 *  • مآذن ومباني إسلامية واقعية في الأفق
 *  • مذنب واقعي بذيلين (غبار + أيونات) يظهر دورياً
 *  • بقع شمسية + لهب شمسي (Solar Flares + Sunspots)
 *  • نجمة القطب أكثر وضوحاً مع هالة مميزة
 *  • المشتري مع أحزمة جوية + نقطة حمراء + 4 أقمار
 *  • طيور مهاجرة عند الغروب (Silhouette birds)
 *  • انعكاس المدينة في الماء أسفل الأفق
 *  • هلال رمضان ذهبي مميز
 *  • عمود ضوء القمر (Moon Pillar) فوق الأفق
 *  • ضبابية الحرارة (Heat Haze) وقت الظهيرة
 *  • تصحيح كامل لأطوار القمر بالتقويم الهجري
 */
public final class SkyBitmapRenderer {

    private SkyBitmapRenderer() {}

    // ═══════════════════════════════════════════════════════════════════════
    // كتالوج النجوم: { RA_h, Dec_deg, magnitude, twinkle_ms, spectral }
    // spectral: 0=O/B أزرق  1=A أبيض  2=F أصفر-أبيض  3=G أصفر  4=K برتقالي  5=M أحمر
    // ═══════════════════════════════════════════════════════════════════════
    private static final double[][] STARS = {
        {  6.753, -16.716, -1.46, 2200, 1 }, // Sirius (A1)
        {  6.399, -52.696, -0.74, 3100, 1 }, // Canopus (A9)
        { 14.261,  19.182, -0.05, 2700, 4 }, // Arcturus (K0)
        { 14.660, -60.835, -0.27, 3000, 3 }, // Alpha Centauri (G2)
        { 18.615,  38.783,  0.03, 1900, 1 }, // Vega (A0)
        {  5.278,  45.998,  0.08, 3400, 3 }, // Capella (G5)
        {  5.242,  -8.202,  0.13, 2500, 0 }, // Rigel (B8)
        {  7.655,   5.225,  0.38, 2900, 2 }, // Procyon (F5)
        {  1.628, -57.237,  0.46, 4100, 0 }, // Achernar (B6)
        {  5.919,   7.407,  0.50, 3700, 5 }, // Betelgeuse (M2)
        { 14.064, -60.373,  0.61, 2300, 0 }, // Hadar (B1)
        { 19.847,   8.868,  0.77, 1800, 1 }, // Altair (A7)
        { 12.443, -63.099,  0.77, 4300, 0 }, // Acrux (B0)
        {  4.599,  16.509,  0.87, 2600, 4 }, // Aldebaran (K5)
        { 16.490, -26.432,  0.96, 3900, 5 }, // Antares (M1)
        { 13.420, -11.161,  0.98, 2100, 0 }, // Spica (B1)
        {  7.755,  28.026,  1.16, 3300, 4 }, // Pollux (K0)
        { 22.961, -29.622,  1.17, 2800, 1 }, // Fomalhaut (A3)
        { 20.691,  45.280,  1.25, 4700, 1 }, // Deneb (A2)
        { 12.795, -59.689,  1.25, 3600, 0 }, // Mimosa (B0)
        { 10.140,  11.967,  1.36, 2400, 0 }, // Regulus (B7)
        {  6.977, -28.972,  1.50, 5100, 0 }, // Adhara (B2)
        {  7.577,  31.888,  1.58, 2000, 1 }, // Castor (A2)
        { 17.560, -37.104,  1.62, 4400, 0 }, // Shaula (B2)
        { 12.519, -57.113,  1.64, 3200, 0 }, // Gacrux (M4)
        {  5.418,   6.350,  1.64, 2700, 0 }, // Bellatrix (B2)
        {  5.438,  28.608,  1.68, 3800, 0 }, // Elnath (B7)
        { 17.621, -43.239,  1.62, 4900, 0 }, // Kaus Australis (B9)
        {  8.159, -47.337,  1.75, 2200, 1 }, // Miaplacidus (A2)
        {  9.459, -65.072,  1.67, 3500, 4 }, // Avior (K3)
        {  2.530,  89.264,  1.97, 5500, 2 }, // Polaris (F7) — نجم القطب [30]
        {  3.791,  24.113,  1.87, 2800, 0 }, // Alcyone/Pleiades ref (B7)
        {  9.460,  -8.658,  1.99, 3100, 4 }, // Alphard (K3)
        {  2.120,  23.463,  2.00, 4200, 4 }, // Hamal (K2)
        {  0.139,  29.090,  2.06, 2700, 0 }, // Alpheratz (B9)
        { 14.845,  74.156,  2.08, 3900, 4 }, // Kochab (K4)
        { 17.582,  12.560,  2.08, 2600, 1 }, // Rasalhague (A5)
        { 20.428, -56.735,  1.94, 3300, 0 }, // Peacock (B2)
        {  1.162,  35.621,  2.07, 4400, 5 }, // Mirach (M0)
        {  5.534,  -0.299,  2.23, 2100, 0 }, // Mintaka (O9) — حزام الجبار
        { 15.578,  26.715,  2.23, 3700, 1 }, // Alphekka (A0)
        { 20.370,  40.257,  2.23, 2900, 2 }, // Sadr (F8) — صدر الدجاجة
        { 17.943,  51.489,  2.24, 4100, 4 }, // Eltanin (K5)
        {  3.136,  40.956,  2.12, 2400, 0 }, // Algol (B8) — رأس الغول! [43]
        { 21.736,  58.782,  2.47, 3600, 0 }, // Gamma Cep (K1)
        {  0.675,  56.537,  2.23, 3200, 4 }, // Schedar (K0)
        { 22.137, -46.961,  1.74, 2800, 0 }, // Alnair (B7)
        {  5.603,  -1.202,  1.70, 1900, 0 }, // Alnilam (B0) — حزام الجبار
        {  5.680,  -1.943,  1.74, 2200, 0 }, // Alnitak (O9) — حزام الجبار
        {  5.796,  -9.670,  2.07, 3000, 0 }, // Saiph (B0)
        { 18.921, -26.296,  2.05, 2500, 0 }, // Nunki (B2) — القوس
        { 12.901,  55.960,  1.77, 2100, 1 }, // Alioth (A0) — الدب الأكبر
        { 13.792,  49.314,  1.86, 3800, 0 }, // Alkaid (B3) — ذيل الدب
        {  3.406,  49.861,  1.79, 2900, 2 }, // Mirfak (F5) — برشاوس
        { 11.062,  61.751,  1.79, 4500, 4 }, // Dubhe (K0) — الدب الأكبر
        {  2.065,  42.330,  2.10, 3300, 4 }, // Almach (K3)
        { 13.399,  54.926,  2.23, 2700, 1 }, // Mizar (A2) — الدب الأكبر
        {  6.248,  22.505,  1.65, 2000, 0 }, // Alhena (A0) — الجوزاء
        {  7.401, -29.303,  2.45, 3700, 0 }, // Aludra (B5)
        { 17.173, -15.724,  2.43, 4200, 1 }, // Sabik (A2) — الحواء
        {  5.130,  -5.086,  2.79, 3100, 1 }, // Cursa (A3)
        { 23.079,  15.183,  2.49, 2600, 1 }, // Markab (A0) — بيغاسوس
        { 23.063,  28.082,  2.44, 4800, 5 }, // Scheat (M2) — بيغاسوس
        { 20.770,  33.971,  2.48, 3500, 4 }, // Gienah (K0) — الدجاجة
        { 14.750,  27.074,  2.35, 3900, 4 }, // Izar (K0) — العواء
        { 16.962,  -3.694,  2.74, 4600, 5 }, // Yed Prior (M1)
        { 19.512,  27.960,  3.05, 2200, 4 }, // Albireo (K3) — الدجاجة الجميلة
        { 13.911,  18.398,  2.68, 3000, 3 }, // Muphrid (G0)
        { 12.694,  -1.450,  2.74, 2800, 2 }, // Porrima (F0)
        { 21.526,  -5.571,  2.90, 4300, 3 }, // Sadalsuud (G0) — الدلو
        { 15.738,   6.426,  2.63, 3600, 4 }, // Unukalhai (K2) — الحية
        {  7.140, -26.393,  1.84, 2100, 2 }, // Wezen (F8)
        { 19.771,  10.613,  2.72, 4000, 4 }, // Tarazed (K3)
        { 17.531, -37.296,  2.69, 2900, 0 }, // Lesath (B2)
        { 14.850, -16.042,  2.75, 3200, 1 }, // Zubenelgenubi (A3)
        { 17.725,   4.567,  2.77, 3700, 4 }, // Cebalrai (K2)
        { 18.350, -29.828,  2.70, 2600, 4 }, // Kaus Media (K3) — القوس
        { 19.045, -29.880,  2.60, 3300, 1 }, // Ascella (A2) — القوس
        { 22.097,  -0.319,  2.95, 4100, 3 }, // Sadalmelik (G2) — الدلو
        {  3.038,   4.090,  2.53, 5000, 5 }, // Menkar (M2) — الحوت
        { 11.031,  56.383,  2.37, 3000, 1 }, // [80] Merak (A1) — الدب الأكبر
        { 11.897,  53.694,  2.44, 3200, 1 }, // [81] Phecda (A0) — الدب الأكبر
        { 12.257,  57.033,  3.31, 4000, 1 }, // [82] Megrez (A3) — الدب الأكبر
        {  0.153,  59.150,  2.27, 3400, 2 }, // [83] Caph (F2) — ذات الكرسي
        {  0.945,  60.717,  2.47, 2100, 0 }, // [84] Navi/Gamma Cas (B0) — ذات الكرسي
        {  1.431,  60.235,  2.68, 3600, 1 }, // [85] Ruchbah (A5) — ذات الكرسي
        {  1.906,  63.670,  3.38, 4500, 0 }, // [86] Segin (B3) — ذات الكرسي
        { 19.749,  45.131,  2.87, 2800, 0 }, // [87] Delta Cygni (B9) — الدجاجة
        { 10.333,  19.841,  1.99, 2600, 4 }, // [88] Algieba (K0) — الأسد
        { 11.235,  20.524,  2.56, 2900, 1 }, // [89] Zosma (A4) — الأسد
        { 10.122,  23.417,  3.44, 3800, 2 }, // [90] Adhafera (F0) — الأسد
        { 16.352, -25.593,  2.89, 2400, 0 }, // [91] Sigma Sco (B1) — العقرب
        { 16.836, -34.293,  2.29, 3000, 4 }, // [92] Epsilon Sco (K2) — العقرب
        { 16.600, -28.216,  2.82, 3500, 0 }, // [93] Tau Sco (B0) — العقرب
    };

    // ألوان الأطياف النجمية الحقيقية — محسّنة
    private static final int[] SPECTRAL_COLORS = {
        0xFFCADDFF, // 0 = O/B — أزرق-أبيض مشبّع
        0xFFFFFFFF, // 1 = A   — أبيض نقي
        0xFFFFF8E8, // 2 = F   — أبيض-أصفر
        0xFFFFEEB0, // 3 = G   — أصفر (مثل الشمس)
        0xFFFFCC88, // 4 = K   — برتقالي
        0xFFFF9966, // 5 = M   — أحمر-برتقالي
    };

    // درب التبانة — نقاط { RA_h, Dec_deg, عرض°, سطوع 0-1 }
    private static final double[][] MW_KNOTS = {
        {  5.80,  28.5,  8.0, 0.28 },
        {  6.20,  18.0,  9.0, 0.32 },
        {  7.00,   6.0,  8.0, 0.28 },
        {  8.50,  -3.0,  7.0, 0.24 },
        { 10.00, -16.0,  7.0, 0.22 },
        { 12.00, -50.0,  8.0, 0.30 },
        { 13.50, -60.0,  9.5, 0.40 },
        { 15.00, -52.0, 10.0, 0.48 },
        { 16.00, -40.0, 10.5, 0.58 },
        { 16.50, -43.0, 11.0, 0.65 },
        { 17.50, -29.0, 16.0, 1.00 }, // ★ مركز المجرة
        { 18.00, -22.0, 14.0, 0.90 },
        { 18.50, -10.0, 12.0, 0.80 },
        { 19.30,   3.0, 11.0, 0.72 },
        { 20.00,  20.0, 10.5, 0.68 },
        { 20.70,  40.0, 12.0, 0.72 },
        { 21.50,  53.0, 10.0, 0.60 },
        { 22.90,  60.0,  9.5, 0.55 },
        { 23.80,  57.0,  9.0, 0.45 },
        {  2.50,  46.0,  8.5, 0.35 },
        {  4.50,  36.0,  8.0, 0.30 },
    };

    // الثريا — Pleiades
    private static final double[][] PLEIADES = {
        { 3.791, 24.105, 2.87 }, // Alcyone
        { 3.783, 24.367, 3.63 }, // Atlas
        { 3.774, 24.053, 3.70 }, // Electra
        { 3.793, 24.031, 3.87 }, // Maia
        { 3.786, 23.948, 4.18 }, // Merope
        { 3.760, 24.113, 5.09 }, // Taygeta
        { 3.788, 24.287, 5.45 }, // Pleione
    };

    // خطوط الكوكبات { index_a, index_b }
    private static final int[][] CONSTELLATION_LINES = {
        // الجبار Orion
        { 9, 25}, {25, 39}, {39, 47}, {47, 48}, { 9, 47}, { 6, 39}, {49, 48},
        // الدب الأكبر Ursa Major
        {54, 80}, {80, 81}, {81, 82}, {82, 54}, {82, 51}, {51, 56}, {56, 52},
        // ذات الكرسي Cassiopeia
        {83, 45}, {45, 84}, {84, 85}, {85, 86},
        // الدجاجة Cygnus
        {18, 41}, {41, 66}, {87, 41}, {41, 63},
        // العقرب Scorpius
        {91, 14}, {14, 93}, {93, 92}, {92, 23},
        // الأسد Leo
        {20, 88}, {88, 89}, {88, 90},
    };

    // الأجرام السماوية العميقة { RA_h, Dec_deg, type }
    private static final double[][] DSO = {
        {  0.711,  41.269, 0 }, // M31 — مجرة أندروميدا
        {  5.588,  -5.391, 1 }, // M42 — سديم الجبار
    };

    // أمطار الشهب الموسمية { dayOfYear_peak, duration_days, rateMultiplier }
    private static final double[][] METEOR_SHOWERS = {
        {   3, 4, 8.0 }, // Quadrantids  — 3 يناير
        { 125, 5, 5.0 }, // Eta Aquarids — 5 مايو
        { 224, 8, 9.0 }, // Perseids     — 12 أغسطس ★
        { 281, 3, 4.0 }, // Draconids    — 8 أكتوبر
        { 321, 4, 7.0 }, // Leonids      — 17 نوفمبر
        { 347, 7,10.0 }, // Geminids     — 13 ديسمبر ★
    };

    // Cache فلكي
    private static long      lastCalcMin = -1;
    private static double    cSunAlt,  cSunAz;
    private static double    cMoonAlt, cMoonAz, cMoonPhase;
    private static double    cVenusAlt, cVenusAz;
    private static double    cJupAlt,   cJupAz;
    private static double    cMarsAlt,  cMarsAz;
    private static double    cSatAlt,   cSatAz;
    private static double    cMercAlt,  cMercAz;
    private static double[][] cStarPos;
    private static double[][] cMwPos;
    private static double[][] cPleiPos;
    private static double[][] cDsoPos;
    private static double    cGmst;
    private static double    cLat;
    private static double    cLng;
    private static int       cHijriMonth;   // الشهر الهجري الحالي (1-12)

    // جودة الأداء التكيفية
    private static int     cQuality     = 2;    // 0=منخفضة 1=متوسطة 2=عالية
    private static boolean cQualityInit = false;

    // حالة المنارة البحرية
    private static boolean cHasLighthouse = false;
    private static float   cLighthouseX   = 0f;
    private static long    cLighthouseCheck = -1L;

    // أوقات الصلاة للأذان المرئي
    private static long cFajrMs, cDhuhrMs, cAsrMs, cMaghribMs, cIshaMs;

    // ═══════════════════════════════════════════════════════════════════════
    // نقطة الدخول الرئيسية
    // ═══════════════════════════════════════════════════════════════════════
    public static Bitmap render(int w, int h,
                                double lat, double lng,
                                long fajrMs, long sunriseMs, long dhuhrMs,
                                long asrMs,  long maghribMs, long ishaMs) {
        if (w <= 0 || h <= 0) return null;

        long now    = System.currentTimeMillis();
        long nowMin = now / 60_000L;
        boolean hasGps = (lat != 0.0 || lng != 0.0);

        if (nowMin != lastCalcMin || cStarPos == null) {
            lastCalcMin = nowMin;
            double jd = julianDate(now);

            if (hasGps) {
                double[] sun  = solarPosition(jd, lat, lng);
                cSunAlt = sun[0];  cSunAz = sun[1];

                double[] moon = moonPosition(jd, lat, lng);
                cMoonAlt = moon[0]; cMoonAz = moon[1];

                double[] venus = planetPosition(jd, lat, lng, 181.979, 1.6021302, 0.387098, 0.723);
                cVenusAlt = venus[0]; cVenusAz = venus[1];

                double[] jup = planetPosition(jd, lat, lng, 34.351, 0.0830853, 5.458104, 5.203);
                cJupAlt = jup[0]; cJupAz = jup[1];

                double[] mars = planetPosition(jd, lat, lng, 355.433, 0.5240707, 1.523688, 1.524);
                cMarsAlt = mars[0]; cMarsAz = mars[1];

                double[] sat = planetPosition(jd, lat, lng, 50.077, 0.0334597, 8.997011, 9.537);
                cSatAlt = sat[0]; cSatAz = sat[1];

                double[] merc = planetPosition(jd, lat, lng, 252.251, 4.0923345, 0.240846, 0.387);
                cMercAlt = merc[0]; cMercAz = merc[1];

                cGmst = greenwichSiderealTime(jd);
                cLat  = lat;
                cLng  = lng;

                cStarPos = new double[STARS.length][2];
                for (int i = 0; i < STARS.length; i++) {
                    double[] hp = raDecToAltAz(STARS[i][0], STARS[i][1], lat, lng, cGmst);
                    cStarPos[i][0] = hp[0];
                    cStarPos[i][1] = hp[1];
                }

                cPleiPos = new double[PLEIADES.length][2];
                for (int i = 0; i < PLEIADES.length; i++) {
                    double[] hp = raDecToAltAz(PLEIADES[i][0], PLEIADES[i][1], lat, lng, cGmst);
                    cPleiPos[i][0] = hp[0];
                    cPleiPos[i][1] = hp[1];
                }

                cMwPos = new double[MW_KNOTS.length][3];
                for (int i = 0; i < MW_KNOTS.length; i++) {
                    double[] hp = raDecToAltAz(MW_KNOTS[i][0], MW_KNOTS[i][1], lat, lng, cGmst);
                    cMwPos[i][0] = hp[0];
                    cMwPos[i][1] = hp[1];
                    cMwPos[i][2] = MW_KNOTS[i][3];
                }

                cDsoPos = new double[DSO.length][2];
                for (int i = 0; i < DSO.length; i++) {
                    double[] hp = raDecToAltAz(DSO[i][0], DSO[i][1], lat, lng, cGmst);
                    cDsoPos[i][0] = hp[0];
                    cDsoPos[i][1] = hp[1];
                }

            } else {
                cSunAlt = fallbackSunAlt(now, fajrMs, sunriseMs, dhuhrMs, asrMs, maghribMs, ishaMs);
                cSunAz  = fallbackSunAz(now, sunriseMs, maghribMs);
                cMoonAlt = 38; cMoonAz = 220;
                cVenusAlt = -1; cJupAlt = 30; cJupAz = 180;
                cMarsAlt  = 25; cMarsAz = 150;
                cSatAlt   = 20; cSatAz  = 200;
                cMercAlt  = -5;
                cLat = lat; cLng = lng;
                Random rnd = new Random(42);
                cStarPos = new double[STARS.length][2];
                for (int i = 0; i < STARS.length; i++) {
                    cStarPos[i][0] = 8 + rnd.nextDouble() * 72;
                    cStarPos[i][1] = rnd.nextDouble() * 360;
                }
                cMwPos = null; cPleiPos = null; cDsoPos = null;
            }

            cMoonPhase  = moonPhase(jd);
            cHijriMonth = hijriMonth(jd);
        }

        // ── الرسم ──────────────────────────────────────────────────────────
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c   = new Canvas(bmp);
        Paint  p   = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);

        float sunX  = azToX(cSunAz,  w);
        float sunY  = altToY(cSunAlt, h);
        float moonX = azToX(cMoonAz, w);
        float moonY = altToY(cMoonAlt, h);

        // 00. جودة الأداء التكيفية + تحديث الطقس + حفظ أوقات الصلاة
        checkAdaptiveQuality();
        updateWeatherState(now, cLat);
        cFajrMs    = fajrMs;
        cDhuhrMs   = dhuhrMs;
        cAsrMs     = asrMs;
        cMaghribMs = maghribMs;
        cIshaMs    = ishaMs;

        // 01. تدرج السماء (Rayleigh Scattering — 6 stops)
        drawSkyGradient(c, w, h, p, cSunAlt);

        // 02. ضباب Mie اتجاهي حول الشمس
        drawMieHaze(c, w, h, p, cSunAlt, sunX);

        // 03. ظل الأرض + Belt of Venus عند الشفق
        drawBeltOfVenus(c, w, h, p, cSunAlt, cSunAz);

        // 04. توهج الأفق Golden/Blue Hour
        drawHorizonGlow(c, w, h, p, cSunAlt, sunX);

        // 05. Alpenglow — وهج وردي بعد الغروب مباشرة
        drawAlpenglow(c, w, h, p, cSunAlt);

        // 06. شفق قطبي (لخطوط العرض > 52°)
        drawAurora(c, w, h, p, cSunAlt, cLat, now);

        // 07. نور الزودياك (بعد الغروب / قبل الشروق)
        drawZodiacalLight(c, w, h, p, cSunAlt, cSunAz);

        // 08. Gegenschein — توهج خافت مقابل الشمس
        drawGegenschein(c, w, h, p, cSunAlt, cSunAz);

        // 09. Airglow — توهج الغلاف الجوي الليلي
        drawAirglow(c, w, h, p, cSunAlt);

        // 10. درب التبانة
        drawMilkyWay(c, w, h, p, cSunAlt);

        // 11. الأجرام السماوية العميقة (M31 / M42)
        drawDeepSkyObjects(c, w, h, p, cSunAlt, now);

        // 12. خطوط الكوكبات
        drawConstellations(c, w, h, p, cSunAlt);

        // 13. النجوم بألوانها الطيفية + نجم الغول المتغير
        drawStars(c, w, h, p, cSunAlt, cMoonPhase, now);

        // 14. الثريا كعنقود مميز
        drawPleiades(c, w, h, p, cSunAlt, now);

        // 15. كوكب الزهرة (يظهر في النهار أحياناً)
        if (cVenusAlt > 0.5) drawPlanet(c, p, cVenusAlt, cVenusAz, w, h, 0xFFDDF4FF, 3.8f, false);
        // 16. كوكب المشتري — مع أحزمة وأقمار
        if (cJupAlt   > 1.5) drawJupiter(c, p, cJupAlt, cJupAz, w, h, now);
        // 17. كوكب المريخ (أحمر مميز)
        if (cMarsAlt  > 1.5) drawPlanet(c, p, cMarsAlt, cMarsAz, w, h, 0xFFFF6644, 3.5f, false);
        // 18. كوكب زحل (مع حلقة)
        if (cSatAlt   > 1.5) drawSaturn(c, p, cSatAlt, cSatAz, w, h);
        // 19. عطارد (قرب الأفق فقط)
        if (cMercAlt  > 0.5 && cMercAlt < 20) drawPlanet(c, p, cMercAlt, cMercAz, w, h, 0xFFFFEEDD, 2.5f, false);

        // 20. شهاب موسمي ذكي
        drawShootingStar(c, w, h, p, cSunAlt, now);

        // 20.5. مذنب دوري
        drawComet(c, w, h, p, cSunAlt, now);

        // 21. قمر اصطناعي / ISS
        drawSatellite(c, w, h, p, cSunAlt, now);

        // 22. القمر المحسّن — sun-relative terminator + 3D + Ramadan
        if (cMoonAlt > -2) drawMoon(c, p, moonX, moonY, h, w, cMoonPhase, cMoonAlt, cSunAlt, sunX, sunY, now);

        // 23. الوميض الأخضر — Green Flash لحظة الغروب
        drawGreenFlash(c, w, h, p, cSunAlt, sunX, sunY);

        // 24. أشعة الإله / Crepuscular Rays
        if (cSunAlt > -3) drawCrepuscularRays(c, w, h, p, cSunAlt, sunX, sunY);

        // 25. أشعة مضادة (Anti-crepuscular)
        drawAntiCrepuscularRays(c, w, h, p, cSunAlt, cSunAz);

        // 26. Sundog / Parhelion
        if (cSunAlt > 0 && cSunAlt < 28) drawSundog(c, w, h, p, cSunAlt, sunX, sunY);

        // 27. Circumzenithal Arc
        if (cSunAlt > 22 && cSunAlt < 62) drawCircumzenithalArc(c, w, h, p, cSunAlt, sunX);

        // 28. الشمس
        if (cSunAlt > -3) drawSun(c, p, sunX, sunY, w, h, cSunAlt, now);

        // 28.5. HDR Bloom — توهج حول الشمس والقمر
        drawHDRBloom(c, w, h, p, sunX, sunY, moonX, moonY, cSunAlt, cMoonAlt, cMoonPhase, now);

        // 29. سحاب Cirrus
        drawCirrus(c, w, h, p, cSunAlt, sunX, now);

        // 30. سحاب Cumulus
        drawClouds(c, w, h, p, cSunAlt, sunX, sunY, now);

        // 30.5. غطاء الغيوم الكثيف
        drawOvercastVeil(c, w, h, p, cSunAlt);

        // 31. سحاب Cumulonimbus + مطر + برق
        drawCumulonimbus(c, w, h, p, cSunAlt, now);

        // 32. آثار الطائرات
        drawContrails(c, w, h, p, cSunAlt, now);

        // 33. تلوث ضوئي للمدن
        drawLightPollution(c, w, h, p, cSunAlt);

        // 34. خط الأفق
        drawHorizonLine(c, w, h, p, cSunAlt);

        // 34.5. ضبابية الحرارة وقت الظهيرة
        drawHeatHaze(c, w, h, p, cSunAlt, now);

        // 35. ضباب الأرض عند الفجر/الغروب
        drawGroundFog(c, w, h, p, cSunAlt, now);

        // 35.5. جبال في الخلفية — 3 طبقات
        drawMountainSilhouette(c, w, h, p, cSunAlt, now);

        // 36. سكاي لاين — أبراج مدنية + مساجد
        drawCitySilhouette(c, w, h, p, cSunAlt, now);

        // 36.3. أذان مرئي — حلقات ذهبية + موجات + جسيمات
        drawAdhan(c, w, h, p, now);

        // 36.5. منارة بحرية دوارة
        drawLighthouse(c, w, h, p, cSunAlt, now);

        // 37. طيور مهاجرة عند الغروب/الشروق
        drawBirds(c, w, h, p, cSunAlt, now);

        // 38. انعكاس المدينة في الماء
        drawWaterReflection(c, w, h, p, cSunAlt, now);

        // 39. حواف دائرية
        applyRoundedCorners(bmp, w, h);

        return bmp;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 01. تدرج السماء — Rayleigh Scattering
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawSkyGradient(Canvas c, int w, int h, Paint p, double sunAlt) {
        int[] colors = skyColors(sunAlt);
        p.setShader(new LinearGradient(0, 0, 0, h,
            colors,
            new float[]{ 0f, 0.20f, 0.42f, 0.63f, 0.82f, 1f },
            Shader.TileMode.CLAMP));
        p.setStyle(Paint.Style.FILL);
        c.drawRect(0, 0, w, h, p);
        p.setShader(null);
    }

    private static int[] skyColors(double a) {
        if (a >= 45)
            return new int[]{ 0xFF021666, 0xFF062A8C, 0xFF0A3FB8, 0xFF1A62D0, 0xFF3A88E0, 0xFF7AC0FF };
        if (a >= 25) {
            float t = (float)((a - 25) / 20);
            return new int[]{
                lerpColor(0xFF080E50, 0xFF021666, t),
                lerpColor(0xFF0E2370, 0xFF062A8C, t),
                lerpColor(0xFF1A50A0, 0xFF0A3FB8, t),
                lerpColor(0xFF2865BB, 0xFF1A62D0, t),
                lerpColor(0xFF4A92D8, 0xFF3A88E0, t),
                lerpColor(0xFF9AD5FF, 0xFF7AC0FF, t) };
        }
        if (a >= 10) {
            float t = (float)((a - 10) / 15);
            return new int[]{
                lerpColor(0xFF060A30, 0xFF080E50, t),
                lerpColor(0xFF101A50, 0xFF0E2370, t),
                lerpColor(0xFF1A3888, 0xFF1A50A0, t),
                lerpColor(0xFF7890C8, 0xFF2865BB, t),
                lerpColor(0xFFCCD8FF, 0xFF4A92D8, t),
                lerpColor(0xFFFFEAC0, 0xFF9AD5FF, t) };
        }
        if (a >= 4) {
            float t = (float)((a - 4) / 6);
            return new int[]{
                lerpColor(0xFF050828, 0xFF060A30, t),
                lerpColor(0xFF0C1240, 0xFF101A50, t),
                lerpColor(0xFF141E68, 0xFF1A3888, t),
                lerpColor(0xFFFF9060, 0xFF7890C8, t),
                lerpColor(0xFFFFCC80, 0xFFCCD8FF, t),
                lerpColor(0xFFFF5800, 0xFFFFEAC0, t) };
        }
        if (a >= 0) {
            float t = (float)(a / 4);
            return new int[]{
                lerpColor(0xFF030720, 0xFF050828, t),
                lerpColor(0xFF060B28, 0xFF0C1240, t),
                lerpColor(0xFF18084A, 0xFF141E68, t),
                lerpColor(0xFFDD4400, 0xFFFF9060, t),
                lerpColor(0xFFFF3800, 0xFFFFCC80, t),
                lerpColor(0xFFBB1200, 0xFFFF5800, t) };
        }
        if (a >= -4) {
            float t = (float)((a + 4) / 4);
            return new int[]{
                lerpColor(0xFF020510, 0xFF030720, t),
                lerpColor(0xFF030614, 0xFF060B28, t),
                lerpColor(0xFF0C052A, 0xFF18084A, t),
                lerpColor(0xFF880820, 0xFFDD4400, t),
                lerpColor(0xFF660010, 0xFFFF3800, t),
                lerpColor(0xFF3A0008, 0xFFBB1200, t) };
        }
        if (a >= -8) {
            float t = (float)((a + 8) / 4);
            return new int[]{
                lerpColor(0xFF010208, 0xFF020510, t),
                lerpColor(0xFF020410, 0xFF030614, t),
                lerpColor(0xFF070322, 0xFF0C052A, t),
                lerpColor(0xFF460418, 0xFF880820, t),
                lerpColor(0xFF2A0210, 0xFF660010, t),
                lerpColor(0xFF160108, 0xFF3A0008, t) };
        }
        if (a >= -12) {
            float t = (float)((a + 12) / 4);
            return new int[]{
                lerpColor(0xFF010106, 0xFF010208, t),
                lerpColor(0xFF010208, 0xFF020410, t),
                lerpColor(0xFF040218, 0xFF070322, t),
                lerpColor(0xFF1E0210, 0xFF460418, t),
                lerpColor(0xFF0E010A, 0xFF2A0210, t),
                lerpColor(0xFF070106, 0xFF160108, t) };
        }
        if (a >= -18) {
            float t = (float)((a + 18) / 6);
            return new int[]{
                lerpColor(0xFF010105, 0xFF010106, t),
                lerpColor(0xFF010106, 0xFF010208, t),
                lerpColor(0xFF020110, 0xFF040218, t),
                lerpColor(0xFF080108, 0xFF1E0210, t),
                lerpColor(0xFF050106, 0xFF0E010A, t),
                lerpColor(0xFF030104, 0xFF070106, t) };
        }
        return new int[]{ 0xFF010105, 0xFF010106, 0xFF020112, 0xFF060110, 0xFF030108, 0xFF020106 };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 02. ضباب Mie عند الأفق
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawMieHaze(Canvas c, int w, int h, Paint p, double sunAlt, float sunX) {
        if (sunAlt < -6) return;
        float intense = (float) Math.min(1, (sunAlt + 6) / 20.0);
        int alpha = (int)(60 * intense);
        p.setShader(new LinearGradient(0, h * 0.65f, 0, h,
            new int[]{ Color.argb(0, 180, 200, 220), Color.argb(alpha, 180, 200, 220) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.65f, w, h, p);
        p.setShader(null);
        int sunAlpha = (int)(alpha * 0.75f);
        if (sunAlpha > 4) {
            p.setShader(new RadialGradient(sunX, h, w * 0.72f,
                new int[]{ Color.argb(sunAlpha, 225, 210, 185),
                           Color.argb(sunAlpha / 2, 205, 198, 180),
                           Color.argb(0, 180, 176, 165) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(0, h * 0.50f, w, h, p);
            p.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 03. Belt of Venus + Earth's Shadow
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawBeltOfVenus(Canvas c, int w, int h, Paint p,
                                        double sunAlt, double sunAz) {
        if (sunAlt < -8 || sunAlt > 3) return;
        float t = (float)((3 - sunAlt) / 11.0);
        t = Math.max(0, Math.min(1, t));
        int shadowAlpha = (int)(110 * t);
        int beltAlpha   = (int)(90  * t);
        double antiAz = (sunAz + 180) % 360;
        float  antiX  = azToX(antiAz, w);
        p.setShader(new RadialGradient(antiX, h * 0.9f, w * 0.85f,
            new int[]{ Color.argb(shadowAlpha, 28, 48, 120),
                       Color.argb(shadowAlpha / 2, 30, 50, 110),
                       Color.argb(0, 20, 40, 90) },
            new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.55f, w, h, p);
        p.setShader(null);
        p.setShader(new RadialGradient(antiX, h * 0.5f, w * 0.72f,
            new int[]{ Color.argb(beltAlpha, 210, 140, 180),
                       Color.argb(beltAlpha / 2, 200, 130, 165),
                       Color.argb(0, 180, 110, 150) },
            new float[]{ 0f, 0.45f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.38f, w, h * 0.7f, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 04. توهج الأفق Golden Hour / Blue Hour
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawHorizonGlow(Canvas c, int w, int h, Paint p,
                                        double sunAlt, float sunX) {
        if (sunAlt < -12 || sunAlt > 28) return;
        float inten = (float)(sunAlt < 0
            ? 1.0 - Math.abs(sunAlt) / 12.0
            : 1.0 - sunAlt / 28.0);
        inten = Math.max(0, Math.min(1, inten));
        int a = (int)(220 * inten);
        int innerColor = sunAlt < 2 ? Color.argb(a, 255, 100, 15) : Color.argb(a, 255, 190, 70);
        int midColor   = sunAlt < 2 ? Color.argb(a/2, 255, 55, 0) : Color.argb(a/2, 255, 150, 0);
        p.setShader(new RadialGradient(sunX, h * 0.92f, w * 0.80f,
            new int[]{ innerColor, midColor, Color.argb(0, 255, 80, 0) },
            new float[]{ 0f, 0.38f, 1f }, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(sunX - w * 0.8f, h * 0.45f, sunX + w * 0.8f, h * 1.12f), p);
        p.setShader(null);
        if (sunAlt > -5 && sunAlt < 6) {
            int ba = (int)(90 * inten);
            p.setShader(new RadialGradient(w - sunX, h * 0.8f, w * 0.55f,
                new int[]{ Color.argb(ba, 30, 70, 210), Color.argb(0, 20, 50, 180) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(0, 0, w, h, p);
            p.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 05. نور الزودياك — محسّن
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawZodiacalLight(Canvas c, int w, int h, Paint p,
                                          double sunAlt, double sunAz) {
        if (sunAlt < -22 || sunAlt > -4) return;
        double t = Math.min(1, (-sunAlt - 4) / 18.0);
        int alpha = (int)(65 * t);
        float sx = azToX(sunAz, w);
        p.setShader(new RadialGradient(sx, h, w * 0.48f,
            new int[]{ Color.argb(alpha, 255, 250, 220),
                       Color.argb(alpha / 2, 240, 230, 190),
                       Color.argb(0, 220, 210, 170) },
            new float[]{ 0f, 0.4f, 1f }, Shader.TileMode.CLAMP));
        Path cone = new Path();
        cone.moveTo(sx, h);
        cone.lineTo(sx - w * 0.24f, h * 0.12f);
        cone.lineTo(sx + w * 0.24f, h * 0.12f);
        cone.close();
        c.drawPath(cone, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 06. درب التبانة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawMilkyWay(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > -14 || cMwPos == null) return;
        double darkness = Math.min(1.0, (-sunAlt - 14) / 8.0);
        Paint mwPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        mwPaint.setStyle(Paint.Style.FILL);
        for (int i = 0; i < cMwPos.length; i++) {
            double alt  = cMwPos[i][0];
            double az   = cMwPos[i][1];
            double brig = cMwPos[i][2];
            if (alt < -8) continue;
            float x = azToX(az, w);
            float y = altToY(alt, h);
            if (x < -w * 0.3f || x > w * 1.3f) continue;
            float widthDeg = (float) MW_KNOTS[i][2];
            float radiusPx = (widthDeg / 90f) * h * 0.55f;
            double altFade = alt < 5 ? Math.max(0, (alt + 8) / 13.0) : 1.0;
            int alpha = (int)(60 * brig * darkness * altFade);
            if (alpha < 3) continue;
            int r, g, b;
            if (brig > 0.7) { r = 255; g = 240; b = 200; }
            else if (brig > 0.4) { r = 245; g = 248; b = 235; }
            else { r = 220; g = 228; b = 255; }
            mwPaint.setShader(new RadialGradient(x, y, radiusPx,
                new int[]{ Color.argb(alpha, r, g, b),
                           Color.argb(alpha / 2, r, g, b),
                           Color.argb(0, r, g, b) },
                new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(x, y, radiusPx, mwPaint);
        }
        mwPaint.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 07. النجوم — ألوان طيفية + توهج + هالة + نجمة القطب مميزة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawStars(Canvas c, int w, int h, Paint p,
                                  double sunAlt, double moonPhase, long now) {
        if (sunAlt > -4) return;

        double maxMag;
        if      (sunAlt > -10) maxMag = 0.0;
        else if (sunAlt > -14) maxMag = 1.8;
        else if (sunAlt > -18) maxMag = 3.5;
        else                   maxMag = 5.5;

        double moonIll = moonIllumination(moonPhase);
        if (moonIll > 0.35 && cMoonAlt > 8) maxMag -= (moonIll - 0.35) * 2.5;

        float dark = (float) Math.min(1, (-sunAlt - 4) / 14.0);
        p.setStyle(Paint.Style.FILL);

        // نجم الغول Algol المتغير (index 43)
        double algolPeriod = 2.8673043 * 86400.0;
        double algolRef    = 2452885.50;
        double algolJd     = julianDate(now);
        double algolPhase  = ((algolJd - algolRef) % algolPeriod / algolPeriod + 1) % 1;
        double algolMag    = 2.12;
        if (algolPhase < 0.04 || algolPhase > 0.96) {
            double dp = Math.min(algolPhase, 1 - algolPhase) / 0.04;
            algolMag  = 2.12 + (3.4 - 2.12) * (1 - dp * dp);
        }

        // كثافة النجوم حسب جودة الجهاز
        int starLimit = (cQuality == 0) ? 40 : (cQuality == 1) ? 70 : STARS.length;

        for (int i = 0; i < starLimit && cStarPos != null; i++) {
            double mag = (i == 43) ? algolMag : STARS[i][2];
            if (mag > maxMag) continue;
            double alt = cStarPos[i][0], az = cStarPos[i][1];
            if (alt < 0.5) continue;
            double apparentAlt = alt + refractionCorrection(alt);
            float sx = azToX(az, w);
            float sy = altToY(apparentAlt, h);
            if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

            // ══ الخمود الجوي Atmospheric Extinction ══
            // كلما اقترب النجم من الأفق، امتصّ الغلاف الجوي المزيد من ضوئه
            double airmass = (alt > 2.0)
                ? 1.0 / Math.sin(Math.toRadians(alt))
                : (alt > 0.5 ? 1.0 / Math.sin(Math.toRadians(2.0)) : 20.0);
            airmass = Math.min(airmass, 20.0);
            double extinctionMag = 0.20 * airmass; // 0.20 mag/airmass
            double extinctFactor = Math.pow(10.0, -0.4 * Math.min(extinctionMag, 5.0));

            // نجمة القطب — مميزة بشكل خاص
            boolean isPolaris = (i == 30);
            float bright;
            if (isPolaris) {
                bright = 0.85f * dark;
            } else {
                bright = (float)(1.0 - (mag + 1.6) / 6.8);
                bright = Math.max(0.06f, Math.min(1f, bright));
            }

            double period = STARS[i][3];
            float twinkleAmp = isPolaris ? 0.06f :
                (float) Math.min(0.35, 0.12 + 0.23 * Math.max(0, (20 - alt) / 20));
            float twinkle = (1f - twinkleAmp) + twinkleAmp *
                (float) Math.sin((now % (long)period) / period * 2 * Math.PI);
            bright *= twinkle * dark * (float) extinctFactor;

            int specClass = (int) Math.max(0, Math.min(5, STARS[i][4]));
            if (i == 43 && algolMag > 2.8) specClass = 4;
            int starColor = SPECTRAL_COLORS[specClass];
            int sr = Color.red(starColor), sg = Color.green(starColor), sb = Color.blue(starColor);

            int a = (int)(255 * bright);
            float r = isPolaris ? (1.2f + bright * 3.0f) : (0.55f + bright * 2.2f);

            // هالة للنجوم اللامعة جداً
            if (STARS[i][2] < 1.0 || isPolaris) {
                float haloR = isPolaris ? r * 8f : (r * (STARS[i][2] < 0 ? 7f : 5f));
                p.setShader(new RadialGradient(sx, sy, haloR,
                    new int[]{ Color.argb(a / 3, sr, sg, sb), Color.argb(0, sr, sg, sb) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(sx, sy, haloR, p);
                p.setShader(null);
            }

            p.setColor(Color.argb(a, sr, sg, sb));
            c.drawCircle(sx, sy, r, p);

            // بريق صليبي للنجوم الألمع + القطب
            if ((STARS[i][2] < -0.3 && dark > 0.6) || (isPolaris && dark > 0.5)) {
                float spikeLen = isPolaris ? r * 8f : r * 6f;
                drawStarSpike(c, p, sx, sy, spikeLen, a / 2, sr, sg, sb);
            }
        }
    }

    private static void drawStarSpike(Canvas c, Paint p, float x, float y,
                                      float len, int alpha, int r, int g, int b) {
        Paint sp = new Paint(Paint.ANTI_ALIAS_FLAG);
        sp.setStrokeCap(Paint.Cap.ROUND);
        sp.setStyle(Paint.Style.STROKE);
        sp.setStrokeWidth(1.0f);
        sp.setColor(Color.argb(alpha, r, g, b));
        c.drawLine(x - len, y, x + len, y, sp);
        c.drawLine(x, y - len * 0.7f, x, y + len * 0.7f, sp);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 08. الثريا — Pleiades
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawPleiades(Canvas c, int w, int h, Paint p,
                                     double sunAlt, long now) {
        if (sunAlt > -8 || cPleiPos == null) return;
        double dark = Math.min(1.0, (-sunAlt - 8) / 10.0);
        float cx = azToX(cPleiPos[0][1], w);
        float cy = altToY(cPleiPos[0][0], h);
        if (cx < -20 || cx > w + 20 || cy < -20 || cy > h + 20) return;
        if (cPleiPos[0][0] < 2) return;

        // توهج ضبابي حول المجموعة
        int nebAlpha = (int)(32 * dark);
        p.setShader(new RadialGradient(cx, cy, h * 0.07f,
            new int[]{ Color.argb(nebAlpha, 180, 200, 255), Color.argb(0, 160, 180, 255) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(cx, cy, h * 0.07f, p);
        p.setShader(null);

        p.setStyle(Paint.Style.FILL);
        for (int i = 0; i < PLEIADES.length && cPleiPos != null; i++) {
            double alt = cPleiPos[i][0];
            if (alt < 2) continue;
            float sx = azToX(cPleiPos[i][1], w);
            float sy = altToY(alt, h);
            float bright = (float)(0.6 - (PLEIADES[i][2] - 2.5) / 4.0);
            bright = (float)(bright * dark);
            if (bright < 0.05) continue;
            double period = 2200 + i * 700;
            float tw = 0.82f + 0.18f * (float)Math.sin((now % (long)period) / period * 2 * Math.PI);
            bright *= tw;
            int a = (int)(255 * bright);
            float r = 0.7f + bright * 1.4f;
            p.setColor(Color.argb(a, 200, 215, 255));
            c.drawCircle(sx, sy, r, p);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 09. كواكب عامة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawPlanet(Canvas c, Paint p,
                                   double alt, double az, int w, int h,
                                   int color, float r, boolean bright) {
        double appAlt = alt + refractionCorrection(alt);
        float x = azToX(az, w), y = altToY(appAlt, h);
        if (x < -10 || x > w + 10 || y < -10 || y > h + 10) return;
        int cr = Color.red(color), cg = Color.green(color), cb = Color.blue(color);
        p.setShader(new RadialGradient(x, y, r * 6.5f,
            new int[]{ Color.argb(70, cr, cg, cb), Color.argb(0, cr, cg, cb) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r * 6.5f, p);
        p.setShader(null);
        p.setShader(new RadialGradient(x - r * 0.25f, y - r * 0.25f, r * 1.4f,
            new int[]{ Color.argb(255, Math.min(255, cr + 30), Math.min(255, cg + 30), Math.min(255, cb + 30)), color },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // المشتري — أحزمة جوية + نقطة حمراء + 4 أقمار جاليليو
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawJupiter(Canvas c, Paint p,
                                    double alt, double az, int w, int h, long now) {
        double appAlt = alt + refractionCorrection(alt);
        float x = azToX(az, w), y = altToY(appAlt, h);
        if (x < -15 || x > w + 15 || y < -15 || y > h + 15) return;

        float r = 5.0f;

        // هالة
        p.setShader(new RadialGradient(x, y, r * 7f,
            new int[]{ Color.argb(65, 255, 238, 200), Color.argb(0, 230, 210, 170) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r * 7f, p);
        p.setShader(null);

        // قرص المشتري الأساسي
        p.setShader(new RadialGradient(x - r * 0.2f, y - r * 0.2f, r * 1.4f,
            new int[]{ 0xFFFFEED0, 0xFFE8C880 }, null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r, p);
        p.setShader(null);

        // أحزمة جوية — 4 أحزمة
        Paint bandPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bandPaint.setStyle(Paint.Style.FILL);
        int savedLayer = c.saveLayer(new RectF(x - r, y - r, x + r, y + r), null);
        float[][] bands = {
            { -0.55f, 0.18f, 0xFF8B5E3C }, // حزام استوائي جنوبي (أحمر-بني)
            { -0.20f, 0.12f, 0xFFB87040 }, // منطقة استوائية
            {  0.10f, 0.14f, 0xFF7A4E2E }, // حزام استوائي شمالي
            {  0.38f, 0.10f, 0xFF9E6030 }, // حزام معتدل شمالي
        };
        for (float[] band : bands) {
            float bandCY = y + band[0] * r;
            float bandH  = band[1] * r;
            int bandColor = band[2];
            int br = Color.red(bandColor), bg = Color.green(bandColor), bb = Color.blue(bandColor);
            bandPaint.setShader(new LinearGradient(0, bandCY - bandH, 0, bandCY + bandH,
                new int[]{ Color.argb(0, br, bg, bb),
                           Color.argb(90, br, bg, bb),
                           Color.argb(90, br, bg, bb),
                           Color.argb(0, br, bg, bb) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(x - r, bandCY - bandH, x + r, bandCY + bandH, bandPaint);
        }
        // النقطة الحمراء الكبيرة (Great Red Spot)
        float grsX = x + r * 0.28f;
        float grsY = y + r * 0.25f;
        float grsR = r * 0.22f;
        bandPaint.setShader(new RadialGradient(grsX, grsY, grsR,
            new int[]{ Color.argb(160, 200, 60, 30), Color.argb(60, 180, 40, 20), Color.argb(0, 150, 30, 15) },
            null, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(grsX - grsR, grsY - grsR * 0.6f, grsX + grsR, grsY + grsR * 0.6f), bandPaint);
        c.restoreToCount(savedLayer);
        bandPaint.setShader(null);

        // 4 أقمار جاليليو — تتحرك ببطء
        double t = now / 86400000.0; // أيام منذ epoch
        float[] moonPeriods  = { 1.769f, 3.551f, 7.155f, 16.689f }; // يوم
        float[] moonDists    = { r * 2.2f, r * 3.5f, r * 5.0f, r * 8.5f };
        int[] moonColors = { 0xFFFFD890, 0xFFCCBBA0, 0xFFE8E0C8, 0xFFCCB890 };
        Paint moonP = new Paint(Paint.ANTI_ALIAS_FLAG);
        moonP.setStyle(Paint.Style.FILL);
        for (int i = 0; i < 4; i++) {
            double angle = (t / moonPeriods[i]) * 2 * Math.PI;
            float mx = x + (float)(Math.cos(angle) * moonDists[i]);
            float my = y + (float)(Math.sin(angle) * moonDists[i] * 0.3f); // مائلة
            float mr = 0.9f + i * 0.1f;
            moonP.setColor(moonColors[i]);
            c.drawCircle(mx, my, mr, moonP);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // زحل مع حلقاته
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawSaturn(Canvas c, Paint p, double alt, double az, int w, int h) {
        if (alt < 1.5) return;
        double appAlt = alt + refractionCorrection(alt);
        float x = azToX(az, w), y = altToY(appAlt, h);
        if (x < -15 || x > w + 15 || y < -15 || y > h + 15) return;
        float r = 4.0f;
        p.setShader(new RadialGradient(x, y, r * 7,
            new int[]{ Color.argb(60, 255, 240, 180), Color.argb(0, 255, 230, 160) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r * 7, p);
        p.setShader(null);
        // حلقة خلفية (ظل)
        Paint ringPaintBg = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringPaintBg.setStyle(Paint.Style.STROKE);
        ringPaintBg.setStrokeWidth(2.5f);
        ringPaintBg.setColor(Color.argb(100, 180, 160, 100));
        c.drawOval(new RectF(x - r * 2.6f, y - r * 0.8f, x + r * 2.6f, y + r * 0.8f), ringPaintBg);
        // قرص الكوكب
        p.setShader(new RadialGradient(x - r * 0.2f, y - r * 0.2f, r * 1.3f,
            new int[]{ 0xFFFFEEAA, 0xFFDDB860 }, null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r, p);
        p.setShader(null);
        // حلقة أمامية
        Paint ringPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringPaint.setStyle(Paint.Style.STROKE);
        ringPaint.setStrokeWidth(2.0f);
        ringPaint.setShader(new LinearGradient(x - r * 2.4f, 0, x + r * 2.4f, 0,
            new int[]{ Color.argb(80, 200, 180, 100),
                       Color.argb(200, 255, 235, 160),
                       Color.argb(240, 255, 248, 190),
                       Color.argb(200, 255, 235, 160),
                       Color.argb(80, 200, 180, 100) },
            null, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(x - r * 2.4f, y - r * 0.7f, x + r * 2.4f, y + r * 0.7f), ringPaint);
        ringPaint.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 13. الأجرام السماوية العميقة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawDeepSkyObjects(Canvas c, int w, int h, Paint p,
                                           double sunAlt, long now) {
        if (sunAlt > -15 || cDsoPos == null) return;
        float dark = (float) Math.min(1, (-sunAlt - 15) / 8.0);
        for (int i = 0; i < DSO.length && i < cDsoPos.length; i++) {
            double alt = cDsoPos[i][0], az = cDsoPos[i][1];
            if (alt < 4) continue;
            float sx = azToX(az, w), sy = altToY(alt, h);
            if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
            int type = (int) DSO[i][2];
            if (type == 0) {
                float rx = h * 0.065f, ry = h * 0.022f;
                int a = (int)(30 * dark);
                p.setStyle(Paint.Style.FILL);
                p.setShader(new RadialGradient(sx, sy, rx,
                    new int[]{ Color.argb(a, 220, 230, 255),
                               Color.argb(a / 3, 180, 200, 255),
                               Color.argb(0, 160, 180, 255) },
                    new float[]{ 0f, 0.45f, 1f }, Shader.TileMode.CLAMP));
                c.drawOval(new RectF(sx - rx, sy - ry, sx + rx, sy + ry), p);
                p.setShader(null);
                p.setColor(Color.argb(Math.min(255, (int)(a * 3)), 240, 245, 255));
                c.drawCircle(sx, sy, 2.5f, p);
            } else {
                float rOuter = h * 0.045f;
                int a = (int)(24 * dark);
                p.setStyle(Paint.Style.FILL);
                p.setShader(new RadialGradient(sx, sy, rOuter,
                    new int[]{ Color.argb(a, 160, 220, 200),
                               Color.argb(a / 2, 120, 180, 200),
                               Color.argb(0, 80, 140, 180) },
                    new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
                c.drawCircle(sx, sy, rOuter, p);
                p.setShader(null);
                p.setColor(Color.argb(Math.min(255, a * 4), 255, 255, 255));
                for (int j = 0; j < 4; j++) {
                    float ox = (j % 2 == 0 ? -1 : 1) * h * 0.004f;
                    float oy = (j < 2 ? -1 : 1) * h * 0.004f;
                    c.drawCircle(sx + ox, sy + oy, 1.2f, p);
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // خطوط الكوكبات
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawConstellations(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > -14 || cStarPos == null) return;
        float dark = (float) Math.min(1, (-sunAlt - 14) / 10.0);
        int alpha = (int)(32 * dark);
        if (alpha < 6) return;
        Paint lp = new Paint(Paint.ANTI_ALIAS_FLAG);
        lp.setStyle(Paint.Style.STROKE);
        lp.setStrokeWidth(1.0f);
        lp.setColor(Color.argb(alpha, 180, 210, 255));
        for (int[] pair : CONSTELLATION_LINES) {
            int ia = pair[0], ib = pair[1];
            if (ia >= cStarPos.length || ib >= cStarPos.length) continue;
            double altA = cStarPos[ia][0], azA = cStarPos[ia][1];
            double altB = cStarPos[ib][0], azB = cStarPos[ib][1];
            if (altA < 2 || altB < 2) continue;
            float x1 = azToX(azA, w), y1 = altToY(altA + refractionCorrection(altA), h);
            float x2 = azToX(azB, w), y2 = altToY(altB + refractionCorrection(altB), h);
            if (x1 < -10 || x1 > w + 10 || x2 < -10 || x2 > w + 10) continue;
            c.drawLine(x1, y1, x2, y2, lp);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // الشفق القطبي — Aurora Borealis
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawAurora(Canvas c, int w, int h, Paint p,
                                   double sunAlt, double lat, long now) {
        if (Math.abs(lat) < 52 || sunAlt > -18) return;
        float intensity = (float) Math.min(1.0, (Math.abs(lat) - 52) / 20.0);
        float dark      = (float) Math.min(1.0, (-sunAlt - 18) / 10.0);
        float amp       = intensity * dark;
        if (amp < 0.05f) return;
        Random rnd = new Random((now / 8000L));
        int bandCount = 4 + rnd.nextInt(3);
        float baseY = h * 0.35f;
        for (int band = 0; band < bandCount; band++) {
            float bandOffset = rnd.nextFloat() * h * 0.15f;
            float waveAmp    = h * 0.035f * (0.6f + rnd.nextFloat() * 0.8f);
            float waveFreq   = (float)(Math.PI * 2 / w * (2 + rnd.nextFloat() * 3));
            float phaseShift = rnd.nextFloat() * (float)(Math.PI * 2);
            float bandAlpha  = amp * (0.5f + rnd.nextFloat() * 0.5f);
            boolean purple = rnd.nextFloat() < 0.25f;
            int cr = purple ? 160 : 40, cg = purple ? 40 : 210, cb = purple ? 200 : 100;
            int steps = 60;
            float[] xs = new float[steps + 1], ys = new float[steps + 1];
            for (int s = 0; s <= steps; s++) {
                float xp = (float) s / steps * w;
                float yp = baseY + bandOffset
                    + (float)(Math.sin(waveFreq * xp + phaseShift) * waveAmp)
                    + (float)(Math.sin(waveFreq * 2.3 * xp + phaseShift * 1.7) * waveAmp * 0.4);
                xs[s] = xp; ys[s] = yp;
            }
            Paint aurPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            aurPaint.setStyle(Paint.Style.STROKE);
            aurPaint.setStrokeWidth(1.2f);
            for (int s = 0; s < steps; s += 4) {
                float curtainAlpha = bandAlpha * (0.4f + 0.6f * (float)Math.random());
                int ca = (int)(curtainAlpha * 90);
                if (ca < 5) continue;
                float bx = xs[s], by = ys[s];
                float curtainLen = h * 0.06f * (0.5f + rnd.nextFloat());
                aurPaint.setShader(new LinearGradient(bx, by, bx, by + curtainLen,
                    Color.argb(ca, cr, cg, cb), Color.argb(0, cr, cg, cb), Shader.TileMode.CLAMP));
                c.drawLine(bx, by, bx, by + curtainLen, aurPaint);
            }
            aurPaint.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // شهاب موسمي
    // ═══════════════════════════════════════════════════════════════════════
    private static long  sLastStart = 0, sNextDelay = 0;
    private static float sX1, sY1, sX2, sY2;
    private static long  satLastPass = 0, satNextPass = 0;
    private static float satX1, satY1, satX2, satY2;
    private static boolean satFlare = false;
    // Cumulonimbus state
    private static long  cbStormStart = 0, cbStormDur = 0, cbStormNext = 180_000L;
    private static float cbCloudX = 0.62f, cbCloudW = 0;
    private static long  cbBoltTime = 0;
    private static float cbBoltX1, cbBoltY1;
    // نظام الطقس الموسمي
    private static final int WS_CLEAR    = 0;
    private static final int WS_PARTLY   = 1;
    private static final int WS_OVERCAST = 2;
    private static final int WS_STORMY   = 3;
    private static final int WS_FOGGY    = 4;
    private static int   wsCurrent   = WS_PARTLY;
    private static int   wsNextState  = WS_PARTLY;
    private static float wsTrans      = 1.0f;
    private static long  wsChanged    = 0L;
    private static long  wsHold       = 600_000L;
    private static float wsCloudMult  = 0.5f;
    private static float wsFogMult    = 0.0f;
    private static float wsStormMult  = 0.0f;
    private static float wsOvercast   = 0.0f;
    // حالة المذنب
    private static long  cometLastAppear = 0;
    private static long  cometNextAppear = 0;
    private static boolean cometVisible  = false;
    // حالة الطيور
    private static long  birdsLastSeen = 0;
    private static float birdsX = 0, birdsY = 0;

    private static void drawShootingStar(Canvas c, int w, int h, Paint p,
                                         double sunAlt, long now) {
        if (sunAlt > -11) return;
        if (sNextDelay == 0) sNextDelay = 60_000L;
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int dayOfYear = cal.get(java.util.Calendar.DAY_OF_YEAR);
        double showerRate = 1.0;
        for (double[] shower : METEOR_SHOWERS) {
            double dDiff = Math.abs(dayOfYear - shower[0]);
            if (dDiff > 180) dDiff = 365 - dDiff;
            if (dDiff <= shower[1]) {
                showerRate = Math.max(showerRate, shower[2] * (1 - dDiff / shower[1]));
            }
        }
        long baseDelay = (long)(60_000L / showerRate);
        if (now - sLastStart > sNextDelay) {
            sLastStart = now;
            Random rnd = new Random(now / 1000L);
            sNextDelay = (long)(baseDelay * (0.5f + rnd.nextFloat()));
            sX1 = rnd.nextFloat() * w;
            sY1 = rnd.nextFloat() * h * 0.42f;
            float angle = (float)(Math.PI / 6 + rnd.nextFloat() * Math.PI * 0.45);
            float lenScale = (showerRate > 3) ? 1.4f : 1.0f;
            float len = (w * 0.10f + rnd.nextFloat() * w * 0.18f) * lenScale;
            sX2 = sX1 + (float)(Math.cos(angle) * len);
            sY2 = sY1 + (float)(Math.sin(angle) * len);
        }
        long dur = 1200L, elapsed = now - sLastStart;
        if (elapsed >= dur) return;
        float t  = elapsed / (float)dur;
        float fa = t < 0.12f ? t / 0.12f : 1f - (t - 0.12f) / 0.88f;
        int a = (int)(240 * fa);
        float cx = sX1 + (sX2 - sX1) * t;
        float cy = sY1 + (sY2 - sY1) * t;
        float tx = sX1 + (sX2 - sX1) * Math.max(0, t - 0.20f);
        float ty = sY1 + (sY2 - sY1) * Math.max(0, t - 0.20f);
        int tc = (showerRate > 3) ? Color.argb(a, 255, 240, 180) : Color.argb(a, 255, 255, 255);
        Paint trail = new Paint(Paint.ANTI_ALIAS_FLAG);
        trail.setShader(new LinearGradient(tx, ty, cx, cy,
            Color.argb(0, 255, 252, 240), tc, Shader.TileMode.CLAMP));
        trail.setStrokeWidth(showerRate > 3 ? 2.5f : 2.0f);
        trail.setStyle(Paint.Style.STROKE);
        trail.setStrokeCap(Paint.Cap.ROUND);
        c.drawLine(tx, ty, cx, cy, trail);
        p.setShader(new RadialGradient(cx, cy, 6,
            new int[]{ Color.argb(a, 255, 255, 255), Color.argb(0, 255, 255, 255) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(cx, cy, 6, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // مذنب واقعي — ذيل غبار + ذيل أيوني
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawComet(Canvas c, int w, int h, Paint p, double sunAlt, long now) {
        if (sunAlt > -8) return;

        // مذنب يظهر كل ~90 يوماً لمدة 4 أيام
        if (cometNextAppear == 0) {
            Random r0 = new Random(now / 86400000L / 90L);
            cometNextAppear = 0;
            cometLastAppear = now - (long)(r0.nextFloat() * 86400000L * 4L);
        }
        long cometAge = now - cometLastAppear;
        long cometDuration = 86400000L * 4L; // 4 أيام
        if (cometAge > cometDuration) {
            // جدولة الظهور التالي
            Random r1 = new Random(now / 86400000L);
            cometLastAppear = now + (long)(r1.nextFloat() * 86400000L * 86L); // 86 يوم من الآن
            cometNextAppear = 1;
            return;
        }

        float cAge = (float)(cometAge / (double)cometDuration);
        float fadeFactor = cAge < 0.1f ? cAge / 0.1f : (cAge > 0.9f ? 1f - (cAge - 0.9f) / 0.1f : 1f);
        fadeFactor = Math.max(0, Math.min(1, fadeFactor));

        // موقع المذنب — ثابت لفترة تُحدَّث يومياً
        Random posRnd = new Random(now / 86400000L * 90L + 777L);
        float cometX = w * (0.15f + posRnd.nextFloat() * 0.70f);
        float cometY = h * (0.05f + posRnd.nextFloat() * 0.35f);

        // اتجاه الذيل — مُعاكس لاتجاه الشمس (sunX, sunY)
        float sunX = azToX(cSunAz, w);
        float sunY = altToY(cSunAlt, h);
        float dTailX = cometX - sunX;
        float dTailY = cometY - sunY;
        float dLen = (float) Math.max(1, Math.sqrt(dTailX * dTailX + dTailY * dTailY));
        float tailDirX = dTailX / dLen;
        float tailDirY = dTailY / dLen;

        float dark = (float) Math.min(1.0, (-sunAlt - 8) / 12.0) * fadeFactor;
        if (dark < 0.05f) return;

        // ذيل الغبار — عريض ومنحنٍ قليلاً (أصفر-بيج)
        float dustLen = w * 0.28f * fadeFactor;
        float dustEndX = cometX + tailDirX * dustLen;
        float dustEndY = cometY + tailDirY * dustLen;
        // انحراف خفيف
        float perpX = -tailDirY * dustLen * 0.12f;
        float perpY =  tailDirX * dustLen * 0.12f;

        Paint dustPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        dustPaint.setStyle(Paint.Style.STROKE);
        dustPaint.setStrokeCap(Paint.Cap.ROUND);
        for (int layer = 0; layer < 4; layer++) {
            float layerW = (8f - layer * 1.5f) * fadeFactor;
            int layerA = (int)(dark * (60 - layer * 12));
            if (layerA < 4 || layerW < 1) continue;
            float offsetX = perpX * (layer * 0.3f);
            float offsetY = perpY * (layer * 0.3f);
            Path dustPath = new Path();
            dustPath.moveTo(cometX, cometY);
            dustPath.quadTo(
                cometX + tailDirX * dustLen * 0.5f + offsetX * 0.5f,
                cometY + tailDirY * dustLen * 0.5f + offsetY * 0.5f,
                dustEndX + offsetX, dustEndY + offsetY);
            dustPaint.setStrokeWidth(layerW);
            dustPaint.setShader(new LinearGradient(
                cometX, cometY, dustEndX, dustEndY,
                Color.argb(layerA, 255, 245, 190),
                Color.argb(0, 220, 200, 140),
                Shader.TileMode.CLAMP));
            c.drawPath(dustPath, dustPaint);
        }
        dustPaint.setShader(null);

        // ذيل أيوني — رفيع ومستقيم (أزرق-أبيض)
        float ionLen = w * 0.35f * fadeFactor;
        float ionEndX = cometX + tailDirX * ionLen;
        float ionEndY = cometY + tailDirY * ionLen;
        Paint ionPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ionPaint.setStyle(Paint.Style.STROKE);
        ionPaint.setStrokeWidth(2.0f * fadeFactor);
        ionPaint.setStrokeCap(Paint.Cap.ROUND);
        ionPaint.setShader(new LinearGradient(cometX, cometY, ionEndX, ionEndY,
            Color.argb((int)(dark * 140), 180, 210, 255),
            Color.argb(0, 140, 180, 255),
            Shader.TileMode.CLAMP));
        c.drawLine(cometX, cometY, ionEndX, ionEndY, ionPaint);
        ionPaint.setShader(null);

        // توهج النواة
        int nucleusA = (int)(dark * 255);
        p.setShader(new RadialGradient(cometX, cometY, 12f * fadeFactor,
            new int[]{ Color.argb(nucleusA, 255, 255, 240),
                       Color.argb(nucleusA / 2, 220, 230, 255),
                       Color.argb(0, 180, 200, 255) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(cometX, cometY, 12f * fadeFactor, p);
        p.setShader(null);

        // نواة مركزية ساطعة
        p.setColor(Color.argb(nucleusA, 255, 255, 255));
        c.drawCircle(cometX, cometY, 2.5f, p);

        // هالة الغاز (Coma)
        int comaA = (int)(dark * 55);
        p.setShader(new RadialGradient(cometX, cometY, h * 0.04f * fadeFactor,
            new int[]{ Color.argb(comaA, 220, 240, 200),
                       Color.argb(comaA / 3, 200, 220, 180),
                       Color.argb(0, 160, 200, 140) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(cometX, cometY, h * 0.04f * fadeFactor, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // القمر المحسّن — sun-relative terminator + 3D sphere + Ramadan
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawMoon(Canvas c, Paint p, float x, float y,
                                 int h, int w, double phase, double moonAlt,
                                 double sunAlt, float sunScreenX, float sunScreenY, long now) {
        float r  = h * 0.075f;
        float yy = Math.max(r + 4, Math.min(y, (float)(h - r - 4)));
        double ill = moonIllumination(phase);

        // ══ تلوين القمر حسب ارتفاعه ══
        float horizonT = (float) Math.max(0, Math.min(1, (15 - moonAlt) / 15.0));
        boolean bloodMoon = (moonAlt < 5 && ill > 0.45);
        int moonBase1, moonBase2, moonBase3;
        if (bloodMoon) {
            moonBase1 = 0xFFFF3300; moonBase2 = 0xFFCC2200; moonBase3 = 0xFF881100;
        } else if (horizonT > 0) {
            moonBase1 = lerpColor(0xFFF8F0D8, 0xFFFFB060, horizonT);
            moonBase2 = lerpColor(0xFFE8D8A8, 0xFFFF8030, horizonT);
            moonBase3 = lerpColor(0xFFCCB87A, 0xFFCC5010, horizonT);
        } else {
            moonBase1 = 0xFFF8F0D8; moonBase2 = 0xFFE8D8A8; moonBase3 = 0xFFCCB87A;
        }

        // ══ هالة القمر 22° ══
        if (ill > 0.15 && sunAlt < 0) {
            float halo22 = r * 5.5f;
            int haloClr = bloodMoon ? Color.argb((int)(22 * ill), 220, 80, 40)
                                    : Color.argb((int)(28 * ill), 230, 230, 200);
            Paint haloPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            haloPaint.setStyle(Paint.Style.STROKE);
            haloPaint.setStrokeWidth(1.2f);
            haloPaint.setColor(haloClr);
            c.drawCircle(x, yy, halo22, haloPaint);
            int aurClr = bloodMoon ? Color.argb((int)(50 * ill), 255, 80, 30)
                                   : Color.argb((int)(55 * ill), 240, 238, 200);
            p.setShader(new RadialGradient(x, yy, r * 4.0f,
                new int[]{ aurClr, Color.argb(0, Color.red(aurClr), Color.green(aurClr), Color.blue(aurClr)) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(x, yy, r * 4.0f, p);
            p.setShader(null);
        }

        // ══ هلال رمضان — تأثير ذهبي في أول يومين ══
        boolean isRamadanCrescent = (cHijriMonth == 9 && phase < 0.07 && ill < 0.15);
        if (isRamadanCrescent) {
            // هالة ذهبية متوهجة
            p.setShader(new RadialGradient(x, yy, r * 6.5f,
                new int[]{ Color.argb(90, 255, 215, 50),
                           Color.argb(40, 220, 175, 30),
                           Color.argb(0, 180, 130, 20) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(x, yy, r * 6.5f, p);
            p.setShader(null);
        }

        // ══ الجانب المظلم من القمر ══
        p.setColor(0xFF080E1C);
        p.setStyle(Paint.Style.FILL);
        c.drawCircle(x, yy, r, p);

        // ══ Earthshine — إضاءة خافتة للجانب المظلم ══
        if (ill < 0.35 && sunAlt < 0) {
            int esAlpha = (int)(22 * (1 - ill / 0.35));
            p.setColor(Color.argb(esAlpha, 60, 90, 140));
            c.drawCircle(x, yy, r, p);
        }

        // ══ الجانب المضيء بـ Terminator محسوب حسب موقع الشمس ══
        if (ill > 0.012) {
            // حساب اتجاه الشمس من موضعها الفعلي على الشاشة
            // هذا يعطي اتجاه الإضاءة الصحيح بصرياً
            float dx = sunScreenX - x;
            float dy = sunScreenY - yy;

            // زاوية الشمس من القمر على الشاشة
            double sunAngleOnScreen = Math.atan2(dy, dx);

            // حساب Terminator بطريقة sun-relative
            // المحور الرأسي للتيرميناتور عمودي على اتجاه الشمس
            double phAngle = phase * 2 * Math.PI;
            float term = r * (float) Math.cos(phAngle);
            boolean waning = (phase > 0.5);

            // تدوير المسار حسب اتجاه الشمس
            c.save();
            c.rotate((float) Math.toDegrees(sunAngleOnScreen) + 90f, x, yy);

            Path mp = new Path();
            RectF oval = new RectF(x - r, yy - r, x + r, yy + r);
            float absT = Math.abs(term);

            if (!waning) {
                mp.addArc(oval, -90, 180);
                if (term >= 0)
                    mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), 90, 180);
                else
                    mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), 90, -180);
            } else {
                mp.addArc(oval, 90, 180);
                if (term >= 0)
                    mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), -90, 180);
                else
                    mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), -90, -180);
            }
            mp.close();

            // سطح مضيء مع gradient ثلاثي الأبعاد (Limb Darkening)
            p.setShader(new RadialGradient(x + term * 0.15f, yy - r * 0.1f, r * 1.2f,
                new int[]{ moonBase1,
                           lerpColor(moonBase1, moonBase2, 0.5f),
                           moonBase2,
                           moonBase3 },
                new float[]{ 0f, 0.40f, 0.72f, 1f }, Shader.TileMode.CLAMP));
            c.drawPath(mp, p);
            p.setShader(null);

            // بحار القمر Mare
            if (ill > 0.25 && !bloodMoon) drawMoonMare(c, x, yy, r, phase, ill, mp);

            // فوهات القمر
            if (ill > 0.15 && r > 8) drawMoonCraters(c, x, yy, r, phase, ill, sunAngleOnScreen);

            c.restore();

            // هلال رمضان الذهبي — خط ذهبي على حافة الهلال
            if (isRamadanCrescent) {
                Paint goldenRim = new Paint(Paint.ANTI_ALIAS_FLAG);
                goldenRim.setStyle(Paint.Style.STROKE);
                goldenRim.setStrokeWidth(1.8f);
                goldenRim.setColor(Color.argb(160, 255, 220, 80));
                c.drawCircle(x, yy, r + 0.5f, goldenRim);
            }
        }

        // Blood Moon ring
        if (bloodMoon) {
            p.setShader(new RadialGradient(x, yy, r * 1.35f,
                new int[]{ Color.argb(0, 255, 60, 0),
                           Color.argb(90, 255, 40, 0),
                           Color.argb(0, 255, 20, 0) },
                new float[]{ 0.7f, 0.88f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(x, yy, r * 1.35f, p);
            p.setShader(null);
        }

        // عمود ضوء القمر (Moon Pillar) عند الأفق
        drawMoonPillar(c, p, x, yy, r, moonAlt, sunAlt, ill);
    }

    /** بحار القمر الداكنة */
    private static void drawMoonMare(Canvas c, float mx, float my, float r,
                                     double phase, double ill, Path clipPath) {
        float[][] mare = {
            { -0.22f, -0.18f, 0.30f, 0.24f }, // Mare Imbrium
            {  0.18f, -0.20f, 0.20f, 0.17f }, // Mare Serenitatis
            {  0.22f,  0.12f, 0.19f, 0.15f }, // Mare Tranquillitatis
            {  0.46f,  0.02f, 0.13f, 0.11f }, // Mare Crisium
            { -0.12f,  0.28f, 0.22f, 0.19f }, // Mare Nubium
            { -0.38f,  0.08f, 0.17f, 0.30f }, // Oceanus Procellarum
        };
        int alpha = (int)(36 * Math.min(1, (ill - 0.25) / 0.75));
        Paint mp2 = new Paint(Paint.ANTI_ALIAS_FLAG);
        mp2.setStyle(Paint.Style.FILL);
        c.save();
        c.clipPath(clipPath);
        for (float[] m : mare) {
            float cx = mx + m[0] * r, cy = my + m[1] * r;
            float rx = m[2] * r,      ry = m[3] * r;
            mp2.setShader(new RadialGradient(cx, cy, Math.max(rx, ry),
                new int[]{ Color.argb(alpha, 32, 28, 25),
                           Color.argb(alpha / 2, 52, 48, 42),
                           Color.argb(0, 78, 72, 65) },
                new float[]{ 0f, 0.55f, 1f }, Shader.TileMode.CLAMP));
            c.drawOval(new RectF(cx - rx, cy - ry, cx + rx, cy + ry), mp2);
        }
        c.restore();
        mp2.setShader(null);
    }

    /** فوهات قمرية واقعية مع تظليل بناءً على اتجاه الشمس */
    private static void drawMoonCraters(Canvas c, float mx, float my, float r,
                                        double phase, double ill, double sunAngle) {
        float[][] craters = {
            { 0.25f, -0.10f, 0.065f, 1 }, // Tycho
            {-0.15f,  0.30f, 0.055f, 1 }, // Copernicus
            { 0.40f, -0.35f, 0.045f, 0 }, // Clavius
            {-0.30f, -0.20f, 0.038f, 0 }, // Plato
            { 0.10f,  0.45f, 0.040f, 1 }, // Grimaldi
            {-0.20f,  0.05f, 0.032f, 0 }, // Mare Imbrium hint
            { 0.05f, -0.38f, 0.030f, 1 }, // Aristarchus
        };
        Paint cp = new Paint(Paint.ANTI_ALIAS_FLAG);
        cp.setStyle(Paint.Style.FILL);
        int alpha = (int)(40 * ill);

        float shadowDX = -(float)Math.cos(sunAngle) * 0.3f;
        float shadowDY = -(float)Math.sin(sunAngle) * 0.3f;

        for (float[] cr : craters) {
            float cx = mx + cr[0] * r;
            float cy = my + cr[1] * r;
            float cr2 = cr[2] * r;
            // حافة مضيئة
            cp.setColor(Color.argb(alpha / 2, 220, 210, 190));
            c.drawCircle(cx - shadowDX * cr2, cy - shadowDY * cr2, cr2, cp);
            // ظل الفوهة
            cp.setColor(Color.argb(alpha, 70, 58, 40));
            c.drawCircle(cx + shadowDX * cr2, cy + shadowDY * cr2, cr2 * 0.8f, cp);
            // مركز الفوهة
            cp.setColor(Color.argb(alpha * 3 / 4, 100, 88, 70));
            c.drawCircle(cx, cy, cr2 * 0.55f, cp);
        }
    }

    /** عمود ضوء القمر (Moon Pillar) عند الأفق قريباً */
    private static void drawMoonPillar(Canvas c, Paint p, float x, float y,
                                       float r, double moonAlt, double sunAlt, double ill) {
        if (moonAlt > 8 || moonAlt < -2 || sunAlt > -2 || ill < 0.25) return;
        float moonT = (float) Math.max(0, Math.min(1, (8 - moonAlt) / 8.0));
        int pillarA = (int)(ill * 35 * moonT);
        if (pillarA < 4) return;
        p.setShader(new LinearGradient(x, y - r * 6, x, y + r * 4,
            new int[]{ Color.argb(0, 220, 220, 200),
                       Color.argb(pillarA, 220, 220, 200),
                       Color.argb(pillarA / 2, 200, 200, 180),
                       Color.argb(0, 180, 180, 160) },
            new float[]{ 0f, 0.25f, 0.7f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(x - r * 0.4f, y - r * 6, x + r * 0.4f, y + r * 4, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // أشعة الإله / Crepuscular Rays
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawCrepuscularRays(Canvas c, int w, int h, Paint p,
                                            double sunAlt, float sunX, float sunY) {
        if (sunAlt < -8 || sunAlt > 20) return;
        double intensity = 0;
        if (sunAlt < 0)      intensity = 1.0 - Math.abs(sunAlt) / 8.0;
        else if (sunAlt < 8) intensity = 1.0 - sunAlt / 8.0;
        else                 intensity = (20 - sunAlt) / 12.0;
        intensity = Math.max(0, Math.min(1, intensity));
        Random rnd = new Random(12345L);
        int numRays = 9;
        for (int i = 0; i < numRays; i++) {
            double angle = -Math.PI / 2 + (i - numRays / 2.0) * (Math.PI * 0.16)
                         + rnd.nextDouble() * 0.15;
            float ex = sunX + (float)(Math.cos(angle) * w * 1.5);
            float ey = sunY + (float)(Math.sin(angle) * w * 1.5);
            float rayW = (0.8f + rnd.nextFloat() * 2.5f);
            int alpha = (int)((25 + rnd.nextFloat() * 30) * intensity);
            Paint rayPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            rayPaint.setShader(new LinearGradient(sunX, sunY, ex, ey,
                Color.argb(alpha, 255, 245, 200), Color.argb(0, 255, 240, 180), Shader.TileMode.CLAMP));
            rayPaint.setStyle(Paint.Style.STROKE);
            rayPaint.setStrokeWidth(rayW);
            rayPaint.setStrokeCap(Paint.Cap.ROUND);
            c.drawLine(sunX, sunY, ex, ey, rayPaint);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // الشمس المحسّنة — بقع شمسية + لهب + تسطيح
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawSun(Canvas c, Paint p, float x, float y, int w, int h,
                                double sunAlt, long now) {
        float sizeMult = (sunAlt < 10) ? (1.0f + (float)(10 - sunAlt) * 0.025f) : 1.0f;
        float r  = h * 0.070f * sizeMult;
        float yy = Math.max(r + 4, Math.min(y, (float)(h * 1.05)));

        // تسطّح الشمس عند الأفق (Oblate)
        float oblateness = (sunAlt < 5) ? (float)(1.0 - Math.max(0, sunAlt) / 5.0 * 0.22) : 1.0f;
        float ry = r * oblateness;

        boolean lowSun = (sunAlt < 10);

        int centerColor, edgeColor;
        if (sunAlt > 20) { centerColor = 0xFFFFFFF5; edgeColor = 0xFFFFF080; }
        else if (sunAlt > 8) { centerColor = 0xFFFFFECC; edgeColor = 0xFFFFEC44; }
        else if (sunAlt > 2) { centerColor = 0xFFFFE888; edgeColor = 0xFFFF9000; }
        else { centerColor = 0xFFFFCC44; edgeColor = 0xFFFF4400; }

        // هالة خارجية كبيرة
        int haloInner = lowSun ? Color.argb(100, 255, 110, 5) : Color.argb(80, 255, 200, 50);
        int haloMid   = lowSun ? Color.argb(40,  255,  60, 0) : Color.argb(30, 255, 170, 0);
        p.setShader(new RadialGradient(x, yy, r * 11f,
            new int[]{ haloInner, haloMid, Color.argb(0, 255, 120, 0) },
            new float[]{ 0f, 0.3f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(x, yy, r * 11f, p);
        p.setShader(null);

        // Corona — 8 أشعة
        Paint coronaRay = new Paint(Paint.ANTI_ALIAS_FLAG);
        coronaRay.setStyle(Paint.Style.STROKE);
        coronaRay.setStrokeWidth(r * 0.3f);
        coronaRay.setStrokeCap(Paint.Cap.ROUND);
        for (int ray = 0; ray < 8; ray++) {
            double ang = ray * Math.PI / 4.0;
            float rx2 = (float)(Math.cos(ang)), ry2 = (float)(Math.sin(ang));
            float inner = r * 1.25f, outer = r * (2.8f + (ray % 2) * 0.6f);
            coronaRay.setShader(new LinearGradient(
                x + rx2 * inner, yy + ry2 * inner,
                x + rx2 * outer, yy + ry2 * outer,
                Color.argb(lowSun ? 52 : 38, 255, 240, 180),
                Color.argb(0, 255, 200, 100), Shader.TileMode.CLAMP));
            c.drawLine(x + rx2 * inner, yy + ry2 * inner, x + rx2 * outer, yy + ry2 * outer, coronaRay);
        }
        coronaRay.setShader(null);

        // Corona داخلية (glow)
        p.setShader(new RadialGradient(x, yy, r * 3.0f,
            new int[]{ Color.argb(160, 255, 255, 210),
                       Color.argb(50,  255, 210, 80),
                       Color.argb(0,   255, 160, 0) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, yy, r * 3.0f, p);
        p.setShader(null);

        // قرص الشمس — Oblate + Limb Darkening
        p.setShader(new RadialGradient(x, yy, r,
            new int[]{ centerColor, edgeColor, lerpColor(edgeColor, 0xFF883300, 0.45f) },
            new float[]{ 0f, 0.70f, 1f }, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(x - r, yy - ry, x + r, yy + ry), p);
        p.setShader(null);

        // بقع شمسية Sunspots — تظهر دائماً (عددها يتغير ببطء)
        if (sunAlt > 5) {
            long sunspotSeed = now / (86400000L * 11L); // دورة 11 يوم
            Random spRnd = new Random(sunspotSeed);
            int numSpots = 2 + spRnd.nextInt(3);
            Paint spotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            spotPaint.setStyle(Paint.Style.FILL);
            int savedSpots = c.saveLayer(new RectF(x - r, yy - ry, x + r, yy + ry), null);
            // clip إلى الشمس
            Path sunClip = new Path();
            sunClip.addOval(new RectF(x - r, yy - ry, x + r, yy + ry), Path.Direction.CW);
            c.clipPath(sunClip);
            for (int s = 0; s < numSpots; s++) {
                float spX = x + (spRnd.nextFloat() - 0.5f) * r * 1.2f;
                float spY = yy + (spRnd.nextFloat() - 0.5f) * ry * 0.8f;
                float spR = r * (0.032f + spRnd.nextFloat() * 0.040f);
                // Umbra (مركز داكن)
                spotPaint.setShader(new RadialGradient(spX, spY, spR,
                    new int[]{ Color.argb(210, 40, 20, 10),
                               Color.argb(120, 80, 40, 20),
                               Color.argb(0, 140, 70, 30) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(spX, spY, spR, spotPaint);
            }
            c.restoreToCount(savedSpots);
            spotPaint.setShader(null);
        }

        // لهب شمسي Solar Flares — على حافة الشمس
        if (sunAlt > 3) {
            drawSolarFlares(c, p, x, yy, r, now);
        }

        // Solar Pillar عند الغروب/الشروق
        if (sunAlt < 4 && sunAlt > -5) {
            float pillarAlpha = (float)(1.0 - Math.abs(sunAlt) / 5.0) * 62;
            p.setShader(new LinearGradient(x, yy - r * 5, x, yy + r * 3,
                new int[]{ Color.argb(0, 255, 200, 80),
                           Color.argb((int)pillarAlpha, 255, 180, 60),
                           Color.argb(0, 255, 160, 40) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(x - r * 0.5f, yy - r * 5, x + r * 0.5f, yy + r * 3, p);
            p.setShader(null);
        }
    }

    /** لهب شمسي Solar Flares — بروزات حمراء على حافة الشمس */
    private static void drawSolarFlares(Canvas c, Paint p, float x, float y, float r, long now) {
        long flareSeed = now / 300_000L; // يتغير كل 5 دقائق
        Random fRnd = new Random(flareSeed);
        int numFlares = 2 + fRnd.nextInt(3);
        Paint flarePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        flarePaint.setStyle(Paint.Style.FILL);
        for (int i = 0; i < numFlares; i++) {
            double angle = fRnd.nextDouble() * 2 * Math.PI;
            float flareLen = r * (0.15f + fRnd.nextFloat() * 0.25f);
            float baseX1 = x + (float)(Math.cos(angle - 0.25) * r * 0.92f);
            float baseY1 = y + (float)(Math.sin(angle - 0.25) * r * 0.92f);
            float baseX2 = x + (float)(Math.cos(angle + 0.25) * r * 0.92f);
            float baseY2 = y + (float)(Math.sin(angle + 0.25) * r * 0.92f);
            float tipX = x + (float)(Math.cos(angle) * (r + flareLen));
            float tipY = y + (float)(Math.sin(angle) * (r + flareLen));

            Path flarePath = new Path();
            flarePath.moveTo(baseX1, baseY1);
            flarePath.quadTo(tipX, tipY, baseX2, baseY2);
            flarePath.close();

            int flareA = 130 + fRnd.nextInt(80);
            flarePaint.setShader(new RadialGradient(x, y, r + flareLen,
                new int[]{ Color.argb(flareA, 255, 60, 20),
                           Color.argb(flareA / 2, 220, 40, 10),
                           Color.argb(0, 180, 20, 5) },
                null, Shader.TileMode.CLAMP));
            c.drawPath(flarePath, flarePaint);
        }
        flarePaint.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // سحاب — seeds وطبقات
    // ═══════════════════════════════════════════════════════════════════════
    private static final float[][] CLOUD_SEEDS = {
        { 0.04f, 0.10f, 0.32f, 0, 16, 2.2f },
        { 0.52f, 0.08f, 0.27f, 0, 14, 1.8f },
        { 0.80f, 0.14f, 0.30f, 0, 15, 2.0f },
        { 0.28f, 0.19f, 0.22f, 0, 13, 1.6f },
        { 0.13f, 0.28f, 0.24f, 1, 15, 1.9f },
        { 0.60f, 0.25f, 0.28f, 1, 16, 2.1f },
        { 0.86f, 0.22f, 0.20f, 1, 13, 1.7f },
        { 0.38f, 0.36f, 0.26f, 1, 14, 1.8f },
        { 0.20f, 0.44f, 0.19f, 2, 13, 1.5f },
        { 0.66f, 0.40f, 0.24f, 2, 14, 1.7f },
        { 0.46f, 0.50f, 0.17f, 2, 12, 1.4f },
    };
    private static final float[] LAYER_SPEED = { 0.003f, 0.006f, 0.011f };

    // ═══════════════════════════════════════════════════════════════════════
    // Alpenglow
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawAlpenglow(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > 0 || sunAlt < -8) return;
        float t = (float)((sunAlt + 8) / 8.0);
        int alpha = (int)(58 * t * t);
        if (alpha < 4) return;
        p.setStyle(Paint.Style.FILL);
        p.setShader(new LinearGradient(0, h * 0.55f, 0, h * 0.80f,
            new int[]{ Color.argb(alpha, 230, 140, 180),
                       Color.argb(alpha / 2, 200, 100, 160),
                       Color.argb(0, 160, 60, 120) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.55f, w, h * 0.80f, p);
        p.setShader(null);
    }

    // Gegenschein
    private static void drawGegenschein(Canvas c, int w, int h, Paint p,
                                        double sunAlt, double sunAz) {
        if (sunAlt > -18) return;
        float dark = (float) Math.min(1, (-sunAlt - 18) / 10.0);
        int alpha = (int)(16 * dark);
        if (alpha < 3) return;
        float gx = azToX(sunAz + 180, w);
        float gy = altToY(5, h);
        float gr = h * 0.09f;
        p.setStyle(Paint.Style.FILL);
        p.setShader(new RadialGradient(gx, gy, gr,
            new int[]{ Color.argb(alpha, 230, 235, 200),
                       Color.argb(alpha / 2, 210, 215, 180),
                       Color.argb(0, 190, 200, 160) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(gx, gy, gr, p);
        p.setShader(null);
    }

    // Airglow
    private static void drawAirglow(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > -18) return;
        float dark = (float) Math.min(1, (-sunAlt - 18) / 8.0);
        int alpha = (int)(18 * dark);
        if (alpha < 3) return;
        float midY = h * 0.28f;
        p.setStyle(Paint.Style.FILL);
        p.setShader(new LinearGradient(0, midY - h * 0.08f, 0, midY + h * 0.08f,
            new int[]{ Color.argb(0, 100, 200, 80),
                       Color.argb(alpha, 110, 210, 90),
                       Color.argb(0, 100, 200, 80) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(0, midY - h * 0.08f, w, midY + h * 0.08f, p);
        p.setShader(null);
    }

    // Green Flash
    private static void drawGreenFlash(Canvas c, int w, int h, Paint p,
                                       double sunAlt, float sunX, float sunY) {
        if (sunAlt < -0.6 || sunAlt > 0.8) return;
        float t = (float)(1.0 - Math.abs(sunAlt - 0.1) / 0.7);
        int alpha = (int)(200 * t * t);
        if (alpha < 20) return;
        float r = h * 0.075f * (1.0f + (float)(10 - Math.max(sunAlt, 0)) * 0.025f);
        float yy = Math.max(r + 4, Math.min(sunY, (float)(h * 1.05)));
        p.setStyle(Paint.Style.FILL);
        p.setShader(new RadialGradient(sunX, yy - r * 0.6f, r * 0.8f,
            new int[]{ Color.argb(alpha, 100, 255, 80),
                       Color.argb(alpha / 2, 50, 220, 60),
                       Color.argb(0, 0, 180, 40) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(sunX, yy - r * 0.6f, r * 0.8f, p);
        p.setShader(null);
    }

    // Sundog
    private static void drawSundog(Canvas c, int w, int h, Paint p,
                                   double sunAlt, float sunX, float sunY) {
        float intensity = (float)(1.0 - sunAlt / 28.0);
        int alpha = (int)(55 * intensity);
        if (alpha < 8) return;
        float yy = Math.max(h * 0.05f, Math.min(sunY, (float)(h * 0.9f)));
        float dogR = h * 0.04f, offset22 = w * 0.18f;
        float[] dogXs = { sunX - offset22, sunX + offset22 };
        for (float dx : dogXs) {
            if (dx < -dogR || dx > w + dogR) continue;
            p.setShader(new RadialGradient(dx, yy, dogR * 2.5f,
                new int[]{ Color.argb(alpha, 255, 255, 220),
                           Color.argb(alpha * 2 / 3, 255, 230, 100),
                           Color.argb(alpha / 3, 255, 160, 60),
                           Color.argb(0, 255, 120, 40) },
                new float[]{ 0f, 0.3f, 0.6f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(dx, yy, dogR * 2.5f, p);
            p.setShader(null);
            Paint linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            linePaint.setStyle(Paint.Style.STROKE);
            linePaint.setStrokeWidth(1.5f);
            linePaint.setShader(new LinearGradient(sunX, yy, dx, yy,
                Color.argb(alpha / 3, 255, 240, 180), Color.argb(0, 255, 240, 180), Shader.TileMode.CLAMP));
            c.drawLine(sunX, yy, dx, yy, linePaint);
        }
    }

    // Circumzenithal Arc
    private static void drawCircumzenithalArc(Canvas c, int w, int h, Paint p,
                                              double sunAlt, float sunX) {
        float intensity = (float)(1.0 - Math.abs(sunAlt - 42) / 20.0);
        int alpha = (int)(62 * intensity);
        if (alpha < 8) return;
        float zenithY  = altToY(90, h);
        float arcRadiusPx = h * 0.32f;
        float arcCenterY  = zenithY + arcRadiusPx;
        int[] arcColors = {
            Color.argb(0, 220, 60, 80), Color.argb(alpha, 220, 60, 80),
            Color.argb(alpha, 255, 130, 0), Color.argb(alpha, 240, 230, 0),
            Color.argb(alpha, 50, 200, 60), Color.argb(alpha, 30, 100, 220),
            Color.argb(alpha, 120, 40, 200), Color.argb(0, 120, 40, 200) };
        float bandW = h * 0.025f;
        Paint arcPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        arcPaint.setStyle(Paint.Style.STROKE);
        for (int band = 0; band < 7; band++) {
            arcPaint.setColor(arcColors[band + 1]);
            arcPaint.setStrokeWidth(bandW);
            arcPaint.setAlpha(alpha);
            float br = arcRadiusPx - band * bandW * 0.7f;
            RectF oval = new RectF(w / 2f - br, arcCenterY - br, w / 2f + br, arcCenterY + br);
            c.drawArc(oval, 200, 140, false, arcPaint);
        }
    }

    // Cirrus
    private static void drawCirrus(Canvas c, int w, int h, Paint p,
                                   double sunAlt, float sunX, long now) {
        float sec = now / 1000f;
        Random rnd = new Random(1337);
        int base = cirrusBaseAlpha(sunAlt);
        if (base < 4) return;
        Paint cp = new Paint(Paint.ANTI_ALIAS_FLAG);
        cp.setStyle(Paint.Style.STROKE);
        cp.setStrokeCap(Paint.Cap.ROUND);
        for (int i = 0; i < 7; i++) {
            float x0 = rnd.nextFloat() * w * 1.3f - w * 0.15f;
            float y0 = rnd.nextFloat() * h * 0.28f + h * 0.03f;
            float len = w * (0.12f + rnd.nextFloat() * 0.22f);
            float drift = (sec * 0.003f * w + i * w * 0.14f) % (w * 1.6f);
            float cx2 = (x0 - drift + w * 1.6f) % (w * 1.6f) - w * 0.15f;
            float cx3 = cx2 + len;
            float midX = (cx2 + cx3) / 2 + (rnd.nextFloat() - 0.5f) * len * 0.4f;
            float midY = y0 + (rnd.nextFloat() - 0.5f) * h * 0.04f;
            int alpha = (int)(base * (0.5f + rnd.nextFloat() * 0.5f));
            int clr = cirrusColor(sunAlt);
            cp.setStrokeWidth(h * (0.003f + rnd.nextFloat() * 0.005f));
            cp.setShader(new LinearGradient(cx2, y0, cx3, y0,
                Color.argb(0, Color.red(clr), Color.green(clr), Color.blue(clr)),
                Color.argb(alpha, Color.red(clr), Color.green(clr), Color.blue(clr)),
                Shader.TileMode.MIRROR));
            Path cirPath = new Path();
            cirPath.moveTo(cx2, y0);
            cirPath.quadTo(midX, midY, cx3, y0 + (rnd.nextFloat() - 0.5f) * h * 0.03f);
            c.drawPath(cirPath, cp);
            for (int j = 0; j < 4; j++) {
                float frac = 0.2f + j * 0.2f;
                float fx = cx2 + (cx3 - cx2) * frac;
                float fy = y0 + (rnd.nextFloat() - 0.5f) * h * 0.025f;
                float fLen = h * 0.02f;
                cp.setShader(null);
                cp.setColor(Color.argb(alpha / 2, Color.red(clr), Color.green(clr), Color.blue(clr)));
                cp.setStrokeWidth(h * 0.002f);
                c.drawLine(fx, fy - fLen, fx + fLen * 1.5f, fy + fLen * 0.5f, cp);
            }
        }
        cp.setShader(null);
    }

    private static int cirrusBaseAlpha(double sunAlt) {
        if (sunAlt > 30)  return 80;
        if (sunAlt > 0)   return (int)(40 + sunAlt * 1.3);
        if (sunAlt > -3)  return 60;
        if (sunAlt > -10) return 40;
        return 18;
    }

    private static int cirrusColor(double sunAlt) {
        if (sunAlt > 8)  return 0xFFFFFFFF;
        if (sunAlt > 0)  return 0xFFFFEECC;
        if (sunAlt > -3) return 0xFFFFCCA0;
        return 0xFFCCCCDD;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // السحاب المحسّن — Silver Lining + Sunset colors
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawClouds(Canvas c, int w, int h, Paint p,
                                   double sunAlt, float sunX, float sunY, long now) {
        if (wsCloudMult < 0.04f) return;
        CloudColors cc = cloudColors(sunAlt);
        float sec  = now / 1000f;
        Random rnd = new Random(777);
        float cm = Math.min(2.0f, wsCloudMult);
        int baseA = Math.min(255, (int)(Color.alpha(cc.base)      * cm));
        int shadA = Math.min(255, (int)(Color.alpha(cc.shadow)    * cm));
        int highA = Math.min(255, (int)(Color.alpha(cc.highlight) * cm));
        int scaledBase = Color.argb(baseA, Color.red(cc.base), Color.green(cc.base), Color.blue(cc.base));
        int scaledShad = Color.argb(shadA, Color.red(cc.shadow), Color.green(cc.shadow), Color.blue(cc.shadow));
        int scaledHigh = Color.argb(highA, Color.red(cc.highlight), Color.green(cc.highlight), Color.blue(cc.highlight));
        for (float[] s : CLOUD_SEEDS) {
            int   layer  = (int)s[3];
            float drift  = (sec * LAYER_SPEED[layer] * w) % (w * 1.6f);
            float cx     = (s[0] * w - drift + w * 1.6f) % (w * 1.6f) - w * 0.3f;
            float cy     = s[1] * h;
            float sz     = s[2] * w;
            int   np     = (int)s[4];
            float aspect = s[5];
            drawOrganicCloud(c, p, cx, cy, sz, np, aspect,
                             scaledBase, scaledShad, scaledHigh,
                             sunX, sunY, sunAlt, rnd);
        }
    }

    private static void drawOrganicCloud(Canvas c, Paint p, float cx, float cy,
                                         float sz, int n, float aspect,
                                         int base, int shadow, int highlight,
                                         float lightX, float lightY,
                                         double sunAlt, Random rnd) {
        boolean hasSilver = (sunAlt > -2 && sunAlt < 10);
        boolean moonLit   = (sunAlt < -4 && sunAlt > -18);
        float ldx = lightX - cx, ldy = lightY - cy;
        float ldLen = (float) Math.max(1.0, Math.sqrt((double)(ldx * ldx + ldy * ldy)));
        float lnx = ldx / ldLen, lny = ldy / ldLen;
        float flatBase = cy + sz * 0.28f;
        RectF layerRect = new RectF(cx - sz * 2.0f, cy - sz * 1.5f, cx + sz * 2.0f, flatBase);
        int savedCount = c.saveLayer(layerRect, null);
        int brr = Color.red(base), bgr = Color.green(base), bbr = Color.blue(base), bar = Color.alpha(base);
        int hrr = Color.red(highlight), hgr = Color.green(highlight), hbr = Color.blue(highlight);
        float[] pxArr = new float[n], pyArr = new float[n], prArr = new float[n];
        for (int i = 0; i < n; i++) {
            double angle = (rnd.nextDouble() - 0.5) * Math.PI * 1.5;
            float  dist  = (float)(rnd.nextDouble() * 0.50 * sz);
            pxArr[i] = cx + (float)(Math.cos(angle) * dist * aspect);
            pyArr[i] = cy + (float)(Math.sin(angle) * dist * 0.55f) - sz * 0.05f;
            float cDist = (float) Math.sqrt((double)((pxArr[i]-cx)*(pxArr[i]-cx) + (pyArr[i]-cy)*(pyArr[i]-cy)));
            float sf = Math.max(0.28f, 1.0f - cDist / (sz * 0.75f));
            prArr[i] = sz * (0.16f + rnd.nextFloat() * 0.22f) * sf;
        }
        for (int i = 0; i < n; i++) {
            float bx = pxArr[i], by = pyArr[i], brad = prArr[i];
            if (by + brad * 0.45f > flatBase) by = flatBase - brad * 0.55f;
            float dotL = (cx - bx) * lnx + (cy - by) * lny;
            float lit = 0.32f + 0.68f * (float) Math.max(0, Math.min(1, (dotL / sz + 0.65)));
            int lr2 = Math.max(0, Math.min(255, (int)(brr + (hrr - brr) * lit)));
            int lg2 = Math.max(0, Math.min(255, (int)(bgr + (hgr - bgr) * lit)));
            int lb2 = Math.max(0, Math.min(255, (int)(bbr + (hbr - bbr) * lit)));
            p.setShader(new RadialGradient(
                bx - brad * 0.10f * lnx, by - brad * 0.10f * lny, brad,
                new int[]{
                    Color.argb(bar, Math.min(255, lr2 + 20), Math.min(255, lg2 + 20), Math.min(255, lb2 + 20)),
                    Color.argb(bar, lr2, lg2, lb2),
                    Color.argb(bar * 3 / 5, lr2, lg2, lb2),
                    Color.argb(0, lr2, lg2, lb2) },
                new float[]{ 0f, 0.36f, 0.68f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(bx, by, brad, p);
            p.setShader(null);
        }
        if (hasSilver) {
            float silverT = (float)(1.0 - Math.abs(sunAlt - 4) / 6.0);
            int sA = (int)(60 * silverT);
            if (sA > 6) {
                float eX = cx + lnx * sz * 0.65f, eY = cy + lny * sz * 0.50f;
                p.setShader(new RadialGradient(eX, eY, sz * 0.92f,
                    new int[]{ Color.argb(sA, 255, 255, 245),
                               Color.argb(sA / 2, 255, 250, 210),
                               Color.argb(0, 255, 240, 180) },
                    null, Shader.TileMode.CLAMP));
                c.drawRect(layerRect, p);
                p.setShader(null);
            }
        }
        if (moonLit && cMoonAlt > 10) {
            int mA = (int)(22 * Math.min(1.0, (cMoonAlt - 10) / 30.0));
            if (mA > 3) {
                p.setShader(new RadialGradient(cx, cy - sz * 0.5f, sz * 1.1f,
                    new int[]{ Color.argb(mA, 200, 215, 255), Color.argb(0, 180, 200, 240) },
                    null, Shader.TileMode.CLAMP));
                c.drawRect(layerRect, p);
                p.setShader(null);
            }
        }
        c.restoreToCount(savedCount);
        int sr2 = Color.red(shadow), sg2 = Color.green(shadow), sb2 = Color.blue(shadow), sa2 = Color.alpha(shadow);
        p.setShader(new RadialGradient(cx, flatBase + sz * 0.10f, sz * 1.15f,
            new int[]{ Color.argb(sa2, sr2, sg2, sb2),
                       Color.argb(sa2 / 2, sr2, sg2, sb2),
                       Color.argb(0, sr2, sg2, sb2) },
            null, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(cx - sz * 1.15f, flatBase, cx + sz * 1.15f, flatBase + sz * 0.28f), p);
        p.setShader(null);
    }

    private static class CloudColors { int base, shadow, highlight; }

    private static CloudColors cloudColors(double a) {
        CloudColors cc = new CloudColors();
        if (a > 18) {
            cc.base = Color.argb(185, 255, 255, 255);
            cc.shadow = Color.argb(65, 110, 135, 190);
            cc.highlight = Color.argb(220, 255, 255, 255);
        } else if (a > 5) {
            float t = (float)((a - 5) / 13);
            cc.base = lerpColor(Color.argb(180, 255, 215, 170), Color.argb(185, 255, 255, 255), t);
            cc.shadow = lerpColor(Color.argb(65, 100, 60, 30), Color.argb(65, 110, 135, 190), t);
            cc.highlight = lerpColor(Color.argb(200, 255, 230, 180), Color.argb(220, 255, 255, 255), t);
        } else if (a > -1) {
            float t = (float)((a + 1) / 6);
            cc.base = lerpColor(Color.argb(170, 200, 110, 70), Color.argb(180, 255, 215, 170), t);
            cc.shadow = lerpColor(Color.argb(60, 60, 20, 15), Color.argb(65, 100, 60, 30), t);
            cc.highlight = lerpColor(Color.argb(190, 255, 160, 100), Color.argb(200, 255, 230, 180), t);
        } else if (a > -8) {
            cc.base = Color.argb(140, 180, 90, 60);
            cc.shadow = Color.argb(50, 40, 15, 10);
            cc.highlight = Color.argb(160, 220, 120, 80);
        } else {
            cc.base = Color.argb(80, 22, 30, 60);
            cc.shadow = Color.argb(35, 8, 10, 25);
            cc.highlight = Color.argb(90, 35, 45, 80);
        }
        return cc;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // تلوث ضوئي
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawLightPollution(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > -5) return;
        double dark = Math.min(1.0, (-sunAlt - 5) / 13.0);
        int alpha = (int)(50 * dark);
        p.setShader(new LinearGradient(0, h * 0.72f, 0, h,
            new int[]{ Color.argb(0, 255, 140, 30),
                       Color.argb(alpha / 2, 255, 120, 20),
                       Color.argb(alpha, 255, 100, 10) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.72f, w, h, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // خط الأفق
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawHorizonLine(Canvas c, int w, int h, Paint p, double sunAlt) {
        float horizonY = altToY(0, h);
        if (horizonY > h || horizonY < 0) return;
        float hazeH = h * 0.06f;
        if (sunAlt > -6) {
            int hazeAlpha = (int)(40 * Math.min(1, (sunAlt + 6) / 12.0));
            p.setShader(new LinearGradient(0, horizonY - hazeH * 0.5f, 0, horizonY + hazeH,
                new int[]{ Color.argb(0, 190, 210, 230),
                           Color.argb(hazeAlpha, 190, 210, 230),
                           Color.argb(hazeAlpha / 2, 180, 200, 220) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(0, horizonY - hazeH * 0.5f, w, horizonY + hazeH, p);
            p.setShader(null);
        }
        Paint linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        linePaint.setStyle(Paint.Style.STROKE);
        if (sunAlt > 2) linePaint.setColor(Color.argb(60, 200, 220, 255));
        else if (sunAlt > -4) linePaint.setColor(Color.argb(50, 255, 200, 150));
        else linePaint.setColor(Color.argb(30, 100, 130, 180));
        linePaint.setStrokeWidth(0.8f);
        c.drawLine(0, horizonY, w, horizonY, linePaint);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ضبابية الحرارة — Heat Haze وقت الظهيرة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawHeatHaze(Canvas c, int w, int h, Paint p, double sunAlt, long now) {
        if (sunAlt < 55) return; // الظهيرة فقط
        float intensity = (float) Math.min(1.0, (sunAlt - 55) / 25.0) * (1.0f - wsOvercast);
        if (intensity < 0.05f) return;

        float horizonY = altToY(0, h);
        float hazeTop = horizonY - h * 0.08f;
        float hazeBot = horizonY + h * 0.02f;

        // تموج حراري — خطوط أفقية متموجة شفافة فوق الأفق
        Paint hazePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        hazePaint.setStyle(Paint.Style.STROKE);
        hazePaint.setStrokeCap(Paint.Cap.ROUND);
        float sec = now / 1000f;
        Random rnd = new Random(88888L);

        for (int i = 0; i < 8; i++) {
            float baseY = hazeTop + (hazeBot - hazeTop) * ((float)i / 7f);
            float waveAmp = h * 0.003f * intensity;
            float waveFreq = (float)(Math.PI * 2 / w * (3 + rnd.nextFloat() * 4));
            float phase = sec * 0.8f + i * 1.1f;
            int alpha = (int)(intensity * (15 + rnd.nextFloat() * 20));
            hazePaint.setStrokeWidth(h * 0.004f);
            hazePaint.setColor(Color.argb(alpha, 220, 210, 190));
            Path wavePath = new Path();
            wavePath.moveTo(0, baseY);
            for (int x = 0; x <= w; x += 4) {
                float waveY = baseY + (float)(Math.sin(waveFreq * x + phase) * waveAmp);
                wavePath.lineTo(x, waveY);
            }
            c.drawPath(wavePath, hazePaint);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // حواف دائرية
    // ═══════════════════════════════════════════════════════════════════════
    private static void applyRoundedCorners(Bitmap bmp, int w, int h) {
        Bitmap mask = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas mc   = new Canvas(mask);
        Paint  mp   = new Paint(Paint.ANTI_ALIAS_FLAG);
        mp.setColor(0xFFFFFFFF);
        float rad = w * 0.082f;
        mc.drawRoundRect(new RectF(0, 0, w, h), rad, rad, mp);
        Paint xfer = new Paint(Paint.ANTI_ALIAS_FLAG);
        xfer.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_IN));
        new Canvas(bmp).drawBitmap(mask, 0, 0, xfer);
        mask.recycle();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // الحسابات الفلكية
    // ═══════════════════════════════════════════════════════════════════════
    static double julianDate(long millis) {
        return millis / 86400000.0 + 2440587.5;
    }

    static double refractionCorrection(double altDeg) {
        if (altDeg > 85) return 0;
        if (altDeg < 0.5) return 0.57;
        double tanA = Math.tan(Math.toRadians(altDeg));
        return (1.02 / (60.0 * tanA));
    }

    static double[] solarPosition(double jd, double lat, double lng) {
        double n  = jd - 2451545.0;
        double L  = normDeg(280.46 + 0.9856474 * n);
        double g  = Math.toRadians(normDeg(357.528 + 0.9856003 * n));
        double lam = Math.toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
        double eps = Math.toRadians(23.439 - 0.0000004 * n);
        double sinL = Math.sin(lam);
        double ra   = Math.atan2(Math.cos(eps) * sinL, Math.cos(lam));
        double dec  = Math.asin(Math.sin(eps) * sinL);
        double gmst = greenwichSiderealTime(jd);
        double lst  = normH(gmst + lng / 15.0);
        double ha   = Math.toRadians((lst - Math.toDegrees(ra) / 15.0) * 15.0);
        double lr  = Math.toRadians(lat);
        double alt = Math.asin(Math.sin(lr)*Math.sin(dec) + Math.cos(lr)*Math.cos(dec)*Math.cos(ha));
        double az  = Math.atan2(-Math.cos(dec)*Math.sin(ha),
                                 Math.sin(lr)*Math.cos(dec)*Math.cos(ha) - Math.cos(lr)*Math.sin(dec));
        return new double[]{ Math.toDegrees(alt), normDeg(Math.toDegrees(az) + 180) };
    }

    /** موقع القمر — Jean Meeus مع تصحيحات إضافية لدقة أعلى */
    static double[] moonPosition(double jd, double lat, double lng) {
        double n   = jd - 2451545.0;
        double Lm  = Math.toRadians(normDeg(218.316 + 13.176396 * n));
        double Mm  = Math.toRadians(normDeg(134.963 + 13.064993 * n));
        double F   = Math.toRadians(normDeg( 93.272 + 13.229350 * n));
        double D   = Math.toRadians(normDeg( 297.850 + 12.190749 * n)); // elongation
        double eps = Math.toRadians(23.439 - 0.0000004 * n);

        // تصحيحات Meeus المختصرة
        double lam = Lm
            + Math.toRadians(6.289 * Math.sin(Mm))
            + Math.toRadians(1.274 * Math.sin(2*D - Mm))  // Evection
            + Math.toRadians(0.658 * Math.sin(2*D))       // Variation
            + Math.toRadians(-0.186 * Math.sin(Math.toRadians(normDeg(357.528 + 0.9856003 * n)))) // Annual equation
            + Math.toRadians(-0.059 * Math.sin(2*D - 2*Mm))
            + Math.toRadians(-0.057 * Math.sin(2*D - Mm - Math.toRadians(normDeg(134.963 + 13.064993 * n))));
        double bet = Math.toRadians(5.128 * Math.sin(F))
            + Math.toRadians(0.280 * Math.sin(Mm + F))
            + Math.toRadians(0.277 * Math.sin(Mm - F));

        double ra  = Math.atan2(Math.sin(lam)*Math.cos(eps) - Math.tan(bet)*Math.sin(eps), Math.cos(lam));
        double dec = Math.asin(Math.sin(bet)*Math.cos(eps) + Math.cos(bet)*Math.sin(eps)*Math.sin(lam));
        double gmst = greenwichSiderealTime(jd);
        double lst  = normH(gmst + lng / 15.0);
        double ha   = Math.toRadians((lst - Math.toDegrees(ra) / 15.0) * 15.0);
        double lr  = Math.toRadians(lat);
        double alt = Math.asin(Math.sin(lr)*Math.sin(dec) + Math.cos(lr)*Math.cos(dec)*Math.cos(ha));
        double az  = Math.atan2(-Math.cos(dec)*Math.sin(ha),
                                 Math.sin(lr)*Math.cos(dec)*Math.cos(ha) - Math.cos(lr)*Math.sin(dec));
        return new double[]{ Math.toDegrees(alt), normDeg(Math.toDegrees(az) + 180) };
    }

    /**
     * طور القمر [0=جديد .. 0.5=بدر] — مُصحَّح بمرجع JDE دقيق
     * مرجع: New Moon 2000 Jan 6.18 UT = JD 2451549.72
     */
    static double moonPhase(double jd) {
        double synodicMonth = 29.530588853;
        double jd0 = 2451549.72; // مرجع هلال يناير 2000
        double d = (jd - jd0) % synodicMonth;
        if (d < 0) d += synodicMonth;
        return d / synodicMonth;
    }

    static double moonIllumination(double phase) {
        return (1.0 - Math.cos(phase * 2 * Math.PI)) / 2.0;
    }

    /**
     * الشهر الهجري التقريبي من Julian Date
     * يستخدم التقويم الهجري الجدولي (Tabular Islamic Calendar)
     * الشهر 9 = رمضان
     */
    static int hijriMonth(double jd) {
        // epoch هجري: 1 محرم 1 هـ = JD 1948438.5 (16 يوليو 622 م)
        long N = (long) Math.floor(jd - 1948438.5 + 0.5);
        if (N < 0) return 1;

        // عدد السنوات
        long year = (30L * N + 10646L) / 10631L;

        // أول يوم في هذه السنة الهجرية
        long day1 = (long) Math.floor((11.0 * year + 3.0) / 30.0) + 354L * (year - 1L) + 30L;

        long dayOfYear = N - day1 + 1;
        if (dayOfYear <= 0 || dayOfYear > 355) {
            // تصحيح للحالات الحدية
            year--;
            day1 = (long) Math.floor((11.0 * year + 3.0) / 30.0) + 354L * (year - 1L) + 30L;
            dayOfYear = N - day1 + 1;
        }

        // الشهر (كل شهر ~29.5 يوم)
        int month = (int) Math.ceil(dayOfYear / 29.5);
        return Math.max(1, Math.min(12, month));
    }

    static double[] planetPosition(double jd, double lat, double lng,
                                   double L0, double rate, double Ma, double sma) {
        double n   = jd - 2451545.0;
        double Lp  = Math.toRadians(normDeg(L0 + rate * n));
        double Ls  = Math.toRadians(normDeg(280.46 + 0.9856474 * n));
        double eps = Math.toRadians(23.439 - 0.0000004 * n);
        double correction = sma < 1.0
            ? Math.sin(Lp - Ls) * 0.38 / sma
            : Math.sin(Lp - Ls) * 0.55 / sma;
        double lam = Lp + correction;
        double ra  = Math.atan2(Math.sin(lam)*Math.cos(eps), Math.cos(lam));
        double dec = Math.asin(Math.sin(eps)*Math.sin(lam));
        double gmst = greenwichSiderealTime(jd);
        double lst  = normH(gmst + lng / 15.0);
        double ha   = Math.toRadians((lst - Math.toDegrees(ra) / 15.0) * 15.0);
        double lr  = Math.toRadians(lat);
        double alt = Math.asin(Math.sin(lr)*Math.sin(dec) + Math.cos(lr)*Math.cos(dec)*Math.cos(ha));
        double az  = Math.atan2(-Math.cos(dec)*Math.sin(ha),
                                 Math.sin(lr)*Math.cos(dec)*Math.cos(ha) - Math.cos(lr)*Math.sin(dec));
        return new double[]{ Math.toDegrees(alt), normDeg(Math.toDegrees(az) + 180) };
    }

    static double[] raDecToAltAz(double raH, double decDeg, double lat, double lng, double gmst) {
        double lst = normH(gmst + lng / 15.0);
        double ha  = Math.toRadians((lst - raH) * 15.0);
        double dec = Math.toRadians(decDeg);
        double lr  = Math.toRadians(lat);
        double alt = Math.asin(Math.sin(lr)*Math.sin(dec) + Math.cos(lr)*Math.cos(dec)*Math.cos(ha));
        double az  = Math.atan2(-Math.cos(dec)*Math.sin(ha),
                                 Math.sin(lr)*Math.cos(dec)*Math.cos(ha) - Math.cos(lr)*Math.sin(dec));
        return new double[]{ Math.toDegrees(alt), normDeg(Math.toDegrees(az) + 180) };
    }

    /** وقت رصد غرينتش النجمي — IAU 1982 مُصحَّح */
    static double greenwichSiderealTime(double jd) {
        double T  = (jd - 2451545.0) / 36525.0;
        double ut = ((jd + 0.5) % 1.0) * 24.0 * 1.00273791;
        double gmst = 6.697374558 + 2400.0513369 * T + 0.0000258622 * T * T + ut;
        return normH(gmst);
    }

    // تحويل إحداثيات السماء ← الشاشة
    static float azToX(double az, int w) {
        double rel = az - 60;
        if (rel < 0)   rel += 360;
        if (rel > 300) rel  = 300;
        return (float)(rel / 300.0 * w);
    }

    static float altToY(double alt, int h) {
        return h * (1f - (float)(alt / 90.0) * 0.87f);
    }

    // Fallback عند غياب GPS
    private static double fallbackSunAlt(long now, long fajrMs, long sunriseMs,
                                         long dhuhrMs, long asrMs, long maghribMs, long ishaMs) {
        if (fajrMs <= 0 || sunriseMs <= fajrMs || dhuhrMs <= sunriseMs
                || asrMs <= dhuhrMs || maghribMs <= asrMs || ishaMs <= maghribMs)
            return -18;
        if (now < fajrMs)    return -20;
        if (now < sunriseMs) return -8   + 8  * (now - fajrMs)    / (double)(sunriseMs - fajrMs);
        if (now < dhuhrMs)   return  0   + 60 * (now - sunriseMs) / (double)(dhuhrMs   - sunriseMs);
        if (now < asrMs)     return  60  - 20 * (now - dhuhrMs)   / (double)(asrMs     - dhuhrMs);
        if (now < maghribMs) return  40  - 40 * (now - asrMs)     / (double)(maghribMs - asrMs);
        if (now < ishaMs)    return   0  - 12 * (now - maghribMs) / (double)(ishaMs    - maghribMs);
        return -18;
    }

    private static double fallbackSunAz(long now, long sunriseMs, long maghribMs) {
        if (now <= sunriseMs) return 90;
        if (now >= maghribMs) return 270;
        return 90 + 180 * (now - sunriseMs) / (double)(maghribMs - sunriseMs);
    }

    static double normDeg(double d) { d %= 360; return d < 0 ? d + 360 : d; }
    static double normH  (double h) { h %=  24; return h < 0 ? h +  24 : h; }

    // ═══════════════════════════════════════════════════════════════════════
    // نظام الطقس الموسمي
    // ═══════════════════════════════════════════════════════════════════════
    private static void updateWeatherState(long now, double lat) {
        if (wsChanged == 0L) { wsChanged = now; wsHold = 480_000L; }
        long sinceChange = now - wsChanged;
        float transMs = 90_000L;
        wsTrans = Math.min(1.0f, sinceChange / transMs);
        if (sinceChange < wsHold) {
            applyWeatherMults(wsCurrent, wsNextState, wsTrans);
            return;
        }
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int month = cal.get(java.util.Calendar.MONTH);
        float[] probs = seasonalProbs(month, lat);
        Random wRnd = new Random(now / 3_600_000L + wsCurrent * 7L);
        float roll = wRnd.nextFloat();
        float cum = 0;
        int picked = WS_PARTLY;
        for (int i = 0; i < 5; i++) { cum += probs[i]; if (roll < cum) { picked = i; break; } }
        if (picked == wsCurrent) picked = (picked + 1) % 5;
        wsNextState = picked; wsCurrent = picked; wsChanged = now; wsTrans = 0f;
        long[] holdTimes = { 720_000L, 540_000L, 480_000L, 300_000L, 420_000L };
        long base2 = holdTimes[picked];
        wsHold = base2 + (long)(wRnd.nextFloat() * base2 * 0.6f);
        applyWeatherMults(wsCurrent, wsNextState, 0f);
    }

    private static float[] seasonalProbs(int month, double lat) {
        boolean southern = lat < -10;
        boolean tropical  = Math.abs(lat) < 20;
        int adjMonth = southern ? (month + 6) % 12 : month;
        boolean isWinter = (adjMonth == 11 || adjMonth == 0 || adjMonth == 1);
        boolean isSummer = (adjMonth >= 5 && adjMonth <= 7);
        boolean isSpring = (adjMonth >= 2 && adjMonth <= 4);
        if (tropical) {
            boolean isWet = (month >= 5 && month <= 9);
            return isWet
                ? new float[]{ 0.12f, 0.22f, 0.24f, 0.34f, 0.08f }
                : new float[]{ 0.55f, 0.28f, 0.08f, 0.06f, 0.03f };
        }
        if (isWinter) return new float[]{ 0.12f, 0.22f, 0.28f, 0.20f, 0.18f };
        if (isSummer) return new float[]{ 0.52f, 0.32f, 0.08f, 0.06f, 0.02f };
        if (isSpring) return new float[]{ 0.28f, 0.34f, 0.18f, 0.12f, 0.08f };
        return               new float[]{ 0.22f, 0.30f, 0.25f, 0.14f, 0.09f };
    }

    private static void applyWeatherMults(int cur, int nxt, float t) {
        float[][] params = {
            { 0.0f, 0.0f, 0.0f, 0.0f },
            { 0.7f, 0.0f, 0.0f, 0.0f },
            { 1.8f, 0.2f, 0.0f, 0.45f },
            { 2.4f, 0.1f, 1.0f, 0.65f },
            { 0.5f, 1.5f, 0.0f, 0.20f },
        };
        float[] a = params[cur], b = params[nxt];
        wsCloudMult = a[0] + (b[0] - a[0]) * t;
        wsFogMult   = a[1] + (b[1] - a[1]) * t;
        wsStormMult = a[2] + (b[2] - a[2]) * t;
        wsOvercast  = a[3] + (b[3] - a[3]) * t;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // غطاء الغيوم الكثيف
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawOvercastVeil(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (wsOvercast < 0.02f) return;
        float oa = Math.min(0.80f, wsOvercast);
        int vR, vG, vB;
        if (sunAlt > 8) { vR = 195; vG = 200; vB = 212; }
        else if (sunAlt > 0) { vR = 160; vG = 155; vB = 175; }
        else if (sunAlt > -5) { vR = 80; vG = 75; vB = 95; }
        else { vR = 18; vG = 18; vB = 30; }
        int topA = (int)(oa * 210), botA = (int)(oa * 140);
        p.setShader(new LinearGradient(0, 0, 0, h * 0.68f,
            new int[]{ Color.argb(topA, vR, vG, vB), Color.argb(botA, vR, vG, vB), Color.argb(0, vR, vG, vB) },
            new float[]{ 0f, 0.65f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h * 0.68f, p);
        p.setShader(null);
        if (wsOvercast > 0.20f) {
            Random rnd = new Random(11111L);
            Paint cp = new Paint(Paint.ANTI_ALIAS_FLAG);
            cp.setStyle(Paint.Style.STROKE);
            cp.setStrokeCap(Paint.Cap.ROUND);
            for (int i = 0; i < 6; i++) {
                float ly = h * (0.02f + rnd.nextFloat() * 0.30f);
                float lw = w * (0.30f + rnd.nextFloat() * 0.55f);
                float lx = rnd.nextFloat() * w;
                int la = (int)(wsOvercast * (25 + rnd.nextFloat() * 30));
                cp.setStrokeWidth(h * (0.018f + rnd.nextFloat() * 0.028f));
                cp.setShader(new LinearGradient(lx, ly, lx + lw, ly,
                    Color.argb(0, vR, vG, vB), Color.argb(la, vR - 20, vG - 20, vB - 15), Shader.TileMode.MIRROR));
                c.drawLine(lx, ly, lx + lw, ly, cp);
            }
            cp.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // تفاصيل سطح المباني
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawRooftopDetails(Canvas c, int w, int h, Paint p,
                                           float[][] towers, float baseY,
                                           int silR, int silG, int silB, int silA) {
        Random rnd = new Random(65432L);
        p.setStyle(Paint.Style.FILL);
        int detailA = Math.min(255, silA + 30);
        int dR = Math.min(255, silR + 18), dG = Math.min(255, silG + 18), dB = Math.min(255, silB + 22);
        for (float[] t : towers) {
            float tx  = t[0] * w, tw  = t[1] * w, th  = t[2] * h;
            float top = baseY - th, mx2 = tx + tw / 2f;
            int   typ = (int) t[3];
            if (th < h * 0.06f) continue;
            // لا تفاصيل على المساجد والمآذن (type 9, 10)
            if (typ == 9 || typ == 10) continue;
            p.setColor(Color.argb(detailA, dR, dG, dB));
            if (typ == 0 && rnd.nextFloat() < 0.55f) {
                float tR = Math.max(2f, tw * 0.14f), tH = tR * 1.35f;
                float tX = mx2 + (rnd.nextFloat() - 0.5f) * tw * 0.28f;
                c.drawOval(new RectF(tX - tR, top - tH, tX + tR, top), p);
                p.setColor(Color.argb(detailA - 30, dR, dG, dB));
                float legW = Math.max(1f, tR * 0.18f);
                for (int lg = -1; lg <= 1; lg++)
                    c.drawRect(tX + lg * tR * 0.6f - legW, top - tH * 0.40f, tX + lg * tR * 0.6f + legW, top, p);
                p.setColor(Color.argb(detailA, dR, dG, dB));
            }
            if (rnd.nextFloat() < 0.70f) {
                int nUnits = 1 + rnd.nextInt(3);
                for (int u = 0; u < nUnits; u++) {
                    float uw = Math.max(2.5f, tw * (0.08f + rnd.nextFloat() * 0.10f));
                    float uh = uw * (0.55f + rnd.nextFloat() * 0.30f);
                    float ux = tx + w * 0.004f + rnd.nextFloat() * (tw - uw - w * 0.006f);
                    c.drawRect(ux, top - uh, ux + uw, top, p);
                }
            }
            if (typ >= 1 && th > h * 0.10f && rnd.nextFloat() < 0.60f) {
                float epW = Math.max(3f, tw * 0.18f), epH = th * (0.055f + rnd.nextFloat() * 0.040f);
                c.drawRect(mx2 - epW / 2f, top - epH, mx2 + epW / 2f, top, p);
                Path epRoof = new Path();
                epRoof.moveTo(mx2 - epW / 2f - w * 0.002f, top - epH);
                epRoof.lineTo(mx2, top - epH - epH * 0.30f);
                epRoof.lineTo(mx2 + epW / 2f + w * 0.002f, top - epH);
                epRoof.close();
                c.drawPath(epRoof, p);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // انعكاس واجهات زجاجية
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawGlassCurtainSheen(Canvas c, int w, int h, Paint p,
                                              float[][] towers, float baseY, double sunAlt) {
        if (sunAlt < -3 || sunAlt > 75) return;
        float sA = (float) Math.min(1.0, (sunAlt + 3) / 20.0) * (1.0f - wsOvercast * 0.8f);
        if (sA < 0.03f) return;
        Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG);
        gp.setStyle(Paint.Style.FILL);
        for (float[] t : towers) {
            if (t[2] < 0.10f) continue;
            int typ = (int) t[3];
            if (typ == 4 || typ == 9 || typ == 10) continue;
            float tx = t[0] * w, tw = t[1] * w, th = t[2] * h;
            float top = baseY - th;
            float sheenW = tw * 0.22f, sheenX = tx + tw * 0.60f;
            gp.setShader(new LinearGradient(sheenX, top, sheenX + sheenW, top,
                new int[]{ Color.argb(0, 200, 225, 255),
                           Color.argb((int)(sA * 45), 220, 238, 255),
                           Color.argb((int)(sA * 28), 210, 230, 255),
                           Color.argb(0, 200, 220, 255) },
                new float[]{ 0f, 0.35f, 0.70f, 1f }, Shader.TileMode.CLAMP));
            c.drawRect(new RectF(sheenX, top + th * 0.05f, sheenX + sheenW, baseY - h * 0.005f), gp);
        }
        gp.setShader(null);
    }

    static int lerpColor(int c1, int c2, float t) {
        t = Math.max(0f, Math.min(1f, t));
        return Color.argb(
            (int)(Color.alpha(c1) + (Color.alpha(c2) - Color.alpha(c1)) * t),
            (int)(Color.red(c1)   + (Color.red(c2)   - Color.red(c1))   * t),
            (int)(Color.green(c1) + (Color.green(c2) - Color.green(c1)) * t),
            (int)(Color.blue(c1)  + (Color.blue(c2)  - Color.blue(c1))  * t));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // أشعة مضادة — Anti-Crepuscular Rays
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawAntiCrepuscularRays(Canvas c, int w, int h, Paint p,
                                                double sunAlt, double sunAz) {
        if (sunAlt < -5 || sunAlt > 18) return;
        float intensity = (float)(sunAlt < 0 ? 1.0 - Math.abs(sunAlt) / 5.0 : 1.0 - sunAlt / 18.0);
        intensity = Math.max(0, Math.min(0.65f, intensity));
        if (intensity < 0.05f) return;
        double antiAz = (sunAz + 180.0) % 360.0;
        float antiX = azToX(antiAz, w), antiY = altToY(0, h) * 0.92f;
        Random rnd = new Random(55555L);
        Paint rayPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        rayPaint.setStyle(Paint.Style.STROKE);
        rayPaint.setStrokeCap(Paint.Cap.ROUND);
        for (int i = 0; i < 8; i++) {
            double angle = rnd.nextDouble() * Math.PI - Math.PI / 2.0;
            float ex = antiX + (float)(Math.cos(angle) * w * 1.6f);
            float ey = antiY + (float)(Math.sin(angle) * w * 1.6f);
            int alpha = (int)((12 + rnd.nextFloat() * 18) * intensity);
            rayPaint.setStrokeWidth(1.2f + rnd.nextFloat() * 2.8f);
            rayPaint.setShader(new LinearGradient(antiX, antiY, ex, ey,
                Color.argb(alpha, 255, 242, 200), Color.argb(0, 255, 235, 180), Shader.TileMode.CLAMP));
            c.drawLine(antiX, antiY, ex, ey, rayPaint);
        }
        rayPaint.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // قمر اصطناعي / ISS
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawSatellite(Canvas c, int w, int h, Paint p,
                                      double sunAlt, long now) {
        if (sunAlt > -6) return;
        float dark = (float) Math.min(1.0, (-sunAlt - 6) / 14.0);
        if (dark < 0.1f) return;
        if (satNextPass == 0 || now > satLastPass + satNextPass) {
            satLastPass = now;
            Random rnd = new Random(now / 35_000L);
            satNextPass = 100_000L + (long)(rnd.nextFloat() * 280_000L);
            satX1 = rnd.nextFloat() * w;
            satY1 = rnd.nextFloat() * h * 0.48f;
            double angle = rnd.nextDouble() * Math.PI;
            float len = w * (0.42f + rnd.nextFloat() * 0.38f);
            satX2 = satX1 + (float)(Math.cos(angle) * len);
            satY2 = satY1 + (float)(Math.sin(angle) * len);
            satFlare = rnd.nextFloat() < 0.18f;
        }
        long elapsed = now - satLastPass;
        long dur = 9_000L;
        if (elapsed >= dur) return;
        float t = elapsed / (float) dur;
        float sx = satX1 + (satX2 - satX1) * t;
        float sy = satY1 + (satY2 - satY1) * t;
        float fadeA = t < 0.12f ? t / 0.12f : (t > 0.88f ? 1f - (t - 0.88f) / 0.12f : 1f);
        fadeA = Math.max(0, Math.min(1, fadeA));
        if (satFlare) {
            float fp = Math.abs(t - 0.5f);
            float fi = Math.max(0, 1.0f - fp * 6f);
            int fa = (int)(dark * 255 * fi);
            if (fa > 6) {
                p.setShader(new RadialGradient(sx, sy, 14f * fi + 2f,
                    new int[]{ Color.argb(fa, 255, 255, 215), Color.argb(fa / 3, 255, 245, 190), Color.argb(0, 255, 230, 160) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(sx, sy, 14f * fi + 2f, p);
                p.setShader(null);
            }
        }
        int sa = (int)(dark * 210 * fadeA);
        if (sa > 5) {
            p.setColor(Color.argb(sa, 255, 255, 238));
            c.drawCircle(sx, sy, 1.8f, p);
            float tailT = Math.max(0, t - 0.025f);
            float tx2 = satX1 + (satX2 - satX1) * tailT;
            float ty2 = satY1 + (satY2 - satY1) * tailT;
            Paint tail = new Paint(Paint.ANTI_ALIAS_FLAG);
            tail.setStyle(Paint.Style.STROKE);
            tail.setStrokeWidth(1.4f);
            tail.setStrokeCap(Paint.Cap.ROUND);
            tail.setShader(new LinearGradient(tx2, ty2, sx, sy,
                Color.argb(0, 255, 255, 238), Color.argb(sa / 4, 255, 255, 238), Shader.TileMode.CLAMP));
            c.drawLine(tx2, ty2, sx, sy, tail);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // آثار الطائرات — Contrails
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawContrails(Canvas c, int w, int h, Paint p,
                                      double sunAlt, long now) {
        if (sunAlt < -4) return;
        float bright = (float) Math.min(1.0, (sunAlt + 4) / 24.0);
        if (bright < 0.05f) return;
        Random rnd = new Random(8888L);
        float sec = now / 1000f;
        for (int i = 0; i < 3; i++) {
            float baseY = h * (0.05f + rnd.nextFloat() * 0.22f);
            double ang = (rnd.nextDouble() - 0.5) * 0.28 * Math.PI;
            float len  = w * (0.28f + rnd.nextFloat() * 0.50f);
            float age  = rnd.nextFloat();
            float drift = (sec * 0.6f * (0.5f + rnd.nextFloat() * 0.5f)) % (w * 1.6f);
            float x0 = ((rnd.nextFloat() * w * 1.3f - drift) % (w * 1.6f) + w * 1.6f) % (w * 1.6f) - w * 0.15f;
            float x1 = x0 + (float)(Math.cos(ang) * len);
            float y1 = baseY + (float)(Math.sin(ang) * len);
            if ((x0 > w + len && x1 > w + len) || (x0 < -len && x1 < -len)) continue;
            float trailW = h * (0.003f + age * 0.020f);
            int tA = (int)(bright * (50 - age * 33));
            if (tA < 5) continue;
            int tG = (int)(255 - age * 22);
            Paint tp = new Paint(Paint.ANTI_ALIAS_FLAG);
            tp.setStyle(Paint.Style.STROKE);
            tp.setStrokeWidth(trailW);
            tp.setStrokeCap(Paint.Cap.ROUND);
            tp.setShader(new LinearGradient(x0, baseY, x1, y1,
                Color.argb(0, 255, tG, tG), Color.argb(tA, 255, tG, tG), Shader.TileMode.CLAMP));
            c.drawLine(x0, baseY, x1, y1, tp);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ضباب الأرض
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawGroundFog(Canvas c, int w, int h, Paint p,
                                      double sunAlt, long now) {
        float timeIntensity = (float)(1.0 - Math.abs(sunAlt - (-1)) / 7.0);
        timeIntensity = Math.max(0f, Math.min(1f, timeIntensity));
        float weatherFog = wsFogMult * 0.85f;
        float intensity = Math.max(timeIntensity * 0.6f, weatherFog);
        if (sunAlt > 6 && weatherFog < 0.25f) return;
        if (sunAlt < -12) return;
        intensity = Math.max(0.08f, Math.min(1.5f, intensity));
        int alpha = (int)(Math.min(255, 48 * intensity + wsFogMult * 58));
        if (alpha < 6) return;
        float fogBase = h * 0.87f;
        int fR = 218, fG = 224, fB = 234;
        p.setShader(new LinearGradient(0, fogBase, 0, h,
            new int[]{ Color.argb(0, fR, fG, fB), Color.argb(alpha, fR, fG, fB), Color.argb(alpha * 4 / 5, fR, fG, fB) },
            new float[]{ 0f, 0.38f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, fogBase, w, h, p);
        p.setShader(null);
        Random rnd = new Random(2025L);
        float sec = now / 1000f;
        for (int i = 0; i < 5; i++) {
            float blobW = w * (0.18f + rnd.nextFloat() * 0.22f);
            float blobX = ((rnd.nextFloat() * w * 1.5f + sec * 1.2f * (i % 2 == 0 ? 1 : -1)) % (w * 1.6f) + w * 1.6f) % (w * 1.6f) - w * 0.1f;
            float blobY = fogBase + rnd.nextFloat() * h * 0.07f;
            int   bA    = (int)(alpha * (0.35f + rnd.nextFloat() * 0.40f));
            p.setShader(new RadialGradient(blobX, blobY + blobW * 0.25f, blobW,
                new int[]{ Color.argb(bA, fR, fG, fB), Color.argb(bA / 2, fR, fG, fB), Color.argb(0, fR, fG, fB) },
                new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
            c.drawOval(new RectF(blobX - blobW, blobY, blobX + blobW, blobY + blobW * 0.45f), p);
            p.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // سكاي لاين — أبراج + مساجد + نخلة
    // type: 0=flat 1=setback 2=tapered 3=wedge 4=stepped 5=antenna 6=twin
    //       7=cylinder 8=diamond 9=minaret 10=dome
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawCitySilhouette(Canvas c, int w, int h, Paint p,
                                           double sunAlt, long now) {
        float baseY = h;
        boolean isDay   = sunAlt > 2;
        boolean isDusk  = sunAlt <= 2 && sunAlt > -5;
        boolean isNight = sunAlt <= -5;

        int silR, silG, silB, silA;
        if (isDay) {
            silR = 30; silG = 36; silB = 52; silA = 130;
        } else if (isDusk) {
            float t = (float)((sunAlt + 5) / 7.0);
            silR = (int)(5  + t * 25); silG = (int)(5  + t * 31);
            silB = (int)(10 + t * 42); silA = (int)(200 - t * 70);
        } else {
            silR = 4; silG = 5; silB = 12; silA = 220;
        }

        // خلفية بنايات صغيرة (عمق)
        Random rndBg = new Random(77321L);
        Path bgPath = new Path();
        float xb = -w * 0.01f;
        while (xb < w * 1.02f) {
            float bww = w * (0.018f + rndBg.nextFloat() * 0.038f);
            float bh  = h * (0.028f + rndBg.nextFloat() * 0.065f);
            bgPath.addRect(xb, baseY - bh, xb + bww - w * 0.001f, baseY, Path.Direction.CW);
            xb += bww + w * (0.002f + rndBg.nextFloat() * 0.008f);
        }
        p.setStyle(Paint.Style.FILL);
        p.setColor(Color.argb(silA * 7 / 10, silR, silG, silB));
        c.drawPath(bgPath, p);

        // ══════════════════════════════════════════════════════════
        // أبراج المدينة — تشمل مسجدين ومئذنتين ونخلة
        // ══════════════════════════════════════════════════════════
        float[][] towers = {
            { 0.01f, 0.048f, 0.068f, 0 },
            { 0.05f, 0.032f, 0.092f, 1 },
            { 0.09f, 0.022f, 0.058f, 0 },
            { 0.11f, 0.052f, 0.118f, 4 },
            { 0.17f, 0.020f, 0.052f, 0 },
            { 0.19f, 0.058f, 0.148f, 7 },   // ★ برج أسطواني زجاجي
            { 0.25f, 0.016f, 0.065f, 0 },
            { 0.27f, 0.068f, 0.188f, 5 },   // ★ ناطحة مع هوائي
            { 0.34f, 0.022f, 0.078f, 0 },
            { 0.36f, 0.050f, 0.132f, 3 },
            { 0.41f, 0.026f, 0.088f, 8 },   // diamond cap
            { 0.44f, 0.082f, 0.235f, 5 },   // ★★ أعلى برج
            { 0.53f, 0.044f, 0.155f, 2 },
            { 0.58f, 0.018f, 0.062f, 0 },
            { 0.60f, 0.070f, 0.168f, 6 },   // ★ توأم
            { 0.68f, 0.028f, 0.085f, 0 },
            // ★ مسجد مع قبة
            { 0.70f, 0.065f, 0.095f, 10 },
            // ★ مئذنة
            { 0.76f, 0.014f, 0.162f, 9 },
            { 0.78f, 0.052f, 0.112f, 4 },
            { 0.83f, 0.020f, 0.070f, 8 },
            { 0.85f, 0.058f, 0.125f, 3 },
            // ★ مسجد ثانٍ مع قبة
            { 0.89f, 0.060f, 0.090f, 10 },
            // ★ مئذنة ثانية
            { 0.93f, 0.012f, 0.145f, 9 },
            { 0.95f, 0.042f, 0.098f, 7 },
            { 0.97f, 0.032f, 0.080f, 1 },
        };

        Path fgPath = new Path();
        p.setStyle(Paint.Style.FILL);
        p.setColor(Color.argb(silA, silR, silG, silB));

        for (float[] t : towers) {
            float tx  = t[0] * w, tw  = t[1] * w, th  = t[2] * h;
            int   typ = (int) t[3];
            addSkylineBuilding(fgPath, tx, baseY, tw, th, typ, w, h);
        }

        // أشجار موسمية — تتغير حسب الفصل والموقع
        addSeasonalTrees(fgPath, w, h, baseY, now);

        // الأرض
        fgPath.addRect(0, baseY - 1, w, h + 4, Path.Direction.CW);
        c.drawPath(fgPath, p);

        // بريق زجاج الأبراج
        if (sunAlt > -4) {
            float glassA = (float) Math.min(1.0, (sunAlt + 4) / 10.0);
            Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG);
            gp.setStyle(Paint.Style.STROKE);
            gp.setStrokeWidth(1.4f);
            gp.setColor(Color.argb((int)(60 * glassA), 200, 225, 255));
            c.drawPath(fgPath, gp);
        }

        // واجهات زجاجية
        drawGlassCurtainSheen(c, w, h, p, towers, baseY, sunAlt);

        // نوافذ مضيئة ليلاً
        if (sunAlt < 0) {
            float nightT = (float) Math.min(1.0, -sunAlt / 10.0);
            drawWindowGrid(c, w, h, baseY, towers, nightT, now);
        }

        // أضواء طيران على قمم الأبراج الشاهقة
        if (sunAlt < -2) {
            float dark = (float) Math.min(1.0, (-sunAlt - 2) / 12.0);
            long blinkMs = now % 1200L;
            int bA = (int)(dark * (blinkMs < 600 ? 180 : 80));
            for (float[] t : towers) {
                if (t[2] > 0.14f) {
                    float tx = t[0] * w + t[1] * w * 0.5f;
                    float ty = baseY - t[2] * h;
                    float lightR = w * 0.007f;
                    p.setShader(new RadialGradient(tx, ty, lightR * 3.5f,
                        new int[]{ Color.argb(bA / 2, 255, 60, 60), Color.argb(0, 255, 60, 60) },
                        null, Shader.TileMode.CLAMP));
                    c.drawCircle(tx, ty, lightR * 3.5f, p);
                    p.setShader(null);
                    p.setColor(Color.argb(bA, 255, 80, 80));
                    c.drawCircle(tx, ty, lightR, p);
                }
            }
        }

        if (isNight) drawCityLights(c, w, h, p, baseY, sunAlt, now);
        if (sunAlt > -8) drawRooftopDetails(c, w, h, p, towers, baseY, silR, silG, silB, silA);

        // هلال المسجد يومض قليلاً في رمضان
        if (cHijriMonth == 9 && sunAlt < 2) {
            drawMosqueCrescentAccent(c, w, h, p, towers, baseY, silA, now);
        }
    }

    /** يضيف مبنى ناطح واحد للـ Path حسب النوع */
    private static void addSkylineBuilding(Path path, float x, float base,
                                           float bw, float bh, int type,
                                           int w, int h) {
        float top = base - bh;
        float mx  = x + bw / 2f;
        switch (type) {
            case 0: { // مستطيل بسيط
                path.addRect(x, top, x + bw, base, Path.Direction.CW);
                path.addRect(x - w * 0.002f, top - bh * 0.022f, x + bw + w * 0.002f, top, Path.Direction.CW);
                break;
            }
            case 1: { // setback كلاسيكي
                path.addRect(x, top, x + bw, base, Path.Direction.CW);
                float sw1 = bw * 0.72f, sx1 = x + bw * 0.14f;
                path.addRect(sx1, top - bh * 0.30f, sx1 + sw1, top, Path.Direction.CW);
                float sw2 = bw * 0.46f, sx2 = x + bw * 0.27f;
                path.addRect(sx2, top - bh * 0.55f, sx2 + sw2, top - bh * 0.30f, Path.Direction.CW);
                float mechY = base - bh * 0.38f;
                path.addRect(x - w * 0.001f, mechY, x + bw + w * 0.001f, mechY + bh * 0.025f, Path.Direction.CW);
                break;
            }
            case 2: { // مدبب
                path.addRect(x, top + bh * 0.20f, x + bw, base, Path.Direction.CW);
                float sw = bw * 0.70f, sx = x + bw * 0.15f;
                path.addRect(sx, top + bh * 0.08f, sx + sw, top + bh * 0.20f, Path.Direction.CW);
                Path tri = new Path();
                tri.moveTo(sx, top + bh * 0.08f);
                tri.lineTo(mx, top);
                tri.lineTo(sx + sw, top + bh * 0.08f);
                tri.close();
                path.addPath(tri);
                break;
            }
            case 3: { // wedge
                path.addRect(x, top + bh * 0.14f, x + bw, base, Path.Direction.CW);
                Path wed = new Path();
                wed.moveTo(x, top + bh * 0.14f);
                wed.lineTo(x + bw, top - bh * 0.04f);
                wed.lineTo(x + bw, top + bh * 0.14f);
                wed.close();
                path.addPath(wed);
                float mechY = base - bh * 0.42f;
                path.addRect(x, mechY, x + bw, mechY + bh * 0.020f, Path.Direction.CW);
                break;
            }
            case 4: { // متدرج — 5 كتل
                float[] ws = { bw, bw * 0.82f, bw * 0.62f, bw * 0.42f, bw * 0.24f };
                float[] hs = { bh * 0.32f, bh * 0.24f, bh * 0.18f, bh * 0.14f, bh * 0.12f };
                float curY = base;
                for (int i = 0; i < 5; i++) {
                    float offX = (bw - ws[i]) / 2f;
                    path.addRect(x + offX, curY - hs[i], x + offX + ws[i], curY, Path.Direction.CW);
                    curY -= hs[i];
                }
                break;
            }
            case 5: { // هوائي + setback
                path.addRect(x, top + bh * 0.20f, x + bw, base, Path.Direction.CW);
                float sw1 = bw * 0.72f, sx1 = x + bw * 0.14f;
                path.addRect(sx1, top + bh * 0.10f, sx1 + sw1, top + bh * 0.20f, Path.Direction.CW);
                float sw2 = bw * 0.50f, sx2 = x + bw * 0.25f;
                path.addRect(sx2, top + bh * 0.03f, sx2 + sw2, top + bh * 0.10f, Path.Direction.CW);
                path.addRect(sx2, top, sx2 + sw2, top + bh * 0.03f, Path.Direction.CW);
                path.addRect(x - w*0.002f, base - bh*0.40f, x + bw + w*0.002f, base - bh*0.36f, Path.Direction.CW);
                float antW = Math.max(1.5f, w * 0.003f);
                path.addRect(mx - antW, top - bh * 0.38f, mx + antW, top, Path.Direction.CW);
                for (int d = 0; d < 2; d++) {
                    float dy = top - bh * (0.15f + d * 0.12f);
                    path.addRect(mx - antW * 4f, dy, mx + antW * 4f, dy + bh * 0.020f, Path.Direction.CW);
                }
                break;
            }
            case 6: { // توأم (Petronas-esque)
                float gap  = bw * 0.10f, tw2  = bw * 0.44f;
                for (int side = 0; side < 2; side++) {
                    float tx = x + side * (tw2 + gap);
                    path.addRect(tx, top + bh * 0.20f, tx + tw2, base, Path.Direction.CW);
                    path.addRect(tx + tw2*0.12f, top + bh*0.08f, tx + tw2*0.88f, top + bh*0.20f, Path.Direction.CW);
                    path.addRect(tx + tw2*0.22f, top, tx + tw2*0.78f, top + bh*0.08f, Path.Direction.CW);
                    float atW = Math.max(1.2f, w * 0.0025f), atX = tx + tw2 / 2f;
                    path.addRect(atX - atW, top - bh * 0.22f, atX + atW, top, Path.Direction.CW);
                }
                float bridgeY = base - bh * 0.55f;
                path.addRect(x + tw2, bridgeY, x + tw2 + gap, bridgeY + bh * 0.035f, Path.Direction.CW);
                break;
            }
            case 7: { // برج أسطواني زجاجي
                float[] cws = { bw, bw * 0.88f, bw * 0.74f, bw * 0.58f, bw * 0.38f };
                float[] chs = { bh * 0.30f, bh * 0.22f, bh * 0.18f, bh * 0.14f, bh * 0.16f };
                float curY = base;
                for (int i = 0; i < 5; i++) {
                    float offX = (bw - cws[i]) / 2f;
                    path.addRect(x + offX, curY - chs[i], x + offX + cws[i], curY, Path.Direction.CW);
                    curY -= chs[i];
                }
                float domeR = bw * 0.20f;
                path.addOval(new RectF(mx - domeR, top - domeR * 0.7f, mx + domeR, top), Path.Direction.CW);
                break;
            }
            case 8: { // diamond cap
                path.addRect(x, top + bh * 0.18f, x + bw, base, Path.Direction.CW);
                path.addRect(x - w*0.002f, base - bh*0.45f, x + bw + w*0.002f, base - bh*0.40f, Path.Direction.CW);
                float sw = bw * 0.65f, sx = x + bw * 0.175f;
                path.addRect(sx, top + bh * 0.06f, sx + sw, top + bh * 0.18f, Path.Direction.CW);
                Path diamond = new Path();
                diamond.moveTo(mx, top);
                diamond.lineTo(sx + sw, top + bh * 0.06f);
                diamond.lineTo(mx, top + bh * 0.12f);
                diamond.lineTo(sx, top + bh * 0.06f);
                diamond.close();
                path.addPath(diamond);
                break;
            }
            case 9: { // ★ مئذنة إسلامية
                // قاعدة مستطيلة
                path.addRect(x + bw * 0.30f, top + bh * 0.60f, x + bw * 0.70f, base, Path.Direction.CW);
                // جسم المئذنة المستدير (octagonal محاكاة)
                float mw = bw * 0.35f, mx2 = x + bw * 0.5f;
                path.addRect(mx2 - mw / 2f, top + bh * 0.20f, mx2 + mw / 2f, top + bh * 0.60f, Path.Direction.CW);
                // شرفة المؤذن (balcony)
                path.addRect(mx2 - mw * 0.65f, top + bh * 0.18f, mx2 + mw * 0.65f, top + bh * 0.22f, Path.Direction.CW);
                // رأس المئذنة المدبب (مخروط)
                float nw = bw * 0.22f, nx = mx2 - nw / 2f;
                path.addRect(nx, top + bh * 0.06f, nx + nw, top + bh * 0.20f, Path.Direction.CW);
                // هلال المئذنة
                float crR = bw * 0.10f;
                Path crescent = new Path();
                // الكرة أسفل الهلال
                crescent.addCircle(mx2, top + bh * 0.04f, crR * 0.4f, Path.Direction.CW);
                // الهلال — دائرتان
                RectF outerC = new RectF(mx2 - crR, top - crR * 0.5f, mx2 + crR, top + bh * 0.04f);
                crescent.addArc(outerC, 210, 300);
                RectF innerC = new RectF(mx2 - crR * 0.6f, top - crR * 0.3f, mx2 + crR * 0.6f, top + bh * 0.04f - crR * 0.2f);
                crescent.addArc(innerC, 215, -300);
                path.addPath(crescent);
                break;
            }
            case 10: { // ★ مسجد مع قبة
                // جسم المسجد الرئيسي
                path.addRect(x, top + bh * 0.45f, x + bw, base, Path.Direction.CW);
                // إيوان (مدخل مقوس) في المنتصف
                float iW = bw * 0.40f, iH = bh * 0.20f;
                path.addRect(mx - iW / 2f, top + bh * 0.25f, mx + iW / 2f, top + bh * 0.45f, Path.Direction.CW);
                // قوس الإيوان
                Path archPath = new Path();
                archPath.moveTo(mx - iW / 2f, top + bh * 0.25f);
                archPath.arcTo(new RectF(mx - iW / 2f, top + bh * 0.18f, mx + iW / 2f, top + bh * 0.30f), 180, -180);
                archPath.lineTo(mx + iW / 2f, top + bh * 0.25f);
                archPath.close();
                path.addPath(archPath);
                // صف مسلتين صغيرتين (minarets صغيرة)
                float sm = bw * 0.06f;
                for (int side = 0; side < 2; side++) {
                    float stX = (side == 0) ? x + sm * 0.5f : x + bw - sm * 1.5f;
                    path.addRect(stX, top + bh * 0.10f, stX + sm, top + bh * 0.45f, Path.Direction.CW);
                    // رأس مدبب
                    Path sTri = new Path();
                    sTri.moveTo(stX, top + bh * 0.10f);
                    sTri.lineTo(stX + sm / 2f, top + bh * 0.02f);
                    sTri.lineTo(stX + sm, top + bh * 0.10f);
                    sTri.close();
                    path.addPath(sTri);
                }
                // القبة الرئيسية
                float domeW = bw * 0.48f, domeH = bh * 0.30f;
                float domeLeft = mx - domeW / 2f, domeTop = top + bh * 0.08f;
                Path domePath = new Path();
                domePath.moveTo(domeLeft, top + bh * 0.25f);
                // نصف قطع ناقص
                domePath.cubicTo(
                    domeLeft, domeTop,
                    mx + domeW / 2f, domeTop,
                    mx + domeW / 2f, top + bh * 0.25f);
                domePath.close();
                path.addPath(domePath);
                // قبتان صغيرتان جانبيتان
                float sdW = bw * 0.22f, sdH = bh * 0.14f;
                for (int side = 0; side < 2; side++) {
                    float sdCX = (side == 0) ? x + bw * 0.20f : x + bw * 0.80f;
                    float sdTop2 = top + bh * 0.35f;
                    Path sdDome = new Path();
                    sdDome.moveTo(sdCX - sdW / 2f, sdTop2 + sdH);
                    sdDome.cubicTo(sdCX - sdW / 2f, sdTop2, sdCX + sdW / 2f, sdTop2, sdCX + sdW / 2f, sdTop2 + sdH);
                    sdDome.close();
                    path.addPath(sdDome);
                }
                // هلال القبة
                float cR = bw * 0.07f;
                path.addCircle(mx, domeTop - cR * 0.3f, cR * 0.28f, Path.Direction.CW);
                Path cres2 = new Path();
                cres2.addOval(new RectF(mx - cR, domeTop - cR * 1.2f, mx + cR, domeTop - cR * 0.2f), Path.Direction.CW);
                path.addPath(cres2);
                break;
            }
        }
    }

    /** إضافة نخلة للسيلويت */
    private static void addPalmTree(Path path, float x, float base, float height, int w) {
        float trunkW = w * 0.006f;
        float trunkTop = base - height;

        // جذع منحنٍ قليلاً
        Path trunk = new Path();
        trunk.moveTo(x - trunkW, base);
        trunk.cubicTo(x - trunkW, base - height * 0.6f, x + trunkW * 2f, base - height * 0.8f, x + trunkW, trunkTop);
        trunk.cubicTo(x + trunkW * 3f, base - height * 0.8f, x + trunkW, base - height * 0.6f, x + trunkW * 2, base);
        trunk.close();
        path.addPath(trunk);

        // سعف النخلة — 7 أوراق متناظرة
        float leafLen = height * 0.55f;
        for (int i = 0; i < 7; i++) {
            double angle = Math.toRadians(-150 + i * 50);
            float ex = x + (float)(Math.cos(angle) * leafLen);
            float ey = trunkTop + (float)(Math.sin(angle) * leafLen * 0.5f);

            // كل سعفة كمنحنى رفيع
            Path leaf = new Path();
            leaf.moveTo(x, trunkTop);
            float ctrlX = x + (float)(Math.cos(angle) * leafLen * 0.5f);
            float ctrlY = trunkTop + (float)(Math.sin(angle) * leafLen * 0.3f) - height * 0.05f;
            leaf.quadTo(ctrlX, ctrlY, ex, ey);
            // نعود بخط موازٍ رفيع
            leaf.quadTo(ctrlX, ctrlY + height * 0.02f, x, trunkTop + height * 0.01f);
            leaf.close();
            path.addPath(leaf);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // أشجار موسمية — نخلة + صنوبر + أشجار ورقية حسب الفصل والموقع
    // ═══════════════════════════════════════════════════════════════════════
    private static void addSeasonalTrees(Path path, int w, int h, float baseY, long now) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int month = cal.get(java.util.Calendar.MONTH) + 1; // 1-12

        // الفصل بناءً على الشهر والنصف الكروي
        int season; // 0=ربيع 1=صيف 2=خريف 3=شتاء
        boolean southern = cLat < -15;
        int adjustedMonth = southern ? ((month + 6 - 1) % 12 + 1) : month;
        if (adjustedMonth <= 2 || adjustedMonth == 12) season = 3; // شتاء
        else if (adjustedMonth <= 5)                   season = 0; // ربيع
        else if (adjustedMonth <= 8)                   season = 1; // صيف
        else                                           season = 2; // خريف

        // النوع الأساسي حسب خط العرض
        // مناخ حار (|lat| < 30): نخيل + أكاسيا
        // معتدل (30-55): أشجار ورقية
        // بارد (55+): صنوبر
        double absLat = Math.abs(cLat);
        int treeType; // 0=نخلة 1=صنوبر 2=ورقية
        if (absLat < 30)       treeType = 0;
        else if (absLat < 55)  treeType = 2;
        else                   treeType = 1;

        Random tRnd = new Random(33221L);

        // 1-2 أشجار في مواضع ثابتة
        float[] positions = { 0.07f, 0.63f, 0.88f };
        int count = (cQuality == 0) ? 1 : 2;
        for (int i = 0; i < count; i++) {
            float tx = w * positions[i];
            float th = h * (0.085f + tRnd.nextFloat() * 0.030f);

            if (treeType == 0) {
                addPalmTree(path, tx, baseY, th, w);
            } else if (treeType == 1) {
                addPineTree(path, tx, baseY, th, w);
            } else {
                addDeciduousTree(path, tx, baseY, th, w, season);
            }
        }
    }

    /** شجرة صنوبر — مثلث هرمي مع جذع */
    private static void addPineTree(Path path, float x, float base, float height, int w) {
        float tw = w * 0.005f;
        float trunkH = height * 0.18f;
        // جذع
        path.addRect(x - tw, base - trunkH, x + tw, base, Path.Direction.CW);
        // 3 طبقات هرمية
        float top = base - height;
        for (int i = 0; i < 3; i++) {
            float layerTop = top + height * (i * 0.22f);
            float layerBot = top + height * (i * 0.22f + 0.38f);
            float layerW   = height * (0.18f + i * 0.09f);
            Path tri = new Path();
            tri.moveTo(x, layerTop);
            tri.lineTo(x - layerW, layerBot);
            tri.lineTo(x + layerW, layerBot);
            tri.close();
            path.addPath(tri);
        }
    }

    /** شجرة ورقية — تتغير حسب الفصل (ربيع/صيف/خريف/شتاء) */
    private static void addDeciduousTree(Path path, float x, float base, float height, int w, int season) {
        float tw = w * 0.005f;
        float trunkH = height * 0.30f;
        // جذع
        path.addRect(x - tw, base - trunkH, x + tw, base, Path.Direction.CW);

        if (season == 3) {
            // شتاء — أغصان عارية بدون أوراق
            float branchLen = height * 0.35f;
            double[] angles = { -90, -120, -60, -140, -40, -110, -70 };
            for (double ang : angles) {
                float ex = x + (float)(Math.cos(Math.toRadians(ang)) * branchLen);
                float ey = (base - trunkH) + (float)(Math.sin(Math.toRadians(ang)) * branchLen);
                // فرع كمستطيل رفيع
                float bw2 = tw * 0.5f;
                Path branch = new Path();
                branch.moveTo(x - bw2, base - trunkH);
                branch.lineTo(ex - bw2 * 0.3f, ey);
                branch.lineTo(ex + bw2 * 0.3f, ey);
                branch.lineTo(x + bw2, base - trunkH);
                branch.close();
                path.addPath(branch);
            }
        } else {
            // ربيع/صيف/خريف — تاج بيضاوي
            float crownR  = height * 0.38f;
            float crownCy = base - trunkH - crownR * 0.55f;
            // تاج بيضاوي مع عدم انتظام طفيف
            float rW = crownR * (0.85f + (season == 0 ? 0.10f : season == 1 ? 0.15f : 0.12f));
            float rH = crownR * (0.90f + (season == 1 ? 0.10f : 0.05f));
            RectF crown = new RectF(x - rW, crownCy - rH, x + rW, crownCy + rH * 0.5f);
            path.addOval(crown, Path.Direction.CW);

            if (season == 0) {
                // ربيع — برعم إضافي صغير
                path.addCircle(x - crownR * 0.4f, crownCy - rH * 0.4f, crownR * 0.22f, Path.Direction.CW);
            }
        }
    }

    /** هلال المسجد يلمع في رمضان */
    private static void drawMosqueCrescentAccent(Canvas c, int w, int h, Paint p,
                                                  float[][] towers, float baseY,
                                                  int silA, long now) {
        long pulse = now % 3000L;
        float pulseF = (float)(0.6 + 0.4 * Math.sin(pulse / 3000.0 * 2 * Math.PI));
        int glowA = (int)(silA * 0.4f * pulseF);
        if (glowA < 8) return;

        p.setStyle(Paint.Style.FILL);
        for (float[] t : towers) {
            int typ = (int) t[3];
            if (typ != 9 && typ != 10) continue;
            float tx  = t[0] * w + t[1] * w * 0.5f;
            float top = baseY - t[2] * h;
            // هالة ذهبية على رأس المبنى الإسلامي
            p.setShader(new RadialGradient(tx, top, w * 0.03f,
                new int[]{ Color.argb(glowA, 255, 220, 60), Color.argb(0, 200, 165, 30) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(tx, top, w * 0.03f, p);
            p.setShader(null);
        }
    }

    /** شبكة نوافذ مضيئة */
    private static void drawWindowGrid(Canvas c, int w, int h, float baseY,
                                       float[][] towers, float nightT, long now) {
        Random rnd = new Random(54321L);
        long flickerSeed = now / 8000L;
        Random flickerRnd = new Random(flickerSeed);
        Paint wp = new Paint(Paint.ANTI_ALIAS_FLAG);
        for (float[] t : towers) {
            float tx = t[0] * w, tw = t[1] * w, th = t[2] * h;
            float top = baseY - th;
            int typ = (int) t[3];
            if (typ == 9) continue; // مئذنة — لا نوافذ شبكية

            float wW = Math.max(2.5f, tw * 0.14f), wH = Math.max(2.0f, h * 0.020f);
            float gapX = tw * 0.08f, gapY = h * 0.012f;
            int cols = Math.max(1, (int)(tw / (wW + gapX)));
            int rows = Math.max(1, (int)(th * 0.75f / (wH + gapY)));
            float startX = tx + (tw - cols * (wW + gapX) + gapX) / 2f;
            float startY = baseY - h * 0.035f;

            for (int row = 0; row < rows; row++) {
                for (int col = 0; col < cols; col++) {
                    boolean lit = flickerRnd.nextFloat() < (0.35f + rnd.nextFloat() * 0.35f);
                    if (!lit) { rnd.nextFloat(); continue; }
                    float wx = startX + col * (wW + gapX);
                    float wy = startY - row * (wH + gapY);
                    if (wy < top + th * 0.10f) break;
                    int wtype = flickerRnd.nextInt(4);
                    int wr, wg, wb;
                    if (wtype == 0) { wr = 255; wg = 235; wb = 160; }
                    else if (wtype == 1) { wr = 210; wg = 230; wb = 255; }
                    else if (wtype == 2) { wr = 255; wg = 255; wb = 220; }
                    else { wr = 255; wg = 180; wb = 100; }
                    int wa = (int)(nightT * (100 + rnd.nextFloat() * 85));
                    wp.setColor(Color.argb(wa, wr, wg, wb));
                    c.drawRect(wx, wy - wH, wx + wW, wy, wp);
                }
            }
        }
    }

    /** أضواء الشوارع — صوديوم (أصفر/برتقالي) مقابل LED (أبيض/بارد) مقابل هاليد */
    private static void drawCityLights(Canvas c, int w, int h, Paint p,
                                       float baseY, double sunAlt, long now) {
        float dark = (float) Math.min(1.0, (-sunAlt - 5) / 15.0);
        if (dark < 0.05f) return;

        Random rnd = new Random(99887L);
        int lightCount = (cQuality == 0) ? 14 : 22;
        for (int i = 0; i < lightCount; i++) {
            float lx = rnd.nextFloat() * w;
            float ly = baseY - h * 0.008f;
            float roll = rnd.nextFloat();

            int cr, cg, cb;
            float haloR;
            if (roll < 0.55f) {
                // صوديوم عالي الضغط — برتقالي دافئ جداً (2200K)
                // أقدم وأكثر انتشاراً في المناطق القديمة والطرق السريعة
                cr = 255; cg = 165; cb = 30;
                haloR = w * 0.050f;
            } else if (roll < 0.85f) {
                // LED — أبيض بارد (5000–6000K) في الأحياء الحديثة
                cr = 220; cg = 240; cb = 255;
                haloR = w * 0.035f;
            } else {
                // هاليد معدني Metal Halide — أبيض محايد (4200K)
                // في مواقف السيارات والملاعب والجسور
                cr = 200; cg = 220; cb = 255;
                haloR = w * 0.042f;
            }

            int la = (int)(dark * (38 + rnd.nextFloat() * 55));
            p.setShader(new RadialGradient(lx, ly, haloR,
                new int[]{ Color.argb(la, cr, cg, cb),
                           Color.argb(la / 3, cr, cg, cb),
                           Color.argb(0, cr, cg, cb) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(lx, ly, haloR, p);
            p.setShader(null);

            // نقطة الضوء المركزية
            p.setColor(Color.argb(Math.min(255, (int)(dark * 180)), cr, cg, cb));
            c.drawCircle(lx, ly, 1.8f, p);
        }

        // سيارات متحركة — مصابيح أمامية بيضاء وخلفية حمراء
        long carSeed = now / 300L;
        Random carRnd = new Random(carSeed);
        for (int i = 0; i < 6; i++) {
            float cx2 = (carRnd.nextFloat() * w * 1.3f) % w;
            float cy2 = baseY - h * (0.004f + carRnd.nextFloat() * 0.006f);
            int ca = (int)(dark * (100 + carRnd.nextFloat() * 80));
            p.setColor(Color.argb(ca, 255, 250, 230));
            c.drawCircle(cx2, cy2, 1.5f, p);
            c.drawCircle(cx2 + w * 0.015f, cy2, 1.5f, p);
            if (carRnd.nextBoolean()) {
                float cx3 = (carRnd.nextFloat() * w * 1.4f) % w;
                p.setColor(Color.argb(ca / 2, 255, 50, 50));
                c.drawCircle(cx3, cy2, 1.2f, p);
                c.drawCircle(cx3 - w * 0.010f, cy2, 1.2f, p);
            }
        }

        // تلوث ضوئي — sky glow مختلط أصفر/برتقالي من مزيج الأضواء
        p.setShader(new RadialGradient(w * 0.5f, baseY, w * 0.65f,
            new int[]{ Color.argb((int)(dark * 42), 255, 130, 30),
                       Color.argb((int)(dark * 16), 255, 100, 20),
                       Color.argb(0, 200, 80, 10) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(0, baseY - h * 0.22f, w, baseY, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // سحاب Cumulonimbus
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawCumulonimbus(Canvas c, int w, int h, Paint p,
                                         double sunAlt, long now) {
        if (sunAlt < -20 || wsStormMult < 0.05f) return;
        boolean stormActive = false;
        if (cbStormStart == 0) {
            cbStormStart = now;
            cbStormNext  = 240_000L + (long)((new Random(now / 300_000L)).nextFloat() * 360_000L);
            cbCloudX     = 0.32f + (new Random(now / 120_000L)).nextFloat() * 0.45f;
            cbCloudW     = 0.35f + (new Random(now / 120_000L + 1)).nextFloat() * 0.28f;
            cbStormDur   = 90_000L  + (long)((new Random(now / 300_000L + 2)).nextFloat() * 120_000L);
        }
        long elapsed = now - cbStormStart;
        if (elapsed > cbStormNext + cbStormDur) {
            cbStormStart = now;
            Random sr = new Random(now / 60_000L);
            cbStormNext = 180_000L + (long)(sr.nextFloat() * 300_000L);
            cbCloudX    = 0.20f + sr.nextFloat() * 0.52f;
            cbCloudW    = 0.30f + sr.nextFloat() * 0.32f;
            cbStormDur  = 80_000L + (long)(sr.nextFloat() * 140_000L);
            elapsed = 0;
        }
        stormActive = elapsed >= cbStormNext && elapsed < cbStormNext + cbStormDur;
        if (!stormActive) return;
        long stormT = elapsed - cbStormNext;
        float stormAge = (float)(stormT / (double) cbStormDur);
        float fade = stormAge < 0.12f ? stormAge / 0.12f : (stormAge > 0.88f ? 1f - (stormAge - 0.88f) / 0.12f : 1f);
        fade = Math.max(0, Math.min(1, fade));
        float cloudCX  = cbCloudX * w, cloudHW  = cbCloudW * w * 0.5f;
        float cloudTopY = h * 0.05f, anvilTopY = h * 0.02f;
        float cloudBaseY = h * (0.40f + (float)Math.max(0, sunAlt / 90.0) * 0.08f);
        float anvilHW   = cloudHW * 1.55f;
        long timeSinceBolt = now - cbBoltTime;
        boolean boltFlash = timeSinceBolt < 180L;
        float flashAlpha = boltFlash ? (float) Math.max(0, 1.0 - timeSinceBolt / 180.0) : 0;
        if (now - cbBoltTime > 5_000L + (long)(new Random(cbBoltTime).nextFloat() * 12_000L)) {
            cbBoltTime = now;
            cbBoltX1 = cloudCX + (new Random(now).nextFloat() - 0.5f) * cloudHW * 0.8f;
            cbBoltY1 = cloudBaseY - h * 0.06f;
        }
        int baseA = (int)(fade * 210);
        if (baseA < 10) return;
        if (boltFlash) {
            p.setShader(new RadialGradient(cloudCX, cloudBaseY - (cloudBaseY - cloudTopY) * 0.5f,
                cloudHW * 1.4f,
                new int[]{ Color.argb((int)(flashAlpha * 180), 220, 235, 255),
                           Color.argb((int)(flashAlpha * 80),  180, 200, 255),
                           Color.argb(0, 140, 160, 220) }, null, Shader.TileMode.CLAMP));
            c.drawRect(cloudCX - anvilHW, anvilTopY, cloudCX + anvilHW, cloudBaseY, p);
            p.setShader(null);
        }
        p.setShader(new LinearGradient(0, cloudTopY, 0, cloudBaseY,
            new int[]{ Color.argb(baseA * 5 / 8, 30, 32, 45), Color.argb(baseA, 22, 24, 38),
                       Color.argb(baseA, 18, 20, 32), Color.argb(baseA * 3 / 4, 38, 42, 58) },
            new float[]{ 0f, 0.3f, 0.75f, 1f }, Shader.TileMode.CLAMP));
        Path cbPath = new Path();
        cbPath.moveTo(cloudCX - cloudHW, cloudBaseY);
        cbPath.lineTo(cloudCX + cloudHW, cloudBaseY);
        cbPath.lineTo(cloudCX + cloudHW, cloudTopY + h * 0.10f);
        cbPath.quadTo(cloudCX + anvilHW, cloudTopY + h * 0.04f, cloudCX + anvilHW, anvilTopY + h * 0.04f);
        cbPath.quadTo(cloudCX, anvilTopY, cloudCX - anvilHW, anvilTopY + h * 0.04f);
        cbPath.quadTo(cloudCX - anvilHW, cloudTopY + h * 0.04f, cloudCX - cloudHW, cloudTopY + h * 0.10f);
        cbPath.close();
        c.drawPath(cbPath, p);
        p.setShader(null);
        Random cnvRnd = new Random(33344L);
        Paint cnvP = new Paint(Paint.ANTI_ALIAS_FLAG);
        for (int i = 0; i < 6; i++) {
            float cx2 = cloudCX + (cnvRnd.nextFloat() - 0.5f) * cloudHW * 1.5f;
            float colW = cloudHW * (0.08f + cnvRnd.nextFloat() * 0.10f);
            float colH = (cloudBaseY - cloudTopY) * (0.45f + cnvRnd.nextFloat() * 0.35f);
            float colTop = cloudBaseY - colH;
            cnvP.setShader(new RadialGradient(cx2, colTop + colH * 0.5f, colW * 1.4f,
                new int[]{ Color.argb(baseA * 2 / 5, 10, 10, 20), Color.argb(0, 15, 15, 28) },
                null, Shader.TileMode.CLAMP));
            c.drawOval(new RectF(cx2 - colW, colTop, cx2 + colW, colTop + colH), cnvP);
        }
        cnvP.setShader(null);
        int mamA = (int)(fade * 90);
        p.setShader(new LinearGradient(0, cloudBaseY - h * 0.05f, 0, cloudBaseY,
            new int[]{ Color.argb(0, 50, 58, 80), Color.argb(mamA, 42, 50, 72), Color.argb(mamA, 35, 42, 65) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(cloudCX - cloudHW, cloudBaseY - h * 0.05f, cloudCX + cloudHW, cloudBaseY, p);
        p.setShader(null);
        float rainA = fade * 0.82f;
        if (rainA > 0.05f) {
            Paint rainPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            rainPaint.setStyle(Paint.Style.STROKE);
            rainPaint.setStrokeCap(Paint.Cap.ROUND);
            Random rainRnd = new Random(55566L);
            long rainFrame = now / 60L;
            Random animRnd = new Random(rainFrame);
            for (int i = 0; i < 55; i++) {
                float rx = cloudCX - cloudHW * 0.9f + rainRnd.nextFloat() * cloudHW * 1.8f;
                float offset = (animRnd.nextFloat() * h * 0.25f + rainFrame * 6f) % (h * 0.38f);
                float ry0 = cloudBaseY + offset;
                float ry1 = ry0 + h * (0.025f + rainRnd.nextFloat() * 0.035f);
                if (ry0 > h) continue;
                float windSlant = h * 0.018f;
                rainPaint.setStrokeWidth(0.6f + rainRnd.nextFloat() * 0.8f);
                rainPaint.setColor(Color.argb((int)(rainA * (55 + rainRnd.nextFloat() * 65)), 160, 185, 220));
                c.drawLine(rx, ry0, rx + windSlant, ry1, rainPaint);
            }
        }
        int virgaA = (int)(fade * 55);
        p.setShader(new LinearGradient(0, cloudBaseY, 0, Math.min(h * 0.88f, cloudBaseY + h * 0.28f),
            new int[]{ Color.argb(virgaA, 100, 130, 180), Color.argb(virgaA / 3, 80, 110, 160), Color.argb(0, 60, 90, 140) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(cloudCX - cloudHW * 0.72f, cloudBaseY, cloudCX + cloudHW * 0.72f, Math.min(h * 0.88f, cloudBaseY + h * 0.28f), p);
        p.setShader(null);
        if (boltFlash && cbBoltX1 > 0) {
            Paint boltP = new Paint(Paint.ANTI_ALIAS_FLAG);
            boltP.setStyle(Paint.Style.STROKE);
            boltP.setStrokeCap(Paint.Cap.ROUND);
            Path boltPath = new Path();
            float bx = cbBoltX1, by = cbBoltY1;
            float endY = Math.min(h * 0.88f, cloudBaseY + h * 0.32f);
            boltPath.moveTo(bx, by);
            Random bRnd = new Random(cbBoltTime);
            while (by < endY) {
                float stepY = h * (0.035f + bRnd.nextFloat() * 0.045f);
                float stepX = (bRnd.nextFloat() - 0.5f) * cloudHW * 0.55f;
                if (bRnd.nextFloat() < 0.3f) {
                    Path branch = new Path();
                    branch.moveTo(bx, by);
                    branch.lineTo(bx + (bRnd.nextFloat() - 0.5f) * cloudHW * 0.5f, by + h * 0.06f);
                    boltP.setStrokeWidth(1.0f);
                    boltP.setColor(Color.argb((int)(flashAlpha * 160), 190, 210, 255));
                    c.drawPath(branch, boltP);
                }
                bx += stepX; by += stepY;
                boltPath.lineTo(bx, by);
            }
            boltP.setStrokeWidth(4.0f * flashAlpha);
            boltP.setColor(Color.argb((int)(flashAlpha * 120), 160, 190, 255));
            c.drawPath(boltPath, boltP);
            boltP.setStrokeWidth(2.0f * flashAlpha);
            boltP.setColor(Color.argb((int)(flashAlpha * 200), 210, 225, 255));
            c.drawPath(boltPath, boltP);
            boltP.setStrokeWidth(0.8f * flashAlpha);
            boltP.setColor(Color.argb((int)(flashAlpha * 255), 245, 250, 255));
            c.drawPath(boltPath, boltP);
            p.setShader(new RadialGradient(bx, h, cloudHW * 0.28f * 2.2f,
                new int[]{ Color.argb((int)(flashAlpha * 90), 200, 220, 255), Color.argb(0, 160, 180, 220) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(bx, h, cloudHW * 0.28f * 2.2f, p);
            p.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // طيور مهاجرة — تظهر عند الغروب والشروق
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawBirds(Canvas c, int w, int h, Paint p, double sunAlt, long now) {
        // تظهر عند الشروق والغروب
        if (Math.abs(sunAlt) > 12 || sunAlt < -8) return;
        float intensity = (float)(1.0 - Math.abs(sunAlt) / 12.0);
        intensity = Math.max(0, Math.min(1, intensity));
        if (intensity < 0.15f) return;

        // موضع السرب يتحرك ببطء
        float sec = now / 1000f;
        float flockX = (sec * 12f) % (w * 1.8f) - w * 0.1f;
        float flockY = h * (0.22f + (float)(Math.sin(sec * 0.05) * 0.06));

        int birdAlpha = (int)(200 * intensity);
        if (birdAlpha < 20) return;

        Paint birdPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        birdPaint.setStyle(Paint.Style.STROKE);
        birdPaint.setStrokeWidth(1.2f);
        birdPaint.setStrokeCap(Paint.Cap.ROUND);
        birdPaint.setColor(Color.argb(birdAlpha, 20, 20, 30));

        // تكوين V — 7 طيور
        float[][] birdOffsets = {
            { 0, 0 }, { -14, 5 }, { 14, 5 },
            { -28, 11 }, { 28, 11 },
            { -44, 18 }, { 44, 18 }
        };
        float birdScale = 0.6f + (float)(Math.sin(sec * 2.5f) * 0.15f); // رفرفة أجنحة

        for (float[] offset : birdOffsets) {
            float bx = flockX + offset[0];
            float by = flockY + offset[1];
            if (bx < -20 || bx > w + 20) continue;

            // كل طائر = V صغيرة (جناحان)
            float wingSpan = 6f * birdScale;
            float wingDip  = 2.5f * birdScale;

            // الجناح الأيسر
            Path wing = new Path();
            wing.moveTo(bx - wingSpan, by - wingDip * (float)Math.sin(sec * 3.0 + offset[0] * 0.05));
            wing.quadTo(bx - wingSpan * 0.4f, by + wingDip * 0.3f, bx, by);
            // الجناح الأيمن
            wing.moveTo(bx + wingSpan, by - wingDip * (float)Math.sin(sec * 3.0 + offset[0] * 0.05));
            wing.quadTo(bx + wingSpan * 0.4f, by + wingDip * 0.3f, bx, by);

            c.drawPath(wing, birdPaint);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // الجودة التكيفية — Adaptive Quality
    // ═══════════════════════════════════════════════════════════════════════
    private static void checkAdaptiveQuality() {
        if (cQualityInit) return;
        cQualityInit = true;
        long maxMemMb = Runtime.getRuntime().maxMemory() / 1_048_576L;
        if      (maxMemMb < 128) cQuality = 0;
        else if (maxMemMb < 256) cQuality = 1;
        else                     cQuality = 2;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // جبال الخلفية — 3 طبقات متدرجة (بعيدة / متوسطة / قريبة)
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawMountainSilhouette(Canvas c, int w, int h, Paint p,
                                               double sunAlt, long now) {
        // تظهر دائماً خلف السكاي لاين — 3 طبقات
        float horizonY = h * 0.72f;

        // ألوان كل طبقة حسب وقت اليوم
        int[] farC, midC, nearC;
        if (sunAlt > 8) {
            // نهار — ألوان زرقاء هوائية
            farC  = new int[]{ 140, 165, 195 };
            midC  = new int[]{ 85,  115, 150 };
            nearC = new int[]{ 45,  70,  100 };
        } else if (sunAlt > 0) {
            // ذهبية — برتقالي/وردي
            farC  = new int[]{ 200, 160, 130 };
            midC  = new int[]{ 100, 80,  80  };
            nearC = new int[]{ 40,  35,  45  };
        } else if (sunAlt > -6) {
            // شفق — أرجواني داكن
            farC  = new int[]{ 80,  60,  90  };
            midC  = new int[]{ 40,  30,  55  };
            nearC = new int[]{ 18,  14,  28  };
        } else {
            // ليل — سيلويت أسود/رمادي داكن
            farC  = new int[]{ 20,  22,  32  };
            midC  = new int[]{ 12,  13,  22  };
            nearC = new int[]{ 5,   6,   12  };
        }

        Paint mp = new Paint(Paint.ANTI_ALIAS_FLAG);
        mp.setStyle(Paint.Style.FILL);

        int layerCount = (cQuality == 0) ? 2 : 3;
        for (int layer = 0; layer < layerCount; layer++) {
            int[] col;
            float yBase, heightFrac, amp, freq;
            long seed;
            if (layer == 0) {
                // طبقة بعيدة — قمم ناعمة وهادئة
                col = farC; yBase = horizonY - h * 0.09f;
                heightFrac = 0.14f; amp = h * 0.05f; freq = 2.8f; seed = 11223L;
            } else if (layer == 1) {
                // طبقة متوسطة — قمم أكثر وأعلى
                col = midC; yBase = horizonY - h * 0.05f;
                heightFrac = 0.10f; amp = h * 0.07f; freq = 3.8f; seed = 44556L;
            } else {
                // طبقة قريبة — سيلويت صلب داكن جداً
                col = nearC; yBase = horizonY + h * 0.005f;
                heightFrac = 0.07f; amp = h * 0.045f; freq = 5.2f; seed = 78899L;
            }

            // ارسم خط القمم (perlin-like via sin sum)
            Path mPath = new Path();
            mPath.moveTo(0, h);
            Random mRnd = new Random(seed);
            float phase1 = mRnd.nextFloat() * 6.28f;
            float phase2 = mRnd.nextFloat() * 6.28f;
            float phase3 = mRnd.nextFloat() * 6.28f;

            for (int x = 0; x <= w; x += 4) {
                float t = (float) x / w;
                float py = yBase
                    - amp * 0.55f * (float) Math.sin(t * Math.PI * freq + phase1)
                    - amp * 0.30f * (float) Math.sin(t * Math.PI * freq * 2.1 + phase2)
                    - amp * 0.15f * (float) Math.sin(t * Math.PI * freq * 4.3 + phase3);
                if (x == 0) mPath.moveTo(0, py);
                else        mPath.lineTo(x, py);
            }
            mPath.lineTo(w, h);
            mPath.lineTo(0, h);
            mPath.close();

            mp.setColor(Color.argb(220, col[0], col[1], col[2]));
            c.drawPath(mPath, mp);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // منارة بحرية Lighthouse — ضوء دوّار
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawLighthouse(Canvas c, int w, int h, Paint p,
                                       double sunAlt, long now) {
        // تظهر فقط في المدن الساحلية (بناءً على مزيج lat/lng كـ seed)
        if (cLighthouseCheck < 0) {
            Random lhRnd = new Random((long)(Math.abs(cLng) * 10000) ^ (long)(Math.abs(cLat) * 1000));
            cHasLighthouse = lhRnd.nextFloat() < 0.22f; // 22% من المناطق
            cLighthouseX   = w * (0.05f + lhRnd.nextFloat() * 0.12f);
            cLighthouseCheck = now;
        }
        if (!cHasLighthouse) return;

        float baseY = h * 0.72f;
        float lhH   = h * 0.09f;
        float lhW   = w * 0.016f;
        float lx    = cLighthouseX;

        Paint lhP = new Paint(Paint.ANTI_ALIAS_FLAG);
        lhP.setStyle(Paint.Style.FILL);

        // برج المنارة — جذع مستطيل متناقص
        lhP.setColor(Color.argb(220, 240, 235, 225));
        Path tower = new Path();
        tower.moveTo(lx - lhW, baseY);
        tower.lineTo(lx - lhW * 0.55f, baseY - lhH);
        tower.lineTo(lx + lhW * 0.55f, baseY - lhH);
        tower.lineTo(lx + lhW, baseY);
        tower.close();
        c.drawPath(tower, lhP);

        // خطوط أفقية حمراء على البرج
        lhP.setColor(Color.argb(200, 200, 50, 40));
        for (int i = 1; i <= 3; i++) {
            float stripY = baseY - lhH * i * 0.22f;
            c.drawRect(lx - lhW * 0.9f, stripY - 2, lx + lhW * 0.9f, stripY + 2, lhP);
        }

        // قبة زجاجية في القمة
        lhP.setColor(Color.argb(200, 60, 70, 90));
        RectF dome = new RectF(lx - lhW * 0.7f, baseY - lhH - lhW * 0.8f,
                               lx + lhW * 0.7f, baseY - lhH + lhW * 0.2f);
        c.drawOval(dome, lhP);

        // ضوء دوّار — يظهر فقط في الغسق والليل
        if (sunAlt < 2) {
            float lightBright = (float) Math.min(1.0, (-sunAlt - 0) / 6.0);
            float sec = now / 1000f;
            // الضوء يدور كل 4 ثوانٍ (like a real lighthouse)
            double beamAngle = (sec % 4.0) / 4.0 * Math.PI * 2.0;
            float beamLen = w * 0.45f;
            float beamEndX = lx + (float)(Math.cos(beamAngle) * beamLen);
            float beamEndY = (baseY - lhH) + (float)(Math.sin(beamAngle) * beamLen * 0.3f);
            float lhCy = baseY - lhH;

            // شعاع الضوء — مثلث شفاف
            float beamW = 0.06f;
            double a1 = beamAngle - beamW, a2 = beamAngle + beamW;
            int beamA = (int)(lightBright * 90);

            Path beam = new Path();
            beam.moveTo(lx, lhCy);
            beam.lineTo(lx + (float)(Math.cos(a1) * beamLen), lhCy + (float)(Math.sin(a1) * beamLen * 0.3f));
            beam.lineTo(lx + (float)(Math.cos(a2) * beamLen), lhCy + (float)(Math.sin(a2) * beamLen * 0.3f));
            beam.close();

            p.setShader(new RadialGradient(lx, lhCy, beamLen,
                new int[]{ Color.argb(beamA, 255, 250, 220), Color.argb(0, 255, 240, 180) },
                null, Shader.TileMode.CLAMP));
            c.drawPath(beam, p);
            p.setShader(null);

            // نقطة الضوء المركزية
            p.setShader(new RadialGradient(lx, lhCy, lhW * 1.5f,
                new int[]{ Color.argb((int)(lightBright * 255), 255, 255, 230),
                           Color.argb(0, 255, 240, 180) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(lx, lhCy, lhW * 1.5f, p);
            p.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HDR Bloom — توهج متدرج متعدد الطبقات حول مصادر الضوء
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawHDRBloom(Canvas c, int w, int h, Paint p,
                                     float sunX, float sunY, float moonX, float moonY,
                                     double sunAlt, double moonAlt, double moonPhase, long now) {
        if (cQuality == 0) return;

        // ══ Bloom حول الشمس ══
        if (sunAlt > -6 && sunAlt < 20) {
            // كلما اقتربت من الأفق كان الـ bloom أقوى وأكثر أحمراراً
            double t = Math.max(0, Math.min(1, (8 - sunAlt) / 14.0));
            int bA1 = (int)(t * 55);
            int bA2 = (int)(t * 25);
            int bA3 = (int)(t * 10);
            if (bA1 > 3) {
                int r1 = (int)(255);
                int g1 = (int)(140 + t * 60);
                int b1 = (int)(20 + t * 40);
                float r  = w * (float)(0.18 + t * 0.14);
                // 5 طبقات bloom متداخلة
                p.setShader(new RadialGradient(sunX, sunY, r * 0.3f,
                    new int[]{ Color.argb(bA1, r1, g1, b1), Color.argb(0, r1, g1, b1) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(sunX, sunY, r * 0.3f, p); p.setShader(null);
                p.setShader(new RadialGradient(sunX, sunY, r * 0.55f,
                    new int[]{ Color.argb(bA2, r1, g1, b1), Color.argb(0, r1, g1, b1) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(sunX, sunY, r * 0.55f, p); p.setShader(null);
                p.setShader(new RadialGradient(sunX, sunY, r,
                    new int[]{ Color.argb(bA3, r1, g1, b1), Color.argb(0, r1, g1, b1) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(sunX, sunY, r, p); p.setShader(null);
            }
        }

        // ══ Bloom حول القمر ══
        if (moonAlt > 5 && sunAlt < -4) {
            double moonIll = moonIllumination(moonPhase);
            if (moonIll > 0.15) {
                int mA = (int)(moonIll * 40);
                float mr = w * (float)(0.06 + moonIll * 0.06);
                // طبقتان كافيتان للقمر
                p.setShader(new RadialGradient(moonX, moonY, mr * 0.5f,
                    new int[]{ Color.argb(mA, 230, 235, 255), Color.argb(0, 210, 220, 255) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(moonX, moonY, mr * 0.5f, p); p.setShader(null);
                p.setShader(new RadialGradient(moonX, moonY, mr,
                    new int[]{ Color.argb(mA / 2, 215, 225, 255), Color.argb(0, 200, 215, 255) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(moonX, moonY, mr, p); p.setShader(null);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // انعكاس المدينة في الماء — Water Reflection
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawWaterReflection(Canvas c, int w, int h, Paint p,
                                            double sunAlt, long now) {
        // شريط ماء أسفل الويدجت — يظهر دائماً لكن أكثر وضوحاً ليلاً
        float waterTop = h * 0.88f;
        float waterBot = h;
        float waterH   = waterBot - waterTop;

        // لون الماء الأساسي
        int skyR, skyG, skyB;
        if (sunAlt > 8) { skyR = 40; skyG = 80; skyB = 140; }
        else if (sunAlt > 0) { skyR = 60; skyG = 50; skyB = 80; }
        else if (sunAlt > -5) { skyR = 20; skyG = 20; skyB = 40; }
        else { skyR = 8; skyG = 10; skyB = 25; }

        // الطبقة الأساسية للماء
        p.setShader(new LinearGradient(0, waterTop, 0, waterBot,
            new int[]{ Color.argb(180, skyR, skyG, skyB),
                       Color.argb(220, skyR / 2, skyG / 2, skyB / 2) },
            null, Shader.TileMode.CLAMP));
        p.setStyle(Paint.Style.FILL);
        c.drawRect(0, waterTop, w, waterBot, p);
        p.setShader(null);

        // انعكاس الشمس/القمر في الماء
        if (cSunAlt > -2 && cSunAlt < 15) {
            float sunReflX = azToX(cSunAz, w);
            float reflIntensity = (float)(1.0 - Math.max(0, cSunAlt - 2) / 13.0);
            int reflA = (int)(reflIntensity * 80);
            if (reflA > 5) {
                p.setShader(new RadialGradient(sunReflX, waterTop + waterH * 0.3f, w * 0.25f,
                    new int[]{ Color.argb(reflA, 255, 180, 60),
                               Color.argb(reflA / 2, 220, 140, 40),
                               Color.argb(0, 180, 100, 20) },
                    null, Shader.TileMode.CLAMP));
                c.drawRect(0, waterTop, w, waterBot, p);
                p.setShader(null);
            }
        }

        if (cMoonAlt > 0 && cSunAlt < -2) {
            float moonReflX = azToX(cMoonAz, w);
            double moonIll = moonIllumination(cMoonPhase);
            int mReflA = (int)(moonIll * 55);
            if (mReflA > 4) {
                p.setShader(new RadialGradient(moonReflX, waterTop + waterH * 0.3f, w * 0.15f,
                    new int[]{ Color.argb(mReflA, 230, 230, 210),
                               Color.argb(mReflA / 2, 200, 200, 185),
                               Color.argb(0, 160, 165, 150) },
                    null, Shader.TileMode.CLAMP));
                c.drawRect(0, waterTop, w, waterBot, p);
                p.setShader(null);
            }
        }

        // تموجات الماء — خطوط أفقية رفيعة
        float sec = now / 1000f;
        Paint wavePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        wavePaint.setStyle(Paint.Style.STROKE);
        wavePaint.setStrokeCap(Paint.Cap.ROUND);
        Random wRnd = new Random(44444L);

        for (int i = 0; i < 6; i++) {
            float waveY = waterTop + waterH * (0.1f + i * 0.14f);
            float waveAmp = w * 0.003f;
            float freq = (float)(Math.PI * 2 / w * (3 + wRnd.nextFloat() * 3));
            float phase = sec * 0.5f + i * 1.3f;
            int wAlpha = (int)(25 + wRnd.nextFloat() * 20);
            wavePaint.setStrokeWidth(0.8f);
            wavePaint.setColor(Color.argb(wAlpha, skyR + 40, skyG + 50, skyB + 60));

            Path wavePath = new Path();
            wavePath.moveTo(0, waveY);
            for (int xx = 0; xx <= w; xx += 5) {
                float wy = waveY + (float)(Math.sin(freq * xx + phase) * waveAmp);
                wavePath.lineTo(xx, wy);
            }
            c.drawPath(wavePath, wavePaint);
        }

        // انعكاس أضواء المدينة في الماء ليلاً — صوديوم/LED/هاليد
        if (sunAlt < -4) {
            Random rnd = new Random(77777L);
            float dark = (float) Math.min(1.0, (-sunAlt - 4) / 16.0);
            for (int i = 0; i < 12; i++) {
                float lx = rnd.nextFloat() * w;
                int cr, cg, cb;
                float roll = rnd.nextFloat();
                if (roll < 0.55f) { cr = 255; cg = 165; cb = 30; }        // صوديوم
                else if (roll < 0.85f) { cr = 220; cg = 240; cb = 255; } // LED
                else { cr = 200; cg = 220; cb = 255; }                    // هاليد
                int la = (int)(dark * (20 + rnd.nextFloat() * 30));
                float lightH2 = waterH * (0.25f + rnd.nextFloat() * 0.40f);
                p.setShader(new LinearGradient(lx, waterTop, lx, waterTop + lightH2,
                    new int[]{ Color.argb(la, cr, cg, cb), Color.argb(0, cr, cg, cb) },
                    null, Shader.TileMode.CLAMP));
                float lw = w * (0.003f + rnd.nextFloat() * 0.006f);
                c.drawRect(lx - lw, waterTop, lx + lw, waterTop + lightH2, p);
                p.setShader(null);
            }
        }

        // ══ قوارب صيد على الماء ══
        drawBoatsOnWater(c, w, h, p, waterTop, waterH, sunAlt, now);
    }

    /** قوارب صيد صغيرة بصور ظلية مع أضواء متذبذبة */
    private static void drawBoatsOnWater(Canvas c, int w, int h, Paint p,
                                         float waterTop, float waterH,
                                         double sunAlt, long now) {
        Random rnd = new Random((long)(cLng * 1000) + 55555L);
        int boatCount = rnd.nextInt(3) + 1; // 1-3 قوارب
        float sec = now / 1000f;

        Paint boatPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        boatPaint.setStyle(Paint.Style.FILL);

        for (int b = 0; b < boatCount; b++) {
            float bx = w * (0.12f + rnd.nextFloat() * 0.76f);
            float bobAmp = h * 0.003f;
            float by = waterTop + waterH * 0.35f + (float)(Math.sin(sec * 0.4 + b * 2.1) * bobAmp);

            float bw = w * (0.035f + rnd.nextFloat() * 0.025f);
            float bh2 = bw * 0.32f;

            // hull — لون داكن
            int hullA = (sunAlt < -2) ? 210 : 140;
            boatPaint.setColor(Color.argb(hullA, 20, 20, 25));
            Path hull = new Path();
            hull.moveTo(bx - bw, by);
            hull.cubicTo(bx - bw * 0.85f, by + bh2, bx + bw * 0.85f, by + bh2, bx + bw, by);
            hull.lineTo(bx - bw, by);
            c.drawPath(hull, boatPaint);

            // سارية بسيطة
            boatPaint.setStyle(Paint.Style.STROKE);
            boatPaint.setStrokeWidth(1.2f);
            boatPaint.setColor(Color.argb(hullA, 40, 40, 45));
            c.drawLine(bx - bw * 0.1f, by, bx - bw * 0.1f, by - bh2 * 2.5f, boatPaint);
            boatPaint.setStyle(Paint.Style.FILL);

            // ضوء القارب — يتذبذب بمعدل مختلف لكل قارب
            float flicker = 0.5f + 0.5f * (float) Math.sin(sec * (1.3 + b * 0.7));
            int lightA = (int)(flicker * 160);
            if (sunAlt < 0) {
                // ضوء أبيض في المقدمة
                p.setShader(new RadialGradient(bx + bw * 0.7f, by - bh2 * 0.5f,
                    bw * 0.4f,
                    new int[]{ Color.argb(lightA, 255, 255, 230),
                               Color.argb(0, 255, 255, 200) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(bx + bw * 0.7f, by - bh2 * 0.5f, bw * 0.4f, p);
                p.setShader(null);

                // ضوء أحمر في المؤخرة
                int redA = (int)(flicker * 120);
                p.setColor(Color.argb(redA, 220, 50, 30));
                c.drawCircle(bx - bw * 0.75f, by - bh2 * 0.3f, 2.0f, p);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // الأذان المرئي — تأثير بصري جذّاب عند أوقات الصلاة
    // يظهر 15 دقيقة بعد كل أذان ثم يتلاشى بهدوء
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawAdhan(Canvas c, int w, int h, Paint p, long now) {
        // ══ فحص: هل نحن في نافذة الأذان؟ ══
        long[] times = { cFajrMs, cDhuhrMs, cAsrMs, cMaghribMs, cIshaMs };
        long elapsedMs = Long.MAX_VALUE;
        for (long pt : times) {
            if (pt <= 0) continue;
            long diff = now - pt;
            if (diff >= 0 && diff < 15L * 60_000L) {
                elapsedMs = diff;
                break;
            }
        }
        if (elapsedMs == Long.MAX_VALUE) return;

        // ══ شدة التأثير ══
        // 0-2 دقيقة: بناء تدريجي | 2-11 دقيقة: ذروة | 11-15 دقيقة: تلاشٍ هادئ
        float progress = elapsedMs / (15f * 60_000f);
        float intensity;
        if (progress < 0.133f) {
            intensity = progress / 0.133f;                            // build-up
        } else if (progress < 0.733f) {
            intensity = 1.0f;                                         // peak
        } else {
            intensity = 1f - (progress - 0.733f) / 0.267f;           // fade
        }
        if (intensity < 0.02f) return;

        float baseY = h;
        float sec   = now / 1000f;

        // ══ مواضع المآذن (type 9) في السكاي لاين ══
        // minaret 1: index 17 → x=0.76*w, w=0.014*w, h=0.162*h → top at baseY - 0.162*h
        // minaret 2: index 21 → x=0.93*w, w=0.012*w, h=0.145*h → top at baseY - 0.145*h
        float[][] minarets = {
            { 0.76f * w + 0.007f * w, baseY - 0.162f * h },
            { 0.93f * w + 0.006f * w, baseY - 0.145f * h },
        };

        for (float[] mt : minarets) {
            float mx = mt[0], my = mt[1];

            // ══════════════════════════════════════════════
            // 1. هالة ذهبية ثابتة حول قمة المئذنة
            // ══════════════════════════════════════════════
            float glowPulse = 0.75f + 0.25f * (float) Math.sin(sec * 2.2);
            int glowA = (int)(intensity * glowPulse * 90);
            p.setShader(new RadialGradient(mx, my, w * 0.07f,
                new int[]{ Color.argb(glowA,     255, 215, 80),
                           Color.argb(glowA / 2, 220, 160, 40),
                           Color.argb(0,         180, 120, 20) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(mx, my, w * 0.07f, p);
            p.setShader(null);

            // ══════════════════════════════════════════════
            // 2. حلقات sonar ذهبية تتمدد من رأس المئذنة
            // ══════════════════════════════════════════════
            Paint ringPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            ringPaint.setStyle(Paint.Style.STROKE);

            int ringCount = (cQuality == 0) ? 3 : 5;
            float ringSpeed = 0.20f; // دورة كاملة كل 5 ثوانٍ
            for (int ring = 0; ring < ringCount; ring++) {
                // كل حلقة تبدأ بتأخير مختلف
                float ringPhase = ((sec * ringSpeed + ring * (1f / ringCount)) % 1.0f);
                float ringR = w * (0.025f + ringPhase * 0.40f);

                // الحلقة تبدأ لامعة وتتلاشى وهي تتوسع
                float lifeFade = 1f - ringPhase;
                float ringAlpha = lifeFade * lifeFade * intensity * 200;
                if (ringAlpha < 4) continue;

                float strokeW = (3.5f - ringPhase * 2.5f) * intensity;
                ringPaint.setStrokeWidth(Math.max(0.5f, strokeW));

                // لون يتدرج من أبيض ذهبي → ذهبي عميق
                int rr = 255, rg = (int)(215 - ringPhase * 80), rb = (int)(60 - ringPhase * 40);
                ringPaint.setColor(Color.argb((int) ringAlpha, rr, rg, Math.max(0, rb)));

                // رسم القوس العلوي فقط (180° + هامش) لتجنب الرسم داخل الأرض
                RectF oval = new RectF(mx - ringR, my - ringR, mx + ringR, my + ringR);
                c.drawArc(oval, 180f, 180f, false, ringPaint); // نصف دائرة علوي
            }

            // ══════════════════════════════════════════════
            // 3. موجات صوتية جيبية تمتد يساراً ويميناً
            // ══════════════════════════════════════════════
            Paint wavePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            wavePaint.setStyle(Paint.Style.STROKE);
            wavePaint.setStrokeCap(Paint.Cap.ROUND);

            int waveCount = (cQuality == 0) ? 2 : 3;
            float waveSpeed = 0.28f;
            for (int wave = 0; wave < waveCount; wave++) {
                float wPhase = ((sec * waveSpeed + wave * (1f / waveCount)) % 1.0f);
                float wLen   = w * (0.06f + wPhase * 0.32f);
                float wFade  = (1f - wPhase) * (1f - wPhase); // تلاشٍ تربيعي
                float wAlpha = wFade * intensity * 160;
                if (wAlpha < 5) continue;

                // سُمك يتناقص مع المسافة
                wavePaint.setStrokeWidth(Math.max(0.8f, (2.0f - wPhase * 1.5f)));
                int wa = (int) wAlpha;
                wavePaint.setColor(Color.argb(wa, 255, 205, 70));

                // سعة الموجة تتناقص مع الانتشار
                float amp  = h * 0.014f * (1f - wPhase * 0.6f);
                float freq = (float)(Math.PI * 3.0);

                // موجة يسار
                Path leftPath = new Path();
                boolean leftMoved = false;
                for (int xi = 0; xi <= (int) wLen; xi += 3) {
                    float wx = mx - xi;
                    float wy = my + (float)(Math.sin(freq * xi / wLen + sec * 4.5) * amp);
                    if (!leftMoved) { leftPath.moveTo(wx, wy); leftMoved = true; }
                    else             leftPath.lineTo(wx, wy);
                }
                c.drawPath(leftPath, wavePaint);

                // موجة يمين
                Path rightPath = new Path();
                boolean rightMoved = false;
                for (int xi = 0; xi <= (int) wLen; xi += 3) {
                    float wx = mx + xi;
                    float wy = my + (float)(Math.sin(freq * xi / wLen + sec * 4.5) * amp);
                    if (!rightMoved) { rightPath.moveTo(wx, wy); rightMoved = true; }
                    else              rightPath.lineTo(wx, wy);
                }
                c.drawPath(rightPath, wavePaint);
            }

            // ══════════════════════════════════════════════
            // 4. جسيمات ضوء ذهبية تتصاعد من المئذنة
            // ══════════════════════════════════════════════
            if (cQuality > 0) {
                // seed يتغير كل 0.5 ثانية لإعطاء جسيمات جديدة
                long partSeed = (long)(sec * 2) * 997L + (long)(mx);
                Random pRnd   = new Random(partSeed);
                Paint partP   = new Paint(Paint.ANTI_ALIAS_FLAG);
                partP.setStyle(Paint.Style.FILL);

                int partCount = (cQuality == 2) ? 8 : 5;
                for (int pt = 0; pt < partCount; pt++) {
                    // كل جسيم يعيش 1.5–2.5 ثانية
                    float lifeLen  = 1.5f + pRnd.nextFloat();
                    float partSec  = (sec % lifeLen) / lifeLen;
                    float spreadX  = (pRnd.nextFloat() - 0.5f) * w * 0.12f;

                    float pX = mx + spreadX * partSec;
                    float pY = my - partSec * h * 0.22f;

                    float pFade = (1f - partSec) * (partSec < 0.2f ? partSec / 0.2f : 1f);
                    int pA = (int)(pFade * intensity * 200);
                    float pR = 3.5f * (1f - partSec * 0.6f);
                    if (pA < 8 || pR < 0.5f) continue;

                    // توهج صغير حول الجسيم
                    partP.setShader(new RadialGradient(pX, pY, pR * 2.2f,
                        new int[]{ Color.argb(pA,     255, 240, 140),
                                   Color.argb(pA / 2, 255, 200,  60),
                                   Color.argb(0,      210, 150,  20) },
                        null, Shader.TileMode.CLAMP));
                    c.drawCircle(pX, pY, pR * 2.2f, partP);
                    partP.setShader(null);

                    // نقطة مركزية بيضاء ساطعة
                    partP.setColor(Color.argb(Math.min(255, pA + 40), 255, 255, 220));
                    c.drawCircle(pX, pY, pR * 0.5f, partP);
                }
            }

            // ══════════════════════════════════════════════
            // 5. خط متوهج رفيع يصعد من قمة المئذنة
            //    (كخيط نور يمتد إلى السماء)
            // ══════════════════════════════════════════════
            float beamHeight = h * 0.18f * intensity;
            float beamPulse  = 0.6f + 0.4f * (float) Math.sin(sec * 3.1);
            int   beamAlpha  = (int)(intensity * beamPulse * 120);
            if (beamAlpha > 5) {
                p.setShader(new LinearGradient(mx, my, mx, my - beamHeight,
                    new int[]{ Color.argb(beamAlpha,     255, 215, 80),
                               Color.argb(beamAlpha / 2, 255, 235, 140),
                               Color.argb(0,             230, 200,  80) },
                    null, Shader.TileMode.CLAMP));
                Paint beamP = new Paint(Paint.ANTI_ALIAS_FLAG);
                beamP.setStyle(Paint.Style.STROKE);
                beamP.setStrokeWidth(1.8f * intensity);
                beamP.setShader(new LinearGradient(mx, my, mx, my - beamHeight,
                    new int[]{ Color.argb(beamAlpha,     255, 215, 80),
                               Color.argb(beamAlpha / 2, 255, 235, 140),
                               Color.argb(0,             230, 200,  80) },
                    null, Shader.TileMode.CLAMP));
                c.drawLine(mx, my, mx, my - beamHeight, beamP);
                p.setShader(null);
            }
        }
    }
}
