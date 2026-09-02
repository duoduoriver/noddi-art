# Page builder checklist (v1)

## After scaffolding

- [ ] `content/pages/<slug>.md` exists (content type) with valid frontmatter
- [ ] `src/routes/(pages|legals)/<slug>.tsx` exists and uses correct `createFileRoute` path
- [ ] `src/lib/routes.ts` has new `Routes.<Key>` constant
- [ ] `src/routes/sitemap[.]xml.ts` includes `{ path: '/<slug>' }`
- [ ] `src/messages/en.ts` has page messages (marketing type)
- [ ] `src/messages/zh.ts` has matching keys or `TODO:` placeholders (marketing type)
- [ ] No duplicate route paths
- [ ] `pnpm build` passes

## Manual follow-ups (optional)

- Add nav item in `messages.nav` + verify `navbar-config.ts` picks it up
- Add footer link in `footer-config.ts`
- For content pages with forms (like contact), copy `contact.tsx` pattern instead of markdown

## Do not (v1)

- Edit `src/routeTree.gen.ts`
- Overwrite existing routes without `--force`
- Add images to `public/`
