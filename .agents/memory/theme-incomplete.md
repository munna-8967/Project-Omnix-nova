---
name: Appearance theme incomplete
description: The theme/appearance persistence feature is a DB-only stub — saving works but nothing applies the color to the UI.
---

## State as of audit
- `user_settings.theme` (DB column): stores "violet" | "blue" | "gold" | "red" | "green" ✅
- Settings page UI: shows swatches, saves to DB on submit ✅
- AppLayout / App.tsx: hardcodes `rgba(124,58,237,0.3)` (violet) everywhere via inline styles ❌
- No ThemeProvider, no CSS variable injection, no `data-theme` attribute ❌
- `sonner.tsx` imports `useTheme` from next-themes but there is no next-themes ThemeProvider anywhere (harmless — defaults to "system", only affects toast toast styling)

## What's needed to fully implement
1. On app load, fetch settings and get `theme`
2. Map theme name → CSS variable values (primary hue, etc.)
3. Apply to `document.documentElement` as `style` or `data-theme` attribute
4. Replace all hardcoded `rgba(124,58,237,...)` inline styles in AppLayout with `var(--primary)` equivalents

**Why:** The feature appears to work (save confirmation fires, DB stores value) but users see no visual difference between themes. This is a known incomplete feature, not a regression.
