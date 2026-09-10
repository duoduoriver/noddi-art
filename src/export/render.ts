import {
  encodePng,
  encodeRaster,
  resizePng,
  type PngImage,
  type RasterFormat,
} from '@/image/png';

export type Rgba = { r: number; g: number; b: number; a: number };
export type PreparedArtwork = { foreground: PngImage; background: Rgba };

const ANDROID_SAFE_RATIO = 66 / 108;
const MASKABLE_SAFE_SQUARE_RATIO = 0.8 / Math.SQRT2;

function image(width: number, height: number, fill?: Rgba): PngImage {
  const data = new Uint8ClampedArray(width * height * 4);
  if (fill) {
    for (let offset = 0; offset < data.length; offset += 4) {
      data[offset] = fill.r;
      data[offset + 1] = fill.g;
      data[offset + 2] = fill.b;
      data[offset + 3] = fill.a;
    }
  }
  return { data, width, height };
}

function pixel(source: PngImage, x: number, y: number): Rgba {
  const offset = (y * source.width + x) * 4;
  return {
    r: source.data[offset],
    g: source.data[offset + 1],
    b: source.data[offset + 2],
    a: source.data[offset + 3],
  };
}

function backgroundColor(source: PngImage): Rgba {
  const points = [
    [0, 0],
    [source.width - 1, 0],
    [0, source.height - 1],
    [source.width - 1, source.height - 1],
    [Math.floor(source.width / 2), 0],
    [Math.floor(source.width / 2), source.height - 1],
    [0, Math.floor(source.height / 2)],
    [source.width - 1, Math.floor(source.height / 2)],
  ] as const;
  const opaque = points
    .map(([x, y]) => pixel(source, x, y))
    .filter((sample) => sample.a >= 192);
  if (!opaque.length) return { r: 255, g: 255, b: 255, a: 255 };
  const total = opaque.reduce(
    (sum, sample) => ({
      r: sum.r + sample.r,
      g: sum.g + sample.g,
      b: sum.b + sample.b,
    }),
    { r: 0, g: 0, b: 0 }
  );
  return {
    r: Math.round(total.r / opaque.length),
    g: Math.round(total.g / opaque.length),
    b: Math.round(total.b / opaque.length),
    a: 255,
  };
}

function colorDistance(first: Rgba, second: Rgba) {
  const red = first.r - second.r;
  const green = first.g - second.g;
  const blue = first.b - second.b;
  return Math.sqrt(red * red + green * green + blue * blue);
}

function hasUsefulTransparency(source: PngImage) {
  let transparent = 0;
  let sampled = 0;
  const step = Math.max(
    1,
    Math.floor(Math.min(source.width, source.height) / 128)
  );
  for (let y = 0; y < source.height; y += step) {
    for (let x = 0; x < source.width; x += step) {
      sampled += 1;
      if (source.data[(y * source.width + x) * 4 + 3] < 245) transparent += 1;
    }
  }
  return transparent / Math.max(sampled, 1) > 0.01;
}

/**
 * Best-effort foreground extraction for flattened generated artwork.
 * Transparent sources keep their alpha. Opaque sources remove pixels close to
 * the estimated edge background color. Structured artwork can replace this
 * fallback later without changing any platform preset.
 */
export function extractForeground(source: PngImage): PngImage {
  if (hasUsefulTransparency(source)) {
    return {
      data: new Uint8ClampedArray(source.data),
      width: source.width,
      height: source.height,
    };
  }
  const background = backgroundColor(source);
  const data = new Uint8ClampedArray(source.data);
  for (let offset = 0; offset < data.length; offset += 4) {
    const distance = colorDistance(
      { r: data[offset], g: data[offset + 1], b: data[offset + 2], a: 255 },
      background
    );
    const foreground = Math.min(Math.max((distance - 18) / 54, 0), 1);
    data[offset + 3] = Math.round(data[offset + 3] * foreground);
  }
  return { data, width: source.width, height: source.height };
}

