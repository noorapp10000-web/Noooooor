---
name: Sky renderer photorealism pass
description: Techniques and constraints for pushing the Android widget's 2D sky renderer toward maximal photorealistic detail without true 3D.
---

Android RemoteViews widgets only support a static 2D canvas bitmap (no OpenGL/3D). "Photorealistic" upgrades must come from layered 2D texture tricks, not geometry: per-pixel grain overlays, radial-gradient "cell" dabs for organic surfaces (sun granulation, sand/rock speckle), and multi-stop gradients instead of 2-stop ones to kill banding.

**Why:** user explicitly asked for "extreme, 3D-quality" visuals; confirmed understanding that true 3D isn't possible and still wants max 2D fidelity — so all realism gains must be additive layers on top of the existing silhouette/gradient system, not a rewrite.

**How to apply:**
- Daytime buildings previously only got thin horizontal "floor stripe" lines — flat and unconvincing. Added a real column+row window grid (`drawDaytimeWindowGrid`) with per-window sky-reflection tint variation and glass mullion strokes, layered on top of the existing night `drawWindowGrid`. Reflection color should sample the horizon-adjacent sky gradient stop (last index of `skyColors()`), not the zenith stop, since buildings sit near the horizon line.
- Mosque dome (building type 10 in `addSkylineBuilding`) is a flat silhouette fill; added a radial "specular" highlight circle on top (off-center light source) to fake a glazed/gilded dome surface.
- Organic-looking noise (sun granulation, sand grain, film grain) is done via scattering many small `RadialGradient` circles seeded by `Random`, clipped with `saveLayer`+`clipPath` to the parent shape — this is the established pattern in this codebase, reuse it rather than inventing bitmap-shader noise each time.
- Mountain layers had a single flat fill color per layer — added a vertical gradient per layer (lighter at ridge, matching sun tint) plus a sunlit ridge-line stroke and scattered light/dark speckles on the nearest layer only (rock/sand texture read poorly on far/blurred layers).
- No Android SDK/Gradle available in this sandbox — verification is manual read-through + brace-balance script (`grep -o '{' file | wc -l` vs `}`) after every edit, not actual compilation. Always re-run the balance check immediately after each multi-line edit to this file, since it is 5000+ lines and easy to lose track.
