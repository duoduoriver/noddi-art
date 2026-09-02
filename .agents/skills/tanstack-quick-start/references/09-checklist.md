# Minimal checklist (duoduohe-tanstack)

Use this as the default "v1 bootstrap" scope.

## Rule (v1 hard limit)

For the first version, **only edit the files in the allowlist below**. Do not touch anything else unless the user explicitly expands scope.

## Validation (required)

- Before starting: `pnpm install`
- After finishing: `pnpm build` (ensure no lint/build errors)

## Always

- `.env.local` (and `.env.production` when deploying)
- `src/messages/en.ts` → `site.*`, `nav.*`, `footer.*`
- `src/messages/zh.ts` → same keys (when supporting Chinese)
- `src/config/website.ts` → `metadata`, `social`, `mail` display strings
- `src/components/blocks/hero.tsx`
- `src/components/blocks/logo-cloud.tsx`
- `src/components/blocks/features.tsx`
- `src/components/blocks/features2.tsx`
- `src/components/blocks/calltoaction.tsx`
- `src/components/blocks/faqs.tsx`
- `src/components/blocks/stats.tsx` (optional but recommended)
- `src/components/blocks/integration.tsx` (optional)
- `src/components/blocks/integration2.tsx` (optional)
- `src/components/blocks/testimonials.tsx` (optional)
- `src/styles.css` (only when brand color provided)
- `public/logo.png`, `public/logo-dark.png`, `public/og.png`
- `content/pages/privacy.md`, `content/pages/terms.md`, `content/pages/cookie.md`

## Do not edit in v1 (unless explicitly requested)

- `src/routes/**` (except sitemap is read-only in v1)
- `src/components/blocks/homepage.tsx`, `home-product-sections.tsx`, `home-conversion-sections.tsx`
- `src/components/ui/**`, `src/auth/**`, `src/payment/**`, `src/db/**`
- `src/routeTree.gen.ts`
- Auth/billing wiring and dashboard routes
- `websiteConfig.auth.enable`, `payment.enable`, database secrets

## Optional (recommended)

- `src/messages/en.ts` → `pricing.*` when payment will be enabled soon
- Fetch OG image via `scripts/fetch_og_image.py`
- Switch `src/messages/index.ts` to `./zh` for Chinese-only sites

## Pair with repo bootstrap

For creating a new GitHub repo from the template, use the external `start-tanstack` skill (`~/.codex/skills/start-tanstack/`). Run that **before** this skill when starting from scratch.
