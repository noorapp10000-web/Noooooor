package com.noor.app.widget;

import android.graphics.Bitmap;
import android.graphics.BitmapShader;
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
import android.graphics.SweepGradient;

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
            // نطابق حد اليوم الهجري مع المنطقة الزمنية المحلية للجهاز — نفس أساس
            // android.icu.util.IslamicCalendar المستخدم في PrayerWidgetService.getHijriDate()،
            // لأن jd الخام مبني على UTC وكان يسبب اختلاف يوم كامل أحياناً بين نص
            // التاريخ الهجري الظاهر وتأثيرات الشهر (مثل تمييز رمضان) في هذا الرسم.
            long tzOffsetMs = java.util.TimeZone.getDefault().getOffset(now);
            double localJd  = jd + tzOffsetMs / 86400000.0;
            cHijriMonth = hijriMonth(localJd);
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

        // 39.5. حبيبات فيلم ناعمة — تكسر أي "خطوط" بين ألوان التدرجات (anti-banding)
        drawFilmGrain(c, w, h);

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
        // تدرّج ناعم متعدد المراحل بدل مرحلتين فقط — يقلل التبنيد (banding) قرب الأفق
        p.setShader(new LinearGradient(0, h * 0.55f, 0, h,
            new int[]{ Color.argb(0, 180, 200, 220),
                       Color.argb(alpha / 6, 182, 200, 218),
                       Color.argb(alpha / 2, 184, 199, 216),
                       Color.argb(alpha, 186, 198, 214) },
            new float[]{ 0f, 0.35f, 0.68f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.55f, w, h, p);
        p.setShader(null);
        int sunAlpha = (int)(alpha * 0.75f);
        if (sunAlpha > 4) {
            p.setShader(new RadialGradient(sunX, h, w * 0.72f,
                new int[]{ Color.argb(sunAlpha, 225, 210, 185),
                           Color.argb((int)(sunAlpha * 0.55f), 210, 200, 182),
                           Color.argb(sunAlpha / 4, 195, 188, 172),
                           Color.argb(0, 180, 176, 165) },
                new float[]{ 0f, 0.4f, 0.72f, 1f }, Shader.TileMode.CLAMP));
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
            // النجوم الألمع (magnitude منخفض) تتلألأ أبطأ وبسعة أقل
            float twinkleAmp = isPolaris ? 0.05f :
                (float) Math.min(0.38, 0.08 + 0.30 * Math.max(0, (20 - alt) / 20));
            if (mag < 0.5 && !isPolaris) twinkleAmp *= 0.45f;
            else if (mag < 1.5 && !isPolaris) twinkleAmp *= 0.70f;
            double twinklePeriod = isPolaris ? period :
                (mag < 0 ? period * 2.5 : (mag < 1.5 ? period * 1.6 : period));
            float twinkle = (1f - twinkleAmp) + twinkleAmp *
                (float) Math.sin((now % (long)twinklePeriod) / twinklePeriod * 2 * Math.PI);
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
            int bandColor = (int) band[2];
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
        // وهم القمر عند الأفق: يبدو أكبر كلما اقترب من الأفق
        float illFactor = (float)(1.0 + Math.max(0, (12.0 - moonAlt) / 12.0) * 0.30);
        float r  = h * 0.078f * illFactor;
        // القمر يجب أن يبقى مرئياً فوق السيلويت دائماً
        float maxY = h * 0.58f - r;
        float yy = Math.max(r + 4, Math.min(y, maxY));
        double ill = moonIllumination(phase);

        // ══ تلوين القمر حسب ارتفاعه ══
        // الأفق: يبدأ أصفر خفيف فقط تحت 5°، يتعمق قليلاً تحت 2°
        float horizonT = (float) Math.max(0, Math.min(0.65, (5.0 - moonAlt) / 7.0));
        // دم القمر: فقط عند قمر شبه كامل (>82%) قريب جداً من الأفق (<1.5°)
        boolean bloodMoon = (moonAlt < 1.5 && ill > 0.82);
        int moonBase1, moonBase2, moonBase3;
        if (bloodMoon) {
            moonBase1 = 0xFFFF5020; moonBase2 = 0xFFCC3010; moonBase3 = 0xFF991808;
        } else if (horizonT > 0.04f) {
            // أصفر/عنبر فاتح — ليس برتقالي قوي
            moonBase1 = lerpColor(0xFFF8F0D8, 0xFFFFD880, horizonT);
            moonBase2 = lerpColor(0xFFE8D8A8, 0xFFEEBB55, horizonT);
            moonBase3 = lerpColor(0xFFCCB87A, 0xFFCC9030, horizonT);
        } else {
            // القمر الطبيعي — أبيض-عاجي ناصع
            moonBase1 = 0xFFF8F4EC; moonBase2 = 0xFFEEE4C8; moonBase3 = 0xFFD8C898;
        }

        // ══ هالة القمر 22° ملونة — محسّنة بـ gradient حلقي واقعي ══
        if (ill > 0.12 && sunAlt < 0) {
            float halo22 = r * 5.8f;
            if (!bloodMoon) {
                // Aureole — وهج شديد مباشرة حول القرص
                p.setShader(new RadialGradient(x, yy, r * 2.8f,
                    new int[]{ Color.argb((int)(70 * ill), 240, 240, 225),
                               Color.argb((int)(30 * ill), 220, 225, 240),
                               Color.argb(0, 200, 210, 230) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(x, yy, r * 2.8f, p);
                p.setShader(null);

                // حلقة 22° — gradient عرضها متدرج: أحمر → أبيض → أزرق
                float hW = halo22 * 0.14f; // عرض الهالة
                Paint haloPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                haloPaint.setStyle(Paint.Style.STROKE);
                // محطات متعددة بعرض متزايد
                float[] widths = { hW * 0.35f, hW * 0.60f, hW * 0.80f, hW * 0.55f, hW * 0.30f };
                int[]   radMultI = new int[]{ 88, 92, 97, 102, 107 }; // % من halo22
                int[][] haloRGBA = {
                    { (int)(16*ill), 255, 80,  40  }, // أحمر داخلي
                    { (int)(26*ill), 255, 160, 100 }, // برتقالي-أبيض
                    { (int)(38*ill), 245, 242, 230 }, // أبيض-رئيسي
                    { (int)(22*ill), 180, 205, 255 }, // أزرق فاتح
                    { (int)(12*ill), 120, 160, 255 }, // أزرق خارجي
                };
                for (int hi = 0; hi < widths.length; hi++) {
                    float hr = halo22 * radMultI[hi] / 100f;
                    haloPaint.setStrokeWidth(widths[hi]);
                    haloPaint.setColor(Color.argb(haloRGBA[hi][0],
                        haloRGBA[hi][1], haloRGBA[hi][2], haloRGBA[hi][3]));
                    c.drawCircle(x, yy, hr, haloPaint);
                }
                // وهج ناعم حول مركز الهالة
                int aurA = (int)(42 * ill);
                p.setShader(new RadialGradient(x, yy, halo22 * 1.25f,
                    new int[]{ Color.argb(0, 235, 238, 210),
                               Color.argb(aurA, 235, 238, 210),
                               Color.argb(aurA * 2/3, 220, 228, 245),
                               Color.argb(0, 200, 215, 240) },
                    new float[]{ 0f, 0.78f, 0.88f, 1f }, Shader.TileMode.CLAMP));
                c.drawCircle(x, yy, halo22 * 1.25f, p);
                p.setShader(null);
            } else {
                // Blood Moon — هالة حمراء داكنة
                Paint haloPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                haloPaint.setStyle(Paint.Style.STROKE);
                haloPaint.setStrokeWidth(halo22 * 0.08f);
                haloPaint.setColor(Color.argb((int)(28 * ill), 220, 60, 20));
                c.drawCircle(x, yy, halo22, haloPaint);
                int aurA = (int)(65 * ill);
                p.setShader(new RadialGradient(x, yy, r * 5.0f,
                    new int[]{ Color.argb(aurA, 255, 80, 20),
                               Color.argb(aurA / 3, 200, 40, 10),
                               Color.argb(0, 150, 20, 5) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(x, yy, r * 5.0f, p);
                p.setShader(null);
            }
        }

        // ══ كورونا القمر الكاملة — حلقات لونية ضيقة ══
        if (ill > 0.88 && sunAlt < -2) {
            Paint coroPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            coroPaint.setStyle(Paint.Style.STROKE);
            coroPaint.setStrokeWidth(1.2f);
            coroPaint.setColor(Color.argb((int)(ill * 38), 100, 200, 110));
            c.drawCircle(x, yy, r * 1.45f, coroPaint);
            coroPaint.setStrokeWidth(1.0f);
            coroPaint.setColor(Color.argb((int)(ill * 28), 220, 180, 80));
            c.drawCircle(x, yy, r * 1.75f, coroPaint);
            coroPaint.setStrokeWidth(0.8f);
            coroPaint.setColor(Color.argb((int)(ill * 20), 200, 80, 70));
            c.drawCircle(x, yy, r * 2.05f, coroPaint);
        }

        // ══ هلال رمضان — تأثير ذهبي في أول يومين ══
        boolean isRamadanCrescent = (cHijriMonth == 9 && phase < 0.07 && ill < 0.15);
        if (isRamadanCrescent) {
            p.setShader(new RadialGradient(x, yy, r * 7.0f,
                new int[]{ Color.argb(110, 255, 215, 50),
                           Color.argb(55, 220, 175, 30),
                           Color.argb(18, 180, 130, 20),
                           Color.argb(0, 150, 100, 10) },
                new float[]{ 0f, 0.35f, 0.70f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(x, yy, r * 7.0f, p);
            p.setShader(null);
        }

        // ══ الجانب المظلم من القمر (قرص مظلم واقعي) ══
        p.setShader(new RadialGradient(x, yy, r,
            new int[]{ Color.argb(255, 12, 16, 30), Color.argb(255, 6, 10, 22) },
            null, Shader.TileMode.CLAMP));
        p.setStyle(Paint.Style.FILL);
        c.drawCircle(x, yy, r, p);
        p.setShader(null);

        // ══ Earthshine — ضوء الأرض على الجانب المظلم (محسّن: أزرق-رمادي واقعي) ══
        if (ill < 0.45 && sunAlt < 0) {
            float esT = (float)((1 - ill / 0.45) * (1 - ill / 0.45));
            int esAlpha = (int)(72 * esT);
            if (esAlpha > 5) {
                // وهج خارجي ناعم (الهالة المضيئة حول الجانب المظلم)
                p.setShader(new RadialGradient(x, yy, r * 1.35f,
                    new int[]{ Color.argb(esAlpha / 3, 70, 110, 200),
                               Color.argb(esAlpha / 6, 50, 85, 168),
                               Color.argb(0, 30, 60, 130) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(x, yy, r * 1.35f, p);
                p.setShader(null);
                // إضاءة الجانب المظلم نفسه — رمادي-بني دافئ (ضوء أرضي منعكس)
                p.setShader(new RadialGradient(x - r * 0.18f, yy + r * 0.08f, r,
                    new int[]{ Color.argb(esAlpha, 75, 108, 185),
                               Color.argb((int)(esAlpha * 0.65f), 55, 88, 158),
                               Color.argb((int)(esAlpha * 0.25f), 40, 68, 128),
                               Color.argb(0, 25, 48, 98) },
                    new float[]{ 0f, 0.35f, 0.70f, 1f }, Shader.TileMode.CLAMP));
                c.drawCircle(x, yy, r, p);
                p.setShader(null);
            }
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

            RectF termOval = new RectF(x - absT, yy - r, x + absT, yy + r);
            if (!waning) {
                // نصف الدائرة المضيء (يمين) — دائماً ثابت
                mp.addArc(oval, -90, 180);
                // قوس المُنهي (Terminator):
                // term >= 0 → هلال (الكشكول يمين) → نمر عبر اليمين (sweep -180)
                // term < 0  → محدبة (الكشكول يسار) → نمر عبر اليسار (sweep +180)
                mp.arcTo(termOval, 90, term >= 0 ? -180 : 180);
            } else {
                // نصف الدائرة المضيء (يسار) — دائماً ثابت
                mp.addArc(oval, 90, 180);
                // قوس المُنهي — نفس المنطق
                mp.arcTo(termOval, -90, term >= 0 ? 180 : -180);
            }
            mp.close();

            // سطح مضيء مع gradient خماسي المحطات (Limb Darkening واقعي)
            // المركز: لون دافئ نقي / الحافة: داكن جداً (حدة الإضاءة الفيزيائية)
            int moonEdge = bloodMoon
                ? Color.argb(255, 60, 8, 4)
                : lerpColor(moonBase3, Color.argb(255, 80, 68, 48), 0.45f);
            p.setShader(new RadialGradient(x + term * 0.18f, yy - r * 0.08f, r * 1.18f,
                new int[]{ moonBase1,
                           lerpColor(moonBase1, moonBase2, 0.30f),
                           moonBase2,
                           lerpColor(moonBase2, moonBase3, 0.55f),
                           moonBase3,
                           moonEdge },
                new float[]{ 0f, 0.25f, 0.52f, 0.72f, 0.88f, 1f }, Shader.TileMode.CLAMP));
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

    /** فوهات قمرية واقعية مع تظليل + أنظمة أشعة للفوهات الكبرى */
    private static void drawMoonCraters(Canvas c, float mx, float my, float r,
                                        double phase, double ill, double sunAngle) {
        // { normX, normY, normR, hasRays(1=yes) }
        float[][] craters = {
            { 0.25f, -0.10f, 0.068f, 1 }, // Tycho — أبرز فوهة بأشعة
            {-0.15f,  0.30f, 0.058f, 1 }, // Copernicus — فوهة بأشعة
            { 0.40f, -0.35f, 0.050f, 0 }, // Clavius
            {-0.30f, -0.20f, 0.040f, 0 }, // Plato
            { 0.10f,  0.45f, 0.038f, 0 }, // Grimaldi
            { 0.05f, -0.38f, 0.032f, 1 }, // Aristarchus — مشع
            {-0.50f,  0.10f, 0.028f, 0 }, // Kepler
            { 0.35f,  0.28f, 0.025f, 0 }, // Langrenus
            {-0.10f, -0.55f, 0.022f, 0 }, // Tycho-south
            { 0.18f, -0.52f, 0.020f, 0 }, // Moretus
            {-0.45f, -0.38f, 0.022f, 0 }, // Schickard
            { 0.55f, -0.15f, 0.018f, 0 }, // Petavius
            // ══ فوهات إضافية دقيقة — لكثافة سطحية واقعية أعلى ══
            { 0.62f,  0.20f, 0.016f, 0 }, // Furnerius
            {-0.62f, -0.05f, 0.019f, 0 }, // Grimaldi-west
            { 0.02f,  0.08f, 0.014f, 0 }, // Sinus Medii micro
            {-0.22f,  0.55f, 0.017f, 0 }, // Byrgius
            { 0.48f,  0.05f, 0.013f, 0 }, // Taruntius
            {-0.05f, -0.20f, 0.011f, 0 }, // Manilius
            { 0.28f, -0.48f, 0.015f, 1 }, // Bailly-ish rayed
            {-0.38f,  0.42f, 0.013f, 0 }, // Wichmann
            { 0.15f,  0.20f, 0.012f, 0 }, // Sabine
            {-0.55f, -0.25f, 0.010f, 0 }, // Cavalerius
            { 0.58f, -0.32f, 0.012f, 0 }, // Furnerius-B
            {-0.02f,  0.62f, 0.014f, 0 }, // Vitello
            { 0.42f,  0.42f, 0.011f, 0 }, // Colombo
            {-0.28f, -0.05f, 0.013f, 0 }, // Reinhold
            { 0.08f, -0.60f, 0.010f, 0 }, // Casatus
        };
        Paint cp = new Paint(Paint.ANTI_ALIAS_FLAG);
        cp.setStyle(Paint.Style.FILL);
        int alpha = (int)(58 * ill);
        if (alpha < 4) return;

        float shadowDX = -(float)Math.cos(sunAngle) * 0.32f;
        float shadowDY = -(float)Math.sin(sunAngle) * 0.32f;

        // أنظمة الأشعة (Rays) — تظهر عند القمر الكامل
        if (ill > 0.70) {
            Paint rayPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            rayPaint.setStyle(Paint.Style.STROKE);
            int rayAlpha = (int)(alpha * (ill - 0.70) / 0.30 * 0.55);
            for (float[] cr : craters) {
                if (cr[3] < 1 || rayAlpha < 3) continue;
                float crx = mx + cr[0] * r;
                float cry = my + cr[1] * r;
                float crR = cr[2] * r;
                // 8 أشعة مشعة من مركز الفوهة
                int numRays = 8;
                for (int ri = 0; ri < numRays; ri++) {
                    double ang = ri * Math.PI * 2.0 / numRays + (cr[0] * 1.3);
                    float rayLen = r * (0.25f + (float)(cr[2]) * 2.0f);
                    float innerR = crR * 1.1f;
                    float endX = crx + (float)(Math.cos(ang) * rayLen);
                    float endY = cry + (float)(Math.sin(ang) * rayLen);
                    rayPaint.setStrokeWidth(crR * (0.12f + 0.08f * (ri % 2)));
                    rayPaint.setShader(new LinearGradient(
                        crx + (float)(Math.cos(ang) * innerR),
                        cry + (float)(Math.sin(ang) * innerR),
                        endX, endY,
                        Color.argb(rayAlpha, 230, 225, 210),
                        Color.argb(0, 210, 205, 190), Shader.TileMode.CLAMP));
                    c.drawLine(crx + (float)(Math.cos(ang) * innerR),
                               cry + (float)(Math.sin(ang) * innerR),
                               endX, endY, rayPaint);
                }
            }
            rayPaint.setShader(null);
        }

        for (float[] cr : craters) {
            float crx = mx + cr[0] * r;
            float cry = my + cr[1] * r;
            float cr2 = cr[2] * r;
            // حافة مضيئة (rim highlight)
            cp.setShader(new RadialGradient(
                crx - shadowDX * cr2 * 0.8f,
                cry - shadowDY * cr2 * 0.8f,
                cr2 * 1.05f,
                new int[]{ Color.argb(alpha * 2/3, 235, 228, 210),
                           Color.argb(alpha / 3,   200, 192, 178),
                           Color.argb(0, 180, 172, 160) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(crx, cry, cr2 * 1.05f, cp);
            // ظل داخلي الفوهة
            cp.setShader(new RadialGradient(
                crx + shadowDX * cr2 * 0.5f,
                cry + shadowDY * cr2 * 0.5f,
                cr2,
                new int[]{ Color.argb(alpha, 55, 44, 32),
                           Color.argb(alpha * 2 / 3, 80, 66, 50),
                           Color.argb(0, 110, 95, 75) },
                new float[]{ 0f, 0.55f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(crx, cry, cr2, cp);
            // مركز الفوهة (قاع)
            cp.setShader(null);
            cp.setColor(Color.argb(alpha * 3 / 5, 90, 78, 60));
            c.drawCircle(crx, cry, cr2 * 0.42f, cp);
            // نقطة مركزية مضيئة (central peak) للفوهات الكبيرة
            if (cr2 > r * 0.04f) {
                cp.setColor(Color.argb(alpha / 2, 215, 208, 192));
                c.drawCircle(crx, cry, cr2 * 0.10f, cp);
            }
        }
        cp.setShader(null);
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
    // أشعة الإله / Crepuscular Rays — محسّنة بـ 16 شعاع متباين
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawCrepuscularRays(Canvas c, int w, int h, Paint p,
                                            double sunAlt, float sunX, float sunY) {
        if (sunAlt < -10 || sunAlt > 25) return;
        double intensity = 0;
        if (sunAlt < -2)      intensity = Math.max(0, 1.0 - Math.abs(sunAlt + 2) / 8.0);
        else if (sunAlt < 10) intensity = 1.0 - sunAlt / 10.0;
        else                  intensity = (25 - sunAlt) / 15.0;
        intensity = Math.max(0, Math.min(1, intensity));
        if (intensity < 0.04) return;

        Random rnd = new Random(12345L);
        int numRays = 16;
        // نطاق زاوي أوسع — يغطي نصف السماء
        double spreadAngle = Math.PI * 0.70;

        for (int i = 0; i < numRays; i++) {
            double tRay = (double)i / (numRays - 1);
            double angle = -Math.PI / 2 + (tRay - 0.5) * spreadAngle
                         + (rnd.nextDouble() - 0.5) * 0.18;
            float len = w * (1.2f + rnd.nextFloat() * 0.8f);
            float ex = sunX + (float)(Math.cos(angle) * len);
            float ey = sunY + (float)(Math.sin(angle) * len);

            // أشعة قصيرة عريضة + أشعة طويلة رفيعة
            boolean wideRay = (i % 3 == 0);
            float rayW = wideRay ? (2.5f + rnd.nextFloat() * 3.5f)
                                 : (0.6f + rnd.nextFloat() * 1.8f);
            int baseAlpha = wideRay ? (int)((18 + rnd.nextFloat() * 22) * intensity)
                                    : (int)((10 + rnd.nextFloat() * 18) * intensity);
            if (baseAlpha < 4) { rnd.nextFloat(); continue; }

            // لون الشعاع — أكثر ذهبية قرب الأفق
            int rr = 255, rg = (sunAlt < 5) ? 225 : 248, rb = (sunAlt < 5) ? 150 : 205;
            Paint rayPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            rayPaint.setStyle(Paint.Style.STROKE);
            rayPaint.setStrokeWidth(rayW);
            rayPaint.setStrokeCap(Paint.Cap.ROUND);
            rayPaint.setShader(new LinearGradient(sunX, sunY, ex, ey,
                Color.argb(baseAlpha, rr, rg, rb),
                Color.argb(0, rr, rg, rb), Shader.TileMode.CLAMP));
            c.drawLine(sunX, sunY, ex, ey, rayPaint);
        }

        // طبقة إضافية — توهج منتشر حول مصدر الأشعة
        float glowR = w * 0.28f;
        int glowA = (int)(intensity * 38);
        if (glowA > 5) {
            p.setShader(new RadialGradient(sunX, sunY, glowR,
                new int[]{ Color.argb(glowA, 255, 235, 180),
                           Color.argb(glowA / 3, 255, 220, 140),
                           Color.argb(0, 255, 200, 100) },
                new float[]{ 0f, 0.4f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(sunX, sunY, glowR, p);
            p.setShader(null);
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

        // Corona — 12 أشعة غير منتظمة بأطوال وعروض متغيرة (واقعية)
        Paint coronaRay = new Paint(Paint.ANTI_ALIAS_FLAG);
        coronaRay.setStyle(Paint.Style.STROKE);
        coronaRay.setStrokeCap(Paint.Cap.ROUND);
        long coronaSeed = now / 600_000L;
        Random coronaRnd = new Random(coronaSeed);
        int numCoronaRays = 12;
        for (int ray = 0; ray < numCoronaRays; ray++) {
            double baseAng = ray * Math.PI * 2.0 / numCoronaRays;
            double ang = baseAng + (coronaRnd.nextDouble() - 0.5) * 0.22;
            float rx2 = (float)(Math.cos(ang)), ry2 = (float)(Math.sin(ang));
            boolean longRay = (ray % 3 == 0);
            float outer = r * (longRay ? (3.8f + coronaRnd.nextFloat() * 1.2f)
                                       : (2.0f + coronaRnd.nextFloat() * 1.0f));
            float inner = r * (1.18f + coronaRnd.nextFloat() * 0.12f);
            float width  = r * (longRay ? (0.28f + coronaRnd.nextFloat() * 0.18f)
                                        : (0.12f + coronaRnd.nextFloat() * 0.10f));
            int baseAlpha = lowSun ? 58 : 40;
            int rayA = (int)(baseAlpha * (0.65f + coronaRnd.nextFloat() * 0.35f));
            coronaRay.setStrokeWidth(width);
            coronaRay.setShader(new LinearGradient(
                x + rx2 * inner, yy + ry2 * inner,
                x + rx2 * outer, yy + ry2 * outer,
                Color.argb(rayA, 255, 245, 200),
                Color.argb(0, 255, 210, 120), Shader.TileMode.CLAMP));
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

        // نسيج الحبيبات الشمسية Granulation — خلايا حمل حراري صغيرة على السطح
        if (r > 6) drawSunGranulation(c, x, yy, r, ry, now);

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

        // Chromosphere — حلقة حمراء رفيعة مرئية حول قرص الشمس (الشروق/الغروب)
        if (sunAlt < 8 && sunAlt > -2) {
            float chromoT = (float)(1.0 - Math.abs(sunAlt) / 8.0);
            int chromoA = (int)(80 * chromoT);
            if (chromoA > 6) {
                Paint chromoPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                chromoPaint.setStyle(Paint.Style.STROKE);
                chromoPaint.setStrokeWidth(r * 0.06f);
                chromoPaint.setColor(Color.argb(chromoA, 255, 45, 18));
                c.drawOval(new RectF(x - r - r*0.03f, yy - ry - ry*0.03f,
                                     x + r + r*0.03f, yy + ry + ry*0.03f), chromoPaint);
                // طبقة ورديّة-برتقالية خارجية
                chromoPaint.setStrokeWidth(r * 0.04f);
                chromoPaint.setColor(Color.argb(chromoA / 2, 255, 100, 40));
                c.drawOval(new RectF(x - r - r*0.07f, yy - ry - ry*0.07f,
                                     x + r + r*0.07f, yy + ry + ry*0.07f), chromoPaint);
            }
        }

        // لهب شمسي Solar Flares — على حافة الشمس
        if (sunAlt > 3) {
            drawSolarFlares(c, p, x, yy, r, now);
        }

        // Solar Pillar عند الغروب/الشروق — محسّن بعرض متدرج
        if (sunAlt < 4 && sunAlt > -5) {
            float pillarT = (float)(1.0 - Math.abs(sunAlt) / 5.0);
            int pillarAlpha = (int)(pillarT * 70);
            // عمود رئيسي
            p.setShader(new LinearGradient(x, yy - r * 7, x, yy + r * 3,
                new int[]{ Color.argb(0, 255, 200, 80),
                           Color.argb(pillarAlpha, 255, 188, 65),
                           Color.argb((int)(pillarAlpha * 0.7f), 255, 170, 45),
                           Color.argb(0, 255, 150, 30) },
                new float[]{ 0f, 0.25f, 0.65f, 1f }, Shader.TileMode.CLAMP));
            c.drawRect(x - r * 0.55f, yy - r * 7, x + r * 0.55f, yy + r * 3, p);
            p.setShader(null);
            // هالة جانبية للعمود
            p.setShader(new LinearGradient(x, yy - r * 4, x, yy + r * 2,
                new int[]{ Color.argb(0, 255, 180, 60),
                           Color.argb((int)(pillarAlpha * 0.4f), 255, 175, 55),
                           Color.argb(0, 255, 160, 40) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(x - r * 1.4f, yy - r * 4, x + r * 1.4f, yy + r * 2, p);
            p.setShader(null);
        }

        // Lens Flare — تشعشع عدسي hexagonal عند الشروق/الغروب
        if (sunAlt < 18 && sunAlt > -3) {
            drawSunLensFlare(c, p, x, yy, r, w, h, sunAlt);
        }
    }

    /** Lens Flare — تشعشع عدسي سداسي + أشعة انعراج */
    private static void drawSunLensFlare(Canvas c, Paint p, float x, float y, float r,
                                          int w, int h, double sunAlt) {
        float t = (float)(1.0 - Math.min(1, sunAlt / 18.0)) * (float)(Math.max(0, (sunAlt + 3) / 21.0));
        if (t < 0.04f) return;
        Paint flarePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        flarePaint.setStyle(Paint.Style.STROKE);

        // حلقات سداسية — محاكاة بصريات العدسة (Aperture Diffraction)
        float[] ringRadii = { r * 1.7f, r * 2.6f, r * 3.8f, r * 5.5f, r * 7.2f };
        int[]   ringAlpha = { 32,       22,        15,        10,        6 };
        int[]   ringRGB   = { 0xFFFFF0C8, 0xFFC8D8FF, 0xFFFFD0E8, 0xFFD0FFD8, 0xFFFFE8C0 };
        for (int i = 0; i < ringRadii.length; i++) {
            int a = (int)(ringAlpha[i] * t);
            if (a < 3) continue;
            flarePaint.setStrokeWidth(r * (0.07f + i * 0.025f));
            int rc = ringRGB[i];
            flarePaint.setColor(Color.argb(a, Color.red(rc), Color.green(rc), Color.blue(rc)));
            Path hex = new Path();
            for (int s = 0; s <= 6; s++) {
                double ang = s * Math.PI / 3.0 + Math.PI / 6.0;
                float hx = x + (float)(Math.cos(ang) * ringRadii[i]);
                float hy = y + (float)(Math.sin(ang) * ringRadii[i]);
                if (s == 0) hex.moveTo(hx, hy); else hex.lineTo(hx, hy);
            }
            hex.close();
            c.drawPath(hex, flarePaint);
        }

        // أشعة انعراج Diffraction Spikes — 6 أشعة رئيسية + 2 قطرية
        Paint spikePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        spikePaint.setStyle(Paint.Style.STROKE);
        spikePaint.setStrokeCap(Paint.Cap.ROUND);
        int numSpikes = 8;
        for (int s = 0; s < numSpikes; s++) {
            double ang = s * Math.PI / 4.0;
            boolean major = (s % 2 == 0);
            float spikeLen = r * (major ? 9.0f : 5.0f);
            int sa = (int)(t * (major ? 25 : 12));
            if (sa < 3) continue;
            spikePaint.setStrokeWidth(r * (major ? 0.12f : 0.07f));
            spikePaint.setShader(new LinearGradient(
                x, y,
                x + (float)(Math.cos(ang) * spikeLen),
                y + (float)(Math.sin(ang) * spikeLen),
                Color.argb(sa, 255, 252, 235),
                Color.argb(0, 255, 240, 200), Shader.TileMode.CLAMP));
            c.drawLine(x, y,
                x + (float)(Math.cos(ang) * spikeLen),
                y + (float)(Math.sin(ang) * spikeLen), spikePaint);
        }
        spikePaint.setShader(null);

        // Ghost Flares — بقع ضوئية عائمة على خط من المركز
        float cx2 = w / 2f, cy2 = h * 0.5f;
        float[] ghostDists = { 0.3f, 0.55f, 0.8f, 1.1f };
        float[] ghostSizes = { r * 1.2f, r * 0.8f, r * 1.5f, r * 0.6f };
        int[]   ghostAlpha = { 12, 8, 10, 6 };
        for (int g = 0; g < ghostDists.length; g++) {
            float gx = x + (cx2 - x) * ghostDists[g];
            float gy = y + (cy2 - y) * ghostDists[g];
            int ga = (int)(ghostAlpha[g] * t);
            if (ga < 3) continue;
            p.setShader(new RadialGradient(gx, gy, ghostSizes[g],
                new int[]{ Color.argb(ga, 200, 220, 255),
                           Color.argb(0, 180, 200, 240) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(gx, gy, ghostSizes[g], p);
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

    /** نسيج حبيبات الحمل الحراري على سطح الشمس — خلايا صغيرة متفاوتة السطوع */
    private static void drawSunGranulation(Canvas c, float x, float y, float r, float ry, long now) {
        long seed = now / 4000L; // تحديث بطيء لملمس حي
        Random rnd = new Random(seed);
        int saved = c.saveLayer(new RectF(x - r, y - ry, x + r, y + ry), null);
        Path clip = new Path();
        clip.addOval(new RectF(x - r, y - ry, x + r, y + ry), Path.Direction.CW);
        c.clipPath(clip);
        Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG);
        gp.setStyle(Paint.Style.FILL);
        int cellCount = 46;
        for (int i = 0; i < cellCount; i++) {
            double ang = rnd.nextDouble() * 2 * Math.PI;
            double dist = Math.sqrt(rnd.nextDouble()) * 0.88;
            float cx = x + (float)(Math.cos(ang) * dist * r);
            float cy = y + (float)(Math.sin(ang) * dist * ry);
            float cr = r * (0.055f + rnd.nextFloat() * 0.05f);
            boolean bright = rnd.nextBoolean();
            int a = 22 + rnd.nextInt(26);
            int col = bright ? Color.argb(a, 255, 244, 190) : Color.argb(a, 200, 90, 20);
            gp.setShader(new RadialGradient(cx, cy, cr,
                new int[]{ col, Color.argb(0, 255, 200, 100) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(cx, cy, cr, gp);
        }
        gp.setShader(null);
        c.restoreToCount(saved);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // سحاب — seeds وطبقات
    // ═══════════════════════════════════════════════════════════════════════
    private static final float[][] CLOUD_SEEDS = {
        { 0.04f, 0.09f, 0.34f, 0, 20, 2.4f },
        { 0.52f, 0.07f, 0.29f, 0, 18, 2.0f },
        { 0.80f, 0.13f, 0.32f, 0, 19, 2.2f },
        { 0.28f, 0.18f, 0.24f, 0, 16, 1.8f },
        { 0.68f, 0.15f, 0.19f, 0, 14, 1.6f },
        { 0.13f, 0.27f, 0.26f, 1, 18, 2.1f },
        { 0.60f, 0.24f, 0.31f, 1, 20, 2.3f },
        { 0.86f, 0.21f, 0.22f, 1, 16, 1.9f },
        { 0.38f, 0.35f, 0.28f, 1, 17, 2.0f },
        { 0.76f, 0.30f, 0.17f, 1, 13, 1.5f },
        { 0.20f, 0.43f, 0.21f, 2, 15, 1.7f },
        { 0.66f, 0.39f, 0.26f, 2, 16, 1.8f },
        { 0.46f, 0.49f, 0.19f, 2, 14, 1.6f },
        { 0.88f, 0.46f, 0.15f, 2, 13, 1.5f },
        { 0.33f, 0.52f, 0.13f, 2, 12, 1.4f },
        { 0.56f, 0.55f, 0.11f, 2, 11, 1.3f },
    };
    private static final float[] LAYER_SPEED = { 0.0025f, 0.0055f, 0.010f };

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
        boolean hasSilver = (sunAlt > -2 && sunAlt < 12);
        boolean moonLit   = (sunAlt < -4 && sunAlt > -18);

        // اتجاه الضوء
        float ldx = lightX - cx, ldy = lightY - cy;
        float ldLen = (float) Math.max(1.0, Math.sqrt((double)(ldx * ldx + ldy * ldy)));
        float lnx = ldx / ldLen, lny = ldy / ldLen;

        // قاعدة السحاب المسطحة — السمة الأبرز للسحاب الركامي الواقعي
        float flatBase = cy + sz * 0.30f;
        RectF layerRect = new RectF(cx - sz * 2.4f, cy - sz * 1.9f, cx + sz * 2.4f, flatBase + sz * 0.15f);
        int savedCount = c.saveLayer(layerRect, null);

        int bar = Color.alpha(base);
        int hrr = Color.red(highlight), hgr = Color.green(highlight), hbr = Color.blue(highlight);
        int srr = Color.red(shadow),    sgr = Color.green(shadow),    sbr = Color.blue(shadow);

        // ══ توليد البتلات في 3 طبقات (top / body / base-fringe) ══
        // كل طبقة لها إضاءة وحجم مختلف لإبراز العمق الحجمي
        int nTop  = Math.max(3, n / 4);  // قمة الركام — أصغر، أكثر بياضاً
        int nBody = Math.max(4, n / 2);  // جسم السحاب — متوسط
        // nFrng = n - nTop - nBody     // أطراف القاعدة — أكبر، أغمق

        float[] pxA = new float[n], pyA = new float[n], prA = new float[n], aoA = new float[n];

        // طبقة القمة
        for (int i = 0; i < nTop; i++) {
            double ang = (rnd.nextDouble() - 0.5) * Math.PI * 1.3;
            float  d   = (float)(rnd.nextDouble() * 0.28 * sz);
            pxA[i] = cx + (float)(Math.cos(ang) * d * aspect);
            pyA[i] = cy - sz * (0.30f + rnd.nextFloat() * 0.40f);
            prA[i] = sz * (0.11f + rnd.nextFloat() * 0.16f);
            aoA[i] = 0.80f + rnd.nextFloat() * 0.20f;  // الأكثر إنارةً
        }
        // طبقة الجسم
        for (int i = nTop; i < nTop + nBody; i++) {
            double ang = (rnd.nextDouble() - 0.5) * Math.PI * 1.8;
            float  d   = (float)(rnd.nextDouble() * 0.52 * sz);
            pxA[i] = cx + (float)(Math.cos(ang) * d * aspect);
            pyA[i] = cy + (float)(Math.sin(ang) * d * 0.42f) - sz * 0.04f;
            float cd = (float)Math.sqrt((double)((pxA[i]-cx)*(pxA[i]-cx) + (pyA[i]-cy)*(pyA[i]-cy)));
            float sf = Math.max(0.32f, 1.0f - cd / (sz * 0.72f));
            prA[i] = sz * (0.17f + rnd.nextFloat() * 0.19f) * sf;
            aoA[i] = 0.40f + rnd.nextFloat() * 0.38f;
        }
        // طبقة الأطراف (قاعدة)
        for (int i = nTop + nBody; i < n; i++) {
            double ang = (rnd.nextDouble() - 0.5) * Math.PI * 2.0;
            float  d   = (float)(0.30 * sz + rnd.nextDouble() * 0.40 * sz);
            pxA[i] = cx + (float)(Math.cos(ang) * d * aspect);
            pyA[i] = cy + sz * (0.04f + rnd.nextFloat() * 0.24f);
            prA[i] = sz * (0.13f + rnd.nextFloat() * 0.13f);
            aoA[i] = 0.18f + rnd.nextFloat() * 0.26f;  // الأغمق
        }

        // ══ رسم البتلات: الطبقة الوسطى أولاً، ثم القاعدة، ثم القمة (back→front) ══
        int[] order = new int[n];
        int oi = 0;
        for (int i = nTop; i < nTop + nBody; i++) order[oi++] = i;  // body (خلف)
        for (int i = nTop + nBody; i < n;    i++) order[oi++] = i;  // fringe
        for (int i = 0;            i < nTop; i++) order[oi++] = i;  // top (أمام وأعلى)

        for (int ri = 0; ri < n; ri++) {
            int   i    = order[ri];
            float bx   = pxA[i], by = pyA[i], brad = prA[i];
            float ao   = aoA[i];
            // قاعدة مسطحة صارمة
            if (by + brad * 0.48f > flatBase) by = flatBase - brad * 0.52f;
            // نسبة الإنارة من اتجاه الضوء
            float dotL = (cx - bx) * lnx + (cy - by) * lny;
            float lit  = 0.22f + 0.78f * (float)Math.max(0, Math.min(1, dotL / sz + 0.65));
            float bright = ao * lit;
            // لون البتلة — انترپول بين الظل والإضاءة
            int lr = Math.max(0, Math.min(255, (int)(srr + (hrr - srr) * bright)));
            int lg = Math.max(0, Math.min(255, (int)(sgr + (hgr - sgr) * bright)));
            int lb = Math.max(0, Math.min(255, (int)(sbr + (hbr - sbr) * bright)));
            int la = (int)(bar * (0.58f + bright * 0.42f));
            // نقطة توهج منزاحة نحو الضوء داخل البتلة
            float gX = bx - brad * 0.14f * lnx;
            float gY = by - brad * 0.14f * lny;
            p.setShader(new RadialGradient(gX, gY, brad,
                new int[]{
                    Color.argb(Math.min(255, la + 18), Math.min(255, lr + 28), Math.min(255, lg + 22), Math.min(255, lb + 18)),
                    Color.argb(la, lr, lg, lb),
                    Color.argb(la * 11 / 20, lr, lg, lb),
                    Color.argb(la *  3 / 20, lr, lg, lb),
                    Color.argb(0, lr, lg, lb) },
                new float[]{ 0f, 0.28f, 0.55f, 0.78f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(bx, by, brad, p);
            p.setShader(null);
        }

        // ══ Ambient Occlusion داخلي — يُظلم قلب السحابة ══
        int aoAlpha = (int)(bar * 0.35f);
        if (aoAlpha > 6) {
            p.setShader(new RadialGradient(cx, cy + sz * 0.08f, sz * 0.60f,
                new int[]{ Color.argb(aoAlpha, srr, sgr, sbr),
                           Color.argb(aoAlpha / 3, srr, sgr, sbr),
                           Color.argb(0, srr, sgr, sbr) },
                null, Shader.TileMode.CLAMP));
            // نرسم بـ DST_IN تقريباً — في الواقع نطبق تدرج داكن ناعم
            Paint aoPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            aoPaint.setShader(p.getShader());
            aoPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.MULTIPLY));
            c.drawRect(layerRect, aoPaint);
            aoPaint.setXfermode(null);
            p.setShader(null);
        }

        // ══ حافة فضية/ذهبية عند الشروق والغروب ══
        if (hasSilver) {
            float silverT = (float)Math.max(0, 1.0 - Math.abs(sunAlt - 5) / 8.0);
            int sA = (int)(130 * silverT);
            if (sA > 8) {
                float eX = cx + lnx * sz * 0.88f, eY = cy + lny * sz * 0.68f;
                p.setShader(new RadialGradient(eX, eY, sz * 0.70f,
                    new int[]{ Color.argb(sA,              255, 255, 252),
                               Color.argb((int)(sA*0.62f), 255, 252, 225),
                               Color.argb((int)(sA*0.22f), 255, 242, 185),
                               Color.argb(0,               240, 228, 165) },
                    new float[]{ 0f, 0.20f, 0.52f, 1f }, Shader.TileMode.CLAMP));
                c.drawRect(layerRect, p);
                p.setShader(null);
            }
        }
        // ضوء القمر
        if (moonLit && cMoonAlt > 10) {
            int mA = (int)(32 * Math.min(1.0, (cMoonAlt - 10) / 30.0));
            if (mA > 3) {
                p.setShader(new RadialGradient(cx, cy - sz * 0.5f, sz * 1.25f,
                    new int[]{ Color.argb(mA, 205, 218, 255), Color.argb(0, 180, 200, 240) },
                    null, Shader.TileMode.CLAMP));
                c.drawRect(layerRect, p);
                p.setShader(null);
            }
        }

        c.restoreToCount(savedCount);

        // ══ تشتت ضوء تحت السطحي (Subsurface Scattering) — وهج دافئ من الداخل ══
        // يظهر عندما تكون الشمس خلف السحابة أو قريبة منها
        if (sunAlt > -3) {
            float ddx = lightX - cx, ddy = lightY - cy;
            float dDist = (float)Math.sqrt((double)(ddx*ddx + ddy*ddy));
            // كلما كانت الشمس خلف السحابة، كانت الإضاءة الداخلية أقوى
            float backlit = Math.max(0f, 1.0f - dDist / (sz * 4.5f));
            if (backlit > 0.08f) {
                int ssAlpha = (int)(bar * 0.28f * backlit);
                if (ssAlpha > 5) {
                    Paint ssPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                    // لون دافئ (أبيض-ذهبي عند النهار، برتقالي عند الغروب)
                    int ssR = (sunAlt > 10) ? 255 : 255;
                    int ssG = (sunAlt > 10) ? 250 : (int)(200 + sunAlt * 5);
                    int ssB = (sunAlt > 10) ? 220 : (int)(100 + sunAlt * 8);
                    ssPaint.setShader(new RadialGradient(
                        cx - lnx * sz * 0.2f, cy - lny * sz * 0.2f, sz * 1.1f,
                        new int[]{ Color.argb(ssAlpha, ssR, ssG, ssB),
                                   Color.argb(ssAlpha * 2/3, ssR, ssG, ssB),
                                   Color.argb(0, ssR, ssG, ssB) },
                        new float[]{ 0f, 0.4f, 1f }, Shader.TileMode.CLAMP));
                    ssPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.ADD));
                    c.drawRect(layerRect, ssPaint);
                    ssPaint.setXfermode(null);
                    ssPaint.setShader(null);
                }
            }
        }

        // ══ تشتت العدسة الإكليلي (Iridescence) — ألوان قوس قزح باهتة قرب الشمس ══
        if (sunAlt > 0 && sunAlt < 30) {
            float ddx2 = lightX - cx, ddy2 = lightY - cy;
            float angDist = (float)Math.sqrt((double)(ddx2*ddx2 + ddy2*ddy2));
            float iridT = Math.max(0f, 1.0f - angDist / (sz * 5.5f));
            if (iridT > 0.05f) {
                int iridA = (int)(bar * 0.18f * iridT);
                if (iridA > 4) {
                    // حلقات لونية (وردي-أخضر-أزرق) على حواف السحابة
                    Paint iridPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                    iridPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SCREEN));
                    float edgeX = cx + lnx * sz * 1.0f;
                    float edgeY = cy + lny * sz * 0.8f;
                    iridPaint.setShader(new RadialGradient(edgeX, edgeY, sz * 0.65f,
                        new int[]{ Color.argb(0, 255, 180, 200),
                                   Color.argb(iridA, 220, 255, 210),
                                   Color.argb(iridA * 2/3, 180, 200, 255),
                                   Color.argb(0, 200, 180, 255) },
                        new float[]{ 0f, 0.25f, 0.55f, 1f }, Shader.TileMode.CLAMP));
                    c.drawRect(layerRect, iridPaint);
                    iridPaint.setXfermode(null);
                    iridPaint.setShader(null);
                }
            }
        }

        // ══ ظل السحابة أسفلها (shadow blob) ══
        int sa2 = Color.alpha(shadow);
        p.setShader(new RadialGradient(cx, flatBase + sz * 0.09f, sz * 1.28f,
            new int[]{ Color.argb(sa2,       srr, sgr, sbr),
                       Color.argb(sa2 * 3/5, srr, sgr, sbr),
                       Color.argb(sa2 / 5,   srr, sgr, sbr),
                       Color.argb(0,         srr, sgr, sbr) },
            new float[]{ 0f, 0.35f, 0.70f, 1f }, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(cx - sz * 1.28f, flatBase, cx + sz * 1.28f, flatBase + sz * 0.35f), p);
        p.setShader(null);
    }

    private static class CloudColors { int base, shadow, highlight; }

    private static CloudColors cloudColors(double a) {
        CloudColors cc = new CloudColors();
        if (a > 18) {
            // نهار كامل: أبيض ناصع مع ظل أزرق-رمادي عميق وواقعي
            cc.base      = Color.argb(220, 246, 249, 255);
            cc.shadow    = Color.argb(100, 90, 118, 175);
            cc.highlight = Color.argb(255, 255, 255, 255);
        } else if (a > 5) {
            float t = (float)((a - 5) / 13);
            cc.base      = lerpColor(Color.argb(205, 255, 208, 158), Color.argb(220, 246, 249, 255), t);
            cc.shadow    = lerpColor(Color.argb( 80, 118,  70,  22), Color.argb(100,  90, 118, 175), t);
            cc.highlight = lerpColor(Color.argb(230, 255, 225, 168), Color.argb(255, 255, 255, 255), t);
        } else if (a > -1) {
            float t = (float)((a + 1) / 6);
            cc.base      = lerpColor(Color.argb(185, 205, 100,  58), Color.argb(205, 255, 208, 158), t);
            cc.shadow    = lerpColor(Color.argb( 68,  52,  16,   8), Color.argb( 80, 118,  70,  22), t);
            cc.highlight = lerpColor(Color.argb(205, 255, 145,  82), Color.argb(230, 255, 225, 168), t);
        } else if (a > -8) {
            cc.base      = Color.argb(155, 172,  78,  48);
            cc.shadow    = Color.argb( 58,  35,  12,   6);
            cc.highlight = Color.argb(178, 222, 108,  68);
        } else if (a > -14) {
            // ليل مقمر — فضي-أزرق بارد مع ظل بنفسجي عميق
            float moonF = (float)Math.min(1.0, cMoonAlt / 40.0 + 0.4);
            int baseAlpha = (int)(55 + moonF * 42);
            cc.base      = Color.argb(baseAlpha, (int)(28 + moonF * 30), (int)(38 + moonF * 40), (int)(72 + moonF * 58));
            cc.shadow    = Color.argb((int)(30 + moonF * 18), 12, 16, 48);
            cc.highlight = Color.argb((int)(65 + moonF * 50), (int)(90 + moonF * 100), (int)(108 + moonF * 118), (int)(175 + moonF * 68));
        } else {
            // ليل عميق بلا قمر — رمادي-بنفسجي خافت
            cc.base      = Color.argb( 52,  14,  18,  42);
            cc.shadow    = Color.argb( 22,   4,   5,  16);
            cc.highlight = Color.argb( 60,  22,  28,  58);
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
    private static Bitmap sGrainLight;
    private static Bitmap sGrainDark;

    /**
     * حبيبات فيلم دقيقة جداً (Photographic Film Grain) — نمط عشوائي ثابت
     * يُطبَّق بشفافية منخفضة جداً فوق كل شيء لتفكيك أي تدرّج لوني حاد (banding)
     * وإعطاء ملمس واقعي شبيه بالصور الفوتوغرافية بدل السطوح المسطحة الرقمية.
     */
    private static void drawFilmGrain(Canvas c, int w, int h) {
        int nSize = 96;
        if (sGrainLight == null || sGrainDark == null) {
            sGrainLight = Bitmap.createBitmap(nSize, nSize, Bitmap.Config.ALPHA_8);
            sGrainDark  = Bitmap.createBitmap(nSize, nSize, Bitmap.Config.ALPHA_8);
            Random rndL = new Random(90210L);
            Random rndD = new Random(13579L);
            int[] pxL = new int[nSize * nSize];
            int[] pxD = new int[nSize * nSize];
            for (int i = 0; i < pxL.length; i++) {
                pxL[i] = rndL.nextInt(46) << 24;
                pxD[i] = rndD.nextInt(46) << 24;
            }
            sGrainLight.setPixels(pxL, 0, nSize, 0, 0, nSize, nSize);
            sGrainDark.setPixels(pxD, 0, nSize, 0, 0, nSize, nSize);
        }
        Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        BitmapShader lightShader = new BitmapShader(sGrainLight, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT);
        gp.setShader(lightShader);
        gp.setColor(0xFFFFFFFF);
        c.drawRect(0, 0, w, h, gp);
        BitmapShader darkShader = new BitmapShader(sGrainDark, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT);
        gp.setShader(darkShader);
        gp.setColor(0xFF000000);
        c.drawRect(0, 0, w, h, gp);
        gp.setShader(null);
    }

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
        // معادلة Bennett — انكسار جوي بدون قفزة عند الأفق (تجنب تفرّع tan(0))
        double denom = altDeg + 7.31 / (altDeg + 4.4);
        double R = 1.0 / Math.tan(Math.toRadians(denom));
        return R / 60.0;
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

    /** خط الطول الفلكي (Ecliptic Longitude) للشمس بالدرجات — مطابق لحساب solarPosition */
    static double sunEclipticLongitude(double jd) {
        double n = jd - 2451545.0;
        double g = Math.toRadians(normDeg(357.528 + 0.9856003 * n));
        double L = normDeg(280.46 + 0.9856474 * n);
        return normDeg(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
    }

    /** خط الطول الفلكي للقمر بالدرجات — نفس تصحيحات Meeus المستخدمة في moonPosition */
    static double moonEclipticLongitude(double jd) {
        double n  = jd - 2451545.0;
        double Lm = normDeg(218.316 + 13.176396 * n);
        double Mm = Math.toRadians(normDeg(134.963 + 13.064993 * n));
        double D  = Math.toRadians(normDeg(297.850 + 12.190749 * n));
        double Msun = Math.toRadians(normDeg(357.528 + 0.9856003 * n));
        double corr =
              6.289 * Math.sin(Mm)
            + 1.274 * Math.sin(2 * D - Mm)
            + 0.658 * Math.sin(2 * D)
            - 0.186 * Math.sin(Msun)
            - 0.059 * Math.sin(2 * D - 2 * Mm)
            - 0.057 * Math.sin(2 * D - Mm - Msun);
        return normDeg(Lm + corr);
    }

    /**
     * طور القمر [0=محاق/جديد .. 0.5=بدر .. 1=محاق] — يُحسب من الاستطالة الفعلية
     * (الفرق بين خطي الطول الفلكيين للقمر والشمس) بدل الاعتماد على متوسط طول
     * الشهر الاقتراني الثابت (29.530588853 يوم)، لأن طول الشهر الفعلي يتغير
     * بضع ساعات بسبب لا مركزية مدار القمر — الطريقة الثابتة كانت تنحرف عن
     * الطور الفلكي الحقيقي مع الوقت، وأيضاً كانت منفصلة تماماً عن حساب موقع
     * القمر الفعلي (moonPosition) مما يسبب عدم تطابق بين شكل الإنارة والموضع
     * المرسومين على الشاشة. الطريقة الجديدة مبنية على نفس فيزياء moonPosition
     * فتبقى متطابقة معه دائماً وبلا انحراف تراكمي.
     */
    static double moonPhase(double jd) {
        double sunLon  = sunEclipticLongitude(jd);
        double moonLon = moonEclipticLongitude(jd);
        double elong   = normDeg(moonLon - sunLon);
        return elong / 360.0;
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

        // ألوان السماء المنعكسة على الزجاج تتغير حسب وقت النهار
        int skyReflR, skyReflG, skyReflB;
        if (sunAlt > 20) { skyReflR = 120; skyReflG = 185; skyReflB = 255; } // أزرق نهاري
        else if (sunAlt > 8) {
            float t = (float)((sunAlt - 8) / 12.0);
            skyReflR = (int)(200 + t * (-80)); skyReflG = (int)(180 + t * 5); skyReflB = 255;
        } else if (sunAlt > 0) {
            float t = (float)(sunAlt / 8.0);
            skyReflR = (int)(255 - t * 55); skyReflG = (int)(140 + t * 40); skyReflB = (int)(180 + t * 75);
        } else { skyReflR = 255; skyReflG = 120; skyReflB = 80; } // غروب برتقالي

        Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG);
        gp.setStyle(Paint.Style.FILL);
        for (float[] t : towers) {
            if (t[2] < 0.10f) continue;
            int typ = (int) t[3];
            if (typ == 4 || typ == 9 || typ == 10) continue;
            float tx = t[0] * w, tw = t[1] * w, th = t[2] * h;
            float top = baseY - th;
            // شريط انعكاس رئيسي (أوسع للمباني الزجاجية)
            boolean isGlassBuilding = (typ == 1 || typ == 6 || typ == 7);
            float sheenW = tw * (isGlassBuilding ? 0.30f : 0.18f);
            float sheenX = tx + tw * 0.58f;
            int alphaMax = (int)(sA * (isGlassBuilding ? 65 : 35));
            gp.setShader(new LinearGradient(sheenX, top, sheenX + sheenW, top,
                new int[]{ Color.argb(0, skyReflR, skyReflG, skyReflB),
                           Color.argb(alphaMax, skyReflR, skyReflG, skyReflB),
                           Color.argb((int)(alphaMax * 0.65f), skyReflR, skyReflG, skyReflB),
                           Color.argb((int)(alphaMax * 0.20f), skyReflR, skyReflG, skyReflB),
                           Color.argb(0, skyReflR, skyReflG, skyReflB) },
                new float[]{ 0f, 0.25f, 0.55f, 0.80f, 1f }, Shader.TileMode.CLAMP));
            c.drawRect(new RectF(sheenX, top + th * 0.04f, sheenX + sheenW, baseY - h * 0.005f), gp);
            // شريط ثانوي عاكس أصغر (حافة الزجاج)
            if (isGlassBuilding) {
                float sheen2X = tx + tw * 0.08f;
                float sheen2W = tw * 0.10f;
                gp.setShader(new LinearGradient(sheen2X, top, sheen2X + sheen2W, top,
                    new int[]{ Color.argb(0, skyReflR, skyReflG, skyReflB),
                               Color.argb((int)(alphaMax * 0.30f), skyReflR, skyReflG, skyReflB),
                               Color.argb(0, skyReflR, skyReflG, skyReflB) },
                    null, Shader.TileMode.CLAMP));
                c.drawRect(new RectF(sheen2X, top + th * 0.08f, sheen2X + sheen2W, baseY - h * 0.01f), gp);
            }
        }
        gp.setShader(null);
    }

    /** دخان المداخن — عمودي متصاعد يتلوى في الهواء */
    private static void drawChimneySmoke(Canvas c, int w, int h, Paint p,
                                          float[][] towers, float baseY,
                                          double sunAlt, long now) {
        // الدخان يظهر صباحاً (< 12°) ومساءً/ليلاً — في الشتاء أكثر كثافة
        boolean showSmoke = (wsOvercast > 0.2f || sunAlt < 15);
        if (!showSmoke) return;

        float smokeStr = (float)Math.min(1.0, (1.0 - sunAlt / 30.0)) * (0.5f + wsOvercast * 0.5f);
        if (smokeStr < 0.08f) return;

        float sec = now / 1000f;
        Paint smokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        smokePaint.setStyle(Paint.Style.FILL);
        Random smokeRnd = new Random(654321L);

        for (float[] t : towers) {
            if (t[2] < 0.06f) continue;
            int typ = (int) t[3];
            // فقط للمباني الخرسانية والتدفئة (لا للزجاج الحديث)
            if (typ == 1 || typ == 6 || typ == 7) continue;
            if (smokeRnd.nextFloat() > 0.45f) continue; // 45% من المباني فقط

            float tx = t[0] * w + t[1] * w * smokeRnd.nextFloat();
            float ty = baseY - t[2] * h;

            // عدة حلقات دخان متصاعدة
            int numPuffs = 5;
            for (int pf = 0; pf < numPuffs; pf++) {
                float pAge = ((sec * 0.25f + pf * (1.0f / numPuffs)) % 1.0f);
                float pSize = h * (0.012f + pAge * 0.025f);
                float pY = ty - pAge * h * 0.12f;
                float pX = tx + (float)(Math.sin(sec * 0.6 + pf * 2.1 + t[0] * 5) * h * 0.015f * pAge);
                int pA = (int)(smokeStr * 45 * (1 - pAge) * (1 - pAge));
                if (pA < 4) continue;

                // لون الدخان: رمادي-أبيض نهاراً، رمادي-بني ليلاً
                int sr = (sunAlt > 0) ? 190 : 130;
                int sg = (sunAlt > 0) ? 190 : 128;
                int sb = (sunAlt > 0) ? 195 : 138;

                smokePaint.setShader(new RadialGradient(pX, pY, pSize,
                    new int[]{ Color.argb(pA, sr, sg, sb),
                               Color.argb(pA / 2, sr, sg, sb),
                               Color.argb(0, sr, sg, sb) },
                    new float[]{ 0f, 0.45f, 1f }, Shader.TileMode.CLAMP));
                c.drawCircle(pX, pY, pSize, smokePaint);
            }
        }
        smokePaint.setShader(null);
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
        int alpha = (int)(Math.min(255, 52 * intensity + wsFogMult * 62));
        if (alpha < 6) return;
        float fogBase = h * 0.85f;

        // لون الضباب يتأثر بوقت النهار
        int fR, fG, fB;
        if (sunAlt > 2) {
            // نهار: أبيض-رمادي محايد
            fR = 215; fG = 222; fB = 232;
        } else if (sunAlt > -2) {
            // شروق/غروب: بني-برتقالي فاتح
            float t = (float)((sunAlt + 2) / 4.0);
            fR = (int)(240 - t * 25); fG = (int)(200 + t * 22); fB = (int)(170 + t * 62);
        } else if (sunAlt > -6) {
            // غسق: رمادي-أزرق
            float t = (float)((sunAlt + 6) / 4.0);
            fR = (int)(180 + t * 60); fG = (int)(185 + t * 15); fB = (int)(200 - t * 30);
        } else {
            // ليل: أزرق-رمادي بارد
            fR = 155; fG = 165; fB = 195;
        }

        // طبقة رئيسية ناعمة
        p.setShader(new LinearGradient(0, fogBase, 0, h,
            new int[]{ Color.argb(0, fR, fG, fB),
                       Color.argb(alpha / 2, fR, fG, fB),
                       Color.argb(alpha, fR, fG, fB),
                       Color.argb(alpha, fR, fG, fB) },
            new float[]{ 0f, 0.25f, 0.60f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, fogBase, w, h, p);
        p.setShader(null);

        // كتل ضباب متحركة
        Random rnd = new Random(2025L);
        float sec = now / 1000f;
        for (int i = 0; i < 8; i++) {
            float blobW = w * (0.14f + rnd.nextFloat() * 0.28f);
            float speed = 0.8f + rnd.nextFloat() * 1.2f;
            float dir   = (i % 2 == 0) ? 1f : -1f;
            float blobX = ((rnd.nextFloat() * w * 1.6f + sec * speed * dir) % (w * 1.8f) + w * 1.8f) % (w * 1.8f) - w * 0.2f;
            float blobY = fogBase + rnd.nextFloat() * h * 0.10f;
            int   bA    = (int)(alpha * (0.30f + rnd.nextFloat() * 0.45f));
            float blobH = blobW * (0.30f + rnd.nextFloat() * 0.18f);
            p.setShader(new RadialGradient(blobX, blobY + blobH * 0.35f, blobW,
                new int[]{ Color.argb(bA, fR, fG, fB),
                           Color.argb(bA * 2/3, fR, fG, fB),
                           Color.argb(0, fR, fG, fB) },
                new float[]{ 0f, 0.45f, 1f }, Shader.TileMode.CLAMP));
            c.drawOval(new RectF(blobX - blobW, blobY, blobX + blobW, blobY + blobH * 2f), p);
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
            // نهار: أزرق-رمادي معماري واضح، مرئي كمباني حقيقية
            silR = 38; silG = 50; silB = 78; silA = 195;
        } else if (isDusk) {
            float t = (float)((sunAlt + 5) / 7.0);
            silR = (int)(10 + t * 30); silG = (int)(14 + t * 38);
            silB = (int)(28 + t * 52); silA = (int)(215 - t * 22);
        } else {
            // ليل: أزرق-فحمي عميق غني
            silR = 10; silG = 14; silB = 36; silA = 235;
        }

        // ألوان طبقة الخلفية (أبعد — أفتح قليلاً وأكثر ضبابية)
        int bgR = silR + 14, bgG = silG + 16, bgB = Math.min(255, silB + 28);

        // خلفية بنايات صغيرة (عمق — طبقة ثانية)
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
        // تدرج المباني الخلفية: أفتح في القمة، أغمق عند الأرض
        float bgTop = baseY - h * 0.07f;
        p.setShader(new LinearGradient(0, bgTop, 0, baseY,
            new int[]{ Color.argb(silA * 6 / 10, bgR + 10, bgG + 12, Math.min(255, bgB + 15)),
                       Color.argb(silA * 7 / 10, bgR, bgG, bgB) },
            null, Shader.TileMode.CLAMP));
        c.drawPath(bgPath, p);
        p.setShader(null);

        // ══════════════════════════════════════════════════════════
        // أبراج المدينة — 25 برجاً بأنواع وأحجام متنوعة
        // type: 0=flat 1=setback 2=tapered 3=wedge 4=stepped 5=antenna 6=twin 7=cylinder 8=diamond
        // ══════════════════════════════════════════════════════════
        float[][] towers = {
            { 0.01f, 0.048f, 0.068f, 0 },
            { 0.05f, 0.032f, 0.092f, 1 },
            { 0.09f, 0.022f, 0.058f, 0 },
            { 0.11f, 0.052f, 0.118f, 4 },
            { 0.17f, 0.020f, 0.052f, 0 },
            { 0.19f, 0.058f, 0.148f, 7 },   // برج زجاجي أسطواني
            { 0.25f, 0.016f, 0.065f, 0 },
            { 0.27f, 0.068f, 0.188f, 5 },   // ناطحة مع هوائي
            { 0.34f, 0.022f, 0.078f, 0 },
            { 0.36f, 0.050f, 0.132f, 3 },
            { 0.41f, 0.026f, 0.088f, 8 },   // diamond cap
            { 0.44f, 0.082f, 0.235f, 5 },   // أعلى برج — هوائي
            { 0.53f, 0.044f, 0.155f, 2 },
            { 0.58f, 0.018f, 0.062f, 0 },
            { 0.60f, 0.070f, 0.168f, 6 },   // توأم زجاجي
            { 0.68f, 0.028f, 0.085f, 0 },
            { 0.70f, 0.065f, 0.118f, 4 },   // متدرج حجري
            { 0.76f, 0.014f, 0.148f, 5 },   // هوائي طويل نحيل
            { 0.78f, 0.052f, 0.112f, 4 },
            { 0.83f, 0.020f, 0.070f, 8 },
            { 0.85f, 0.058f, 0.125f, 3 },
            { 0.89f, 0.055f, 0.105f, 2 },   // مدبب خرساني
            { 0.93f, 0.012f, 0.145f, 5 },   // هوائي مع أطباق
            { 0.95f, 0.042f, 0.098f, 7 },
            { 0.97f, 0.032f, 0.080f, 1 },
        };

        // ══ جدول ألوان لكل نوع بناء (offsets فوق silR/G/B) ══
        // { dR_قمة, dG_قمة, dB_قمة, dR_قاعدة, dG_قاعدة, dB_قاعدة }
        int[][] typeColorOffsets = {
            { 32, 30, 28,   6,  5,  4 },  // 0: concrete flat — خرساني رمادي محايد دافئ
            { 28, 52, 95,  10, 18, 32 },  // 1: setback glass — زجاج أزرق-أخضر (Low-E glass)
            { 16, 18, 24,   2,  2,  3 },  // 2: tapered — خرساني داكن بارد
            { 38, 42, 62,   7,  9, 18 },  // 3: wedge — فولاذ معدني أزرق-رمادي
            { 62, 52, 22,  14, 10,  2 },  // 4: stepped — حجر جيري/رملي دافئ (limestone beige)
            { 12, 14, 35,  -2, -2,  2 },  // 5: antenna — فولاذ داكن نحيل
            { 45, 65, 108, 14, 22, 38 },  // 6: twin — زجاج فيروزي براق
            { 72, 85, 130, 26, 32, 58 },  // 7: cylinder glass — مرآة زجاجية عاكسة
            { 20, 22, 58,  -4, -3,  8 },  // 8: diamond — معدني بارد لامع
            { 42, 28, 40,  12,  6,  2 },  // 9: minaret — محجوظ للتوافق
            { 48, 32, 45,  16,  8,  5 },  // 10: mosque — محجوظ للتوافق
        };

        // ══ رسم كل برج منفرداً بتدرج خاص به ══
        Path fgPath = new Path();  // يُستخدم للتأثيرات (rim/glow) فقط
        p.setStyle(Paint.Style.FILL);
        Paint towerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        towerPaint.setStyle(Paint.Style.FILL);

        for (float[] t : towers) {
            float tx  = t[0] * w, tw  = t[1] * w, th  = t[2] * h;
            int   typ = (int) t[3];

            Path tPath = new Path();
            addSkylineBuilding(tPath, tx, baseY, tw, th, typ, w, h);
            fgPath.addPath(tPath);  // للتأثيرات لاحقاً

            float tTop = baseY - th;
            int[] co   = (typ >= 0 && typ < typeColorOffsets.length)
                         ? typeColorOffsets[typ] : typeColorOffsets[0];

            // تنوع لوني فردي لكل مبنى — seed من موضعه الأفقي
            Random bRnd = new Random((long)(t[0] * 31337));
            int dR = (int)((bRnd.nextFloat() - 0.5f) * 20);  // ±10
            int dG = (int)((bRnd.nextFloat() - 0.5f) * 18);  // ±9
            int dB = (int)((bRnd.nextFloat() - 0.5f) * 14);  // ±7

            int r1 = Math.min(255, Math.max(0, silR + co[0] + dR));
            int g1 = Math.min(255, Math.max(0, silG + co[1] + dG));
            int b1 = Math.min(255, Math.max(0, silB + co[2] + dB));
            int r2 = Math.min(255, Math.max(0, silR + co[3] + dR / 2));
            int g2 = Math.min(255, Math.max(0, silG + co[4] + dG / 2));
            int b2 = Math.min(255, Math.max(0, silB + co[5] + dB / 2));

            towerPaint.setShader(new LinearGradient(0, tTop, 0, baseY,
                new int[]{ Color.argb(silA, r1, g1, b1),
                           Color.argb(silA, (r1 + r2) / 2, (g1 + g2) / 2, (b1 + b2) / 2),
                           Color.argb(silA, r2, g2, b2) },
                new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
            c.drawPath(tPath, towerPaint);
            towerPaint.setShader(null);

            // بريق القبة الذهبي — يعطي إحساس معدني/خزفي حقيقي بدل السطح المسطح
            if (typ == 10 && sunAlt > -6) {
                float domeCx = tx + tw * 0.5f;
                float domeCy = tTop + th * 0.16f;
                float domeR = tw * 0.22f;
                float domeLight = (float) Math.min(1.0, (sunAlt + 6) / 20.0);
                Paint domeP = new Paint(Paint.ANTI_ALIAS_FLAG);
                domeP.setShader(new RadialGradient(
                    domeCx - domeR * 0.35f, domeCy - domeR * 0.4f, domeR * 1.4f,
                    new int[]{ Color.argb((int)(150 * domeLight), 255, 235, 180),
                               Color.argb((int)(60 * domeLight), 220, 170, 90),
                               Color.argb(0, 180, 130, 60) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(domeCx, domeCy, domeR, domeP);
                domeP.setShader(null);
            }
        }

        // أشجار موسمية
        {
            Path treePath = new Path();
            addSeasonalTrees(treePath, w, h, baseY, now);
            fgPath.addPath(treePath);
            p.setColor(Color.argb(silA, Math.min(255, silR + 12), Math.min(255, silG + 14), Math.min(255, silB + 26)));
            c.drawPath(treePath, p);
        }

        // الأرض
        fgPath.addRect(0, baseY - 1, w, h + 4, Path.Direction.CW);
        p.setColor(Color.argb(silA, silR, silG, silB));
        c.drawRect(0, baseY - 1, w, h + 4, p);

        // ══ طبقة ضوء المدينة من الأسفل (Street Glow) ══
        if (isNight || isDusk) {
            float streetGlowH = h * 0.06f;
            int sgAlpha = isNight ? (int)(silA * 0.18f) : (int)(silA * 0.08f);
            p.setShader(new LinearGradient(0, baseY - streetGlowH, 0, baseY,
                new int[]{ Color.argb(0, 255, 180, 80),
                           Color.argb(sgAlpha, 255, 180, 80),
                           Color.argb(sgAlpha, 255, 160, 60) },
                new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
            c.drawPath(fgPath, p);
            p.setShader(null);
        }

        // ══ حواف مضيئة على جانب السماء (Sky Rim) ══
        {
            Paint rimPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            rimPaint.setStyle(Paint.Style.STROKE);
            rimPaint.setStrokeWidth(1.0f);
            int rimA;
            if (isDay) {
                rimA = 55;
                rimPaint.setColor(Color.argb(rimA, 180, 210, 255));
            } else if (isDusk) {
                rimA = (int) Math.max(0, Math.min(90, 80 * ((-sunAlt) / 5.0 + 0.3)));
                rimPaint.setColor(Color.argb(rimA, 255, 190, 120));
            } else {
                rimA = 38;
                rimPaint.setColor(Color.argb(rimA, 140, 180, 255));
            }
            c.drawPath(fgPath, rimPaint);
        }

        // ══ بريق زجاج الأبراج (نهاراً) ══
        if (sunAlt > -4) {
            float glassA = (float) Math.min(1.0, (sunAlt + 4) / 10.0);
            Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG);
            gp.setStyle(Paint.Style.STROKE);
            gp.setStrokeWidth(1.2f);
            gp.setColor(Color.argb((int)(50 * glassA), 200, 225, 255));
            c.drawPath(fgPath, gp);
        }

        // واجهات زجاجية
        drawGlassCurtainSheen(c, w, h, p, towers, baseY, sunAlt);

        // ══ شرائط الطوابق على المباني (نهاراً) — تُوهم بالعمق المعماري ══
        if (isDay || isDusk) {
            float floorA = isDay ? (float)Math.min(1.0, (sunAlt - 2) / 18.0) : 0.35f;
            if (floorA > 0.04f) {
                Paint flPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                flPaint.setStyle(Paint.Style.STROKE);
                flPaint.setStrokeWidth(0.7f);
                for (float[] t : towers) {
                    if (t[2] < 0.06f) continue;
                    int typ = (int) t[3];
                    if (typ == 9 || typ == 10) continue;
                    float tx = t[0] * w, tw2 = t[1] * w, th = t[2] * h;
                    float top = baseY - th;
                    int nFloors = Math.max(3, (int)(th / (h * 0.028f)));
                    float floorH = th / nFloors;
                    int flA = (int)(floorA * (typ == 1 || typ == 6 || typ == 7 ? 42 : 22));
                    flPaint.setColor(Color.argb(flA, 120, 155, 210));
                    for (int fl = 1; fl < nFloors; fl++) {
                        float fy = baseY - fl * floorH;
                        if (fy < top + floorH * 0.5f) break;
                        c.drawLine(tx, fy, tx + tw2, fy, flPaint);
                    }
                }
                flPaint.setShader(null);
            }
            // شبكة نوافذ نهارية حقيقية بأعمدة وصفوف وانعكاسات زجاجية متفاوتة
            int[] skyC = skyColors(sunAlt);
            int skyTopColor = skyC[skyC.length - 1];
            int[] skyTopRgb = { Color.red(skyTopColor), Color.green(skyTopColor), Color.blue(skyTopColor) };
            drawDaytimeWindowGrid(c, w, h, baseY, towers, sunAlt, skyTopRgb);
        }

        // ══ انعكاس شمسي على الجانب المواجه للشمس (glass buildings) ══
        if (isDay && sunAlt > 5) {
            float sideA = (float)Math.min(0.85f, (sunAlt - 5) / 30.0);
            Paint sidePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            sidePaint.setStyle(Paint.Style.FILL);
            for (float[] t : towers) {
                int typ = (int) t[3];
                if (typ != 1 && typ != 6 && typ != 7) continue;
                if (t[2] < 0.08f) continue;
                float tx = t[0] * w, tw2 = t[1] * w, th = t[2] * h;
                float top = baseY - th;
                float sideW = tw2 * 0.18f;
                float sideX = tx + tw2 * 0.72f;
                int[] co = typeColorOffsets[typ];
                int hr = Math.min(255, silR + co[0] + 55), hg = Math.min(255, silG + co[1] + 50), hb = Math.min(255, silB + co[2] + 38);
                sidePaint.setShader(new LinearGradient(sideX, top, sideX + sideW, top,
                    new int[]{ Color.argb(0, hr, hg, hb),
                               Color.argb((int)(sideA * 80), hr, hg, hb),
                               Color.argb((int)(sideA * 55), hr, hg, hb),
                               Color.argb(0, hr, hg, hb) },
                    new float[]{ 0f, 0.28f, 0.65f, 1f }, Shader.TileMode.CLAMP));
                c.drawRect(sideX, top + th * 0.04f, sideX + sideW, baseY - h * 0.004f, sidePaint);
                sidePaint.setShader(null);
            }
        }

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

        // ══ دخان مداخن — يظهر صباحاً ومساءً عند التدفئة ══
        drawChimneySmoke(c, w, h, p, towers, baseY, sunAlt, now);

        // ظلال المباني على الأرض عند الشروق/الغروب
        if (sunAlt > 0 && sunAlt < 18) {
            drawBuildingShadows(c, w, h, p, towers, baseY, sunAlt, cSunAz);
        }

        // هلال المسجد يومض قليلاً في رمضان
        if (cHijriMonth == 9 && sunAlt < 2) {
            drawMosqueCrescentAccent(c, w, h, p, towers, baseY, silA, now);
        }

        // أضواء رمضان — خيوط مضيئة بين المآذن والمساجد
        if (cHijriMonth == 9 && sunAlt < -2) {
            drawRamadanLights(c, w, h, p, towers, baseY, now);
        }
    }

    /** ظلال المباني الطويلة على الأرض عند الشروق/الغروب */
    private static void drawBuildingShadows(Canvas c, int w, int h, Paint p,
                                            float[][] towers, float baseY,
                                            double sunAlt, double sunAz) {
        float sunT = (float)(1.0 - sunAlt / 18.0);
        float shadowLen = h * 0.10f * sunT * sunT;
        // اتجاه الظل عكس الشمس
        double shadowDirRad = Math.toRadians(sunAz + 180);
        float sdx = (float)(Math.sin(shadowDirRad) * shadowLen);

        Paint shadowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        shadowPaint.setStyle(Paint.Style.FILL);

        for (float[] t : towers) {
            if (t[2] < 0.08f) continue;
            float tx  = t[0] * w + t[1] * w * 0.5f;
            float th  = t[2] * h;
            float tw2 = t[1] * w;
            float tipX = tx + sdx * (th / h) * 2.2f;
            float tipY = baseY;

            Path shadow = new Path();
            shadow.moveTo(tx - tw2 * 0.4f, baseY);
            shadow.lineTo(tx + tw2 * 0.4f, baseY);
            shadow.lineTo(tipX + tw2 * 0.12f, tipY - 3);
            shadow.lineTo(tipX - tw2 * 0.12f, tipY - 3);
            shadow.close();

            int sA = (int)(sunT * sunT * 28);
            shadowPaint.setShader(new LinearGradient(tx, baseY, tipX, baseY,
                new int[]{ Color.argb(sA, 0, 0, 0),
                           Color.argb(sA / 4, 0, 0, 0),
                           Color.argb(0, 0, 0, 0) },
                null, Shader.TileMode.CLAMP));
            c.drawPath(shadow, shadowPaint);
        }
        shadowPaint.setShader(null);
    }

    /** أضواء رمضان — خيوط ذهبية/خضراء معلقة بين المآذن والمساجد */
    private static void drawRamadanLights(Canvas c, int w, int h, Paint p,
                                          float[][] towers, float baseY, long now) {
        float sec = now / 1000f;

        // نقاط الربط: قمم المآذن والمساجد
        java.util.ArrayList<float[]> anchors = new java.util.ArrayList<>();
        for (float[] t : towers) {
            int typ = (int) t[3];
            if (typ == 9 || typ == 10) {
                float tx = t[0] * w + t[1] * w * 0.5f;
                float ty = baseY - t[2] * h;
                anchors.add(new float[]{ tx, ty });
            }
        }
        if (anchors.size() < 2) return;

        Paint wirePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        wirePaint.setStyle(Paint.Style.STROKE);
        wirePaint.setStrokeWidth(0.7f);
        wirePaint.setColor(Color.argb(90, 180, 140, 60));

        Paint bulbPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bulbPaint.setStyle(Paint.Style.FILL);

        for (int i = 0; i < anchors.size() - 1; i++) {
            float ax = anchors.get(i)[0],   ay = anchors.get(i)[1];
            float bx = anchors.get(i+1)[0], by = anchors.get(i+1)[1];
            float midY = Math.min(ay, by) + h * 0.04f; // تدلي الخيط

            // خيط معلق (catenary مبسط)
            Path wire = new Path();
            wire.moveTo(ax, ay);
            wire.quadTo((ax + bx) / 2f, midY + h * 0.025f, bx, by);
            c.drawPath(wire, wirePaint);

            // مصابيح صغيرة على طول الخيط
            int bulbCount = (int)((bx - ax) / (w * 0.025f));
            bulbCount = Math.max(3, Math.min(12, bulbCount));
            for (int j = 1; j < bulbCount; j++) {
                float t2 = (float) j / bulbCount;
                float lx = ax + (bx - ax) * t2;
                // نقطة على المنحنى (parabola مبسطة)
                float ly = ay + (by - ay) * t2 + (midY + h * 0.025f - (ay + by) / 2f)
                           * 4 * t2 * (1 - t2);

                // تناوب ذهبي/أخضر/أحمر
                float flicker = 0.7f + 0.3f * (float)Math.sin(sec * 2.0 + j * 1.7 + i * 3.1);
                int bulbR, bulbG, bulbB;
                int colorIdx = (j + i) % 3;
                if (colorIdx == 0) { bulbR = 255; bulbG = 215; bulbB = 60; }
                else if (colorIdx == 1) { bulbR = 80; bulbG = 200; bulbB = 100; }
                else { bulbR = 220; bulbG = 80; bulbB = 60; }

                int bA = (int)(flicker * 200);
                p.setShader(new RadialGradient(lx, ly, w * 0.018f,
                    new int[]{ Color.argb(bA / 2, bulbR, bulbG, bulbB),
                               Color.argb(0, bulbR, bulbG, bulbB) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(lx, ly, w * 0.018f, p);
                p.setShader(null);
                bulbPaint.setColor(Color.argb(bA, bulbR, bulbG, bulbB));
                c.drawCircle(lx, ly, 2.2f, bulbPaint);
            }
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

    /** هلال المسجد يلمع في رمضان — مع هالة وحلقة SweepGradient على جسم المئذنة */
    private static void drawMosqueCrescentAccent(Canvas c, int w, int h, Paint p,
                                                  float[][] towers, float baseY,
                                                  int silA, long now) {
        float sec = now / 1000f;
        long pulse = now % 4000L;
        float pulseF = (float)(0.55 + 0.45 * Math.sin(pulse / 4000.0 * 2 * Math.PI));
        int glowA = (int)(Math.min(255, silA * 0.55f) * pulseF);
        if (glowA < 8) return;

        p.setStyle(Paint.Style.FILL);
        for (float[] t : towers) {
            int typ = (int) t[3];
            if (typ != 9 && typ != 10) continue;
            float tx  = t[0] * w + t[1] * w * 0.5f;
            float th  = t[2] * h;
            float tw2 = t[1] * w;
            float top = baseY - th;

            // 1. هالة ذهبية ناعمة أكبر على رأس المئذنة/المسجد
            p.setShader(new RadialGradient(tx, top, w * 0.055f,
                new int[]{ Color.argb(glowA,      255, 215, 70),
                           Color.argb(glowA / 2,  220, 165, 35),
                           Color.argb(0,           180, 120, 20) },
                new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(tx, top, w * 0.055f, p);
            p.setShader(null);

            // 2. حلقة ضوء خضراء تطوف على جسم المئذنة (SweepGradient)
            if (typ == 9 && th > h * 0.08f) {
                float bandY = top + th * 0.30f + (float)Math.sin(sec * 0.6) * th * 0.12f;
                float bw3 = Math.max(3f, tw2 * 1.1f);
                Paint sweepP = new Paint(Paint.ANTI_ALIAS_FLAG);
                sweepP.setStyle(Paint.Style.STROKE);
                sweepP.setStrokeWidth(1.2f);
                sweepP.setShader(new SweepGradient(tx, bandY,
                    new int[]{ Color.argb(0,          100, 220, 120),
                               Color.argb(glowA / 2, 100, 220, 120),
                               Color.argb(glowA,     150, 255, 160),
                               Color.argb(glowA / 2, 100, 220, 120),
                               Color.argb(0,          100, 220, 120) },
                    null));
                c.drawOval(new RectF(tx - bw3, bandY - bw3 * 0.35f,
                                    tx + bw3, bandY + bw3 * 0.35f), sweepP);
                sweepP.setShader(null);
            }

            // 3. نقطة مضيئة بيضاء في القمة
            int dotA = Math.min(255, glowA + 60);
            p.setShader(new RadialGradient(tx, top, w * 0.012f,
                new int[]{ Color.argb(dotA, 255, 255, 230),
                           Color.argb(0, 255, 240, 180) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(tx, top, w * 0.012f, p);
            p.setShader(null);
        }
    }

    /** شبكة نوافذ مضيئة — مع توهج دافئ حول كل نافذة */
    private static void drawWindowGrid(Canvas c, int w, int h, float baseY,
                                       float[][] towers, float nightT, long now) {
        Random rnd = new Random(54321L);
        long flickerSeed = now / 10000L;
        Random flickerRnd = new Random(flickerSeed);
        Paint wp   = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint glowP = new Paint(Paint.ANTI_ALIAS_FLAG);

        for (float[] t : towers) {
            float tx = t[0] * w, tw = t[1] * w, th = t[2] * h;
            float top = baseY - th;
            int typ = (int) t[3];
            if (typ == 9) continue;

            boolean isIslamic = (typ == 10);
            boolean isGlass   = (typ == 1 || typ == 6 || typ == 7);

            // حجم النوافذ يختلف بنوع البناء
            float wW = Math.max(2.8f, tw * (isGlass ? 0.18f : 0.13f));
            float wH = Math.max(2.2f, h * (isGlass ? 0.026f : 0.020f));
            float gapX = tw * (isGlass ? 0.07f : 0.10f);
            float gapY = h * 0.012f;

            int cols = Math.max(1, (int)(tw / (wW + gapX)));
            int rows = Math.max(1, (int)(th * 0.82f / (wH + gapY)));
            float startX = tx + (tw - cols * (wW + gapX) + gapX) / 2f;
            float startY = baseY - h * 0.030f;

            // نسبة الإضاءة بنوع البناء: مكاتب أكثر إضاءة من مباني سكنية
            float litBase = isGlass ? 0.48f : (isIslamic ? 0.30f : 0.38f);

            for (int row = 0; row < rows; row++) {
                float wy = startY - row * (wH + gapY);
                if (wy < top + th * 0.08f) break;

                // بعض الطوابق مطفأة تماماً (واقعي — ساعات العمل منتهية)
                boolean floorDark = !isIslamic && (rnd.nextFloat() < 0.18f);

                for (int col = 0; col < cols; col++) {
                    if (floorDark) { flickerRnd.nextFloat(); rnd.nextFloat(); continue; }
                    boolean lit = flickerRnd.nextFloat() < (litBase + rnd.nextFloat() * 0.32f);
                    if (!lit) { rnd.nextFloat(); continue; }

                    float wx = startX + col * (wW + gapX);

                    // نوع الضوء: أصفر دافئ (متأخر بالليل) / أبيض بارد (مكاتب) / كهرماني (إسلامي)
                    int wtype = flickerRnd.nextInt(5);
                    int wr, wg, wb;
                    if (isIslamic) {
                        wr = 255; wg = 205; wb = 105;
                    } else if (wtype == 0) { wr = 255; wg = 238; wb = 168; }  // دافئ (LED 3000K)
                    else if (wtype == 1) { wr = 215; wg = 232; wb = 255; }   // بارد (LED 6500K)
                    else if (wtype == 2) { wr = 255; wg = 252; wb = 228; }   // محايد (4000K)
                    else if (wtype == 3) { wr = 255; wg = 188; wb = 112; }   // برتقالي دافئ (هاليد قديم)
                    else                 { wr = 238; wg = 248; wb = 255; }   // أبيض-أزرق

                    int wa = (int)(nightT * (100 + rnd.nextFloat() * 100));
                    if (wa < 12) continue;

                    // توهج ناعم متسرب من النافذة
                    float glowR = wW * 2.2f;
                    glowP.setShader(new RadialGradient(wx + wW / 2f, wy - wH / 2f, glowR,
                        new int[]{ Color.argb(wa / 4, wr, wg, wb),
                                   Color.argb(wa / 12, wr, wg, wb),
                                   Color.argb(0, wr, wg, wb) },
                        new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
                    c.drawCircle(wx + wW / 2f, wy - wH / 2f, glowR, glowP);
                    glowP.setShader(null);

                    // النافذة نفسها
                    wp.setColor(Color.argb(wa, wr, wg, wb));
                    if (isIslamic && wW > 4) {
                        Path archPath = new Path();
                        archPath.addArc(new RectF(wx, wy - wH - wW * 0.5f,
                                                  wx + wW, wy - wH + wW * 0.5f), 180, 180);
                        archPath.lineTo(wx + wW, wy);
                        archPath.lineTo(wx, wy);
                        archPath.close();
                        c.drawPath(archPath, wp);
                    } else {
                        c.drawRect(wx, wy - wH, wx + wW, wy, wp);
                    }
                }
            }
        }
    }

    /**
     * شبكة نوافذ نهارية حقيقية — أعمدة وصفوف فعلية بدل خطوط الطوابق فقط.
     * كل نافذة لها انعكاس زجاجي مختلف قليلاً (Sky reflection) يعطي ملمس معماري حقيقي
     * بدل السطح المسطح، بالإضافة لإطارات (mullions) داكنة تفصل بين الوحدات.
     */
    private static void drawDaytimeWindowGrid(Canvas c, int w, int h, float baseY,
                                              float[][] towers, double sunAlt, int[] skyTop) {
        if (sunAlt < -2) return;
        float dayT = (float) Math.min(1.0, (sunAlt + 2) / 12.0);
        Random rnd = new Random(24680L);
        Paint wp = new Paint(Paint.ANTI_ALIAS_FLAG);
        Paint mullion = new Paint(Paint.ANTI_ALIAS_FLAG);
        mullion.setStyle(Paint.Style.STROKE);
        mullion.setStrokeWidth(0.6f);

        for (float[] t : towers) {
            int typ = (int) t[3];
            if (typ == 9 || typ == 10 || t[2] < 0.05f) continue;
            float tx = t[0] * w, tw = t[1] * w, th = t[2] * h;
            float top = baseY - th;
            boolean isGlass = (typ == 1 || typ == 6 || typ == 7);

            float wW = Math.max(2.4f, tw * (isGlass ? 0.16f : 0.11f));
            float wH = Math.max(2.0f, h * (isGlass ? 0.024f : 0.018f));
            float gapX = tw * (isGlass ? 0.045f : 0.07f);
            float gapY = h * 0.010f;
            int cols = Math.max(1, (int)(tw / (wW + gapX)));
            int rows = Math.max(1, (int)(th * 0.85f / (wH + gapY)));
            float startX = tx + (tw - cols * (wW + gapX) + gapX) / 2f;
            float startY = baseY - h * 0.028f;

            mullion.setColor(Color.argb((int)(dayT * (isGlass ? 55 : 35)), skyTop[0]/3, skyTop[1]/3, skyTop[2]/3));

            for (int row = 0; row < rows; row++) {
                float wy = startY - row * (wH + gapY);
                if (wy < top + th * 0.06f) break;
                for (int col = 0; col < cols; col++) {
                    float wx = startX + col * (wW + gapX);
                    float pane = rnd.nextFloat();
                    // انعكاس السماء يختلف من نافذة لأخرى — يعطي ملمس زجاجي واقعي
                    int rR = (int)(skyTop[0] * (0.55f + pane * 0.5f));
                    int rG = (int)(skyTop[1] * (0.55f + pane * 0.5f));
                    int rB = (int)(skyTop[2] * (0.55f + pane * 0.5f));
                    int baseAlpha = isGlass ? (int)(dayT * (60 + pane * 70)) : (int)(dayT * (18 + pane * 20));
                    if (!isGlass) { rR = 40 + (int)(pane*20); rG = 42 + (int)(pane*20); rB = 48 + (int)(pane*22); }
                    wp.setColor(Color.argb(baseAlpha, Math.min(255,rR), Math.min(255,rG), Math.min(255,rB)));
                    c.drawRect(wx, wy - wH, wx + wW, wy, wp);
                    if (isGlass) c.drawRect(wx, wy - wH, wx + wW, wy, mullion);
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
            // توهج خارجي (الضوء يخرج من السحابة)
            p.setShader(new RadialGradient(cloudCX, cloudBaseY - (cloudBaseY - cloudTopY) * 0.5f,
                cloudHW * 1.4f,
                new int[]{ Color.argb((int)(flashAlpha * 180), 220, 235, 255),
                           Color.argb((int)(flashAlpha * 80),  180, 200, 255),
                           Color.argb(0, 140, 160, 220) }, null, Shader.TileMode.CLAMP));
            c.drawRect(cloudCX - anvilHW, anvilTopY, cloudCX + anvilHW, cloudBaseY, p);
            p.setShader(null);
            // توهج أرجواني داخلي — يضيء من قلب السحابة
            float innerCX = cloudCX + (new Random(cbBoltTime + 1)).nextFloat() * cloudHW * 0.5f - cloudHW * 0.25f;
            float innerCY = cloudTopY + (cloudBaseY - cloudTopY) * 0.55f;
            p.setShader(new RadialGradient(innerCX, innerCY, cloudHW * 0.75f,
                new int[]{ Color.argb((int)(flashAlpha * 140), 200, 160, 255),
                           Color.argb((int)(flashAlpha * 60),  160, 100, 220),
                           Color.argb(0, 120, 60, 180) },
                null, Shader.TileMode.CLAMP));
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

            mp.setShader(new LinearGradient(0, yBase - amp, 0, yBase + h * 0.02f,
                new int[]{ Color.argb(220, Math.min(255, col[0] + 18), Math.min(255, col[1] + 14), Math.min(255, col[2] + 10)),
                           Color.argb(220, col[0], col[1], col[2]) },
                new float[]{ 0f, 1f }, Shader.TileMode.CLAMP));
            c.drawPath(mPath, mp);
            mp.setShader(null);

            // إضاءة حافة القمم المواجهة للشمس — تعطي إحساس ارتفاع حقيقي
            if (sunAlt > -4) {
                float ridgeLight = (float) Math.min(1.0, (sunAlt + 4) / 30.0);
                Paint ridgeP = new Paint(Paint.ANTI_ALIAS_FLAG);
                ridgeP.setStyle(Paint.Style.STROKE);
                ridgeP.setStrokeWidth(layer == 2 ? 1.4f : 1.0f);
                ridgeP.setColor(Color.argb((int)(90 * ridgeLight), 255, 235, 200));
                c.drawPath(mPath, ridgeP);
            }

            // نسيج رملي/صخري خفيف على الطبقة القريبة فقط
            if (layer == layerCount - 1) {
                Random txRnd = new Random(seed + 5);
                Paint txP = new Paint(Paint.ANTI_ALIAS_FLAG);
                int grainCount = (cQuality == 0) ? 20 : 40;
                for (int i = 0; i < grainCount; i++) {
                    float gx = txRnd.nextFloat() * w;
                    float gy = yBase + txRnd.nextFloat() * (h - yBase) * 0.7f;
                    float gr = 0.8f + txRnd.nextFloat() * 1.6f;
                    boolean lightSpeck = txRnd.nextBoolean();
                    int ga = 18 + txRnd.nextInt(20);
                    txP.setColor(lightSpeck
                        ? Color.argb(ga, Math.min(255, col[0] + 40), Math.min(255, col[1] + 35), Math.min(255, col[2] + 30))
                        : Color.argb(ga, Math.max(0, col[0] - 20), Math.max(0, col[1] - 20), Math.max(0, col[2] - 18)));
                    c.drawCircle(gx, gy, gr, txP);
                }
            }
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

        // ══ انعكاس السيلويت الشاحب في الماء ══
        if (sunAlt < -1) {
            float dark = (float) Math.min(1.0, (-sunAlt - 1) / 10.0);
            Paint refPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            refPaint.setStyle(Paint.Style.FILL);
            int refA = (int)(dark * 40);
            refPaint.setColor(Color.argb(refA, skyR / 2, skyG / 2, skyB / 2));
            // بنايات مقلوبة مبسطة في الماء
            Random refRnd = new Random(77321L);
            float rxb = -w * 0.01f;
            while (rxb < w * 1.02f) {
                float rbww = w * (0.018f + refRnd.nextFloat() * 0.038f);
                float rbh  = h * (0.010f + refRnd.nextFloat() * 0.025f);
                // المبنى المنعكس: يبدأ من سطح الماء نزولاً
                refPaint.setShader(new LinearGradient(0, waterTop, 0, waterTop + rbh * 1.4f,
                    new int[]{ Color.argb(refA, skyR, skyG, skyB + 20),
                               Color.argb(0, skyR, skyG, skyB) },
                    null, Shader.TileMode.CLAMP));
                c.drawRect(rxb, waterTop, rxb + rbww - w * 0.001f, waterTop + rbh, refPaint);
                refPaint.setShader(null);
                rxb += rbww + w * (0.002f + refRnd.nextFloat() * 0.008f);
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

            // (تم حذف شعاع الضوء لأسباب جمالية)
        }
    }
}
