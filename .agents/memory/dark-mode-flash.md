---
name: Dark mode flash fix
description: How noor prevents white flash before React hydrates
---

Theme is applied via an inline `<script>` in `artifacts/noor/index.html` before React mounts.

**Rule:** Read `localStorage.getItem('noor_uid')`, then `localStorage.getItem('noor_rtdb_cache_' + uid)`, parse JSON, check `.settings.theme`. If `'dark'`, add class `'dark'` to `document.documentElement` immediately.

**Why:** React renders after JS bundle loads — without this, there's a flash of the light theme even when user set dark mode.

**How to apply:** Any change to theme storage key names must also update this inline script.
