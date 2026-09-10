import { encodeIco } from '@/export/ico';
import type { ExportFiles } from '@/export/types';
import {
  IconDownload,
  IconLoader2,
  IconPhoto,
  IconUpload,
} from '@tabler/icons-react';
import { strToU8, zipSync } from 'fflate';
import { useEffect, useMemo, useState } from 'react';

type ToolMode = 'resizer' | 'ios' | 'android' | 'web';

type ToolConfig = {
  title: string;
  description: string;
  buttonLabel: string;
  filename: string;
  recommendedSize: number;
};

const CONFIG: Record<ToolMode, ToolConfig> = {
  resizer: {
    title: 'Free app icon resizer',
    description:
      'Upload one square PNG, JPEG, or WebP and download a ZIP with common icon sizes. The image stays in your browser.',
    buttonLabel: 'Download resized icons',
    filename: 'sunburst-ai-app-icon-sizes.zip',
    recommendedSize: 1024,
  },
  ios: {
    title: 'Free Xcode AppIcon.appiconset generator',
    description:
      'Already have an icon? Convert it into the same AppIcon.appiconset structure Sunburst AI exports, without creating an account.',
    buttonLabel: 'Download Xcode package',
    filename: 'sunburst-ai-xcode-appiconset.zip',
    recommendedSize: 1024,
  },
  android: {
    title: 'Free Android mipmap + adaptive icon generator',
    description:
      'Create launcher PNGs, adaptive foreground/background layers, monochrome themed icons, and API 26+ XML locally in your browser.',
    buttonLabel: 'Download Android package',
    filename: 'sunburst-ai-android-mipmap.zip',
    recommendedSize: 512,
  },
  web: {
    title: 'Free favicon + PWA package generator',
    description:
      'Create favicon.ico, PNG favicons, Apple touch icons, PWA icons, maskable variants, and a web manifest locally in your browser.',
    buttonLabel: 'Download favicon package',
    filename: 'sunburst-ai-favicon-pwa.zip',
    recommendedSize: 512,
  },
};

const RESIZER_SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024] as const;
const ANDROID_DENSITIES = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
] as const;
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ANDROID_SAFE_RATIO = 66 / 108;
const MASKABLE_SAFE_SQUARE_RATIO = 0.8 / Math.SQRT2;

type LocalImage = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

type Rgba = { r: number; g: number; b: number; a: number };
type PreparedArtwork = { foreground: LocalImage; background: Rgba };

function copyBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function downloadBytes(
  bytes: Uint8Array,
  filename: string,
  contentType: string
) {
  const url = URL.createObjectURL(
    new Blob([copyBuffer(bytes)], { type: contentType })
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is not available in this browser.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  return { canvas, context };
}

function canvasFromImage(image: LocalImage) {
  const { canvas, context } = makeCanvas(image.width, image.height);
  context.putImageData(
    new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
    0,
    0
  );
  return canvas;
}

function imageFromCanvas(canvas: HTMLCanvasElement): LocalImage {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas is not available in this browser.');
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  return {
    data: new Uint8ClampedArray(pixels.data),
    width: canvas.width,
    height: canvas.height,
  };
}

async function decodeLocalImage(file: File): Promise<LocalImage> {
  const url = URL.createObjectURL(file);
  try {
    const element = new Image();
    element.decoding = 'async';
    element.src = url;
    await element.decode();
    const width = element.naturalWidth;
    const height = element.naturalHeight;
    if (!width || !height) throw new Error('Could not decode this image.');
    const { canvas, context } = makeCanvas(width, height);
    context.drawImage(element, 0, 0, width, height);
    return imageFromCanvas(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasPng(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error('Could not encode PNG output.'));
    }, 'image/png');
  });
  return new Uint8Array(await blob.arrayBuffer());
}

async function encodePng(image: LocalImage) {
  return canvasPng(canvasFromImage(image));
}

function resizeImage(
  image: LocalImage,
  width: number,
  height: number
): LocalImage {
  const source = canvasFromImage(image);
  const { canvas, context } = makeCanvas(width, height);
  context.drawImage(source, 0, 0, width, height);
  return imageFromCanvas(canvas);
}

async function sizedPng(image: LocalImage, size: number) {
  return encodePng(resizeImage(image, size, size));
}

function pixel(source: LocalImage, x: number, y: number): Rgba {
  const offset = (y * source.width + x) * 4;
  return {
    r: source.data[offset],
    g: source.data[offset + 1],
    b: source.data[offset + 2],
    a: source.data[offset + 3],
  };
}

function backgroundColor(source: LocalImage): Rgba {
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
  const totals = opaque.reduce(
    (sum, sample) => ({
      r: sum.r + sample.r,
      g: sum.g + sample.g,
      b: sum.b + sample.b,
    }),
    { r: 0, g: 0, b: 0 }
  );
  return {
    r: Math.round(totals.r / opaque.length),
    g: Math.round(totals.g / opaque.length),
    b: Math.round(totals.b / opaque.length),
    a: 255,
  };
}

