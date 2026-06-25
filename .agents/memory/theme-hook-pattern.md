---
name: Theme hook pattern
description: How pages detect dark mode — MutationObserver, not next-themes
---

**Rule:** All pages use a local `useDarkMode()` hook (MutationObserver on `document.documentElement` class list), NOT next-themes.

`next-themes` has been removed from package.json. Any new page must use:
```ts
const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
useEffect(() => {
  const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}, []);
```
Or import the shared `useDarkMode` hook.

**Why:** next-themes was removed as an unused dependency. The MutationObserver pattern is lighter and already in use across all pages.
