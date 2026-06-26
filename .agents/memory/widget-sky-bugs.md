---
name: Android widget sky renderer bugs
description: Critical and secondary bugs fixed in SkyBitmapRenderer.java (android widget live sky background).
---

## Bug 1 — CRITICAL: greenwichSiderealTime UT offset error (root cause of "sun at Fajr")

`(jd % 1) * 24.0` computes hours since JD noon, NOT UT hours since midnight. This caused a **12-hour error** in all astronomical positions (sun, moon, stars). Sun appeared where night should be and vice versa.

**Fix:** `((jd + 0.5) % 1.0) * 24.0 * 1.00273791`

**Why:** JD day boundary is at noon (JD X.0 = noon), but UT starts at midnight. Adding 0.5 before mod shifts the boundary. The factor 1.00273791 converts solar to sidereal seconds.

**How to apply:** Any calculation using GMST in this file must use the fixed formula.

## Bug 2: Moon drawn below horizon

`if (cMoonAlt > -5)` allowed moon to render at altitudes down to -5°, but `drawMoon` clamps Y to `h - 15` so moon appeared pinned to bottom of widget when it was below the horizon.

**Fix:** Changed threshold to `cMoonAlt > 0` — only draw moon when above horizon.

## Bug 3: drawMoon Y clamp (one-sided)

Old: `Math.min(y, h - 15)` — only prevented bottom overflow, not top overflow.
**Fix:** `Math.max(r + 4, Math.min(y, h - r - 4))` — clamps both top and bottom.

## Bug 4: drawSun bottom clamp missing

Sun center could be drawn off-canvas bottom. Added `Math.min(y, (float)h)` to clamp at horizon.

## Bug 5: fallbackSunAlt division-by-zero

If prayer time ms values were equal or zero, integer division by 0 was possible. Added guard: if any interval is 0 or negative, return -18 (deep night) immediately.
