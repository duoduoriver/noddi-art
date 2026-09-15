---
name: tanstack-page-builder
description: "Create new marketing or content pages in this TanStack starter from a supplied route and brief."
---

# TanStack Page Builder (New Pages)

This skill creates **new pages** in duoduohe-tanstack. Unlike duoduohe-starter's JSON dynamic page builder, TanStack uses file-based routes plus either React route files or Content Collections markdown.

This skill is intentionally **much simpler** than `tanstack-quick-start`: it only creates new pages.

## v1 edit scope (hard limit)

For v1, you may **only**:

- Add **new** markdown files under `content/pages/**` (content pages)
- Add **new** route files under `src/routes/(pages)/**` or `src/routes/(legals)/**`
- Append entries to `src/lib/routes.ts` (`Routes` constant)
- Append entries to `src/routes/sitemap[.]xml.ts` (`staticUrls`)
- Add **new** message keys under `src/messages/en.ts` and `src/messages/zh.ts` (when creating marketing pages)

Hard rules:

- Do **not** modify existing route files (only create new ones).
- Do **not** touch `src/routeTree.gen.ts` (auto-generated).
- Do **not** add or edit images under `public/`. **Use placeholder image URLs in markdown or copy only.**
- Do **not** change shared block components in `src/components/blocks/` unless the user expands scope.

## Page types

| Type | When to use | Creates |
|------|-------------|---------|
| `content` | Docs, policies, static text pages | `content/pages/<slug>.md` + `src/routes/(legals\|pages)/<slug>.tsx` |
| `marketing` | Feature landing with title + sections | Route TSX + `messages` entries (reuses existing blocks when possible) |

See `references/00-guide.md` for decision rules.

## Inputs (normalize first)

Normalize the user request into:

- `route`: string (e.g. `/features/ai-image-generator`)
- `slug`: string (derived from route, e.g. `ai-image-generator` for flat routes)
- `pageType`: `content` | `marketing`
- `title`: string
- `description`: string
- `keywords`: string[] (3–10)
- `referenceCopy`: optional raw text snippets
- `sectionsWanted`: optional for marketing pages (default: hero copy + FAQ + CTA via existing blocks)

## Execution order

1. Normalize input + decide page type: `references/00-guide.md`
2. Generate files with `scripts/create_page.py`
3. Quick validation checklist: `references/01-checklist.md`
4. Validate build (required): `pnpm build`

## Bundled script (recommended)

Use the bundled script to scaffold route + content + registry updates:

- `scripts/create_page.py`

It is intentionally conservative:

- Creates missing folders
- Refuses to overwrite unless `--force`
- Adds `TODO:` markers for missing translations/content
