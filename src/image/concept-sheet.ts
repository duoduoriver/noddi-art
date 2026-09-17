import { resizePng, type PngImage } from '@/image/png';

export type QuadrantId = 'A' | 'B' | 'C' | 'D';
export type ConceptQuadrants = Record<QuadrantId, PngImage>;

type Rgba = { r: number; g: number; b: number; a: number };

const OUTPUT_SIZE = 512;
const COLOR_THRESHOLD = 28;
const CONTENT_ALPHA = 24;

function pixel(image: PngImage, x: number, y: number): Rgba {
  const offset = (y * image.width + x) * 4;
  return {
    r: image.data[offset],
    g: image.data[offset + 1],
    b: image.data[offset + 2],
    a: image.data[offset + 3],
  };
}

function colorDistance(first: Rgba, second: Rgba) {
  const red = first.r - second.r;
  const green = first.g - second.g;
  const blue = first.b - second.b;
  return Math.sqrt(red * red + green * green + blue * blue);
}

function sampleBackground(image: PngImage): Rgba {
  const points = [
    [0, 0],
    [image.width - 1, 0],
    [0, image.height - 1],
    [image.width - 1, image.height - 1],
  ] as const;
  const total = points.reduce(
    (sum, [x, y]) => {
      const sample = pixel(image, x, y);
      return {
        r: sum.r + sample.r,
        g: sum.g + sample.g,
        b: sum.b + sample.b,
        a: sum.a + sample.a,
      };
    },
    { r: 0, g: 0, b: 0, a: 0 }
  );
  return {
    r: Math.round(total.r / points.length),
    g: Math.round(total.g / points.length),
    b: Math.round(total.b / points.length),
    a: Math.round(total.a / points.length),
  };
}

function isContent(sample: Rgba, background: Rgba) {
  if (background.a < 128) return sample.a > CONTENT_ALPHA;
  if (sample.a < 200) return true;
  return colorDistance(sample, background) > COLOR_THRESHOLD;
}

function fillImage(width: number, height: number, color: Rgba): PngImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    data[offset] = color.r;
    data[offset + 1] = color.g;
    data[offset + 2] = color.b;
    data[offset + 3] = color.a;
  }
  return { data, width, height };
}

function cropRect(
  image: PngImage,
  left: number,
  top: number,
  width: number,
  height: number
): PngImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((top + row) * image.width + left) * 4;
    data.set(
      image.data.subarray(sourceStart, sourceStart + width * 4),
      row * width * 4
    );
  }
  return { data, width, height };
}

function contentBounds(image: PngImage, background: Rgba, step = 2) {
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < image.height; y += step) {
    for (let x = 0; x < image.width; x += step) {
      if (!isContent(pixel(image, x, y), background)) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) return null;
  return { left, top, right, bottom };
}

function sheetBounds(image: PngImage, background: Rgba) {
  const bounds = contentBounds(image, background);
  if (!bounds) {
    return { left: 0, top: 0, width: image.width, height: image.height };
  }
  const rightInset = image.width - 1 - bounds.right;
  const bottomInset = image.height - 1 - bounds.bottom;
  const insets = [bounds.left, bounds.top, rightInset, bottomInset];
  const minInset = Math.min(...insets);
  const maxInset = Math.max(...insets);
  const hasFrame =
    minInset >= 4 && maxInset <= 160 && maxInset / Math.max(minInset, 1) <= 2.5;
  if (!hasFrame) {
    return { left: 0, top: 0, width: image.width, height: image.height };
  }
  return {
    left: bounds.left,
    top: bounds.top,
    width: bounds.right - bounds.left + 1,
    height: bounds.bottom - bounds.top + 1,
  };
}

function bestSplit(counts: Uint32Array, size: number, step = 2) {
  const mid = Math.round(size / 2 / step) * step;
  const window = Math.max(step * 4, Math.floor(size * 0.12));
  let typical = 0;
  let typicalCount = 0;
  for (let i = mid - window; i <= mid + window; i += step) {
    if (i < step || i >= size - step) continue;
    typical += counts[i];
    typicalCount += 1;
  }
  const typicalMean = typical / Math.max(typicalCount, 1);
  let best = mid;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let i = mid - window; i <= mid + window; i += step) {
    if (i < step || i >= size - step) continue;
    const score = counts[i - step] + counts[i] + counts[i + step];
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  // Only move the split when a real gutter is darker than nearby content.
  if (bestScore / 3 > typicalMean * 0.45) return Math.floor(size / 2);
  return best;
}

