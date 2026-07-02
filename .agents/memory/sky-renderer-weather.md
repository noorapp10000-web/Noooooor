---
name: Sky renderer seasonal weather system
description: Weather state machine + enhanced city skyline in SkyBitmapRenderer.java
---

## Weather State Machine

**Constants:** `WS_CLEAR=0, WS_PARTLY=1, WS_OVERCAST=2, WS_STORMY=3, WS_FOGGY=4`

**Static mults** (the only things renderers read):
- `wsCloudMult` — 0.0 (clear) → 2.4 (storm); scales `Color.alpha(cc.base/shadow/highlight)` in `drawClouds`
- `wsFogMult`   — 0.0 → 1.5; used in `drawGroundFog` to extend beyond dawn/dusk and increase alpha
- `wsStormMult` — 0.0 or 1.0; `drawCumulonimbus` returns early if < 0.05
- `wsOvercast`  — 0.0 → 0.65; drives `drawOvercastVeil` gradient alpha

**State durations:** CLEAR 12min, PARTLY 9min, OVERCAST 8min, STORMY 5min, FOGGY 7min ±60%

**Seasonal probs:** `seasonalProbs(month, lat)` returns float[5] for {CLEAR,PARTLY,OVERCAST,STORMY,FOGGY}:
- tropical |lat|<20: dry (CLEAR 55%) vs wet Jun-Sep (STORMY 34%)
- northern winter: CLEAR 12%, STORMY 20%, FOGGY 18%
- northern summer: CLEAR 52%, STORMY 6%, FOGGY 2%
- southern hemisphere: shift month by +6

**Why:** Weather must feel seasonal/geographic — Cairo should feel different from London in January.

## Render Call Order (added steps)

```
00. updateWeatherState(now, cLat)   ← before any drawing
...
30. drawClouds     (uses wsCloudMult)
30.5 drawOvercastVeil (uses wsOvercast)
31. drawCumulonimbus  (returns if wsStormMult < 0.05)
...
35. drawGroundFog  (uses wsFogMult, extended to sunAlt>6 when foggy)
36. drawCitySilhouette
    └─ drawGlassCurtainSheen  (active when -3≤sunAlt≤75)
    └─ drawCityLights (night)
    └─ drawRooftopDetails (sunAlt > -8)
```

## Building Types (addSkylineBuilding)

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

## Rooftop Details (`drawRooftopDetails`)

Draws atop the silhouette path with a slightly lighter color (`silRGB + 18`):
- **Water towers** (type 0, 55% chance): oval cylinder + 3 support legs
- **HVAC units** (70% chance): 1-3 rectangles + ventilation line slits
- **Elevator penthouse** (type≥1, h>10%, 60% chance): box + slight sloped roof

**Why:** Only visible at sunAlt > -8 (dawn through dusk); adds depth and realism without affecting night silhouette.

## Glass Curtain Sheen (`drawGlassCurtainSheen`)

Diagonal light streak on right face of each tall tower (t[2]≥0.10):
- Runs when `-3 ≤ sunAlt ≤ 75` and `wsOvercast < 0.8`
- 4-stop linear gradient (transparent→slight blue-white→transparent) at 60% of tower width
- Skips type 4 (stepped) which doesn't have flat glass faces

## NO RAINBOW RULE

Never add any rainbow in any form anywhere in this file. The `drawRainbow` function was deleted permanently.
