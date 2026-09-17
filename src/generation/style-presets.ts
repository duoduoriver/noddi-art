const ICON_SURFACE =
  ' Fill the square including corners. Do not place the artwork on a rounded rectangle, squircle, or app-icon plate.';

export const STYLE_PROMPT_PRESETS = {
  sketch:
    'Hand-drawn sketch icon style. Use confident expressive ink or pencil-like strokes, slightly imperfect organic outlines, simplified forms, and a tactile handmade character. Keep the silhouette clear and readable at small app-icon sizes. Avoid photorealism, overly polished vector geometry, tiny hatching, and visual clutter.' +
    ICON_SURFACE,
  graffiti:
    'Bold graffiti-inspired icon style. Use energetic urban shapes, thick dynamic contours, punchy simplified forms, and expressive spray-paint or marker-like attitude. Keep the composition compact, iconic, and readable at small sizes. Avoid text, lettering, tags, busy wall scenes, excessive splatter, and tiny decorative details.' +
    ICON_SURFACE,
  minimal:
    'Minimal geometric icon style. Use a simple bold silhouette, very few deliberate shapes, strong negative space, clean precise edges, flat graphic forms, and immediate recognition at small sizes. Prioritize visual balance and reduction over decoration. Avoid unnecessary detail, texture noise, thin fragile lines, complex scenes, and ornamental elements.' +
    ICON_SURFACE,
  doodle:
    'Playful doodle icon style. Use casual hand-drawn lines, friendly simplified shapes, whimsical imperfect geometry, and a light spontaneous illustration character. Keep the subject compact, distinctive, and legible at small icon sizes. Avoid dense sketching, tiny details, realistic rendering, text, and overly complex compositions.' +
    ICON_SURFACE,
} as const;

export type StylePresetId = keyof typeof STYLE_PROMPT_PRESETS;

export function stylePromptDirection(style: unknown) {
  const raw = typeof style === 'string' ? style.trim() : '';
  const presetId = raw.toLowerCase() as StylePresetId;
  return (
    STYLE_PROMPT_PRESETS[presetId] ??
    (raw
      ? `Use the requested ${raw} visual style as a strong design direction. Keep it appropriate for a clean, recognizable app icon, fill the square including corners, and avoid rounded plates or unnecessary visual complexity.`
      : 'Use a clean, recognizable app-icon visual style with a strong silhouette, a full-bleed square canvas, and controlled detail. Do not draw a rounded rectangle plate.')
  );
}
