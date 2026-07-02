---
name: Sky renderer seasonal weather system + v3.0 architecture
description: Weather state machine + enhanced city skyline + all 60 improvements in SkyBitmapRenderer.java v3.0
---

## Weather State Machine

**Constants:** `WS_CLEAR=0, WS_PARTLY=1, WS_OVERCAST=2, WS_STORMY=3, WS_FOGGY=4`

**Static mults** (the only things renderers read):
- `wsCloudMult` — 0.0 (clear) → 2.4 (storm); scales `Color.alpha(cc.base/shadow/highlight)` in `drawClouds`
- `wsFogMult`   — 0.0 → 1.5; used in `drawGroundFog` to extend beyond dawn/dusk and increase alpha
- `wsStormMult` — 0.0 or 1.0; `drawCumulonimbus` returns early if < 0.05
- `wsOvercast`  — 0.0 → 0.65; drives `drawOvercastVeil` gradient alpha

**Seasonal probs:** `seasonalProbs(month, lat)` returns float[5] for {CLEAR,PARTLY,OVERCAST,STORMY,FOGGY}

## Building Types (addSkylineBuilding) — v3.0

| type | description |
|------|-------------|
| 0 | flat rectangle + parapet |
| 1 | 3-tier setback + mechanical floor band |
| 2 | tapered + setback + triangular spire |
| 3 | wedge (left→right slope) + mechanical band |
| 4 | 5-step pyramid |
| 5 | antenna tower: setback + 3-tier + twin dishes + mechanical floor |
| 6 | twin towers (Petronas-esque): two columns + bridge connector |
| 7 | cylindrical glass (Gherkin-esque): 5 tapering rings + dome cap |
| 8 | diamond cap: setback + 4-point diamond top + mechanical floor |
| 9 | **★ مئذنة إسلامية** — قاعدة + جسم + شرفة المؤذن + هلال أعلى المئذنة |
| 10 | **★ مسجد بقبة** — قبة رئيسية + قبتان صغيرتان + إيوان مقوس + مئذنتان صغيرتان |

## v3.0 New Functions (render call order additions)

```
05.  drawAlpenglow           — وهج وردي بعد الغروب
08.  drawZodiacalLight       — نور الزودياك (محسّن)
09.  drawGegenschein         — توهج معاكس للشمس
10.  drawAirglow             — توهج الغلاف الجوي الليلي
13.  drawDeepSkyObjects      — M31 / M42 (سديم + مجرة)
20.5 drawComet               — مذنب بذيلين (غبار أصفر + أيون أزرق)
22.  drawMoon                — sun-relative terminator + 3D sphere + رمضان + عمود ضوء
26.  drawSundog              — ظاهرة البرق (Sundog/Parhelion)
27.  drawCircumzenithalArc   — Arc فوق الزينيث
28.  drawSun                 — sunspots + solar flares + corona + solar pillar
34.5 drawHeatHaze            — ضبابية حرارية (sunAlt > 55°)
37.  drawBirds               — طيور مهاجرة بتشكيل V عند الغروب/الشروق
38.  drawWaterReflection      — انعكاس المدينة في شريط ماء أسفل الشاشة
```

## Moon phase fix (v3.0)

- Reference JD changed from 2451550.26 → **2451549.72** (New Moon 2000 Jan 6.18 UT — more accurate)
- `hijriMonth(jd)` — Tabular Islamic Calendar; شهر 9 = رمضان
- `cHijriMonth` cached every minute alongside other calculations
- Ramadan crescent: `cHijriMonth == 9 && phase < 0.07` → golden halo + golden rim on moon
- Mosque crescent accent: `drawMosqueCrescentAccent` pulsates on type-9/type-10 buildings in Ramadan

## Sun-relative terminator (CRITICAL fix)

`drawMoon` now calculates `sunAngleOnScreen = atan2(sunScreenY - moonY, sunScreenX - moonX)` then `c.rotate(toDegrees(sunAngleOnScreen) + 90, moonX, moonY)` before drawing the terminator path. This makes the lit side always face the actual sun position on screen regardless of hemisphere or time.

**Why:** Previous code always lit the right side for waxing regardless of sun position, causing wrong crescent orientation when moon is at unusual azimuths.

## NO RAINBOW RULE

Never add any rainbow in any form anywhere in this file. The `drawRainbow` function was deleted permanently.
