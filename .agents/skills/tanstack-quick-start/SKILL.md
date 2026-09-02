---
name: tanstack-quick-start
description: Automate first-pass customization of a new duoduohe-tanstack project from a short project brief (app name, domain/app URL, product description/features, reference links, and branding preferences). Use when the user says they are starting a new TanStack project, bootstrapping the starter, or customizing branding and landing content.
---

# TanStack Quick Start (Project Bootstrap)

This skill is intentionally split into small reference modules. Load only the module(s) you need.

## v1 edit scope (hard limit)

For the first pass, **only modify the files listed in** `references/09-checklist.md`.

- Do **not** change routing code, layouts, or shared components outside the allowlist.
- Do **not** introduce login/auth/payment features unless explicitly requested.
- Do **not** edit `src/routeTree.gen.ts` (auto-generated).

## Dev workflow (required)

- Before starting edits: run `pnpm install` (once) to ensure dependencies are installed.
- After finishing all edits: run `pnpm build` to validate the project (build + lint checks). If it fails, fix issues **only within the v1 allowlist** unless the user expands scope.

## Project brief

Normalize the user's request first:

- `references/00-project-brief.md`

## Execution order (duoduohe-tanstack)

1. App basics (env-driven): `references/01-env-app-info.md`
2. SEO metadata: `references/02-seo-metadata.md`
3. Landing page blocks: `references/03-landing-page.md`
4. Theme styles: `references/04-theme-styles.md`
5. Logo + favicon: `references/05-logo-favicon.md`
6. Sitemap: `references/06-sitemap.md`
7. Legal pages: `references/07-legal-pages.md`
8. Images (extract from links or use placeholders): `references/08-images.md`
9. Minimal checklist: `references/09-checklist.md`

## Bundled script

- `scripts/fetch_og_image.py`: Best-effort OG/Twitter preview image downloader for a reference link.