function axisCounts(image: PngImage, background: Rgba) {
  const columns = new Uint32Array(image.width);
  const rows = new Uint32Array(image.height);
  const step = 2;
  for (let y = 0; y < image.height; y += step) {
    for (let x = 0; x < image.width; x += step) {
      if (!isContent(pixel(image, x, y), background)) continue;
      columns[x] += 1;
      rows[y] += 1;
    }
  }
  return { columns, rows };
}

function blit(
  destination: PngImage,
  source: PngImage,
  sourceLeft: number,
  sourceTop: number,
  width: number,
  height: number,
  destX: number,
  destY: number
) {
  for (let row = 0; row < height; row += 1) {
    const targetY = destY + row;
    if (targetY < 0 || targetY >= destination.height) continue;
    for (let col = 0; col < width; col += 1) {
      const targetX = destX + col;
      if (targetX < 0 || targetX >= destination.width) continue;
      const sourceOffset =
        ((sourceTop + row) * source.width + sourceLeft + col) * 4;
      const targetOffset = (targetY * destination.width + targetX) * 4;
      destination.data.set(
        source.data.subarray(sourceOffset, sourceOffset + 4),
        targetOffset
      );
    }
  }
}

function recenterCell(cell: PngImage): PngImage {
  const background = sampleBackground(cell);
  const bounds = contentBounds(cell, background);
  if (!bounds) return cell;
  const width = bounds.right - bounds.left + 1;
  const height = bounds.bottom - bounds.top + 1;
  if (width < 8 || height < 8) return cell;
  if (width >= cell.width * 0.92 && height >= cell.height * 0.92) {
    return cell;
  }
  const destX = Math.floor((cell.width - width) / 2);
  const destY = Math.floor((cell.height - height) / 2);
  const output = fillImage(cell.width, cell.height, background);
  blit(output, cell, bounds.left, bounds.top, width, height, destX, destY);
  return output;
}

/**
 * Split a 1024 concept sheet into four 512 masters. Detects an outer frame
 * and a 2x2 gutter when the model did not land on the exact midlines, then
 * recenters inset artwork so each candidate shares the same optical center.
 */
export async function cropQuadrants(
  image: PngImage
): Promise<ConceptQuadrants> {
  if (image.width !== 1024 || image.height !== 1024) {
    throw new Error('Concept sheet must be 1024×1024');
  }
  const sheetBackground = sampleBackground(image);
  const bounds = sheetBounds(image, sheetBackground);
  const sheet = cropRect(
    image,
    bounds.left,
    bounds.top,
    bounds.width,
    bounds.height
  );
  const background = sampleBackground(sheet);
  const { columns, rows } = axisCounts(sheet, background);
  const splitX = bestSplit(columns, sheet.width);
  const splitY = bestSplit(rows, sheet.height);
  const cells: Array<[QuadrantId, number, number, number, number]> = [
    ['A', 0, 0, splitX, splitY],
    ['B', splitX, 0, sheet.width - splitX, splitY],
    ['C', 0, splitY, splitX, sheet.height - splitY],
    ['D', splitX, splitY, sheet.width - splitX, sheet.height - splitY],
  ];
  const quadrants = {} as ConceptQuadrants;
  for (const [id, left, top, width, height] of cells) {
    if (width < 8 || height < 8) {
      throw new Error('Concept sheet cells are too small to crop');
    }
    let cell = cropRect(sheet, left, top, width, height);
    if (cell.width !== OUTPUT_SIZE || cell.height !== OUTPUT_SIZE) {
      cell = await resizePng(cell, OUTPUT_SIZE, OUTPUT_SIZE);
    }
    quadrants[id] = recenterCell(cell);
  }
  return quadrants;
}
