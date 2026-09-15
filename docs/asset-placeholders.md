# Sunburst AI visual asset prompts

This file tracks the static visual assets that may replace the current HTML/CSS placeholders. Each entry contains a prompt that can be pasted directly into an image-generation model. Icon Gallery assets are intentionally excluded; gallery artwork should be handled separately from this placeholder list.

## Marketing and product visuals

### `auth-side-visual`

- Installed path: `/placeholders/auth/auth-side-visual.webp`
- Used in: Login / Register desktop left panel
- Delivered size: 1024×1024, 1:1
- Source: supplied Sunburst AI workflow visual, optimized to WebP
- Image generation prompt (for future replacement):

> Create a premium branded illustration for **Sunburst AI**, an AI app icon generator for developers. Show a clear visual workflow moving from left to right: a short app brief or prompt card, then four distinct rounded-square app icon concepts labeled subtly A, B, C, D, then a compact developer export panel suggesting iOS, Android, Web, and macOS asset packages. Use a clean white or warm paper background, bold black outlines, vivid fluorescent lime accents, rich purple accents, large rounded cards, subtle neo-brutalist shadows, and polished modern SaaS art direction. Keep the composition spacious and editorial, suitable for the left side of a desktop authentication page. No people, no third-party logos, no fake metrics, no fake testimonials, no dense UI text, no screenshots of existing products. Make it feel original, trustworthy, developer-focused, and visually consistent with a white + black + lime + purple Sunburst AI design system.

### `home-hero-product-visual`

- Installed path: `/home/hero-background.webp`
- Used in: Homepage hero background
- Delivered size: 1439×817, 16:9
- Source: supplied decorative Sunburst hero visual, optimized to WebP
- Image generation prompt (for future replacement):

> Create a high-fidelity product UI mockup for **Sunburst AI — AI App Icon Generator for Developers**. Show a believable desktop generator interface inside one polished browser-like card. Include a prompt field with a concise example such as “A productivity app icon with a clean checkmark, modern and friendly”, compact style controls, four generated app icon concepts labeled A, B, C, D in one row, one selected concept with a clear selected state, and an export action. The workflow represented must match the real product: **Describe → Generate 4 Concepts → Pick → create an HD Master only when needed → Export**. Use white surfaces, crisp black borders, fluorescent lime primary actions, purple selection states, large rounded corners, subtle hard-edged shadows, and excellent spacing. Keep all UI text short and legible. Do not show nonexistent refine/final/revision features, fake usage data, fake reviews, or third-party branding. Present the image as a polished SaaS product marketing visual, not a generic dashboard.

### `generate-empty-concepts`

- Future path: `/placeholders/generate/empty-concepts.webp`
- Used in: Generate workspace empty state, optional
- Target size: ~1000×1000, 1:1
- Image generation prompt:

> Create a minimal empty-state illustration for an AI app icon generator workspace. Show four small rounded-square concept placeholders arranged in a clean row or compact 2×2 composition, clearly empty rather than finished artwork. Use subtle abstract geometry, faint checkerboard or paper textures, thin black or neutral gray outlines, soft off-white surfaces, tiny restrained purple and fluorescent lime accents, and generous negative space. The image should communicate “your generated concepts will appear here” without containing actual app icons, readable product names, fake prompts, people, or fake user content. Keep it quiet, lightweight, and visually compatible with a modern developer SaaS interface.

### `generate-history-empty`

- Future path: `/placeholders/generate/history-empty.webp`
- Used in: Generate workspace project-history empty state, optional
- Target size: ~640×400, 8:5
- Image generation prompt:

> Create a compact empty-state illustration for a **project history** sidebar in a developer SaaS app. Depict a small stack or timeline of neutral rounded project cards with subtle icon-thumbnail placeholders, one faint clock/history motif, and a sense of saved work waiting to appear. Use a white/off-white background, crisp dark outlines, soft gray fills, minimal purple and fluorescent lime highlights, rounded geometry, and restrained neo-brutalist styling. Do not include fake project names, fake users, avatars, dates, statistics, screenshots, or finished app icon artwork. Keep the composition simple enough to remain readable at a small sidebar size.

### `default-og-image`

- Installed path: `/og.jpg`
- Used in: Default Open Graph / social share preview
- Delivered size: 1200×630
- Source: supplied Sunburst AI social visual, center-cropped and optimized as progressive JPEG
- Image generation prompt (for future replacement):

