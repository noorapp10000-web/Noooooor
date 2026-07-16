---
name: Moon terminator rendering bugs
description: Six bugs found and fixed in SkyBitmapRenderer.java drawMoon() — covers terminator path, rotation, Earthshine, craters, blood moon.
---

# Moon Rendering Bugs — SkyBitmapRenderer.java

## The 6 bugs fixed in drawMoon()

### Bug 1 — Waning terminator path sweep inverted (CRITICAL — caused "full moon twice")
`mp.arcTo(termOval, -90, term >= 0 ? 180 : -180)` was wrong for waning moon.
- waning gibbous (term < 0) → used sweep -180 (left arc) → rendered as thin crescent ❌
- waning crescent (term > 0) → used sweep +180 (right arc) → rendered as large gibbous ❌

**Fix:** `mp.arcTo(termOval, -90, term >= 0 ? -180 : 180)` — swapped the two values.

**Why:** Waning moon's terminator arc must traverse the OPPOSITE side from waxing.
- Waxing crescent: right side of termOval (sweep -180 from bottom)
- Waxing gibbous: left side of termOval (sweep +180 from bottom)
- Waning crescent: left side of termOval (sweep -180 from top) ← needs -180 for term>0
- Waning gibbous: right side of termOval (sweep +180 from top) ← needs +180 for term<0

### Bug 2 — Terminator canvas rotation 90° off
`c.rotate(toDegrees(sunAngleOnScreen) + 90f, x, yy)` had extra +90f.
**Fix:** Remove `+ 90f`. The lit side (right half in drawing space) already faces +x; rotating by sunAngleOnScreen aligns it directly toward the sun.

### Bug 3 — Earthshine center hardcoded to left
`RadialGradient(x - r*0.18f, ...)` always put Earthshine on left side.
**Fix:** Compute `esX = x - cos(sunAngleOnScreen)*r*0.18`, `esY = yy - sin(sunAngleOnScreen)*r*0.08`.
The dark side is opposite to the sun direction — both waxing and waning now correct.
**Prerequisite:** sunAngleOnScreen must be computed before the Earthshine block.

### Bug 4 — Crater shadows use screen-space sun angle in rotated canvas
`drawMoonCraters(..., sunAngleOnScreen)` was called inside c.save()/c.rotate() block.
Inside the function: `shadowDX = -cos(sunAngle)*0.32f` — wrong, canvas already rotated.
**Fix:** Pass `0.0` instead. In the rotated canvas space, sun is always at angle 0° (right), so shadow is always -x direction: `shadowDX = -0.32f, shadowDY = 0`.

### Bug 5 — Craters not clipped to illuminated area
drawMoonMare had internal clipPath(mp) but drawMoonCraters had no clipping.
Craters and rays could appear on the dark side of the moon.
**Fix:** Wrap drawMoonCraters call in `c.save(); c.clipPath(mp); ...; c.restore()`.

### Bug 6 — Blood moon fires every full moon near horizon
`bloodMoon = (moonAlt < 1.5 && ill > 0.82)` — fires every monthly full moon rising/setting.
Real blood moon = lunar eclipse, not atmospheric reddening (already handled by horizonT).
**Fix:** `bloodMoon = false`. horizonT already provides the correct amber/orange reddening.

## Architecture note
- sunAngleOnScreen must be computed ONCE before the Earthshine block and reused in the terminator block (avoids duplicate dx/dy calculation).
- The terminator path for waxing and waning are NOT symmetric — the arcTo start angles differ (-90 for waning vs 90 for waxing) AND the sweep logic is inverted.
