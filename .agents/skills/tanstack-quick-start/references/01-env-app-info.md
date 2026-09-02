# Step 1 — App basics (env-driven)

## Goal

Make app URL consistent via env files. Site name/description live in `src/messages/` and `src/config/website.ts`.

## Files

- `.env.example` (source template)
- `.env.local` (local dev)
- `.env.production` (prod build)

## Actions

- Copy `.env.example` → `.env.local` (and `.env.production` when deploying).
- Set at minimum:
  - `VITE_BASE_URL` = **appUrl** (e.g. `https://acme.ai`; local: `http://localhost:3000`)

## Notes

- Do not set server secrets (`BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, etc.) unless the user explicitly wants login/payments now.
- Payment is disabled by default (`VITE_PAYMENT_PROVIDER` empty). Leave it empty in v1 unless requested.

## Where name/description are set

TanStack does **not** read app name from env. Update:

- `src/messages/en.ts` → `site.name`, `site.title`, `site.description`
- `src/messages/zh.ts` → same keys (when supporting Chinese)

`src/config/website.ts` reads from `messages.site` for metadata.
