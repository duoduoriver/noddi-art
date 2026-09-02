# Step 8 — Images

## Goal

Ensure landing content does not keep irrelevant template imagery.

## Rules

- Do **not** add new files under `public/imgs/` in v1 unless the user provides assets.
- For hero/block images embedded in components, use placeholder URLs when real assets are unavailable:

```
https://picsum.photos/seed/<seed>/<width>/<height>
```

- `<seed>` must be a single token (e.g. `acme-hero`, `acme-features-1`).

## OG image

Prefer:

```bash
python3 .agents/skills/tanstack-quick-start/scripts/fetch_og_image.py "<reference-url>" public/og.png
```

Fallback: keep `/og.png` template or a picsum placeholder URL in blog seed content only.

## Block components with images

Check `hero.tsx` (hero image), `features.tsx` (accordion images), `integration*.tsx` for hardcoded `/` paths. Replace template paths with picsum placeholders or user-provided URLs.
