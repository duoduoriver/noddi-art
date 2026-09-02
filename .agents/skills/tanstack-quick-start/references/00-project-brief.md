# Project brief normalization

## Goal

Turn the user's short description into a normalized internal brief the agent can execute deterministically.

## Normalize into these fields

- **projectName**: string
- **tagline**: string
- **description**: string (1–2 sentences)
- **primaryFeatures**: string[] (3–8)
- **targetUsers**: string (optional)
- **domain**: string (e.g. `acme.ai`)
- **appUrl**: string (e.g. `https://acme.ai`)
- **defaultLocale**: `en` | `zh` (default: `en`)
- **supportedLocales**: array subset of `[en, zh]` (default: `[en]` for v1; add `zh` only when requested)
- **socialLinks**:
  - **xUrl** (optional)
  - **githubUrl** (optional)
  - **supportEmail** (optional)
- **referenceLinks**: string[] (docs, competitors, inspiration)
- **branding**:
  - **primaryColor**: CSS color (prefer oklch or hex; edit `src/styles.css` `:root` / `.dark`)
  - **logoAssetPath**: optional local file path
  - **faviconAssetPath**: optional local file path

## TODO marking convention

When data is missing, do not block. Insert safe placeholders and add explicit TODO markers in edited files.

Recommended strings:

- `TODO: set to your domain` / `TODO: replace with your support email`
- Keep TODOs short and searchable.

## Safety

- Do not invent legal claims.
- Do not enable auth/database secrets unless the user explicitly asks.
