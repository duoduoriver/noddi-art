# Step 5 — Logo + favicon

## Goal

Replace default branding assets.

## Files

- `public/logo.png` — light mode logo
- `public/logo-dark.png` — dark mode logo (can match light logo for v1)
- `public/og.png` — Open Graph / social preview (1200×630 recommended)
- Favicon: check `src/routes/__root.tsx` or `public/` for favicon links

## Config wiring

`src/config/website.ts` already points to:

```ts
images: {
  ogImage: '/og.png',
  logoLight: '/logo.png',
  logoDark: '/logo-dark.png',
}
```

Update file contents in `public/`; paths rarely need changing.

## When user provides assets

- Copy **logoAssetPath** → `public/logo.png` (and `public/logo-dark.png` if separate).
- Copy **faviconAssetPath** → appropriate `public/` favicon file.
- Run `scripts/fetch_og_image.py` on a reference link to seed `public/og.png` when no OG asset is provided.

## Placeholder rule

If no logo is provided, keep template logos but add a `TODO: replace logo` comment in the checklist output.
