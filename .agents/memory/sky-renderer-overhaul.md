---
name: Sky renderer 2025 overhaul
description: Major SkyBitmapRenderer.java upgrade — rainbow removal, cloud rewrite, 5 new atmosphere functions, 6-stop sky gradient.
---

## Rules

**Why:** User said "لا قوس قزح في أي وقت" — must never be re-added.
**How to apply:** drawRainbow function and its call were both deleted. Do not re-introduce.

## Signature changes
- `drawMieHaze(c, w, h, p, sunAlt, sunX)` — added sunX for directional haze around sun
- `skyColors(double a)` returns `int[6]` not `int[4]`; `drawSkyGradient` uses 6 float positions
- `drawOrganicCloud` — complete rewrite with saveLayer, flatBase, size falloff, directional lighting

## New static state fields (satellite)
```java
private static long  satLastPass = 0, satNextPass = 0;
private static float satX1, satY1, satX2, satY2;
private static boolean satFlare = false;
```

## 5 new render functions (in order of call in render())
1. `drawSatellite(c,w,h,p,sunAlt,now)` — step 21, before moon
2. `drawAntiCrepuscularRays(c,w,h,p,sunAlt,sunAz)` — step 25, after crepuscular
3. `drawContrails(c,w,h,p,sunAlt,now)` — step 31, after clouds
4. `drawGroundFog(c,w,h,p,sunAlt,now)` — step 34, after horizon line
5. `drawCitySilhouette(c,w,h,p,sunAlt)` — step 35, last before rounded corners
   - helpers: `addMinaret(path,baseX,baseY,totalH,w)`, `drawCityLights(c,w,h,p,horizonY,sunAlt)`

## CLOUD_SEEDS n values
Changed from 5–8 to 12–16 puffs per cloud.

## drawOrganicCloud rewrite key points
- `c.saveLayer(layerRect, null)` → `c.restoreToCount(savedCount)` wraps all puff drawing
- `flatBase = cy + sz * 0.28f` — clips bottom of cloud to flat line
- puffs distributed in -135° to +135° arc (upper hemisphere only)
- per-puff `lit` factor drives highlight interpolation for directional sun lighting
- Silver Lining drawn as single RadialGradient overlay on whole layer (not per-puff)
