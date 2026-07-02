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
 * محرك السماء الفلكي المتقدم — النسخة الشاملة
 *
 * المميزات:
 *  • 94 نجمة من كتالوج Yale Bright Star بألوان طيفية حقيقية (O/B/A/F/G/K/M)
 *  • خطوط 6 كوكبات عربية: الجبار، الدب الأكبر، ذات الكرسي، الدجاجة، العقرب، الأسد
 *  • مجرة أندروميدا M31 + سديم الجبار M42
 *  • نجم الغول Algol المتغير — يتغير سطوعه كل 2.867 يوم
 *  • أمطار الشهب الموسمية: Perseids/Leonids/Geminids/Quadrantids
 *  • الشفق القطبي Aurora Borealis لخطوط العرض العالية (>52°)
 *  • درب التبانة بكامل تفاصيله ومركزه المضيء
 *  • المريخ (أحمر) + زحل (بحلقة) + عطارد (قرب الأفق)
 *  • Belt of Venus + Earth's Shadow عند الشفق
 *  • نور الزودياك (Zodiacal Light) بعد الغروب
 *  • أشعة الإله / Crepuscular Rays من الشمس
 *  • هالة القمر 22° + Earthshine + فوهات
 *  • سحاب عضوي متعدد الطبقات مع إضاءة من الأسفل
 *  • تلوث ضوئي (Light Pollution) للمدن
 *  • خط أفق واضح مع ضبابية جوية
 *  • ثريا Pleiades كعنقود نجمي مستقل
 *  • مراحل الشفق الجوي الثلاث مُحسَّنة
 *  • تصحيح الانكسار الجوي قرب الأفق
 */
public final class SkyBitmapRenderer {

    private SkyBitmapRenderer() {}

    // ═══════════════════════════════════════════════════════════════════════
    // كتالوج النجوم: { RA_h, Dec_deg, magnitude, twinkle_ms, spectral }
    // spectral: 0=O/B أزرق  1=A أبيض  2=F أصفر-أبيض  3=G أصفر  4=K برتقالي  5=M أحمر
    // ═══════════════════════════════════════════════════════════════════════
    private static final double[][] STARS = {
        // ══ أشد النجوم إضاءةً ══
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

        // ══ النجوم من الحجم 1.7 – 2.2 ══
        {  2.530,  89.264,  1.97, 5500, 2 }, // Polaris (F7) — القطبي
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
        {  3.136,  40.956,  2.12, 2400, 0 }, // Algol (B8) — رأس الغول!
        { 21.736,  58.782,  2.47, 3600, 0 }, // Gamma Cep (K1)
        {  0.675,  56.537,  2.23, 3200, 4 }, // Schedar (K0)
        { 22.137, -46.961,  1.74, 2800, 0 }, // Alnair (B7)
        {  5.603,  -1.202,  1.70, 1900, 0 }, // Alnilam (B0) — حزام الجبار
        {  5.680,  -1.943,  1.74, 2200, 0 }, // Alnitak (O9) — حزام الجبار
        {  5.796,  -9.670,  2.07, 3000, 0 }, // Saiph (B0)

        // ══ نجوم 2.2 – 2.7 (مهمة بصرياً) ══
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

        // ══ نجوم الكوكبات الإضافية ══
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

    // ═══════════════════════════════════════════════════════════════════════
    // ألوان الأطياف النجمية الحقيقية
    // ═══════════════════════════════════════════════════════════════════════
    private static final int[] SPECTRAL_COLORS = {
        0xFFB8CCFF, // 0 = O/B — أزرق-أبيض
        0xFFFFFFFF, // 1 = A   — أبيض نقي
        0xFFFFF8E8, // 2 = F   — أبيض-أصفر
        0xFFFFEEB0, // 3 = G   — أصفر (مثل الشمس)
        0xFFFFCC88, // 4 = K   — برتقالي
        0xFFFF9966, // 5 = M   — أحمر-برتقالي
    };

    // ═══════════════════════════════════════════════════════════════════════
    // درب التبانة — نقاط على المستوى المجري { RA_h, Dec_deg, عرض°, سطوع 0-1 }
    // ═══════════════════════════════════════════════════════════════════════
    private static final double[][] MW_KNOTS = {
        {  5.80,  28.5,  8.0, 0.28 }, // قوس قزح (anticenter)
        {  6.20,  18.0,  9.0, 0.32 }, // الجوزاء
        {  7.00,   6.0,  8.0, 0.28 }, // وحيد القرن
        {  8.50,  -3.0,  7.0, 0.24 }, // القطعة البحرية
        { 10.00, -16.0,  7.0, 0.22 }, // الشراع
        { 12.00, -50.0,  8.0, 0.30 }, // الصليب الجنوبي
        { 13.50, -60.0,  9.5, 0.40 }, // القنطور
        { 15.00, -52.0, 10.0, 0.48 }, // الذئب / القاعدة
        { 16.00, -40.0, 10.5, 0.58 }, // العقرب الذيل
        { 16.50, -43.0, 11.0, 0.65 }, // العقرب
        { 17.50, -29.0, 16.0, 1.00 }, // ★ مركز المجرة! القوس
        { 18.00, -22.0, 14.0, 0.90 }, // الترس
        { 18.50, -10.0, 12.0, 0.80 }, // الترس الشمالي
        { 19.30,   3.0, 11.0, 0.72 }, // النسر الطائر
        { 20.00,  20.0, 10.5, 0.68 }, // السهم / الثعلب
        { 20.70,  40.0, 12.0, 0.72 }, // الدجاجة (Cygnus)
        { 21.50,  53.0, 10.0, 0.60 }, // قيفاوس
        { 22.90,  60.0,  9.5, 0.55 }, // ذات الكرسي (Cassiopeia) — مضيء!
        { 23.80,  57.0,  9.0, 0.45 }, // برشاوس
        {  2.50,  46.0,  8.5, 0.35 }, // برشاوس / الثور
        {  4.50,  36.0,  8.0, 0.30 }, // قوس قزح
    };

    // ═══════════════════════════════════════════════════════════════════════
    // الثريا — Pleiades { RA_h, Dec_deg, magnitude }
    // ═══════════════════════════════════════════════════════════════════════
    private static final double[][] PLEIADES = {
        { 3.791, 24.105, 2.87 }, // Alcyone
        { 3.783, 24.367, 3.63 }, // Atlas
        { 3.774, 24.053, 3.70 }, // Electra
        { 3.793, 24.031, 3.87 }, // Maia
        { 3.786, 23.948, 4.18 }, // Merope
        { 3.760, 24.113, 5.09 }, // Taygeta
        { 3.788, 24.287, 5.45 }, // Pleione
    };

    // ═══════════════════════════════════════════════════════════════════════
    // خطوط الكوكبات { index_a, index_b } — أزواج مؤشرات STARS
    // ═══════════════════════════════════════════════════════════════════════
    private static final int[][] CONSTELLATION_LINES = {
        // الجبار Orion
        { 9, 25}, {25, 39}, {39, 47}, {47, 48}, { 9, 47}, { 6, 39}, {49, 48},
        // الدب الأكبر Ursa Major (Dipper)
        {54, 80}, {80, 81}, {81, 82}, {82, 54}, {82, 51}, {51, 56}, {56, 52},
        // ذات الكرسي Cassiopeia (W-shape)
        {83, 45}, {45, 84}, {84, 85}, {85, 86},
        // الدجاجة Cygnus (Northern Cross)
        {18, 41}, {41, 66}, {87, 41}, {41, 63},
        // العقرب Scorpius
        {91, 14}, {14, 93}, {93, 92}, {92, 23},
        // الأسد Leo (Sickle)
        {20, 88}, {88, 89}, {88, 90},
    };

    // ═══════════════════════════════════════════════════════════════════════
    // الأجرام السماوية العميقة { RA_h, Dec_deg, type }
    // type: 0 = مجرة إهليلجية  1 = سديم
    // ═══════════════════════════════════════════════════════════════════════
    private static final double[][] DSO = {
        {  0.711,  41.269, 0 }, // M31 — مجرة أندروميدا
        {  5.588,  -5.391, 1 }, // M42 — سديم الجبار (Orion Nebula)
    };

    // ═══════════════════════════════════════════════════════════════════════
    // أمطار الشهب الموسمية { dayOfYear_peak, duration_days, rateMultiplier }
    // ═══════════════════════════════════════════════════════════════════════
    private static final double[][] METEOR_SHOWERS = {
        {   3, 4, 8.0 }, // Quadrantids  — 3 يناير
        { 125, 5, 5.0 }, // Eta Aquarids — 5 مايو
        { 224, 8, 9.0 }, // Perseids     — 12 أغسطس ★
        { 281, 3, 4.0 }, // Draconids    — 8 أكتوبر
        { 321, 4, 7.0 }, // Leonids      — 17 نوفمبر
        { 347, 7, 10.0}, // Geminids     — 13 ديسمبر ★
    };

    // ═══════════════════════════════════════════════════════════════════════
    // Cache فلكي — يُحدَّث مرة كل دقيقة
    // ═══════════════════════════════════════════════════════════════════════
    private static long      lastCalcMin = -1;
    private static double    cSunAlt,  cSunAz;
    private static double    cMoonAlt, cMoonAz, cMoonPhase;
    private static double    cVenusAlt, cVenusAz;
    private static double    cJupAlt,   cJupAz;
    private static double    cMarsAlt,  cMarsAz;
    private static double    cSatAlt,   cSatAz;
    private static double    cMercAlt,  cMercAz;
    private static double[][] cStarPos;    // [alt, az] لكل نجمة
    private static double[][] cMwPos;      // [x, y, brightness] لكل نقطة MW
    private static double[][] cPleiPos;    // [alt, az] للثريا
    private static double[][] cDsoPos;     // [alt, az] للأجرام العميقة
    private static double    cGmst;        // نستخدمه في رسم درب التبانة
    private static double    cLat;         // لتحديد ظهور الشفق القطبي

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

                double[] venus = planetPosition(jd, lat, lng, 181.979,  1.6021302, 0.387098, 0.723);
                cVenusAlt = venus[0]; cVenusAz = venus[1];

                double[] jup   = planetPosition(jd, lat, lng,  34.351,  0.0830853, 5.458104, 5.203);
                cJupAlt = jup[0]; cJupAz = jup[1];

                double[] mars  = planetPosition(jd, lat, lng, 355.433,  0.5240707, 1.523688, 1.524);
                cMarsAlt = mars[0]; cMarsAz = mars[1];

                double[] sat   = planetPosition(jd, lat, lng,  50.077,  0.0334597, 8.997011, 9.537);
                cSatAlt = sat[0]; cSatAz = sat[1];

                double[] merc  = planetPosition(jd, lat, lng, 252.251,  4.0923345, 0.240846, 0.387);
                cMercAlt = merc[0]; cMercAz = merc[1];

                cGmst = greenwichSiderealTime(jd);

                // مواقع النجوم
                cStarPos = new double[STARS.length][2];
                for (int i = 0; i < STARS.length; i++) {
                    double[] hp = raDecToAltAz(STARS[i][0], STARS[i][1], lat, lng, cGmst);
                    cStarPos[i][0] = hp[0];
                    cStarPos[i][1] = hp[1];
                }

                // مواقع الثريا
                cPleiPos = new double[PLEIADES.length][2];
                for (int i = 0; i < PLEIADES.length; i++) {
                    double[] hp = raDecToAltAz(PLEIADES[i][0], PLEIADES[i][1], lat, lng, cGmst);
                    cPleiPos[i][0] = hp[0];
                    cPleiPos[i][1] = hp[1];
                }

                // مواقع درب التبانة
                cMwPos = new double[MW_KNOTS.length][3];
                for (int i = 0; i < MW_KNOTS.length; i++) {
                    double[] hp = raDecToAltAz(MW_KNOTS[i][0], MW_KNOTS[i][1], lat, lng, cGmst);
                    cMwPos[i][0] = hp[0]; // alt
                    cMwPos[i][1] = hp[1]; // az
                    cMwPos[i][2] = MW_KNOTS[i][3]; // brightness
                }

                // مواقع الأجرام العميقة
                cDsoPos = new double[DSO.length][2];
                for (int i = 0; i < DSO.length; i++) {
                    double[] hp = raDecToAltAz(DSO[i][0], DSO[i][1], lat, lng, cGmst);
                    cDsoPos[i][0] = hp[0];
                    cDsoPos[i][1] = hp[1];
                }

                cLat = lat;

            } else {
                cSunAlt = fallbackSunAlt(now, fajrMs, sunriseMs, dhuhrMs, asrMs, maghribMs, ishaMs);
                cSunAz  = fallbackSunAz(now, sunriseMs, maghribMs);
                cMoonAlt = 38; cMoonAz = 220;
                cVenusAlt = -1; cJupAlt = 30; cJupAz = 180;
                cMarsAlt  = 25; cMarsAz  = 150;
                cSatAlt   = 20; cSatAz   = 200;
                cMercAlt  = -5;
                cLat = lat;
                Random rnd = new Random(42);
                cStarPos = new double[STARS.length][2];
                for (int i = 0; i < STARS.length; i++) {
                    cStarPos[i][0] = 8 + rnd.nextDouble() * 72;
                    cStarPos[i][1] = rnd.nextDouble() * 360;
                }
                cMwPos = null;
                cPleiPos = null;
                cDsoPos  = null;
            }

