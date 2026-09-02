# AGENTS.md

This file provides guidance to Code Agents (Codex, Cursor, etc.) when working with code in this repository.

## Project Overview

**duoduohe TanStack** — a full-stack SaaS starter built with TanStack Start + React 19, deployed on Cloudflare Workers. Includes auth (Better Auth), payments (Stripe / Creem), email (Resend / Cloudflare Email), storage (Cloudflare R2), database (Cloudflare D1 via Drizzle ORM), blog (Content Collections), and admin dashboard.

## Commands

```bash
pnpm dev                    # Dev server on port 3000
pnpm build                  # Production build
pnpm deploy                 # Build + deploy to Cloudflare Workers

pnpm lint                   # Biome lint + format with auto-fix
pnpm check                  # Biome lint (read-only, no auto-fix)
pnpm format                 # Biome format only
pnpm knip                   # Find unused exports/dependencies

pnpm db:generate            # Generate Drizzle migrations from schema
pnpm db:migrate:local       # Apply migrations to local D1
pnpm db:migrate:remote      # Apply migrations to remote D1
pnpm db:studio:local        # Open Drizzle Studio (local)
pnpm db:studio:remote       # Open Drizzle Studio (remote)

pnpm auth:schema:generate   # Regenerate Better Auth schema → src/db/auth.schema.ts
pnpm email:dev              # React Email preview on port 3333
pnpm cf-typegen             # Generate Cloudflare Worker types (also runs on postinstall)
```

No test framework is configured. Manual testing via `pnpm dev` and test routes in `src/routes/(tests)/`.

## Workflow

This is a pnpm + Cloudflare Workers repo. Use `pnpm` only; do not introduce npm or yarn lockfiles.

Reuse existing routes, server functions, middleware, providers, UI components, and Wrangler bindings before adding new ones. Do not create a parallel auth, database, payment, or deploy path.

Full-stack work follows this order:

1. Data model in `src/db/app.schema.ts` (do not hand-edit `auth.schema.ts`; regenerate with `pnpm auth:schema:generate`).
2. `pnpm db:generate`, then apply with `pnpm db:migrate:local`. Record rollback notes (SQL down or expand/migrate/contract). Never run `pnpm db:migrate:remote` or production D1 writes without explicit approval.
3. Zod validation and stable error mapping on `createServerFn()` in `src/api/`.
4. Authz via existing middleware (`auth-middleware`, `admin-middleware`) when the path is protected.
5. Smallest UI change in `src/routes/` / components, including loading, empty, error, and permission states. Never edit `src/routeTree.gen.ts`.
6. Verify: `pnpm check` for lint, `pnpm build` when types or the Worker bundle can break. Smoke the decisive flow with `pnpm dev` (and `src/routes/(tests)/` when relevant). There is no unit-test runner.

Do not claim a bug is fixed until the reproducer works under `pnpm dev` and the relevant `pnpm check` / `pnpm build` has passed.

Read `src/env/client.ts`, `src/env/server.ts`, and `.env.example` only. Do not read `.env`, `.env.local`, Wrangler secrets, or production data unless the user explicitly requires it.

Release order: repo check → `pnpm build` → explicit approval, then `pnpm deploy`. Do not deploy without that approval. Run `web-perf` only when the user asks for a production performance audit of a live or preview URL; drive it with Chrome DevTools MCP, not ego-browser. If `navigate_page` / `performance_start_trace` are unavailable, stop and ask to configure `chrome-devtools-mcp`.

## Architecture

### Request Flow
Incoming request → Cloudflare Worker (`src/server.ts`) → TanStack Start handler → server functions execute (auth, DB, email) → React SSR → response with hydration state → client-side React hydration via TanStack Router.

### Key Architectural Patterns

- **File-based routing**: `src/routes/` maps to URL paths. `[param]` for dynamic segments, `$` for catch-all, `(group)` for layout-only groups, `__root.tsx` for root layout. Route tree auto-generates into `src/routeTree.gen.ts` — never edit this file.

- **Server functions**: Defined with `createServerFn()` from `@tanstack/react-start`. Located in `src/api/`. Support `.inputValidator()` (Zod) and `.middleware()` chains. Called directly from client code.

- **Provider pattern**: Mail, storage, newsletter, notification, and payment each use a provider abstraction (`src/*/provider/`) so implementations can be swapped (e.g., `src/mail/provider/resend.ts`, `src/storage/provider/r2.ts`).

- **Middleware**: `src/middlewares/auth-middleware.ts` (requires login) and `src/middlewares/admin-middleware.ts` (requires admin role) used with server functions.

- **Environment variables**: Client-side uses `VITE_` prefix (build-time, via `src/env/client.ts`). Server-side uses Cloudflare Worker bindings/secrets (runtime, via `src/env/server.ts`). Both validated with Zod via `@t3-oss/env-core`.

### Key Source Directories