export function prepareArtwork(source: PngImage): PreparedArtwork {
  return {
    foreground: extractForeground(source),
    background: backgroundColor(source),
  };
}

function alphaBounds(source: PngImage) {
  let left = source.width;
  let top = source.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (source.data[(y * source.width + x) * 4 + 3] <= 8) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) return null;
  return { left, top, right, bottom };
}

function crop(
  source: PngImage,
  bounds: NonNullable<ReturnType<typeof alphaBounds>>
) {
  const width = bounds.right - bounds.left + 1;
  const height = bounds.bottom - bounds.top + 1;
  const output = image(width, height);
  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((bounds.top + row) * source.width + bounds.left) * 4;
    output.data.set(
      source.data.subarray(sourceStart, sourceStart + width * 4),
      row * width * 4
    );
  }
  return output;
}

function composite(
  destination: PngImage,
  overlay: PngImage,
  left: number,
  top: number
) {
  for (let y = 0; y < overlay.height; y += 1) {
    for (let x = 0; x < overlay.width; x += 1) {
      const sourceOffset = (y * overlay.width + x) * 4;
      const targetOffset = ((top + y) * destination.width + left + x) * 4;
      const sourceAlpha = overlay.data[sourceOffset + 3] / 255;
      const targetAlpha = destination.data[targetOffset + 3] / 255;
      const outputAlpha = sourceAlpha + targetAlpha * (1 - sourceAlpha);
      if (outputAlpha <= 0) continue;
      for (let channel = 0; channel < 3; channel += 1) {
        destination.data[targetOffset + channel] = Math.round(
          (overlay.data[sourceOffset + channel] * sourceAlpha +
            destination.data[targetOffset + channel] *
              targetAlpha *
              (1 - sourceAlpha)) /
            outputAlpha
        );
      }
      destination.data[targetOffset + 3] = Math.round(outputAlpha * 255);
    }
  }
}

async function fittedForeground(
  artwork: PreparedArtwork,
  canvasSize: number,
  maxRatio: number
) {
  const bounds = alphaBounds(artwork.foreground);
  const foreground = bounds
    ? crop(artwork.foreground, bounds)
    : artwork.foreground;
  const maxSize = Math.max(1, Math.floor(canvasSize * maxRatio));
  const scale = Math.min(
    maxSize / foreground.width,
    maxSize / foreground.height
  );
  const width = Math.max(1, Math.round(foreground.width * scale));
  const height = Math.max(1, Math.round(foreground.height * scale));
  const resized = await resizePng(foreground, width, height);
  const output = image(canvasSize, canvasSize);
  composite(
    output,
    resized,
    Math.floor((canvasSize - width) / 2),
    Math.floor((canvasSize - height) / 2)
  );
  return output;
}

export async function androidAdaptiveLayers(
  artwork: PreparedArtwork,
  size: number
) {
  const foreground = await fittedForeground(artwork, size, ANDROID_SAFE_RATIO);
  const background = image(size, size, artwork.background);
  const monochrome = image(size, size);
  for (let offset = 0; offset < foreground.data.length; offset += 4) {
    monochrome.data[offset] = 255;
    monochrome.data[offset + 1] = 255;
    monochrome.data[offset + 2] = 255;
    monochrome.data[offset + 3] = foreground.data[offset + 3];
  }
  return { foreground, background, monochrome };
}

export async function maskablePng(artwork: PreparedArtwork, size: number) {
  const output = image(size, size, artwork.background);
  const foreground = await fittedForeground(
    artwork,
    size,
    MASKABLE_SAFE_SQUARE_RATIO
  );
  composite(output, foreground, 0, 0);
  return encodePng(output);
}

export async function sizedPng(source: PngImage, size: number) {
  return encodePng(await resizePng(source, size, size));
}

export async function sizedRaster(
  source: PngImage,
  size: number,
  format: RasterFormat
) {
  return encodeRaster(await resizePng(source, size, size), format);
}
