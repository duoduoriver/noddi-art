import { stylePromptDirection } from '@/generation/style-presets';

export const PROMPT_TEMPLATE_VERSION = 'noddi-v2';

const ICON_CANVAS_RULES = [
  'Each icon is a square production master that fills its canvas',
  'edge to edge, including all four corners.',
  'The operating system will apply the rounded mask later.',
  'Do not draw a rounded rectangle, squircle, iOS/Android icon mask,',
  'card, tile, badge, bezel, drop-shadow plate, or device mockup.',
  'Do not inset a smaller icon onto a different outer background.',
  'No text, lettering, typography, or watermark.',
].join(' ');

const GRID_LAYOUT_RULES = [
  'Output one 1024x1024 image as a tight 2x2 contact sheet.',
  'The four cells are exactly 512x512 and meet at the exact',
  'midlines x=512 and y=512 with no gutters, gaps, separators,',
  'frames, or shared outer margin.',
  'Each cell is an independent icon concept.',
  'Keep identical framing across all four cells: the subject is',
  'optically centered, and uses the same scale and padding.',
].join(' ');

function briefText(brief: Record<string, unknown>, key: string): string {
  const value = brief[key];
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

function backgroundInstruction(background: string) {
  const value = background.trim() || 'solid #ffffff';
  if (/transparent/i.test(value)) {
    return [
      `Background: ${value}.`,
      'Use a fully transparent square in every cell.',
      'Corners must stay transparent.',
      'Do not hide the glyph on an opaque rounded plate.',
    ].join(' ');
  }
  return [
    `Background: ${value}.`,
    'That background must fill every pixel of each square,',
    'including all four sharp corners.',
  ].join(' ');
}

function referenceInstruction(count: number) {
  if (count <= 0) return '';
  const noun = count === 1 ? 'image' : 'images';
  return ` Use the ${count} supplied reference ${noun} as visual direction while still creating four fresh variations.`;
}

export function promptForJob(
  job: { operation: string; candidate?: string | null },
  project: { brief: string }
) {
  const brief = JSON.parse(project.brief) as Record<string, unknown>;
  if (job.operation === 'grid') {
    const references = Array.isArray(brief.referenceFileIds)
      ? brief.referenceFileIds.length
      : 0;
    const styleDirection = stylePromptDirection(brief.style);
    const avoid = briefText(brief, 'avoid');
    return [
      'Create a 1024x1024 app-icon concept sheet.',
      GRID_LAYOUT_RULES,
      ICON_CANVAS_RULES,
      `Product: ${briefText(brief, 'productDescription')}.`,
      `Subject: ${briefText(brief, 'iconSubject')}.`,
      `Style preset: ${briefText(brief, 'style')}.`,
      `Style direction: ${styleDirection}`,
      `Primary color: ${briefText(brief, 'primaryColor')}.`,
      backgroundInstruction(briefText(brief, 'background')),
      'Treat the selected style direction as a strong visual constraint',
      "while preserving the user's requested subject and concept.",
      avoid ? `Avoid: ${avoid}.` : '',
      referenceInstruction(references),
      'Keep every concept recognizable at small sizes.',
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (job.operation === 'revision') {
    return [
      'Revise the supplied app icon using the stored user instruction.',
      'Keep one clean 1024x1024 square icon.',
      ICON_CANVAS_RULES,
      'If the source sits on a rounded plate or has uneven margins,',
      'expand the background to the square edges and recenter the artwork.',
      'Do not invent a new rounded rectangle.',
    ].join(' ');
  }
  if (job.operation === 'hd_master') {
    return [
      'Re-render the supplied app icon as one clean production-quality',
      '1024x1024 square icon.',
      'Preserve the original composition, shapes, colors, proportions,',
      'and visual identity as faithfully as possible.',
      ICON_CANVAS_RULES,
      'If the source has a rounded plate or unused margins, fill the',
      'square including corners and keep the artwork centered.',
      'Do not redesign it, add details, add text, or add a watermark.',
    ].join(' ');
  }
  return [
    `Turn the supplied candidate ${job.candidate} into one polished`,
    '1024x1024 square app icon.',
    `Product: ${briefText(brief, 'productDescription')}.`,
    ICON_CANVAS_RULES,
    'Match the candidate framing: centered subject, full-bleed square,',
    'no rounded plate.',
  ].join(' ');
}