| Directory | Purpose |
|-----------|---------|
| `src/routes/` | File-based routes (pages, API handlers, webhooks) |
| `src/api/` | Server functions (payment, users, contact, newsletter, files) |
| `src/auth/` | Better Auth config (`auth.ts` server, `client.ts` client) |
| `src/db/` | Drizzle schemas (`auth.schema.ts` auto-generated, `app.schema.ts` app tables), migrations, types |
| `src/payment/` | Stripe / Creem integration (checkout, portal, webhooks) |
| `src/mail/` | Resend / Cloudflare Email — provider, templates (React components), rendering |
| `src/storage/` | Cloudflare R2 file storage |
| `src/newsletter/` | Resend and Beehiiv newsletter via API |
| `src/notification/` | Discord/Feishu webhook notifications |
| `src/components/ui/` | shadcn/ui components (auto-generated, excluded from linting) |
| `src/config/` | Site configuration (website.ts is the main config for features, pricing, metadata) |
| `src/lib/` | Utilities (routes, SEO, formatters, markdown parsing) |
| `src/hooks/` | React hooks (auth, payment, files, etc.) |
| `content/` | Markdown content (blog, pages, changelog) for Content Collections |
| `docs/` | Module-specific documentation (auth, db, payment, mail, storage, env, design) |
| `.agents/skills/` | Agent workflows (`tanstack-quick-start`, `tanstack-page-builder`) |

### Database

Two schema files merged in `src/db/schema.ts`:
- `auth.schema.ts` — auto-generated by Better Auth (user, session, account, verification, apiKey)
- `app.schema.ts` — application tables (userFiles, payment, etc.)

Types inferred from tables in `src/db/types.ts`. Access via `getDb()` from `src/db/index.ts`.

### Cloudflare Bindings (wrangler.jsonc)
- `DB` — D1 database binding
- `BUCKET` — R2 storage binding

## Agent Skills

Project-local skills live in `.agents/skills/`. Read the matching `SKILL.md` before running a workflow.

### `tanstack-quick-start` — first-pass project customization

Use when bootstrapping a new product from this template: app name, domain, landing copy, branding, legal pages.

- Skill: `.agents/skills/tanstack-quick-start/SKILL.md`
- Checklist (v1 allowlist): `references/09-checklist.md`
- Validation: `pnpm install` → edits → `pnpm build`
- Landing copy: `src/components/blocks/*.tsx` (inline `const m`) + `src/messages/en.ts` (nav/footer/site)
- Config: `src/config/website.ts`, `.env.local` (`VITE_BASE_URL`)
- Legal pages: `content/pages/*.md`
- Script: `.agents/skills/tanstack-quick-start/scripts/fetch_og_image.py`

Pair with the external **`start-tanstack`** skill (`~/.codex/skills/start-tanstack/`) when creating a new private GitHub repo from this template. Run `start-tanstack` first, then `tanstack-quick-start`.

### `tanstack-page-builder` — scaffold new pages

Use when adding a new marketing or content page from a short spec (route, title, keywords).

- Skill: `.agents/skills/tanstack-page-builder/SKILL.md`
- Guide: `references/00-guide.md`
- Validation: `pnpm build`
- Script:

```bash
python3 .agents/skills/tanstack-page-builder/scripts/create_page.py \
  --type content --route "/my-page" \
  --title "My Page" --description "Page description."

python3 .agents/skills/tanstack-page-builder/scripts/create_page.py \
  --type marketing --route "/features/seo" \
  --title "SEO Tools" --description "Built-in SEO for your SaaS."
```

`content` type creates `content/pages/<slug>.md` + route loader. `marketing` type creates a route with FAQ/CTA blocks. The script updates `src/lib/routes.ts` and `src/routes/sitemap[.]xml.ts`. Never edit `src/routeTree.gen.ts` (auto-generated on build).

## Code Style

Enforced by Biome (`biome.json`):
- 2-space indent, 80-char line width, single quotes, semicolons always, ES5 trailing commas
- Files excluded from linting: `src/components/ui/`, `src/components/data-table/`, `src/db/`, `src/routeTree.gen.ts`, type definition files

### Conventions
- **File names**: kebab-case (`use-auth.ts`, `data-table.tsx`)
- **Components**: PascalCase (`DataTable`, `LoginForm`)
- **Hooks**: camelCase with `use` prefix
- **Constants**: SCREAMING_SNAKE_CASE
- **Imports**: Use `@/` path alias for all src imports. Order: external → internal (`@/`) → relative
- **Forms**: `react-hook-form` + `@hookform/resolvers` + Zod
- **State**: TanStack Query for server state (query key factory pattern)
- **Styling**: Tailwind CSS v4 with `cn()` from `src/lib/utils.ts`, class-based dark mode
- **Icons**: `@tabler/icons-react`

### Cloudflare Workers Constraint
Avoid Node.js-specific APIs — this runs on Cloudflare Workers runtime, not Node.js.
