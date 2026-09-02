# Step 2 — SEO metadata

## Goal

Ensure site-wide and home-page SEO reflect the new product.

## Files

- `src/messages/en.ts` → `site.{name,title,description}`
- `src/messages/zh.ts` → same (when supporting Chinese)
- `src/config/website.ts` → `metadata` block (reads from messages; update `images.ogImage` path if changed)
- `src/routes/index.tsx` → home `head()` uses `websiteConfig.metadata`

## Actions

- Rewrite `site.title` to include **projectName** + short value prop.
- Rewrite `site.description` from the brief **description** (1–2 sentences, no fluff).
- Keep `metadata.images.ogImage` as `/og.png` unless a new OG image was saved to `public/og.png`.

## Per-page SEO

Do **not** edit other route files in v1. Home page SEO is sufficient for bootstrap.

## Social links

Update `websiteConfig.social` in `src/config/website.ts`:

- `github` → **socialLinks.githubUrl** (or remove if unknown)
- `twitter` → **socialLinks.xUrl** (or remove if unknown)

## Mail display strings

Update `websiteConfig.mail.fromEmail` and `supportEmail` with **projectName** and **socialLinks.supportEmail** when provided.