function colorDistance(first: Rgba, second: Rgba) {
  const red = first.r - second.r;
  const green = first.g - second.g;
  const blue = first.b - second.b;
  return Math.sqrt(red * red + green * green + blue * blue);
}

function hasUsefulTransparency(source: LocalImage) {
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

function extractForeground(source: LocalImage): LocalImage {
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

function prepareArtwork(source: LocalImage): PreparedArtwork {
  return {
    foreground: extractForeground(source),
    background: backgroundColor(source),
  };
}

function alphaBounds(source: LocalImage) {
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

function cropImage(
  source: LocalImage,
  bounds: NonNullable<ReturnType<typeof alphaBounds>>
): LocalImage {
  const width = bounds.right - bounds.left + 1;
  const height = bounds.bottom - bounds.top + 1;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((bounds.top + row) * source.width + bounds.left) * 4;
    data.set(
      source.data.subarray(sourceStart, sourceStart + width * 4),
      row * width * 4
    );
  }
  return { data, width, height };
}

function blankImage(width: number, height: number, fill?: Rgba): LocalImage {
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

function composite(
  destination: LocalImage,
  overlay: LocalImage,
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

function fittedForeground(
  artwork: PreparedArtwork,
  canvasSize: number,
  maxRatio: number
) {
  const bounds = alphaBounds(artwork.foreground);
  const foreground = bounds
    ? cropImage(artwork.foreground, bounds)
    : artwork.foreground;
  const maxSize = Math.max(1, Math.floor(canvasSize * maxRatio));
  const scale = Math.min(
    maxSize / foreground.width,
    maxSize / foreground.height
  );
  const width = Math.max(1, Math.round(foreground.width * scale));
  const height = Math.max(1, Math.round(foreground.height * scale));
  const resized = resizeImage(foreground, width, height);
  const output = blankImage(canvasSize, canvasSize);
  composite(
    output,
    resized,
    Math.floor((canvasSize - width) / 2),
    Math.floor((canvasSize - height) / 2)
  );
  return output;
}

function androidAdaptiveLayers(artwork: PreparedArtwork, size: number) {
  const foreground = fittedForeground(artwork, size, ANDROID_SAFE_RATIO);
  const background = blankImage(size, size, artwork.background);
  const monochrome = blankImage(size, size);
  for (let offset = 0; offset < foreground.data.length; offset += 4) {
    monochrome.data[offset] = 255;
    monochrome.data[offset + 1] = 255;
    monochrome.data[offset + 2] = 255;
    monochrome.data[offset + 3] = foreground.data[offset + 3];
  }
  return { foreground, background, monochrome };
}

async function maskablePng(artwork: PreparedArtwork, size: number) {
  const output = blankImage(size, size, artwork.background);
  composite(
    output,
    fittedForeground(artwork, size, MASKABLE_SAFE_SQUARE_RATIO),
    0,
    0
  );
  return encodePng(output);
}

async function buildResizerFiles(image: LocalImage): Promise<ExportFiles> {
  const entries = await Promise.all(
    RESIZER_SIZES.map(
      async (size) =>
        [`icons/icon-${size}x${size}.png`, await sizedPng(image, size)] as const
    )
  );
  return {
    ...Object.fromEntries(entries),
    'README.txt': strToU8(
      `Sunburst AI app icon resizer\n\nGenerated sizes: ${RESIZER_SIZES.join(', ')} px.\nThe source image was processed locally in your browser.\n`
    ),
  };
}

async function buildIosFiles(image: LocalImage): Promise<ExportFiles> {
  const contents = JSON.stringify(
    {
      images: [
        {
          filename: 'AppIcon-1024.png',
          idiom: 'universal',
          platform: 'ios',
          size: '1024x1024',
        },
      ],
      info: { author: 'sunburst-ai', version: 1 },
    },
    null,
    2
  );
  return {
    'ios/AppIcon.appiconset/AppIcon-1024.png': await sizedPng(image, 1024),
    'ios/AppIcon.appiconset/Contents.json': strToU8(contents),
  };
}

function adaptiveIconXml() {
  return `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@mipmap/ic_launcher_background" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />\n</adaptive-icon>\n`;
}

async function buildAndroidFiles(image: LocalImage): Promise<ExportFiles> {
  const artwork = prepareArtwork(image);
  const files: ExportFiles = {
    'android/play_store_512.png': await sizedPng(image, 512),
    'android/README.txt': strToU8(
      'Android launcher assets\n\nCopy the contents of res/ into app/src/main/res/.\nReview automatically derived adaptive foreground/background/monochrome layers in Android Studio before release.\n'
    ),
    'android/res/mipmap-anydpi-v26/ic_launcher.xml': strToU8(adaptiveIconXml()),
    'android/res/mipmap-anydpi-v26/ic_launcher_round.xml': strToU8(
      adaptiveIconXml()
    ),
  };
  for (const [density, legacySize, adaptiveSize] of ANDROID_DENSITIES) {
    files[`android/res/mipmap-${density}/ic_launcher.png`] = await sizedPng(
      image,
      legacySize
    );
    files[`android/res/mipmap-${density}/ic_launcher_round.png`] =
      await sizedPng(image, legacySize);
    const layers = androidAdaptiveLayers(artwork, adaptiveSize);
    files[`android/res/mipmap-${density}/ic_launcher_foreground.png`] =
      await encodePng(layers.foreground);
    files[`android/res/mipmap-${density}/ic_launcher_background.png`] =
      await encodePng(layers.background);
    files[`android/res/mipmap-${density}/ic_launcher_monochrome.png`] =
      await encodePng(layers.monochrome);
  }
  return files;
}

function manifestJson() {
  return JSON.stringify(
    {
      icons: [
        {
          src: 'icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: 'icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: 'icon-192-maskable.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: 'icon-512-maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2
  );
}

async function buildWebFiles(image: LocalImage): Promise<ExportFiles> {
  const artwork = prepareArtwork(image);
  const faviconPngs = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      png: await sizedPng(image, size),
    }))
  );
  return {
    'web/favicon.ico': encodeIco(faviconPngs),
    'web/favicon-16x16.png': faviconPngs[0].png,
    'web/favicon-32x32.png': faviconPngs[1].png,
    'web/apple-touch-icon.png': await sizedPng(image, 180),
    'web/icon-192.png': await sizedPng(image, 192),
    'web/icon-512.png': await sizedPng(image, 512),
    'web/icon-192-maskable.png': await maskablePng(artwork, 192),
    'web/icon-512-maskable.png': await maskablePng(artwork, 512),
    'web/manifest.webmanifest': strToU8(manifestJson()),
    'web/README.txt': strToU8(
      'Web icon assets\n\nIncludes favicon.ico, PNG favicons, Apple touch icon, PWA icons, maskable variants, and manifest.webmanifest. Review maskable crops before release.\n'
    ),
  };
}

async function buildFiles(mode: ToolMode, image: LocalImage) {
  if (mode === 'resizer') return buildResizerFiles(image);
  if (mode === 'ios') return buildIosFiles(image);
  if (mode === 'android') return buildAndroidFiles(image);
  return buildWebFiles(image);
}

export function LocalIconTool({ mode }: { mode: ToolMode }) {
  const config = CONFIG[mode];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const acceptedLabel = useMemo(() => 'PNG, JPEG or WebP · max 20 MB', []);

  async function createPackage() {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (file.size > MAX_FILE_BYTES) {
        throw new Error('Please choose an image smaller than 20 MB.');
      }
      const source = await decodeLocalImage(file);
      if (source.width !== source.height) {
        throw new Error('Please use a square image (1:1 aspect ratio).');
      }
      if (source.width < 64) {
        throw new Error('Please use an image that is at least 64 × 64 pixels.');
      }
      if (source.width > 4096) {
        throw new Error(
          'Please use an image no larger than 4096 × 4096 pixels.'
        );
      }

      const files = await buildFiles(mode, source);
      const archive = zipSync(files);
      downloadBytes(archive, config.filename, 'application/zip');
      const upscaleWarning =
        source.width < config.recommendedSize
          ? ` Your ${source.width}px source is below the recommended ${config.recommendedSize}px, so larger outputs were upscaled and may look softer.`
          : '';
      setMessage(`Package downloaded.${upscaleWarning}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not process this image. Try a PNG, JPEG, or WebP file.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 border-2 border-black bg-[#f7f7f3] p-5 shadow-[5px_5px_0_#9b7bff] sm:p-7">
      <div className="grid gap-7 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
        <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#9c9a93] bg-white p-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Uploaded icon preview"
              className="max-h-64 max-w-full rounded-2xl object-contain"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <IconPhoto className="mx-auto size-10" />
              <p className="mt-3 text-sm font-semibold">
                Your icon preview appears here
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#c6ff5b] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]">
              Free · local processing
            </span>
            <span className="text-xs text-muted-foreground">
              No account required
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            {config.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {config.description}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-black bg-white px-4 text-sm font-bold shadow-[2px_2px_0_#111] hover:bg-[#f1f1ed]">
              <IconUpload className="size-4" />
              {file ? 'Choose another image' : 'Choose image'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={(event) => {
                  const next = event.target.files?.[0] ?? null;
                  setFile(next);
                  setError(null);
                  setMessage(null);
                }}
              />
            </label>
            <button
              type="button"
              onClick={createPackage}
              disabled={!file || busy}
              className="brush-button inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconDownload className="size-4 text-[#c6ff5b]" />
              )}
              {busy ? 'Preparing…' : config.buttonLabel}
            </button>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {acceptedLabel}. Square artwork recommended at{' '}
            {config.recommendedSize} × {config.recommendedSize}px or larger.
          </p>
          {file ? (
            <p className="mt-2 truncate text-xs font-semibold">
              Selected: {file.name}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-destructive"
            >
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-3 text-sm font-semibold text-[#486d00]">
              {message}
            </p>
          ) : null}

          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Privacy: this utility reads and transforms the selected image in
            your browser. It does not send the image through the Sunburst AI
            generation workflow.
          </p>
        </div>
      </div>
    </section>
  );
}
