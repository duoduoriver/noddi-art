# TanStack Page Builder — Guide (v1)

## Goal

Create a new page from a short spec by scaffolding route files, content, and registry entries.

## Choose page type

### `content` (default for docs / policies / static pages)

Use when the page is mostly markdown text.

Creates:

- `content/pages/<slug>.md`
- `src/routes/(pages)/<slug>.tsx` or `src/routes/(legals)/<slug>.tsx`
- `Routes.<Key>` in `src/lib/routes.ts`
- Entry in `src/routes/sitemap[.]xml.ts` → `staticUrls`

Pattern follows `src/routes/(legals)/privacy.tsx`:

```tsx
loader → getPageContent({ slug })
component → <MarkdownPage page={page} />
```

### `marketing` (feature landing)

Use when the page needs React layout + existing blocks (FAQ, CTA, etc.).

Creates:

- `src/routes/(pages)/<slug>.tsx` with composed blocks
- `messages.pages.<camelSlug>.*` in `en.ts` and `zh.ts`
- `Routes.<Key>` + sitemap entry
- Optional `nav` entry in `messages.nav` (manual follow-up in `navbar-config.ts` only if user requests nav link)

Default block stack for marketing pages:

```tsx
<Container>
  <header /> // from messages
  <FeaturesSection /> // or inline simplified features from messages
  <FaqSection />
  <CallToActionSection />
</Container>
```

For v1, prefer reusing `FaqSection` and a simple hero header from messages rather than editing shared blocks.

## Route → slug → files

- **Route**: `/ai-tools`
- **Slug**: `ai-tools`
- **Route file**: `src/routes/(pages)/ai-tools.tsx`
- **TanStack route id**: `/(pages)/ai-tools`
- **Routes key**: `AiTools` (PascalCase from slug)

Nested routes (e.g. `/features/ai`) require nested folders:

- `src/routes/(pages)/features/ai.tsx`
- Route id: `/(pages)/features/ai`

The bundled script supports single-segment slugs by default. Use nested paths manually or pass `--route "/features/ai"`.

## Placeholder image rule

Use picsum in markdown only:

```
https://picsum.photos/seed/<seed>/1200/630
```

Do not add files to `public/` in v1.

## Script usage

```bash
python3 .agents/skills/tanstack-page-builder/scripts/create_page.py \
  --type content \
  --route "/ai-tools" \
  --title "AI Tools" \
  --description "Explore our AI-powered tools." \
  --keywords "ai,tools,automation"

python3 .agents/skills/tanstack-page-builder/scripts/create_page.py \
  --type marketing \
  --route "/features/seo" \
  --title "SEO Tools" \
  --description "Built-in SEO for your SaaS." \
  --keywords "seo,metadata,sitemap"
```

After the script runs, fill in `TODO:` markers in generated markdown/messages, then `pnpm build`.

## Hard constraints (v1)

- Only create **new** files; do not overwrite unless `--force`.
- Do not edit `src/routeTree.gen.ts` (regenerated on build).
- Do not modify existing pages or shared blocks.
