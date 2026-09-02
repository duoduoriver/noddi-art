# Step 4 — Theme styles

## Goal

Apply branding colors and keep dark-first aesthetic consistent with `docs/design.md`.

## Files

- `src/styles.css` — Tailwind v4 theme tokens (`:root`, `.dark`)
- `src/custom.css` — project-specific overrides (if any)

## Actions

When the user provides **branding.primaryColor**:

- Update `--primary` and related tokens in `src/styles.css` `:root` and `.dark`.
- Prefer oklch values to match the existing token system.
- Keep changes minimal — adjust primary + ring tokens, not the entire palette.

## Defaults

If no brand color is given, keep the template's warm neutral primary (`oklch(0.553 0.195 38.402)`).

## Avoid

- Do not switch font families unless explicitly requested.
- Do not add decorative gradients or accent colors beyond primary token updates.