> Design a polished **1200×630 Open Graph image** for **Sunburst AI**. Brand positioning: **AI App Icon Generator for Developers**. Create a strong social-share composition with the Sunburst AI brand name, the headline “AI App Icon Generator for Developers”, a concise support line “iOS · Android · Web · macOS”, and 3–4 original rounded-square app icon concept tiles as decorative product examples. Use a mostly white background with strong black typography, fluorescent lime CTA-style accents, rich purple geometric details, bold rounded cards, and subtle neo-brutalist shadows. Keep all important text and artwork comfortably inside social-crop safe margins. The result should look crisp and premium at thumbnail size. No fake ratings, customer logos, user counts, third-party logos, or claims about a specific image model.

## Guide diagrams

These are optional educational visuals. Guide pages should continue using semantic HTML, tables, code, and CSS cards until a final diagram is available.

### `ios-app-icon-sizes`

- Future path: `/placeholders/guides/ios-app-icon-sizes.webp`
- Target size: 1600×1000
- Image generation prompt:

> Create a clean educational infographic explaining the modern **iOS app icon source and Xcode export workflow**. On the left, show one large rounded-square source icon labeled **1024×1024 source**. In the center, show a simple directional flow into an Xcode-style AppIcon asset container. On the right, show several smaller rounded icon-size tiles representing generated platform variants without implying a specific deprecated size list. Use precise grid alignment, white/off-white background, black typography and lines, soft gray annotations, and restrained purple + fluorescent lime highlights matching Sunburst AI. Make it technical, minimal, and version-neutral. Avoid Apple logos, screenshots copied from Xcode, fake UI chrome, decorative clutter, or unsupported requirement claims.

### `android-adaptive-safe-zone`

- Future path: `/placeholders/guides/android-adaptive-safe-zone.webp`
- Target size: 1600×1000
- Image generation prompt:

> Create a technical educational diagram for **Android adaptive app icons**. Show a large square icon canvas with clearly separated **background layer**, **foreground layer**, and **monochrome/themed layer**, plus an inner conservative safe-zone boundary around the important foreground artwork. Use concentric rounded-square guides, dashed measurement boundaries, simple arrows, and concise labels. Visually distinguish the layers with neutral gray, purple, and fluorescent lime accents while keeping black outlines and a white/off-white background. The central artwork should be a generic abstract symbol, not a real brand logo. The diagram should feel like developer documentation: clean, precise, spacious, and easy to scan. Do not copy Android Studio screenshots or include third-party branding.

### `favicon-pwa-sizes`

- Future path: `/placeholders/guides/favicon-pwa-sizes.webp`
- Target size: 1600×1000
- Image generation prompt:

> Create a clean developer infographic showing a **Web favicon and PWA icon asset family** generated from one source icon. Start with one master rounded-square source on the left, then branch into labeled output groups: **favicon 16 / 32 / 48**, **Apple touch 180**, **PWA 192 / 512**, and **maskable 192 / 512**. Show the favicon outputs as tiny browser-tab-style samples and the PWA/maskable outputs as rounded-square asset tiles, while keeping the illustration schematic rather than screenshot-like. Use a white/off-white background, crisp black lines and typography, subtle gray dividers, fluorescent lime accents, and purple highlights consistent with Sunburst AI. Keep labels readable and the hierarchy technical and uncluttered. No browser brand logos, fake product metrics, or unrelated decorative artwork.

## Assets intentionally not requested

- **Icon Gallery artwork:** excluded from this document.
- **Fake testimonial avatars:** do not generate; the product should not invent social proof.
- **Fake customer logos or customer-count graphics:** do not generate.
- **Generate concept thumbnails:** use real generated project assets, not static placeholders.
- **Project history thumbnails:** use each real project's stored thumbnail rather than static artwork.

## Replacement rules

1. Keep the HTML/CSS fallback until the final generated asset has been reviewed and optimized.
2. Prefer WebP/AVIF for marketing imagery; use PNG when transparency or the social/asset format requires it.
3. Add explicit width and height plus meaningful alt text when an asset becomes an `<img>`.
4. Do not attribute generated artwork to a specific model unless provenance metadata actually proves it.
5. Do not add testimonials, ratings, customer logos, usage counts, or other social-proof claims unless they are real and sourced.
