# Step 7 — Legal pages

## Goal

Replace template legal copy with product-specific placeholders (not legal advice).

## Files

- `content/pages/privacy.md`
- `content/pages/terms.md`
- `content/pages/cookie.md`

Routes already exist:

- `src/routes/(legals)/privacy.tsx`
- `src/routes/(legals)/terms.tsx`
- `src/routes/(legals)/cookie.tsx`

## Actions

In each markdown file frontmatter + body:

- Replace product name with **projectName**
- Replace domain/email placeholders with **domain** / **socialLinks.supportEmail**
- Keep structure; use `TODO:` for jurisdiction-specific claims the user did not provide

## Avoid

- Do not invent compliance certifications (GDPR, SOC2, etc.) unless the user provided them.
