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

## Moon color tuning (critical)
- `bloodMoon` must only activate at `moonAlt < 1.5 && ill > 0.82` — anything looser makes normal low moon go red
- `horizonT` for orange tint starts at `(5.0 - moonAlt) / 7.0`, capped at 0.65 — start was 15° before fix, caused heavy orange even at 10°+ altitude
- Normal (no-horizon) moon colors: moonBase1=0xFFF8F4EC (white-ivory), moonBase2=0xFFEEE4C8, moonBase3=0xFFD8C898

## Building silhouette depth (city realism)
- Night silR/G/B changed from (4,5,12) to (12,16,38) — dark blue-charcoal not pure black
- Background layer uses gradient shader (`LinearGradient`) instead of solid color
- Per-tower individual rendering: each tower drawn with its own `tPath` + type-specific LinearGradient
  - `typeColorOffsets[11][6]` — {dR_top,dG_top,dB_top,dR_bot,dG_bot,dB_bot} offsets from silR/G/B
  - Glass types (1,6,7): +65/62/78 blue boost; Minaret(9): warm +28R, -4B; Mosque(10): +30R
  - fgPath is built by addPath(tPath) per tower — used ONLY for overlay effects (rim, street glow)
- Street Glow: warm amber overlay (255,180,80) on bottom 6% of buildings when isNight/isDusk
- Sky Rim: 1px stroke pass on fgPath — blue at night, amber at dusk, blue-white at day
- Trees: drawn with their own treePath, separate color (+12/14/26 offsets)
- Ground: solid rect at silR/G/B (no gradient) after all tower draws
- widget resizeMode="none" with minWidth=270dp, minHeight=180dp locks 4×3 size
