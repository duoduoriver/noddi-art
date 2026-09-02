# Step 3 — Landing copy (home page blocks)

## Goal

Update landing page content and navigation for the new product.

## Architecture (duoduohe-tanstack)

Unlike duoduohe-starter's JSON-driven pages, landing sections are **React components** under `src/components/blocks/`. Most copy lives in a local `const m = { ... }` inside each file.

Home page composition (`src/components/blocks/homepage.tsx`):

1. `hero.tsx`
2. `logo-cloud.tsx`
3. `home-product-sections.tsx` → features, features2, CTA, stats, integration, integration2
4. `home-conversion-sections.tsx` → pricing (if enabled), testimonials, faqs, newsletter

## Files to edit (v1)

### Block copy (inline `const m`)

- `src/components/blocks/hero.tsx`
- `src/components/blocks/logo-cloud.tsx`
- `src/components/blocks/features.tsx`
- `src/components/blocks/features2.tsx`
- `src/components/blocks/calltoaction.tsx`
- `src/components/blocks/stats.tsx`
- `src/components/blocks/integration.tsx`
- `src/components/blocks/integration2.tsx`
- `src/components/blocks/testimonials.tsx`
- `src/components/blocks/faqs.tsx`
- `src/components/blocks/pricing.tsx` (only if payment enabled)

### Navigation + footer labels

- `src/messages/en.ts` → `nav.*`, `footer.*`
- `src/messages/zh.ts` → same (when supporting Chinese)

`src/config/navbar-config.ts` and `src/config/footer-config.ts` read from `messages.nav` — do not edit unless adding/removing nav items.

## Default scope (v1)

Rewrite copy in at least:

- `hero` (title, description, introduction, button labels)
- `features` + `features2` (section titles + item titles/descriptions from **primaryFeatures**)
- `faqs` (3–5 Q&A from brief)
- `calltoaction` (final CTA)

Optionally update `stats`, `testimonials`, `integration*` when reference material supports it. Do not invent metrics or fake testimonials.

## Link hygiene

Replace template placeholders:

- `duoduohe.com` / `duoduohe TanStack` → **domain** / **projectName**
- `support@duoduohe.com` → **socialLinks.supportEmail**
- External links in hero → real **appUrl** or reference links when appropriate

## Avoid (v1)

- Do not claim OAuth, Stripe, or admin features in copy unless the user explicitly enabled them.
- Do not edit `src/components/blocks/homepage.tsx` structure unless the user asks to add/remove sections.

## Chinese copy

- Update `src/messages/zh.ts` for nav/footer/site when `supportedLocales` includes `zh`.
- For block components, prefer extracting copy to messages in a later pass; v1 may leave ZH as TODO if blocks remain English-only.
