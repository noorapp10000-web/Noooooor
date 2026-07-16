---
name: Removed packages
description: Packages removed from noor to reduce bundle size (as of June 2026)
---

Removed from `artifacts/noor/package.json`:
- `cmdk` — command palette, unused
- `date-fns` — date utilities, replaced with native JS Date
- `next-themes` — theme provider, replaced with MutationObserver hook
- `embla-carousel` + `embla-carousel-react` — carousel, unused
- `react-day-picker` — date picker, unused
- `input-otp` — OTP input, unused
- `react-resizable-panels` — panel layout, unused
- `recharts` — charting, unused
- `mp4-muxer` — video muxing, unused

**Why:** These packages were installed but never imported, bloating the APK build.

**How to apply:** Do NOT re-add these unless explicitly needed. Check bundle size impact before adding any new package.