            cMoonPhase = moonPhase(jd);
        }

        // ── الرسم ──────────────────────────────────────────────────────────
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c   = new Canvas(bmp);
        Paint  p   = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);

        float sunX  = azToX(cSunAz,  w);
        float sunY  = altToY(cSunAlt, h);
        float moonX = azToX(cMoonAz, w);
        float moonY = altToY(cMoonAlt, h);

        // 00. تحديث نظام الطقس الموسمي
        updateWeatherState(now, cLat);

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

        // 15. كوكب الزهرة
        if (cVenusAlt > 1.5) drawPlanet(c, p, cVenusAlt, cVenusAz, w, h, 0xFFDDF4FF, 3.8f, false);
        // 16. كوكب المشتري
        if (cJupAlt   > 1.5) drawPlanet(c, p, cJupAlt,   cJupAz,   w, h, 0xFFFFEECC, 4.5f, false);
        // 17. كوكب المريخ (أحمر مميز)
        if (cMarsAlt  > 1.5) drawPlanet(c, p, cMarsAlt,  cMarsAz,  w, h, 0xFFFF6644, 3.5f, false);
        // 18. كوكب زحل (مع حلقة)
        if (cSatAlt   > 1.5) drawSaturn(c, p, cSatAlt,   cSatAz,   w, h);
        // 19. عطارد (قرب الأفق فقط)
        if (cMercAlt  > 1.5 && cMercAlt < 18) drawPlanet(c, p, cMercAlt, cMercAz, w, h, 0xFFFFEEDD, 2.5f, false);

        // 20. شهاب موسمي ذكي
        drawShootingStar(c, w, h, p, cSunAlt, now);

        // 21. قمر اصطناعي / ISS
        drawSatellite(c, w, h, p, cSunAlt, now);

        // 22. القمر المحسّن: Mare + تلوّن بالأفق + Blood Moon
        if (cMoonAlt > -2) drawMoon(c, p, moonX, moonY, h, w, cMoonPhase, cMoonAlt, cSunAlt, now);

        // 23. الوميض الأخضر — Green Flash لحظة الغروب
        drawGreenFlash(c, w, h, p, cSunAlt, sunX, sunY);

        // 24. أشعة الإله / Crepuscular Rays
        if (cSunAlt > -3) drawCrepuscularRays(c, w, h, p, cSunAlt, sunX, sunY);

        // 25. أشعة مضادة (Anti-crepuscular) تتقاطع بالجانب المقابل
        drawAntiCrepuscularRays(c, w, h, p, cSunAlt, cSunAz);

        // 26. Sundog / Parhelion — بجانب الشمس
        if (cSunAlt > 0 && cSunAlt < 28) drawSundog(c, w, h, p, cSunAlt, sunX, sunY);

        // 27. Circumzenithal Arc — قوس ملون فوق الشمس
        if (cSunAlt > 22 && cSunAlt < 62) drawCircumzenithalArc(c, w, h, p, cSunAlt, sunX);

        // 28. الشمس (Oblate + Corona + عمود شمسي)
        if (cSunAlt > -3) drawSun(c, p, sunX, sunY, w, h, cSunAlt);

        // 29. سحاب Cirrus طبقة علوية رفيعة
        drawCirrus(c, w, h, p, cSunAlt, sunX, now);

        // 30. سحاب Cumulus (كثافة موسمية حسب نظام الطقس)
        drawClouds(c, w, h, p, cSunAlt, sunX, sunY, now);

        // 30.5. غطاء الغيوم الكثيف (overcast / stormy)
        drawOvercastVeil(c, w, h, p, cSunAlt);

        // 31. سحاب Cumulonimbus + مطر + برق (نشط فقط في حالة العاصفة)
        drawCumulonimbus(c, w, h, p, cSunAlt, now);

        // 32. آثار الطائرات (Contrails)
        drawContrails(c, w, h, p, cSunAlt, now);

        // 33. تلوث ضوئي للمدن
        drawLightPollution(c, w, h, p, cSunAlt);

        // 34. خط الأفق
        drawHorizonLine(c, w, h, p, cSunAlt);

        // 35. ضباب الأرض عند الفجر/الغروب
        drawGroundFog(c, w, h, p, cSunAlt, now);

        // 36. سكاي لاين — أبراج المدينة الواقعية
        drawCitySilhouette(c, w, h, p, cSunAlt, now);

        // 37. حواف دائرية
        applyRoundedCorners(bmp, w, h);

        return bmp;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 01. تدرج السماء — Rayleigh Scattering محسّن
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
        // [زينيث، ربع عالٍ، وسط، قريب أفق، طبقة أفق، أفق]  — 6 stops
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
    // 02. ضباب Mie عند الأفق (Atmospheric Haze)
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

        // الجانب المقابل للشمس
        double antiAz = (sunAz + 180) % 360;
        float  antiX  = azToX(antiAz, w);

        // ظل الأرض — شريط أزرق داكن قرب الأفق
        float shadowTop = h * 0.62f;
        float shadowBot = h * 0.82f;
        p.setShader(new LinearGradient(0, shadowTop, 0, shadowBot,
            new int[]{ Color.argb(0, 30, 50, 110), Color.argb(shadowAlpha, 30, 55, 120) },
            null, Shader.TileMode.CLAMP));
        p.setStyle(Paint.Style.FILL);
        // نرسم RadialGradient مركزه على antiX
        p.setShader(new RadialGradient(antiX, h * 0.9f, w * 0.85f,
            new int[]{ Color.argb(shadowAlpha, 28, 48, 120),
                       Color.argb(shadowAlpha / 2, 30, 50, 110),
                       Color.argb(0, 20, 40, 90) },
            new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.55f, w, h, p);
        p.setShader(null);

        // Belt of Venus — شريط وردي فوق الظل
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

        // توهج الغروب/الشروق
        int innerColor = sunAlt < 2 ? Color.argb(a, 255, 100, 15) : Color.argb(a, 255, 190, 70);
        int midColor   = sunAlt < 2 ? Color.argb(a/2, 255, 55, 0) : Color.argb(a/2, 255, 150, 0);
        p.setShader(new RadialGradient(sunX, h * 0.92f, w * 0.80f,
            new int[]{ innerColor, midColor, Color.argb(0, 255, 80, 0) },
            new float[]{ 0f, 0.38f, 1f }, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(sunX - w * 0.8f, h * 0.45f, sunX + w * 0.8f, h * 1.12f), p);
        p.setShader(null);

        // Blue Hour على الجانب الآخر
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
    // 05. نور الزودياك
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawZodiacalLight(Canvas c, int w, int h, Paint p,
                                          double sunAlt, double sunAz) {
        if (sunAlt < -20 || sunAlt > -4) return;

        double t = Math.min(1, (-sunAlt - 4) / 16.0);
        int alpha = (int)(50 * t);

        // مخروط يمتد من اتجاه الشمس نحو الأعلى على طول دائرة البروج
        float sx = azToX(sunAz, w);
        p.setShader(new RadialGradient(sx, h, w * 0.45f,
            new int[]{ Color.argb(alpha, 255, 250, 220),
                       Color.argb(alpha / 2, 240, 230, 190),
                       Color.argb(0, 220, 210, 170) },
            new float[]{ 0f, 0.4f, 1f }, Shader.TileMode.CLAMP));
        Path cone = new Path();
        cone.moveTo(sx, h);
        cone.lineTo(sx - w * 0.22f, h * 0.15f);
        cone.lineTo(sx + w * 0.22f, h * 0.15f);
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

            // عرض الكتلة المجرية على الشاشة
            float widthDeg = (float) MW_KNOTS[i][2];
            float radiusPx = (widthDeg / 90f) * h * 0.55f;

            // ارتفاع أقل من الأفق — نقص التوهج تدريجياً
            double altFade = alt < 5 ? Math.max(0, (alt + 8) / 13.0) : 1.0;
            int alpha = (int)(58 * brig * darkness * altFade);
            if (alpha < 3) continue;

            // مركز درب التبانة أكثر كثافة ويميل للأحمر/البني
            int r, g, b;
            if (brig > 0.7) {           // المنطقة المركزية — دافئة اللون
                r = 255; g = 240; b = 200;
            } else if (brig > 0.4) {    // مناطق متوسطة — أبيض-أصفر
                r = 245; g = 248; b = 235;
            } else {                    // أطراف — أبيض-أزرق خفيف
                r = 220; g = 228; b = 255;
            }

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
    // 07. النجوم — ألوان طيفية حقيقية + توهج + هالة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawStars(Canvas c, int w, int h, Paint p,
                                  double sunAlt, double moonPhase, long now) {
        if (sunAlt > -4) return;

        double maxMag;
        if      (sunAlt > -10) maxMag = 0.0;
        else if (sunAlt > -14) maxMag = 1.8;
        else if (sunAlt > -18) maxMag = 3.5;
        else                   maxMag = 5.0;

        double moonIll = moonIllumination(moonPhase);
        if (moonIll > 0.35 && cMoonAlt > 8) maxMag -= (moonIll - 0.35) * 2.5;

        float dark = (float) Math.min(1, (-sunAlt - 4) / 14.0);
        p.setStyle(Paint.Style.FILL);

        // ── نجم الغول Algol المتغير (index 43) ──
        // الفترة 2.8673043 يوم، عند الحد الأدنى mag=3.4 لمدة ~2 ساعة
        double algolPeriod = 2.8673043 * 86400.0;
        double algolRef    = 2452885.50;
        double algolJd     = julianDate(now);
        double algolPhase  = ((algolJd - algolRef) % algolPeriod / algolPeriod + 1) % 1;
        double algolMag    = 2.12;
        if (algolPhase < 0.04 || algolPhase > 0.96) {
            double dp = Math.min(algolPhase, 1 - algolPhase) / 0.04;
            algolMag  = 2.12 + (3.4 - 2.12) * (1 - dp * dp);
        }

        for (int i = 0; i < STARS.length && cStarPos != null; i++) {
            double mag = (i == 43) ? algolMag : STARS[i][2];
            if (mag > maxMag) continue;
            double alt = cStarPos[i][0], az = cStarPos[i][1];

            // تصحيح انكسار جوي: النجوم تبدو أعلى قرب الأفق
            if (alt < 0.5) continue;
            double apparentAlt = alt + refractionCorrection(alt);
            float sx = azToX(az, w);
            float sy = altToY(apparentAlt, h);
            if (sx < -10 || sx > w + 10 || sy < -10 || sy > h + 10) continue;

            float bright = (float)(1.0 - (mag + 1.6) / 6.8);
            bright = Math.max(0.06f, Math.min(1f, bright));

            // توهج غير متزامن (twinkle) — أقوى قرب الأفق
            double period = STARS[i][3];
            float twinkleAmp = (float) Math.min(0.35, 0.12 + 0.23 * Math.max(0, (20 - alt) / 20));
            float twinkle = (1f - twinkleAmp) + twinkleAmp *
                (float) Math.sin((now % (long)period) / period * 2 * Math.PI);
            bright *= twinkle * dark;

            // اللون الطيفي
            int specClass = (int) Math.max(0, Math.min(5, STARS[i][4]));
            // الغول عند الحد الأدنى يميل للأحمر قليلاً
            if (i == 43 && algolMag > 2.8) specClass = 4;
            int starColor = SPECTRAL_COLORS[specClass];
            int sr = Color.red(starColor), sg = Color.green(starColor), sb = Color.blue(starColor);

            int a = (int)(255 * bright);
            float r = 0.55f + bright * 2.2f;

            // هالة للنجوم اللامعة جداً (< 1.0 حجماً ظاهرياً)
            if (STARS[i][2] < 1.0) {
                float haloR = r * (STARS[i][2] < 0 ? 7f : 5f);
                p.setShader(new RadialGradient(sx, sy, haloR,
                    new int[]{ Color.argb(a / 3, sr, sg, sb), Color.argb(0, sr, sg, sb) },
                    null, Shader.TileMode.CLAMP));
                c.drawCircle(sx, sy, haloR, p);
                p.setShader(null);
            }

            // جسم النجمة
            p.setColor(Color.argb(a, sr, sg, sb));
            c.drawCircle(sx, sy, r, p);

            // بريق صليبي للنجوم الألمع جداً
            if (STARS[i][2] < -0.3 && dark > 0.6) {
                drawStarSpike(c, p, sx, sy, r * 6f, a / 2, sr, sg, sb);
            }
        }
    }

    /** بريق صليبي (Diffraction Spike) للنجوم شديدة الإضاءة */
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

        // توهج ضبابي حول المجموعة (Nebulosity)
        float cx = azToX(cPleiPos[0][1], w);
        float cy = altToY(cPleiPos[0][0], h);
        if (cx < -20 || cx > w + 20 || cy < -20 || cy > h + 20) return;
        if (cPleiPos[0][0] < 2) return;

        int nebAlpha = (int)(28 * dark);
        p.setShader(new RadialGradient(cx, cy, h * 0.07f,
            new int[]{ Color.argb(nebAlpha, 180, 200, 255), Color.argb(0, 160, 180, 255) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(cx, cy, h * 0.07f, p);
        p.setShader(null);

        // نجوم الثريا الفردية
        p.setStyle(Paint.Style.FILL);
        for (int i = 0; i < PLEIADES.length && cPleiPos != null; i++) {
            double alt = cPleiPos[i][0];
            if (alt < 2) continue;
            float sx = azToX(cPleiPos[i][1], w);
            float sy = altToY(alt, h);
            float bright = (float)(0.6 - (PLEIADES[i][2] - 2.5) / 4.0);
            bright = (float)(bright * dark);
            if (bright < 0.05) continue;
            // توهج
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

        // هالة الكوكب
        p.setShader(new RadialGradient(x, y, r * 6.5f,
            new int[]{ Color.argb(70, cr, cg, cb), Color.argb(0, cr, cg, cb) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r * 6.5f, p);
        p.setShader(null);

        // قرص الكوكب
        p.setShader(new RadialGradient(x - r * 0.25f, y - r * 0.25f, r * 1.4f,
            new int[]{ Color.argb(255, Math.min(255, cr + 30), Math.min(255, cg + 30), Math.min(255, cb + 30)),
                       color },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r, p);
        p.setShader(null);
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

        // هالة
        p.setShader(new RadialGradient(x, y, r * 7,
            new int[]{ Color.argb(60, 255, 240, 180), Color.argb(0, 255, 230, 160) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r * 7, p);
        p.setShader(null);

        // حلقة زحل (ellipse مائلة)
        Paint ringPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringPaint.setStyle(Paint.Style.STROKE);
        ringPaint.setStrokeWidth(1.8f);
        ringPaint.setColor(Color.argb(180, 255, 235, 160));
        RectF ringRect = new RectF(x - r * 2.4f, y - r * 0.7f, x + r * 2.4f, y + r * 0.7f);
        c.drawOval(ringRect, ringPaint);

        // قرص الكوكب (فوق الحلقة)
        p.setShader(new RadialGradient(x - r * 0.2f, y - r * 0.2f, r * 1.3f,
            new int[]{ 0xFFFFEEAA, 0xFFDDB860 }, null, Shader.TileMode.CLAMP));
        c.drawCircle(x, y, r, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 14. شهاب عشوائي محسّن
    // ═══════════════════════════════════════════════════════════════════════
    private static long  sLastStart = 0, sNextDelay = 0;
    private static float sX1, sY1, sX2, sY2;

    private static long  satLastPass = 0, satNextPass = 0;
    private static float satX1, satY1, satX2, satY2;
    private static boolean satFlare = false;

    // Cumulonimbus storm state
    private static long  cbStormStart = 0, cbStormDur = 0, cbStormNext = 180_000L;
    private static float cbCloudX = 0.62f, cbCloudW = 0;
    private static long  cbBoltTime = 0;
    private static float cbBoltX1, cbBoltY1;

    // ── نظام الطقس الموسمي ──────────────────────────────────
    private static final int WS_CLEAR    = 0;
    private static final int WS_PARTLY   = 1;
    private static final int WS_OVERCAST = 2;
    private static final int WS_STORMY   = 3;
    private static final int WS_FOGGY    = 4;
    private static int   wsCurrent   = WS_PARTLY;
    private static int   wsNextState  = WS_PARTLY;
    private static float wsTrans      = 1.0f;     // 0→1 اكتمال التحول
    private static long  wsChanged    = 0L;
    private static long  wsHold       = 600_000L; // مدة الحالة الحالية (ms)
    private static float wsCloudMult  = 0.5f;     // مضاعف كثافة السحاب
    private static float wsFogMult    = 0.0f;     // مضاعف الضباب
    private static float wsStormMult  = 0.0f;     // مضاعف العاصفة
    private static float wsOvercast   = 0.0f;     // شفافية غطاء الغيوم

    // ═══════════════════════════════════════════════════════════════════════
    // 09. خطوط الكوكبات — ست كوكبات عربية خافتة الخطوط
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawConstellations(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > -14 || cStarPos == null) return;
        float dark = (float) Math.min(1, (-sunAlt - 14) / 10.0);
        int alpha = (int)(30 * dark);
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
    // 08-extra. الأجرام السماوية العميقة — M31 + M42
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
                // M31 — مجرة أندروميدا: بيضاوي ضبابي
                float rx = h * 0.065f, ry = h * 0.022f;
                int a = (int)(28 * dark);
                p.setStyle(Paint.Style.FILL);
                p.setShader(new RadialGradient(sx, sy, rx,
                    new int[]{ Color.argb(a, 220, 230, 255),
                               Color.argb(a / 3, 180, 200, 255),
                               Color.argb(0, 160, 180, 255) },
                    new float[]{ 0f, 0.45f, 1f }, Shader.TileMode.CLAMP));
                RectF rf = new RectF(sx - rx, sy - ry, sx + rx, sy + ry);
                c.drawOval(rf, p);
                p.setShader(null);
                // نواة ساطعة
                p.setColor(Color.argb(Math.min(255, a * 3), 240, 245, 255));
                c.drawCircle(sx, sy, 2.5f, p);
            } else {
                // M42 — سديم الجبار: توهج أخضر-أزرق لطيف
                float rOuter = h * 0.045f;
                int a = (int)(22 * dark);
                long seed = now / 300_000L;
                float twistOff = (float)(new Random(seed).nextFloat() * 0.3f - 0.15f);
                p.setStyle(Paint.Style.FILL);
                p.setShader(new RadialGradient(sx + twistOff * rOuter, sy,
                    rOuter,
                    new int[]{ Color.argb(a, 160, 220, 200),
                               Color.argb(a / 2, 120, 180, 200),
                               Color.argb(0, 80, 140, 180) },
                    new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
                c.drawCircle(sx, sy, rOuter, p);
                p.setShader(null);
                // نجوم الجبار الأربعة Trapezium
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
    // 05-extra. الشفق القطبي — Aurora Borealis (خطوط عرض > 52°)
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

            // لون: أخضر أساسي (oxygen 557nm) مع أحيان أرجواني (nitrogen)
            boolean purple = rnd.nextFloat() < 0.25f;
            int cr = purple ? 160 : 40;
            int cg = purple ? 40  : 210;
            int cb = purple ? 200 : 100;

            Path path = new Path();
            float x0 = 0;
            float y0  = baseY + bandOffset + (float)(Math.sin(waveFreq * x0 + phaseShift) * waveAmp);
            path.moveTo(x0, y0);

            int steps = 60;
            float[] xs = new float[steps + 1], ys = new float[steps + 1];
            for (int s = 0; s <= steps; s++) {
                float xp = (float) s / steps * w;
                float yp = baseY + bandOffset
                    + (float)(Math.sin(waveFreq * xp + phaseShift) * waveAmp)
                    + (float)(Math.sin(waveFreq * 2.3 * xp + phaseShift * 1.7) * waveAmp * 0.4);
                xs[s] = xp; ys[s] = yp;
                if (s == 0) path.moveTo(xp, yp);
                else path.lineTo(xp, yp);
            }

            // رسم شريط عمودي (ستارة) لكل نقطة
            Paint aurPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            aurPaint.setStyle(Paint.Style.STROKE);
            aurPaint.setStrokeWidth(1.2f);
            int curtainStep = 4;
            for (int s = 0; s < steps; s += curtainStep) {
                float curtainAlpha = bandAlpha * (0.4f + 0.6f * (float)Math.random());
                int ca = (int)(curtainAlpha * 90);
                if (ca < 5) continue;
                float bx = xs[s], by = ys[s];
                float curtainLen = h * 0.06f * (0.5f + rnd.nextFloat());
                aurPaint.setShader(new LinearGradient(bx, by, bx, by + curtainLen,
                    Color.argb(ca, cr, cg, cb), Color.argb(0, cr, cg, cb),
                    Shader.TileMode.CLAMP));
                c.drawLine(bx, by, bx, by + curtainLen, aurPaint);
            }

            // طبقة ضبابية أسفل الموجة
            Paint fogPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            fogPaint.setStyle(Paint.Style.FILL);
            for (int s = 0; s < steps; s += 2) {
                float bx = xs[s], by = ys[s];
                float fogR = h * 0.025f;
                int fa = (int)(bandAlpha * 18);
                if (fa < 2) continue;
                fogPaint.setShader(new RadialGradient(bx, by, fogR,
                    Color.argb(fa, cr, cg, cb), Color.argb(0, cr, cg, cb),
                    Shader.TileMode.CLAMP));
                c.drawCircle(bx, by, fogR, fogPaint);
            }
        }
    }

    private static void drawShootingStar(Canvas c, int w, int h, Paint p,
                                         double sunAlt, long now) {
        if (sunAlt > -11) return;
        if (sNextDelay == 0) sNextDelay = 60_000L;

        // ── حساب معامل تكثيف الشهب الموسمية ──
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

        // الفترة بين الشهب تقل مع كثافة المطر
        long baseDelay = (long)(60_000L / showerRate);

        if (now - sLastStart > sNextDelay) {
            sLastStart = now;
            Random rnd = new Random(now / 1000L);
            sNextDelay = (long)(baseDelay * (0.5f + rnd.nextFloat())) ;
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

        // ذيل: خلال أمطار الشهب يميل للأصفر-البرتقالي
        int tc = (showerRate > 3) ? Color.argb(a, 255, 240, 180) : Color.argb(a, 255, 255, 255);
        Paint trail = new Paint(Paint.ANTI_ALIAS_FLAG);
        trail.setShader(new LinearGradient(tx, ty, cx, cy,
            Color.argb(0, 255, 252, 240), tc, Shader.TileMode.CLAMP));
        trail.setStrokeWidth(showerRate > 3 ? 2.5f : 2.0f);
        trail.setStyle(Paint.Style.STROKE);
        trail.setStrokeCap(Paint.Cap.ROUND);
        c.drawLine(tx, ty, cx, cy, trail);

        // رأس لامع
        p.setShader(new RadialGradient(cx, cy, 6,
            new int[]{ Color.argb(a, 255, 255, 255), Color.argb(0, 255, 255, 255) },
            null, Shader.TileMode.CLAMP));
        c.drawCircle(cx, cy, 6, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 15. القمر المحسّن — فوهات + Earthshine + هالة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawMoon(Canvas c, Paint p, float x, float y,
                                 int h, int w, double phase, double moonAlt,
                                 double sunAlt, long now) {
        float r  = h * 0.075f;
        float yy = Math.max(r + 4, Math.min(y, (float)(h - r - 4)));
        double ill = moonIllumination(phase);

        // ── تلوّن القمر بالأفق (Rayleigh + Mie للقمر) ──
        // moonAlt < 15 → برتقالي، < 5 → أحمر دموي (Blood Moon عند بدر)
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

        // ── هالة القمر 22° ──
        if (ill > 0.15 && sunAlt < 0) {
            float halo22 = r * 5.5f;
            int haloClr = bloodMoon ? Color.argb((int)(20 * ill), 220, 80, 40)
                                    : Color.argb((int)(25 * ill), 230, 230, 200);
            Paint haloPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            haloPaint.setStyle(Paint.Style.STROKE);
            haloPaint.setStrokeWidth(1.2f);
            haloPaint.setColor(haloClr);
            c.drawCircle(x, yy, halo22, haloPaint);

            // Aureole — توهج ملون داخلي
            int aurClr = bloodMoon ? Color.argb((int)(45 * ill), 255, 80, 30)
                                   : Color.argb((int)(50 * ill), 240, 238, 200);
            p.setShader(new RadialGradient(x, yy, r * 4.0f,
                new int[]{ aurClr, Color.argb(0, Color.red(aurClr), Color.green(aurClr), Color.blue(aurClr)) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(x, yy, r * 4.0f, p);
            p.setShader(null);
        }

        // ── الجانب المظلم ──
        p.setColor(0xFF080E1C); p.setStyle(Paint.Style.FILL);
        c.drawCircle(x, yy, r, p);

        // ── Earthshine — إضاءة خافتة جداً للجانب المظلم ──
        if (ill < 0.35 && sunAlt < 0) {
            int esAlpha = (int)(18 * (1 - ill / 0.35));
            p.setColor(Color.argb(esAlpha, 60, 90, 140));
            c.drawCircle(x, yy, r, p);
        }

        // ── الجانب المضيء ──
        if (ill > 0.012) {
            double phAngle = phase * 2 * Math.PI;
            float term = r * (float)Math.cos(phAngle);
            boolean waning = (phase > 0.5);

            Path mp = new Path();
            RectF oval = new RectF(x - r, yy - r, x + r, yy + r);
            float absT = Math.abs(term);

            if (!waning) {
                mp.addArc(oval, -90, 180);
                if (term >= 0) mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), 90, 180);
                else           mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), 90, -180);
            } else {
                mp.addArc(oval, 90, 180);
                if (term >= 0) mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), -90, 180);
                else           mp.arcTo(new RectF(x - absT, yy - r, x + absT, yy + r), -90, -180);
            }
            mp.close();

            // سطح مضيء مع لون متغير
            p.setShader(new RadialGradient(x + term * 0.2f, yy - r * 0.1f, r * 1.25f,
                new int[]{ moonBase1, moonBase2, moonBase3 },
                new float[]{ 0f, 0.60f, 1f }, Shader.TileMode.CLAMP));
            c.drawPath(mp, p);
            p.setShader(null);

            // ── بحار القمر Mare (مناطق بازالت داكنة) ──
            if (ill > 0.25 && !bloodMoon) drawMoonMare(c, x, yy, r, phase, ill, mp);

            // ── فوهات القمر على الجانب المضيء ──
            if (ill > 0.15 && r > 8) drawMoonCraters(c, x, yy, r, phase, ill);
        }

        // ── Blood Moon atmospheric ring ──
        if (bloodMoon) {
            p.setShader(new RadialGradient(x, yy, r * 1.35f,
                new int[]{ Color.argb(0, 255, 60, 0),
                           Color.argb(90, 255, 40, 0),
                           Color.argb(0,  255, 20, 0) },
                new float[]{ 0.7f, 0.88f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(x, yy, r * 1.35f, p);
            p.setShader(null);
        }
    }

    /** بحار القمر الداكنة — Maria Regions */
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
        int alpha = (int)(32 * Math.min(1, (ill - 0.25) / 0.75));
        Paint mp2 = new Paint(Paint.ANTI_ALIAS_FLAG);
        mp2.setStyle(Paint.Style.FILL);
        c.save();
        c.clipPath(clipPath);
        for (float[] m : mare) {
            float cx = mx + m[0] * r, cy = my + m[1] * r;
            float rx = m[2] * r,      ry = m[3] * r;
            mp2.setShader(new RadialGradient(cx, cy, Math.max(rx, ry),
                new int[]{ Color.argb(alpha, 35, 30, 28),
                           Color.argb(alpha / 2, 55, 50, 45),
                           Color.argb(0, 80, 75, 70) },
                new float[]{ 0f, 0.55f, 1f }, Shader.TileMode.CLAMP));
            c.drawOval(new RectF(cx - rx, cy - ry, cx + rx, cy + ry), mp2);
        }
        c.restore();
        mp2.setShader(null);
    }

    /** فوهات قمرية واقعية */
    private static void drawMoonCraters(Canvas c, float mx, float my, float r,
                                        double phase, double ill) {
        // مواقع نسبية لأبرز الفوهات { x_rel, y_rel, r_rel }
        float[][] craters = {
            { 0.25f, -0.10f, 0.065f }, // Tycho
            {-0.15f,  0.30f, 0.055f }, // Copernicus
            { 0.40f, -0.35f, 0.045f }, // Clavius (north)
            {-0.30f, -0.20f, 0.038f }, // Plato
            { 0.10f,  0.45f, 0.040f }, // Grimaldi
            {-0.20f,  0.05f, 0.032f }, // Mare Imbrium hint
        };

        Paint cp = new Paint(Paint.ANTI_ALIAS_FLAG);
        cp.setStyle(Paint.Style.FILL);
        int alpha = (int)(35 * ill);

        for (float[] cr : craters) {
            float cx = mx + cr[0] * r;
            float cy = my + cr[1] * r;
            float cr2 = cr[2] * r;
            // ظل الفوهة
            cp.setColor(Color.argb(alpha, 80, 65, 45));
            c.drawCircle(cx, cy, cr2, cp);
            // انعكاس ضوء داخل الفوهة
            cp.setColor(Color.argb(alpha / 2, 255, 248, 220));
            c.drawCircle(cx - cr2 * 0.25f, cy - cr2 * 0.25f, cr2 * 0.55f, cp);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 16. أشعة الإله / Crepuscular Rays
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawCrepuscularRays(Canvas c, int w, int h, Paint p,
                                            double sunAlt, float sunX, float sunY) {
        if (sunAlt < -8 || sunAlt > 20) return;

        double intensity = 0;
        if (sunAlt < 0)       intensity = 1.0 - Math.abs(sunAlt) / 8.0;
        else if (sunAlt < 8)  intensity = 1.0 - sunAlt / 8.0;
        else                  intensity = (20 - sunAlt) / 12.0;
        intensity = Math.max(0, Math.min(1, intensity));

        Random rnd = new Random(12345); // ثابت — نفس الأشعة دائماً
        int numRays = 9;

        for (int i = 0; i < numRays; i++) {
            double angle = -Math.PI / 2 + (i - numRays / 2.0) * (Math.PI * 0.16) +
                           rnd.nextDouble() * 0.15;
            float ex = sunX + (float)(Math.cos(angle) * w * 1.5);
            float ey = sunY + (float)(Math.sin(angle) * w * 1.5);
            float rayW = (0.8f + rnd.nextFloat() * 2.5f);
            int alpha = (int)((25 + rnd.nextFloat() * 30) * intensity);

            Paint rayPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            rayPaint.setShader(new LinearGradient(sunX, sunY, ex, ey,
                Color.argb(alpha, 255, 245, 200),
                Color.argb(0, 255, 240, 180),
                Shader.TileMode.CLAMP));
            rayPaint.setStyle(Paint.Style.STROKE);
            rayPaint.setStrokeWidth(rayW);
            rayPaint.setStrokeCap(Paint.Cap.ROUND);
            c.drawLine(sunX, sunY, ex, ey, rayPaint);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 16. الشمس المحسّنة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawSun(Canvas c, Paint p, float x, float y, int w, int h, double sunAlt) {
        float sizeMult = (sunAlt < 10) ? (1.0f + (float)(10 - sunAlt) * 0.025f) : 1.0f;
        float r  = h * 0.070f * sizeMult;
        float yy = Math.max(r + 4, Math.min(y, (float)(h * 1.05)));

        // تسطّح الشمس عند الأفق — Oblate Effect (انكسار جوي)
        float oblateness = (sunAlt < 5) ? (float)(1.0 - Math.max(0, sunAlt) / 5.0 * 0.18) : 1.0f;
        float ry = r * oblateness; // نصف القطر الرأسي أقصر قرب الأفق

        boolean lowSun = (sunAlt < 10);

        int centerColor, edgeColor;
        if (sunAlt > 20) { centerColor = 0xFFFFFFF0; edgeColor = 0xFFFFF080; }
        else if (sunAlt > 8) { centerColor = 0xFFFFFECC; edgeColor = 0xFFFFEC44; }
        else if (sunAlt > 2) { centerColor = 0xFFFFE888; edgeColor = 0xFFFF9000; }
        else                 { centerColor = 0xFFFFCC44; edgeColor = 0xFFFF4400; }

        // هالة خارجية كبيرة
        int haloInner = lowSun ? Color.argb(100, 255, 110, 5) : Color.argb(80, 255, 200, 50);
        int haloMid   = lowSun ? Color.argb(40,  255,  60, 0) : Color.argb(30, 255, 170, 0);
        p.setShader(new RadialGradient(x, yy, r * 11f,
            new int[]{ haloInner, haloMid, Color.argb(0, 255, 120, 0) },
            new float[]{ 0f, 0.3f, 1f }, Shader.TileMode.CLAMP));
        c.drawCircle(x, yy, r * 11f, p);
        p.setShader(null);

        // Corona محسّنة بـ 8 أشعة خفيفة
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
                Color.argb(lowSun ? 50 : 35, 255, 240, 180),
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

        // قرص الشمس — Oblate عند الأفق + Limb Darkening
        p.setShader(new RadialGradient(x, yy, r,
            new int[]{ centerColor, edgeColor, lerpColor(edgeColor, 0xFF884400, 0.5f) },
            new float[]{ 0f, 0.72f, 1f }, Shader.TileMode.CLAMP));
        c.drawOval(new RectF(x - r, yy - ry, x + r, yy + ry), p);
        p.setShader(null);

        // Solar Pillar عند الغروب/الشروق
        if (sunAlt < 4 && sunAlt > -5) {
            float pillarAlpha = (float)(1.0 - Math.abs(sunAlt) / 5.0) * 60;
            p.setShader(new LinearGradient(x, yy - r * 5, x, yy + r * 3,
                new int[]{ Color.argb(0, 255, 200, 80),
                           Color.argb((int)pillarAlpha, 255, 180, 60),
                           Color.argb(0, 255, 160, 40) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(x - r * 0.5f, yy - r * 5, x + r * 0.5f, yy + r * 3, p);
            p.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 17. سحاب محسّن — أشكال عضوية + إضاءة صحيحة
    // ═══════════════════════════════════════════════════════════════════════
    private static final float[][] CLOUD_SEEDS = {
        { 0.04f, 0.10f, 0.32f, 0, 16, 2.2f }, // طبقة بعيدة
        { 0.52f, 0.08f, 0.27f, 0, 14, 1.8f },
        { 0.80f, 0.14f, 0.30f, 0, 15, 2.0f },
        { 0.28f, 0.19f, 0.22f, 0, 13, 1.6f },
        { 0.13f, 0.28f, 0.24f, 1, 15, 1.9f }, // طبقة وسطى
        { 0.60f, 0.25f, 0.28f, 1, 16, 2.1f },
        { 0.86f, 0.22f, 0.20f, 1, 13, 1.7f },
        { 0.38f, 0.36f, 0.26f, 1, 14, 1.8f },
        { 0.20f, 0.44f, 0.19f, 2, 13, 1.5f }, // طبقة أمامية
        { 0.66f, 0.40f, 0.24f, 2, 14, 1.7f },
        { 0.46f, 0.50f, 0.17f, 2, 12, 1.4f },
    };
    private static final float[] LAYER_SPEED = { 0.003f, 0.006f, 0.011f };

    // ═══════════════════════════════════════════════════════════════════════
    // الظواهر الجوية الجديدة — 8 دوال
    // ═══════════════════════════════════════════════════════════════════════

    /** Alpenglow — الوهج الوردي البنفسجي على الأفق بعد الغروب مباشرة */
    private static void drawAlpenglow(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > 0 || sunAlt < -8) return;
        float t = (float)((sunAlt + 8) / 8.0); // 1 عند -0، 0 عند -8
        int alpha = (int)(55 * t * t);
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

    /** Gegenschein — توهج خافت مقابل الشمس تماماً في الليل الداكن */
    private static void drawGegenschein(Canvas c, int w, int h, Paint p,
                                        double sunAlt, double sunAz) {
        if (sunAlt > -18) return;
        float dark = (float) Math.min(1, (-sunAlt - 18) / 10.0);
        int alpha = (int)(14 * dark);
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

    /** Airglow — توهج أخضر-أصفر خفيف للغلاف الجوي الليلي */
    private static void drawAirglow(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > -18) return;
        float dark = (float) Math.min(1, (-sunAlt - 18) / 8.0);
        int alpha = (int)(16 * dark);
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

    /** Green Flash — الوميض الأخضر لحظة اختفاء الشمس */
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

    /** Sundog / Parhelion — قوسان لامعان على يمين ويسار الشمس */
    private static void drawSundog(Canvas c, int w, int h, Paint p,
                                   double sunAlt, float sunX, float sunY) {
        float intensity = (float)(1.0 - sunAlt / 28.0);
        int alpha = (int)(55 * intensity);
        if (alpha < 8) return;
        float yy = Math.max(h * 0.05f, Math.min(sunY, (float)(h * 0.9f)));
        float dogR = h * 0.04f;
        float offset22 = w * 0.18f;
        float[] dogXs = { sunX - offset22, sunX + offset22 };
        for (float dx : dogXs) {
            if (dx < -dogR || dx > w + dogR) continue;
            p.setStyle(Paint.Style.FILL);
            p.setShader(new RadialGradient(dx, yy, dogR * 2.5f,
                new int[]{ Color.argb(alpha, 255, 255, 220),
                           Color.argb(alpha * 2 / 3, 255, 230, 100),
                           Color.argb(alpha / 3, 255, 160, 60),
                           Color.argb(0, 255, 120, 40) },
                new float[]{ 0f, 0.3f, 0.6f, 1f }, Shader.TileMode.CLAMP));
            c.drawCircle(dx, yy, dogR * 2.5f, p);
            p.setShader(null);
            // خيط ضوئي يربط الـ sundog بالشمس
            Paint linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            linePaint.setStyle(Paint.Style.STROKE);
            linePaint.setStrokeWidth(1.5f);
            linePaint.setShader(new LinearGradient(sunX, yy, dx, yy,
                Color.argb(alpha / 3, 255, 240, 180), Color.argb(0, 255, 240, 180),
                Shader.TileMode.CLAMP));
            c.drawLine(sunX, yy, dx, yy, linePaint);
        }
    }

    /** Circumzenithal Arc — قوس ملون فوق الشمس عند ارتفاع متوسط */
    private static void drawCircumzenithalArc(Canvas c, int w, int h, Paint p,
                                              double sunAlt, float sunX) {
        float intensity = (float)(1.0 - Math.abs(sunAlt - 42) / 20.0);
        int alpha = (int)(60 * intensity);
        if (alpha < 8) return;
        float zenithY  = altToY(90, h);
        float arcRadiusPx = h * 0.32f;
        float arcCenterY  = zenithY + arcRadiusPx;
        int[] arcColors = {
            Color.argb(0, 220, 60, 80),
            Color.argb(alpha, 220, 60, 80),
            Color.argb(alpha, 255, 130, 0),
            Color.argb(alpha, 240, 230, 0),
            Color.argb(alpha, 50, 200, 60),
            Color.argb(alpha, 30, 100, 220),
            Color.argb(alpha, 120, 40, 200),
            Color.argb(0, 120, 40, 200) };
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

    /** Cirrus — خيوط سحاب رفيعة عالية */
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

            // نسيج خيطي فرعي
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
    // السحاب المحسّن — Silver Lining
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawClouds(Canvas c, int w, int h, Paint p,
                                   double sunAlt, float sunX, float sunY, long now) {
        if (wsCloudMult < 0.04f) return;
        CloudColors cc = cloudColors(sunAlt);
        float sec  = now / 1000f;
        Random rnd = new Random(777);

        // تطبيق مضاعف الطقس على ألفا الألوان
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

    /** سحابة عضوية مع Silver Lining */
    private static void drawOrganicCloud(Canvas c, Paint p, float cx, float cy,
                                         float sz, int n, float aspect,
                                         int base, int shadow, int highlight,
                                         float lightX, float lightY,
                                         double sunAlt, Random rnd) {
        boolean hasSilver = (sunAlt > -2 && sunAlt < 10);
        boolean moonLit   = (sunAlt < -4 && sunAlt > -18);

        // اتجاه مصدر الضوء
        float ldx = lightX - cx, ldy = lightY - cy;
        float ldLen = (float) Math.max(1.0, Math.sqrt((double)(ldx * ldx + ldy * ldy)));
        float lnx = ldx / ldLen, lny = ldy / ldLen;

        // القاع المستوي للسحابة
        float flatBase = cy + sz * 0.28f;

        // حدود الطبقة المنفصلة
        RectF layerRect = new RectF(cx - sz * 2.0f, cy - sz * 1.5f, cx + sz * 2.0f, flatBase);

        // saveLayer: كل الـ puffs ترسم في طبقة منفصلة لمنع الحواف الشفافة
        int savedCount = c.saveLayer(layerRect, null);

        int brr = Color.red(base), bgr = Color.green(base), bbr = Color.blue(base), bar = Color.alpha(base);
        int hrr = Color.red(highlight), hgr = Color.green(highlight), hbr = Color.blue(highlight);

        // حساب مواقع وأحجام الـ puffs مسبقاً
        float[] pxArr = new float[n], pyArr = new float[n], prArr = new float[n];
        for (int i = 0; i < n; i++) {
            // توزيع في نصف الدائرة العلوي (من -135° إلى +135°)
            double angle = (rnd.nextDouble() - 0.5) * Math.PI * 1.5;
            float  dist  = (float)(rnd.nextDouble() * 0.50 * sz);
            pxArr[i] = cx + (float)(Math.cos(angle) * dist * aspect);
            pyArr[i] = cy + (float)(Math.sin(angle) * dist * 0.55f) - sz * 0.05f;

            // حجم يتناقص من المركز للأطراف (size falloff)
            float cDist = (float) Math.sqrt((double)((pxArr[i]-cx)*(pxArr[i]-cx) + (pyArr[i]-cy)*(pyArr[i]-cy)));
            float sf = Math.max(0.28f, 1.0f - cDist / (sz * 0.75f));
            prArr[i] = sz * (0.16f + rnd.nextFloat() * 0.22f) * sf;
        }

        // رسم الـ puffs
        for (int i = 0; i < n; i++) {
            float bx = pxArr[i], by = pyArr[i], brad = prArr[i];
            // الـ puff لا يتجاوز القاع المستوي
            if (by + brad * 0.45f > flatBase) by = flatBase - brad * 0.55f;

            // درجة الإضاءة بناءً على الموقع من مصدر الضوء
            float dotL = (cx - bx) * lnx + (cy - by) * lny;
            float lit = 0.32f + 0.68f * (float) Math.max(0, Math.min(1, (dotL / sz + 0.65)));

            int lr2 = Math.max(0, Math.min(255, (int)(brr + (hrr - brr) * lit)));
            int lg2 = Math.max(0, Math.min(255, (int)(bgr + (hgr - bgr) * lit)));
            int lb2 = Math.max(0, Math.min(255, (int)(bbr + (hbr - bbr) * lit)));

            // جسم الـ puff مع RadialGradient
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

        // Silver Lining — طبقة واحدة على الحافة كلها باتجاه الشمس
        if (hasSilver) {
            float silverT = (float)(1.0 - Math.abs(sunAlt - 4) / 6.0);
            int sA = (int)(58 * silverT);
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

        // إضاءة القمر الليلية
        if (moonLit && cMoonAlt > 10) {
            int mA = (int)(20 * Math.min(1.0, (cMoonAlt - 10) / 30.0));
            if (mA > 3) {
                p.setShader(new RadialGradient(cx, cy - sz * 0.5f, sz * 1.1f,
                    new int[]{ Color.argb(mA, 200, 215, 255), Color.argb(0, 180, 200, 240) },
                    null, Shader.TileMode.CLAMP));
                c.drawRect(layerRect, p);
                p.setShader(null);
            }
        }

        c.restoreToCount(savedCount);

        // ظل ناعم أسفل السحابة
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
    // 18. تلوث ضوئي
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawLightPollution(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (sunAlt > -5) return; // النهار: لا يظهر
        double dark = Math.min(1.0, (-sunAlt - 5) / 13.0);
        int alpha = (int)(45 * dark); // خفيف — لا يطغى على السماء

        // توهج برتقالي/أصفر في الجزء السفلي (ضوء المدينة)
        p.setShader(new LinearGradient(0, h * 0.72f, 0, h,
            new int[]{ Color.argb(0, 255, 140, 30),
                       Color.argb(alpha / 2, 255, 120, 20),
                       Color.argb(alpha, 255, 100, 10) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(0, h * 0.72f, w, h, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 19. خط الأفق
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawHorizonLine(Canvas c, int w, int h, Paint p, double sunAlt) {
        float horizonY = altToY(0, h);
        if (horizonY > h || horizonY < 0) return;

        // ضبابية ناعمة أسفل الأفق مباشرة
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

        // خط الأفق نفسه — خافت
        Paint linePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        linePaint.setStyle(Paint.Style.STROKE);
        if (sunAlt > 2) {
            linePaint.setColor(Color.argb(60, 200, 220, 255));
        } else if (sunAlt > -4) {
            linePaint.setColor(Color.argb(50, 255, 200, 150));
        } else {
            linePaint.setColor(Color.argb(30, 100, 130, 180));
        }
        linePaint.setStrokeWidth(0.8f);
        c.drawLine(0, horizonY, w, horizonY, linePaint);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 20. حواف دائرية
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

    /** تصحيح الانكسار الجوي (Bennett 1982) بالدرجات */
    static double refractionCorrection(double altDeg) {
        if (altDeg > 85) return 0;
        if (altDeg < 0.5) return 0.57;
        double tanA = Math.tan(Math.toRadians(altDeg));
        return (1.02 / (60.0 * tanA));
    }

    /** موقع الشمس [altitude, azimuth] — USNO Simplified */
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

    /** طور القمر [0=جديد .. 0.5=بدر] */
    static double moonPhase(double jd) {
        double d = (jd - 2451550.26) % 29.530588853;
        return d < 0 ? (d + 29.530588853) / 29.530588853 : d / 29.530588853;
    }

    static double moonIllumination(double phase) {
        return (1.0 - Math.cos(phase * 2 * Math.PI)) / 2.0;
    }

    /**
     * موقع كوكب بالعناصر المدارية المبسّطة
     * @param L0   طول الكوكب الوسطى J2000.0 (درجة)
     * @param rate معدل الحركة اليومية (درجة/يوم)
     * @param Ma   نصف المحور الأكبر (AU) للتصحيح
     * @param sma  نصف المحور الأكبر (للإشارة)
     */
    static double[] planetPosition(double jd, double lat, double lng,
                                   double L0, double rate, double Ma, double sma) {
        double n   = jd - 2451545.0;
        double Lp  = Math.toRadians(normDeg(L0 + rate * n));
        double Ls  = Math.toRadians(normDeg(280.46 + 0.9856474 * n)); // الشمس
        double eps = Math.toRadians(23.439 - 0.0000004 * n);

        // تصحيح بسيط بحساب زاوية المرحلة
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

    /** RA/Dec → Altitude/Azimuth */
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

    /** وقت رصد غرينتش النجمي بالساعات — IAU 1982 */
    static double greenwichSiderealTime(double jd) {
        double T  = (jd - 2451545.0) / 36525.0;
        double ut = ((jd + 0.5) % 1.0) * 24.0 * 1.00273791;
        double gmst = 6.697374558 + 2400.0513369 * T + 0.0000258622 * T * T + ut;
        return normH(gmst);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // تحويل إحداثيات السماء ← الشاشة
    // ═══════════════════════════════════════════════════════════════════════

    /** الاتجاه → X (يعرض 240° حول الجنوب) */
    static float azToX(double az, int w) {
        double rel = az - 60;
        if (rel < 0)   rel += 360;
        if (rel > 300) rel  = 300;
        return (float)(rel / 300.0 * w);
    }

    /** الارتفاع → Y */
    static float altToY(double alt, int h) {
        return h * (1f - (float)(alt / 90.0) * 0.87f);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Fallback عند غياب GPS
    // ═══════════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════════
    // دوال مساعدة
    // ═══════════════════════════════════════════════════════════════════════
    static double normDeg(double d) { d %= 360; return d < 0 ? d + 360 : d; }
    static double normH  (double h) { h %=  24; return h < 0 ? h +  24 : h; }

    // ═══════════════════════════════════════════════════════════════════════
    // نظام الطقس الموسمي
    // ═══════════════════════════════════════════════════════════════════════
    private static void updateWeatherState(long now, double lat) {
        if (wsChanged == 0L) { wsChanged = now; wsHold = 480_000L; }
        long sinceChange = now - wsChanged;

        // انتقال سلس خلال 90 ثانية
        float transMs = 90_000L;
        wsTrans = Math.min(1.0f, sinceChange / transMs);

        if (sinceChange < wsHold) {
            // ابق في الحالة الحالية — حدّث المضاعفات
            applyWeatherMults(wsCurrent, wsNextState, wsTrans);
            return;
        }

        // اختر الحالة التالية بناءً على الموسم والموقع
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int month = cal.get(java.util.Calendar.MONTH); // 0-11
        float[] probs = seasonalProbs(month, lat);

        // وزن عشوائي بثبات ساعي (يتغير كل ساعة)
        Random wRnd = new Random(now / 3_600_000L + wsCurrent * 7L);
        float roll = wRnd.nextFloat();
        float cum = 0;
        int picked = WS_PARTLY;
        for (int i = 0; i < 5; i++) {
            cum += probs[i];
            if (roll < cum) { picked = i; break; }
        }

        // لا تكرر نفس الحالة مرتين متتاليتين
        if (picked == wsCurrent) picked = (picked + 1) % 5;

        wsNextState = picked;
        wsCurrent   = picked;
        wsChanged   = now;
        wsTrans     = 0f;

        // مدة الحالة — تعتمد على نوعها
        long[] holdTimes = { 720_000L, 540_000L, 480_000L, 300_000L, 420_000L };
        long base2 = holdTimes[picked];
        wsHold = base2 + (long)(wRnd.nextFloat() * base2 * 0.6f);

        applyWeatherMults(wsCurrent, wsNextState, 0f);
    }

    private static float[] seasonalProbs(int month, double lat) {
        // تحديد الفصل
        boolean southern = lat < -10;
        boolean tropical  = Math.abs(lat) < 20;
        int adjMonth = southern ? (month + 6) % 12 : month;

        // شتاء/صيف/ربيع/خريف
        boolean isWinter = (adjMonth == 11 || adjMonth == 0 || adjMonth == 1);
        boolean isSummer = (adjMonth >= 5 && adjMonth <= 7);
        boolean isSpring = (adjMonth >= 2 && adjMonth <= 4);

        if (tropical) {
            // موسم جاف (أكتوبر-مايو بالشمال) / موسم مطر (يونيو-سبتمبر)
            boolean isWet = (month >= 5 && month <= 9);
            return isWet
                ? new float[]{ 0.12f, 0.22f, 0.24f, 0.34f, 0.08f } // ممطر
                : new float[]{ 0.55f, 0.28f, 0.08f, 0.06f, 0.03f }; // جاف
        }
        if (isWinter) return new float[]{ 0.12f, 0.22f, 0.28f, 0.20f, 0.18f };
        if (isSummer) return new float[]{ 0.52f, 0.32f, 0.08f, 0.06f, 0.02f };
        if (isSpring)  return new float[]{ 0.28f, 0.34f, 0.18f, 0.12f, 0.08f };
        return               new float[]{ 0.22f, 0.30f, 0.25f, 0.14f, 0.09f }; // خريف
    }

    private static void applyWeatherMults(int cur, int nxt, float t) {
        // { cloudMult, fogMult, stormMult, overcast }
        float[][] params = {
            { 0.0f, 0.0f, 0.0f, 0.0f },   // CLEAR
            { 0.7f, 0.0f, 0.0f, 0.0f },   // PARTLY
            { 1.8f, 0.2f, 0.0f, 0.45f },  // OVERCAST
            { 2.4f, 0.1f, 1.0f, 0.65f },  // STORMY
            { 0.5f, 1.5f, 0.0f, 0.20f },  // FOGGY
        };
        float[] a = params[cur], b = params[nxt];
        wsCloudMult = a[0] + (b[0] - a[0]) * t;
        wsFogMult   = a[1] + (b[1] - a[1]) * t;
        wsStormMult = a[2] + (b[2] - a[2]) * t;
        wsOvercast  = a[3] + (b[3] - a[3]) * t;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // طبقة الغيوم الكثيفة — Overcast Veil
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawOvercastVeil(Canvas c, int w, int h, Paint p, double sunAlt) {
        if (wsOvercast < 0.02f) return;
        float oa = Math.min(0.80f, wsOvercast);

        // لون الغطاء يعتمد على وقت اليوم
        int vR, vG, vB;
        if (sunAlt > 8) { vR = 195; vG = 200; vB = 212; }
        else if (sunAlt > 0) { vR = 160; vG = 155; vB = 175; }
        else if (sunAlt > -5) { vR = 80; vG = 75; vB = 95; }
        else { vR = 18; vG = 18; vB = 30; }

        int topA = (int)(oa * 210);
        int botA = (int)(oa * 140);

        p.setShader(new LinearGradient(0, 0, 0, h * 0.68f,
            new int[]{ Color.argb(topA, vR, vG, vB),
                       Color.argb(botA, vR, vG, vB),
                       Color.argb(0, vR, vG, vB) },
            new float[]{ 0f, 0.65f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, 0, w, h * 0.68f, p);
        p.setShader(null);

        // نسيج غيوم داكن — خطوط أفقية بطيئة
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
                    Color.argb(0, vR, vG, vB),
                    Color.argb(la, vR - 20, vG - 20, vB - 15),
                    Shader.TileMode.MIRROR));
                c.drawLine(lx, ly, lx + lw, ly, cp);
            }
            cp.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // تفاصيل سطح المباني — خزانات مياه + وحدات HVAC + بنتهاوس
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawRooftopDetails(Canvas c, int w, int h, Paint p,
                                           float[][] towers, float baseY,
                                           int silR, int silG, int silB, int silA) {
        Random rnd = new Random(65432L);
        p.setStyle(Paint.Style.FILL);

        // اللون يكون أفتح قليلاً من السيلويت لإظهار العمق
        int detailA = Math.min(255, silA + 30);
        int dR = Math.min(255, silR + 18), dG = Math.min(255, silG + 18), dB = Math.min(255, silB + 22);

        for (float[] t : towers) {
            float tx  = t[0] * w;
            float tw  = t[1] * w;
            float th  = t[2] * h;
            float top = baseY - th;
            float mx2 = tx + tw / 2f;
            int   typ = (int) t[3];

            // تفاصيل فقط على المباني المستطيلة / المتدرجة / الكبيرة
            if (th < h * 0.06f) continue;

            p.setColor(Color.argb(detailA, dR, dG, dB));

            // خزان مياه على المباني العادية (type 0)
            if (typ == 0 && rnd.nextFloat() < 0.55f) {
                float tR = Math.max(2f, tw * 0.14f);
                float tH = tR * 1.35f;
                float tX = mx2 + (rnd.nextFloat() - 0.5f) * tw * 0.28f;
                // حوض أسطواني (oval)
                c.drawOval(new RectF(tX - tR, top - tH, tX + tR, top), p);
                // أعمدة الحوض
                p.setColor(Color.argb(detailA - 30, dR, dG, dB));
                float legW = Math.max(1f, tR * 0.18f);
                for (int lg = -1; lg <= 1; lg++) {
                    c.drawRect(tX + lg * tR * 0.6f - legW, top - tH * 0.40f,
                               tX + lg * tR * 0.6f + legW, top, p);
                }
                p.setColor(Color.argb(detailA, dR, dG, dB));
            }

            // وحدات HVAC — مربعات صغيرة
            if (rnd.nextFloat() < 0.70f) {
                int nUnits = 1 + rnd.nextInt(3);
                for (int u = 0; u < nUnits; u++) {
                    float uw = Math.max(2.5f, tw * (0.08f + rnd.nextFloat() * 0.10f));
                    float uh = uw * (0.55f + rnd.nextFloat() * 0.30f);
                    float ux = tx + w * 0.004f + rnd.nextFloat() * (tw - uw - w * 0.006f);
                    c.drawRect(ux, top - uh, ux + uw, top, p);
                    // فتحات التهوية — خطوط رفيعة
                    Paint vp = new Paint(Paint.ANTI_ALIAS_FLAG);
                    vp.setStyle(Paint.Style.STROKE);
                    vp.setStrokeWidth(0.8f);
                    vp.setColor(Color.argb(detailA / 2, silR, silG, silB));
                    for (int vl = 0; vl < 3; vl++) {
                        float vy = top - uh * (0.25f + vl * 0.22f);
                        c.drawLine(ux + uw * 0.12f, vy, ux + uw * 0.88f, vy, vp);
                    }
                }
            }

            // بنتهاوس مصعد (elevator penthouse) — برج صغير مركزي
            if (typ >= 1 && th > h * 0.10f && rnd.nextFloat() < 0.60f) {
                float epW = Math.max(3f, tw * 0.18f);
                float epH = th * (0.055f + rnd.nextFloat() * 0.040f);
                c.drawRect(mx2 - epW / 2f, top - epH, mx2 + epW / 2f, top, p);
                // سطح مائل خفيف
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
    // انعكاس واجهات زجاجية — لمعة مائلة حسب اتجاه الشمس
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawGlassCurtainSheen(Canvas c, int w, int h, Paint p,
                                              float[][] towers, float baseY,
                                              double sunAlt) {
        if (sunAlt < -3 || sunAlt > 75) return;
        float sA = (float) Math.min(1.0, (sunAlt + 3) / 20.0) * (1.0f - wsOvercast * 0.8f);
        if (sA < 0.03f) return;

        Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG);
        gp.setStyle(Paint.Style.FILL);

        for (float[] t : towers) {
            // انعكاس فقط على الأبراج الكبيرة (>10% ارتفاع)
            if (t[2] < 0.10f) continue;
            int typ = (int) t[3];
            if (typ == 4) continue; // stepped لا تعكس بنفس الطريقة

            float tx  = t[0] * w;
            float tw  = t[1] * w;
            float th  = t[2] * h;
            float top = baseY - th;

            // شريط لمعان مائل — يتحرك بزاوية 30° عبر الواجهة
            float sheenW = tw * 0.22f;
            float sheenX = tx + tw * 0.60f; // الجانب الذي يواجه الشمس

            RectF sheenRect = new RectF(sheenX, top + th * 0.05f,
                                        sheenX + sheenW, baseY - h * 0.005f);
            gp.setShader(new LinearGradient(sheenX, top, sheenX + sheenW, top,
                new int[]{ Color.argb(0, 200, 225, 255),
                           Color.argb((int)(sA * 45), 220, 238, 255),
                           Color.argb((int)(sA * 28), 210, 230, 255),
                           Color.argb(0, 200, 220, 255) },
                new float[]{ 0f, 0.35f, 0.70f, 1f }, Shader.TileMode.CLAMP));
            c.drawRect(sheenRect, gp);
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
    // أشعة مضادة — Anti-Crepuscular Rays (تتقاطع على نقطة مقابل الشمس)
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawAntiCrepuscularRays(Canvas c, int w, int h, Paint p,
                                                double sunAlt, double sunAz) {
        if (sunAlt < -5 || sunAlt > 18) return;
        float intensity = (float)(sunAlt < 0
            ? 1.0 - Math.abs(sunAlt) / 5.0
            : 1.0 - sunAlt / 18.0);
        intensity = Math.max(0, Math.min(0.65f, intensity));
        if (intensity < 0.05f) return;

        double antiAz = (sunAz + 180.0) % 360.0;
        float antiX = azToX(antiAz, w);
        float antiY = altToY(0, h) * 0.92f;

        Random rnd = new Random(55555L);
        Paint rayPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        rayPaint.setStyle(Paint.Style.STROKE);
        rayPaint.setStrokeCap(Paint.Cap.ROUND);

        for (int i = 0; i < 8; i++) {
            double angle = rnd.nextDouble() * Math.PI - Math.PI / 2.0;
            float ex = antiX + (float)(Math.cos(angle) * w * 1.6f);
            float ey = antiY + (float)(Math.sin(angle) * w * 1.6f);
            float rw = 1.2f + rnd.nextFloat() * 2.8f;
            int alpha = (int)((12 + rnd.nextFloat() * 18) * intensity);
            rayPaint.setStrokeWidth(rw);
            rayPaint.setShader(new LinearGradient(antiX, antiY, ex, ey,
                Color.argb(alpha, 255, 242, 200),
                Color.argb(0, 255, 235, 180),
                Shader.TileMode.CLAMP));
            c.drawLine(antiX, antiY, ex, ey, rayPaint);
        }
        rayPaint.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // قمر اصطناعي / ISS — يمر ببطء في الليل مع وميض Iridium أحياناً
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
                    new int[]{ Color.argb(fa, 255, 255, 215),
                               Color.argb(fa / 3, 255, 245, 190),
                               Color.argb(0, 255, 230, 160) },
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
            float tx = satX1 + (satX2 - satX1) * tailT;
            float ty = satY1 + (satY2 - satY1) * tailT;
            Paint tail = new Paint(Paint.ANTI_ALIAS_FLAG);
            tail.setStyle(Paint.Style.STROKE);
            tail.setStrokeWidth(1.4f);
            tail.setStrokeCap(Paint.Cap.ROUND);
            tail.setShader(new LinearGradient(tx, ty, sx, sy,
                Color.argb(0, 255, 255, 238),
                Color.argb(sa / 4, 255, 255, 238),
                Shader.TileMode.CLAMP));
            c.drawLine(tx, ty, sx, sy, tail);
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

            if (x0 > w + len && x1 > w + len) continue;
            if (x0 < -len   && x1 < -len)   continue;

            float trailW = h * (0.003f + age * 0.020f);
            int   tA     = (int)(bright * (50 - age * 33));
            if (tA < 5) continue;
            int   tG     = (int)(255 - age * 22);

            Paint tp = new Paint(Paint.ANTI_ALIAS_FLAG);
            tp.setStyle(Paint.Style.STROKE);
            tp.setStrokeWidth(trailW);
            tp.setStrokeCap(Paint.Cap.ROUND);
            tp.setShader(new LinearGradient(x0, baseY, x1, y1,
                Color.argb(0, 255, tG, tG),
                Color.argb(tA, 255, tG, tG),
                Shader.TileMode.CLAMP));
            c.drawLine(x0, baseY, x1, y1, tp);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ضباب الأرض — Ground Fog عند الفجر والغروب
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawGroundFog(Canvas c, int w, int h, Paint p,
                                      double sunAlt, long now) {
        // توقيت طبيعي: فجر/غروب. الطقس يمد نطاق وكثافة الضباب
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
            new int[]{ Color.argb(0, fR, fG, fB),
                       Color.argb(alpha, fR, fG, fB),
                       Color.argb(alpha * 4 / 5, fR, fG, fB) },
            new float[]{ 0f, 0.38f, 1f }, Shader.TileMode.CLAMP));
        c.drawRect(0, fogBase, w, h, p);
        p.setShader(null);

        Random rnd = new Random(2025L);
        float sec = now / 1000f;
        for (int i = 0; i < 5; i++) {
            float blobW = w * (0.18f + rnd.nextFloat() * 0.22f);
            float blobX = ((rnd.nextFloat() * w * 1.5f
                + sec * 1.2f * (i % 2 == 0 ? 1 : -1)) % (w * 1.6f) + w * 1.6f) % (w * 1.6f) - w * 0.1f;
            float blobY = fogBase + rnd.nextFloat() * h * 0.07f;
            int   bA    = (int)(alpha * (0.35f + rnd.nextFloat() * 0.40f));
            p.setShader(new RadialGradient(blobX, blobY + blobW * 0.25f, blobW,
                new int[]{ Color.argb(bA, fR, fG, fB),
                           Color.argb(bA / 2, fR, fG, fB),
                           Color.argb(0, fR, fG, fB) },
                new float[]{ 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
            c.drawOval(new RectF(blobX - blobW, blobY, blobX + blobW, blobY + blobW * 0.45f), p);
            p.setShader(null);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // سكاي لاين واقعية — أبراج + ناطحات سحاب بتفاصيل دقيقة
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawCitySilhouette(Canvas c, int w, int h, Paint p,
                                           double sunAlt, long now) {
        float baseY = h;
        boolean isDay   = sunAlt > 2;
        boolean isDusk  = sunAlt <= 2 && sunAlt > -5;
        boolean isNight = sunAlt <= -5;

        // لون السيلويت — يتغير حسب الوقت
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

        // ══════════════════════════════════════════════════════════
        // خلفية بنايات صغيرة (عمق) — طبقة ثانية خلف الأبراج
        // ══════════════════════════════════════════════════════════
        Random rndBg = new Random(77321L);
        Path bgPath = new Path();
        float xb = -w * 0.01f;
        while (xb < w * 1.02f) {
            float bw = w * (0.018f + rndBg.nextFloat() * 0.038f);
            float bh = h * (0.028f + rndBg.nextFloat() * 0.065f);
            bgPath.addRect(xb, baseY - bh, xb + bw - w * 0.001f, baseY, Path.Direction.CW);
            xb += bw + w * (0.002f + rndBg.nextFloat() * 0.008f);
        }
        p.setStyle(Paint.Style.FILL);
        p.setColor(Color.argb(silA * 7 / 10, silR, silG, silB));
        c.drawPath(bgPath, p);

        // ══════════════════════════════════════════════════════════
        // type: 0=flat 1=setback 2=tapered 3=wedge 4=stepped 5=antenna 6=twin 7=cylinder 8=diamond
        float[][] towers = {
            { 0.01f, 0.048f, 0.068f, 0 },
            { 0.05f, 0.032f, 0.092f, 1 },
            { 0.09f, 0.022f, 0.058f, 0 },
            { 0.11f, 0.052f, 0.118f, 4 },   // متدرج متوسط
            { 0.17f, 0.020f, 0.052f, 0 },
            { 0.19f, 0.058f, 0.148f, 7 },   // ★ برج أسطواني زجاجي
            { 0.25f, 0.016f, 0.065f, 0 },
            { 0.27f, 0.068f, 0.188f, 5 },   // ★ ناطحة مع هوائي
            { 0.34f, 0.022f, 0.078f, 0 },
            { 0.36f, 0.050f, 0.132f, 3 },   // إسفيني
            { 0.41f, 0.026f, 0.088f, 8 },   // diamond cap
            { 0.44f, 0.082f, 0.235f, 5 },   // ★★ أعلى برج (BurjKhalifa-esque)
            { 0.53f, 0.044f, 0.155f, 2 },   // مدبب جانب الأعلى
            { 0.58f, 0.018f, 0.062f, 0 },
            { 0.60f, 0.070f, 0.168f, 6 },   // ★ توأم (Petronas-esque)
            { 0.68f, 0.028f, 0.085f, 0 },
            { 0.70f, 0.055f, 0.138f, 1 },
            { 0.76f, 0.015f, 0.055f, 0 },
            { 0.77f, 0.052f, 0.112f, 4 },   // متدرج
            { 0.83f, 0.020f, 0.070f, 8 },   // diamond cap صغير
            { 0.85f, 0.058f, 0.125f, 3 },
            { 0.91f, 0.022f, 0.068f, 0 },
            { 0.93f, 0.042f, 0.098f, 7 },   // أسطواني صغير
            { 0.97f, 0.032f, 0.080f, 1 },
        };

        Path fgPath = new Path();
        p.setStyle(Paint.Style.FILL);
        p.setColor(Color.argb(silA, silR, silG, silB));

        for (float[] t : towers) {
            float tx  = t[0] * w;
            float tw  = t[1] * w;
            float th  = t[2] * h;
            int   typ = (int) t[3];
            addSkylineBuilding(fgPath, tx, baseY, tw, th, typ, w, h);
        }

        // الأرض الكاملة
        fgPath.addRect(0, baseY - 1, w, h + 4, Path.Direction.CW);
        c.drawPath(fgPath, p);

        // ══════════════════════════════════════════════════════════
        // بريق زجاج الأبراج — لمعان ناعم على المحيط
        // ══════════════════════════════════════════════════════════
        if (sunAlt > -4) {
            float glassA = (float) Math.min(1.0, (sunAlt + 4) / 10.0);
            Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG);
            gp.setStyle(Paint.Style.STROKE);
            gp.setStrokeWidth(1.4f);
            gp.setColor(Color.argb((int)(60 * glassA), 200, 225, 255));
            c.drawPath(fgPath, gp);
        }

        // ══════════════════════════════════════════════════════════
        // واجهات زجاجية — انعكاس ضوء الشمس على الأبراج الكبيرة
        // ══════════════════════════════════════════════════════════
        drawGlassCurtainSheen(c, w, h, p, towers, baseY, sunAlt);

        // ══════════════════════════════════════════════════════════
        // نوافذ مضيئة ليلاً
        // ══════════════════════════════════════════════════════════
        if (sunAlt < 0) {
            float nightT = (float) Math.min(1.0, -sunAlt / 10.0);
            drawWindowGrid(c, w, h, baseY, towers, nightT, now);
        }

        // ══════════════════════════════════════════════════════════
        // أضواء الطيران الحمراء على قمم الأبراج الشاهقة
        // ══════════════════════════════════════════════════════════
        if (sunAlt < -2) {
            float dark = (float) Math.min(1.0, (-sunAlt - 2) / 12.0);
            long blinkMs = now % 1200L;
            int bA = (int)(dark * (blinkMs < 600 ? 180 : 80));
            p.setColor(Color.argb(bA, 255, 60, 60));
            // قمم الأبراج الأعلى من 15% ارتفاع
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

        // أضواء الشوارع والسيارات ليلاً
        if (isNight) drawCityLights(c, w, h, p, baseY, sunAlt, now);

        // تفاصيل السطح — خزانات مياه + وحدات HVAC + بنتهاوس مصعد
        if (sunAlt > -8) drawRooftopDetails(c, w, h, p, towers, baseY, silR, silG, silB, silA);
    }

    /** يضيف مبنى ناطح واحد للـ Path حسب النوع */
    private static void addSkylineBuilding(Path path, float x, float base,
                                           float bw, float bh, int type,
                                           int w, int h) {
        float top = base - bh;
        float mx  = x + bw / 2f;
        switch (type) {
            case 0: { // مستطيل بسيط مع حائط عند السطح (parapet)
                path.addRect(x, top, x + bw, base, Path.Direction.CW);
                // parapet — جدار أمان بسيط
                path.addRect(x - w * 0.002f, top - bh * 0.022f, x + bw + w * 0.002f, top, Path.Direction.CW);
                break;
            }

            case 1: { // setback كلاسيكي — 3 كتل متراجعة
                path.addRect(x, top, x + bw, base, Path.Direction.CW);
                float sw1 = bw * 0.72f, sx1 = x + bw * 0.14f;
                path.addRect(sx1, top - bh * 0.30f, sx1 + sw1, top, Path.Direction.CW);
                float sw2 = bw * 0.46f, sx2 = x + bw * 0.27f;
                path.addRect(sx2, top - bh * 0.55f, sx2 + sw2, top - bh * 0.30f, Path.Direction.CW);
                // طابق ميكانيكي — شريط أداكن على الجسم
                float mechY = base - bh * 0.38f;
                path.addRect(x - w * 0.001f, mechY, x + bw + w * 0.001f, mechY + bh * 0.025f, Path.Direction.CW);
                break;
            }

            case 2: { // مدبب — جسم + مخروط
                path.addRect(x, top + bh * 0.20f, x + bw, base, Path.Direction.CW);
                // setback خفيف قبل المخروط
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

            case 3: { // wedge — ينحدر من اليسار لليمين
                path.addRect(x, top + bh * 0.14f, x + bw, base, Path.Direction.CW);
                Path wed = new Path();
                wed.moveTo(x, top + bh * 0.14f);
                wed.lineTo(x + bw, top - bh * 0.04f);
                wed.lineTo(x + bw, top + bh * 0.14f);
                wed.close();
                path.addPath(wed);
                // شريط ميكانيكي
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

            case 5: { // هوائي + setback — ناطحة سحاب بدقة عالية
                path.addRect(x, top + bh * 0.20f, x + bw, base, Path.Direction.CW);
                float sw1 = bw * 0.72f, sx1 = x + bw * 0.14f;
                path.addRect(sx1, top + bh * 0.10f, sx1 + sw1, top + bh * 0.20f, Path.Direction.CW);
                float sw2 = bw * 0.50f, sx2 = x + bw * 0.25f;
                path.addRect(sx2, top + bh * 0.03f, sx2 + sw2, top + bh * 0.10f, Path.Direction.CW);
                path.addRect(sx2, top, sx2 + sw2, top + bh * 0.03f, Path.Direction.CW);
                // طابق ميكانيكي بارز
                path.addRect(x - w*0.002f, base - bh*0.40f, x + bw + w*0.002f, base - bh*0.36f, Path.Direction.CW);
                // هوائي رفيع ثلاثي الطبقات
                float antW = Math.max(1.5f, w * 0.003f);
                path.addRect(mx - antW, top - bh * 0.38f, mx + antW, top, Path.Direction.CW);
                // أقراص هوائي
                for (int d = 0; d < 2; d++) {
                    float dy = top - bh * (0.15f + d * 0.12f);
                    path.addRect(mx - antW * 4f, dy, mx + antW * 4f, dy + bh * 0.020f, Path.Direction.CW);
                }
                break;
            }

            case 6: { // توأم — برجان متماثلان (Petronas-esque)
                float gap  = bw * 0.10f;
                float tw2  = bw * 0.44f;
                for (int side = 0; side < 2; side++) {
                    float tx = x + side * (tw2 + gap);
                    // جسم البرج الرئيسي (متدرج)
                    path.addRect(tx, top + bh * 0.20f, tx + tw2, base, Path.Direction.CW);
                    path.addRect(tx + tw2*0.12f, top + bh*0.08f, tx + tw2*0.88f, top + bh*0.20f, Path.Direction.CW);
                    path.addRect(tx + tw2*0.22f, top, tx + tw2*0.78f, top + bh*0.08f, Path.Direction.CW);
                    // هوائي رفيع
                    float atW = Math.max(1.2f, w * 0.0025f);
                    float atX = tx + tw2 / 2f;
                    path.addRect(atX - atW, top - bh * 0.22f, atX + atW, top, Path.Direction.CW);
                }
                // جسر رابط بين البرجين في المنتصف
                float bridgeY = base - bh * 0.55f;
                path.addRect(x + tw2, bridgeY, x + tw2 + gap, bridgeY + bh * 0.035f, Path.Direction.CW);
                break;
            }

            case 7: { // برج أسطواني زجاجي — Gherkin / Salesforce-esque
                // أسفل مستطيل واسع ← يضيق للأعلى (5 مراحل)
                float[] cws = { bw, bw * 0.88f, bw * 0.74f, bw * 0.58f, bw * 0.38f };
                float[] chs = { bh * 0.30f, bh * 0.22f, bh * 0.18f, bh * 0.14f, bh * 0.16f };
                float curY = base;
                for (int i = 0; i < 5; i++) {
                    float offX = (bw - cws[i]) / 2f;
                    path.addRect(x + offX, curY - chs[i], x + offX + cws[i], curY, Path.Direction.CW);
                    curY -= chs[i];
                }
                // قبة القمة
                float domeR = bw * 0.20f;
                path.addOval(new RectF(mx - domeR, top - domeR * 0.7f, mx + domeR, top), Path.Direction.CW);
                break;
            }

            case 8: { // diamond cap — قمة ماسية مشطوفة
                path.addRect(x, top + bh * 0.18f, x + bw, base, Path.Direction.CW);
                // الطابق الميكانيكي
                path.addRect(x - w*0.002f, base - bh*0.45f, x + bw + w*0.002f, base - bh*0.40f, Path.Direction.CW);
                // setback
                float sw = bw * 0.65f, sx = x + bw * 0.175f;
                path.addRect(sx, top + bh * 0.06f, sx + sw, top + bh * 0.18f, Path.Direction.CW);
                // القمة الماسية (معين 4 نقاط)
                Path diamond = new Path();
                diamond.moveTo(mx, top);                          // قمة
                diamond.lineTo(sx + sw, top + bh * 0.06f);       // يمين
                diamond.lineTo(mx, top + bh * 0.12f);            // أسفل
                diamond.lineTo(sx, top + bh * 0.06f);            // يسار
                diamond.close();
                path.addPath(diamond);
                break;
            }
        }
    }

    /** شبكة نوافذ مضيئة على واجهات الأبراج */
    private static void drawWindowGrid(Canvas c, int w, int h, float baseY,
                                       float[][] towers, float nightT, long now) {
        Random rnd = new Random(54321L);
        // وميض عشوائي بطيء للنوافذ
        long flickerSeed = now / 8000L;
        Random flickerRnd = new Random(flickerSeed);

        Paint wp = new Paint(Paint.ANTI_ALIAS_FLAG);
        for (float[] t : towers) {
            float tx = t[0] * w;
            float tw = t[1] * w;
            float th = t[2] * h;
            float top = baseY - th;

            // شبكة نوافذ — عرض وارتفاع كل نافذة
            float wW = Math.max(2.5f, tw * 0.14f);
            float wH = Math.max(2.0f, h * 0.020f);
            float gapX = tw * 0.08f;
            float gapY = h * 0.012f;
            int cols = Math.max(1, (int)(tw / (wW + gapX)));
            int rows = Math.max(1, (int)(th * 0.75f / (wH + gapY)));

            float startX = tx + (tw - cols * (wW + gapX) + gapX) / 2f;
            float startY = baseY - h * 0.035f;

            for (int row = 0; row < rows; row++) {
                for (int col = 0; col < cols; col++) {
                    // بعض النوافذ مضاءة وبعضها مطفية
                    boolean lit = flickerRnd.nextFloat() < (0.35f + rnd.nextFloat() * 0.35f);
                    if (!lit) { rnd.nextFloat(); continue; }

                    float wx = startX + col * (wW + gapX);
                    float wy = startY - row * (wH + gapY);
                    if (wy < top + th * 0.10f) break;

                    // لون النافذة — أبيض/أصفر/أزرق بارد
                    int wtype = flickerRnd.nextInt(4);
                    int wr, wg, wb;
                    if (wtype == 0) { wr = 255; wg = 235; wb = 160; }      // أصفر دافئ
                    else if (wtype == 1) { wr = 210; wg = 230; wb = 255; } // أزرق بارد (LED)
                    else if (wtype == 2) { wr = 255; wg = 255; wb = 220; } // أبيض
                    else { wr = 255; wg = 180; wb = 100; }                  // برتقالي (مكتب)

                    int wa = (int)(nightT * (100 + rnd.nextFloat() * 85));
                    wp.setColor(Color.argb(wa, wr, wg, wb));
                    c.drawRect(wx, wy - wH, wx + wW, wy, wp);
                }
            }
        }
    }

    /** أضواء الشوارع والسيارات */
    private static void drawCityLights(Canvas c, int w, int h, Paint p,
                                       float baseY, double sunAlt, long now) {
        float dark = (float) Math.min(1.0, (-sunAlt - 5) / 15.0);
        if (dark < 0.05f) return;

        Random rnd = new Random(99887L);

        // هالات ضوء الشوارع (sodium/LED)
        for (int i = 0; i < 22; i++) {
            float lx = rnd.nextFloat() * w;
            float ly = baseY - h * 0.008f;
            int type = rnd.nextInt(3);
            int cr, cg, cb;
            if (type == 0) { cr = 255; cg = 190; cb = 60; }  // sodium برتقالي
            else if (type == 1) { cr = 210; cg = 238; cb = 255; } // LED أبيض/أزرق
            else { cr = 255; cg = 215; cb = 110; }
            int la = (int)(dark * (40 + rnd.nextFloat() * 50));
            p.setShader(new RadialGradient(lx, ly, w * 0.045f,
                new int[]{ Color.argb(la, cr, cg, cb), Color.argb(0, cr, cg, cb) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(lx, ly, w * 0.045f, p);
            p.setShader(null);
        }

        // ضوء سيارات متحركة (نقاط صغيرة تتحرك)
        long carSeed = now / 300L;
        Random carRnd = new Random(carSeed);
        for (int i = 0; i < 6; i++) {
            float cx2 = (carRnd.nextFloat() * w * 1.3f) % w;
            float cy2 = baseY - h * (0.004f + carRnd.nextFloat() * 0.006f);
            int ca = (int)(dark * (100 + carRnd.nextFloat() * 80));
            // أضواء أمامية (بيضاء)
            p.setColor(Color.argb(ca, 255, 250, 230));
            c.drawCircle(cx2, cy2, 1.5f, p);
            c.drawCircle(cx2 + w * 0.015f, cy2, 1.5f, p);
            // أضواء خلفية حمراء إذا هناك سيارات في الاتجاه المقابل
            if (carRnd.nextBoolean()) {
                float cx3 = (carRnd.nextFloat() * w * 1.4f) % w;
                p.setColor(Color.argb(ca / 2, 255, 50, 50));
                c.drawCircle(cx3, cy2, 1.2f, p);
                c.drawCircle(cx3 - w * 0.010f, cy2, 1.2f, p);
            }
        }

        // انعكاس ضوء المدينة في الهواء (Orange haze dome)
        p.setShader(new RadialGradient(w * 0.5f, baseY, w * 0.65f,
            new int[]{ Color.argb((int)(dark * 40), 255, 130, 30),
                       Color.argb((int)(dark * 15), 255, 100, 20),
                       Color.argb(0, 200, 80, 10) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(0, baseY - h * 0.22f, w, baseY, p);
        p.setShader(null);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // سحاب Cumulonimbus — عاصفة رعدية مع مطر وبرق
    // ═══════════════════════════════════════════════════════════════════════
    private static void drawCumulonimbus(Canvas c, int w, int h, Paint p,
                                         double sunAlt, long now) {
        if (sunAlt < -20 || wsStormMult < 0.05f) return;

        // ═══ State machine — العاصفة تظهر كل فترة ═══
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

        float cloudCX  = cbCloudX * w;
        float cloudHW  = cbCloudW * w * 0.5f;
        float cloudTopY = h * 0.05f;
        float anvilTopY = h * 0.02f;
        float cloudBaseY = h * (0.40f + (float)Math.max(0, sunAlt / 90.0) * 0.08f);
        float anvilHW   = cloudHW * 1.55f;

        // ═══ 1. وميض البرق — تضيء السحابة كلها ═══
        long timeSinceBolt = now - cbBoltTime;
        boolean boltFlash = timeSinceBolt < 180L;
        float flashAlpha = boltFlash ? (float) Math.max(0, 1.0 - timeSinceBolt / 180.0) : 0;
        // تزامن البروق التالية
        if (now - cbBoltTime > 5_000L + (long)(new Random(cbBoltTime).nextFloat() * 12_000L)) {
            cbBoltTime = now;
            cbBoltX1 = cloudCX + (new Random(now).nextFloat() - 0.5f) * cloudHW * 0.8f;
            cbBoltY1 = cloudBaseY - h * 0.06f;
        }

        // ═══ 2. جسم السحابة الداكن (أعمدة convection) ═══
        int baseA = (int)(fade * 210);
        if (baseA < 10) return;

        // هالة وميض داخل السحابة
        if (boltFlash) {
            p.setShader(new RadialGradient(cloudCX, cloudBaseY - (cloudBaseY - cloudTopY) * 0.5f,
                cloudHW * 1.4f,
                new int[]{ Color.argb((int)(flashAlpha * 180), 220, 235, 255),
                           Color.argb((int)(flashAlpha * 80),  180, 200, 255),
                           Color.argb(0, 140, 160, 220) },
                null, Shader.TileMode.CLAMP));
            c.drawRect(cloudCX - anvilHW, anvilTopY, cloudCX + anvilHW, cloudBaseY, p);
            p.setShader(null);
        }

        // الجسم الرئيسي للسحابة
        p.setShader(new LinearGradient(0, cloudTopY, 0, cloudBaseY,
            new int[]{ Color.argb(baseA * 5 / 8, 30, 32, 45),
                       Color.argb(baseA,           22, 24, 38),
                       Color.argb(baseA,           18, 20, 32),
                       Color.argb(baseA * 3 / 4,  38, 42, 58) },
            new float[]{ 0f, 0.3f, 0.75f, 1f }, Shader.TileMode.CLAMP));
        Path cbPath = new Path();
        // القاعدة المستوية
        cbPath.moveTo(cloudCX - cloudHW, cloudBaseY);
        cbPath.lineTo(cloudCX + cloudHW, cloudBaseY);
        // حواف جوانب
        cbPath.lineTo(cloudCX + cloudHW, cloudTopY + h * 0.10f);
        // القمة — منحنى عريض (anvil)
        cbPath.quadTo(cloudCX + anvilHW, cloudTopY + h * 0.04f, cloudCX + anvilHW, anvilTopY + h * 0.04f);
        cbPath.quadTo(cloudCX, anvilTopY, cloudCX - anvilHW, anvilTopY + h * 0.04f);
        cbPath.quadTo(cloudCX - anvilHW, cloudTopY + h * 0.04f, cloudCX - cloudHW, cloudTopY + h * 0.10f);
        cbPath.close();
        c.drawPath(cbPath, p);
        p.setShader(null);

        // ═══ أعمدة convection داكنة داخل السحابة ═══
        Random cnvRnd = new Random(33344L);
        Paint cnvP = new Paint(Paint.ANTI_ALIAS_FLAG);
        for (int i = 0; i < 6; i++) {
            float cx2 = cloudCX + (cnvRnd.nextFloat() - 0.5f) * cloudHW * 1.5f;
            float colW = cloudHW * (0.08f + cnvRnd.nextFloat() * 0.10f);
            float colH = (cloudBaseY - cloudTopY) * (0.45f + cnvRnd.nextFloat() * 0.35f);
            float colTop = cloudBaseY - colH;
            cnvP.setShader(new RadialGradient(cx2, colTop + colH * 0.5f, colW * 1.4f,
                new int[]{ Color.argb(baseA * 2 / 5, 10, 10, 20),
                           Color.argb(0, 15, 15, 28) },
                null, Shader.TileMode.CLAMP));
            c.drawOval(new RectF(cx2 - colW, colTop, cx2 + colW, colTop + colH), cnvP);
        }
        cnvP.setShader(null);

        // ═══ حواف فيروزية/رصاصية (mammatus hints) على القاعدة ═══
        int mamA = (int)(fade * 90);
        p.setShader(new LinearGradient(0, cloudBaseY - h * 0.05f, 0, cloudBaseY,
            new int[]{ Color.argb(0, 50, 58, 80),
                       Color.argb(mamA, 42, 50, 72),
                       Color.argb(mamA, 35, 42, 65) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(cloudCX - cloudHW, cloudBaseY - h * 0.05f, cloudCX + cloudHW, cloudBaseY, p);
        p.setShader(null);

        // ═══ 3. مطر — خطوط مائلة تحت السحابة ═══
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
                // حركة المطر باستمرار
                float offset = (animRnd.nextFloat() * h * 0.25f + rainFrame * 6f) % (h * 0.38f);
                float ry0 = cloudBaseY + offset;
                float ry1 = ry0 + h * (0.025f + rainRnd.nextFloat() * 0.035f);
                if (ry0 > h) continue;
                float rw = 0.6f + rainRnd.nextFloat() * 0.8f;
                int rA = (int)(rainA * (55 + rainRnd.nextFloat() * 65));
                // انحراف بسيط للرياح
                float windSlant = h * 0.018f;
                rainPaint.setStrokeWidth(rw);
                rainPaint.setColor(Color.argb(rA, 160, 185, 220));
                c.drawLine(rx, ry0, rx + windSlant, ry1, rainPaint);
            }
        }

        // ═══ 4. شريط المطر الغليظ (virga) ═══
        int virgaA = (int)(fade * 55);
        p.setShader(new LinearGradient(0, cloudBaseY, 0, Math.min(h * 0.88f, cloudBaseY + h * 0.28f),
            new int[]{ Color.argb(virgaA, 100, 130, 180),
                       Color.argb(virgaA / 3, 80, 110, 160),
                       Color.argb(0, 60, 90, 140) },
            null, Shader.TileMode.CLAMP));
        c.drawRect(cloudCX - cloudHW * 0.72f, cloudBaseY,
            cloudCX + cloudHW * 0.72f, Math.min(h * 0.88f, cloudBaseY + h * 0.28f), p);
        p.setShader(null);

        // ═══ 5. صاعقة — خط متعرج من قاعدة السحابة للأرض ═══
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
                // فروع البرق
                if (bRnd.nextFloat() < 0.3f) {
                    Path branch = new Path();
                    branch.moveTo(bx, by);
                    float bfx = bx + (bRnd.nextFloat() - 0.5f) * cloudHW * 0.5f;
                    float bfy = by + h * 0.06f;
                    branch.lineTo(bfx, bfy);
                    float branchFa = flashAlpha * 0.5f;
                    boltP.setStrokeWidth(1.0f);
                    boltP.setColor(Color.argb((int)(branchFa * 160), 190, 210, 255));
                    c.drawPath(branch, boltP);
                }
                bx += stepX;
                by += stepY;
                boltPath.lineTo(bx, by);
            }
            // خط الصاعقة الرئيسي — متعدد الطبقات
            boltP.setStrokeWidth(4.0f * flashAlpha);
            boltP.setColor(Color.argb((int)(flashAlpha * 120), 160, 190, 255));
            c.drawPath(boltPath, boltP);
            boltP.setStrokeWidth(2.0f * flashAlpha);
            boltP.setColor(Color.argb((int)(flashAlpha * 200), 210, 225, 255));
            c.drawPath(boltPath, boltP);
            boltP.setStrokeWidth(0.8f * flashAlpha);
            boltP.setColor(Color.argb((int)(flashAlpha * 255), 245, 250, 255));
            c.drawPath(boltPath, boltP);

            // هالة ضوء على الأرض تحت نقطة الوصول
            float gndR = cloudHW * 0.28f;
            p.setShader(new RadialGradient(bx, h, gndR * 2.2f,
                new int[]{ Color.argb((int)(flashAlpha * 90), 200, 220, 255),
                           Color.argb(0, 160, 180, 220) },
                null, Shader.TileMode.CLAMP));
            c.drawCircle(bx, h, gndR * 2.2f, p);
            p.setShader(null);
        }
    }
}
