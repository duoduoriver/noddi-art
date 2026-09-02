# Step 6 — Sitemap

## Goal

Ensure core marketing URLs appear in the dynamic sitemap.

## File

- `src/routes/sitemap[.]xml.ts` — `staticUrls` array inside the GET handler

## Default static URLs (already present)

`/`, `/about`, `/changelog`, `/roadmap`, `/contact`, `/waitlist`, `/terms`, `/privacy`, `/cookie`

## Actions (v1)

- Verify `VITE_BASE_URL` is correct (sitemap uses `getBaseUrl()`).
- Do **not** add new custom pages in quick-start v1 — that is `tanstack-page-builder` scope.
- If payment is enabled, `/pricing` is added automatically when `websiteConfig.payment.enable` is true.
- If blog is enabled, blog posts are added dynamically.

## Notes

Unlike duoduohe-starter's static `public/sitemap.xml`, this project generates sitemap at runtime. Edit the route file, not `public/`.
