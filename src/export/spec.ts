import type { RasterFormat } from '@/image/png';
import {
  EXPORT_PLATFORMS,
  type ExportPlatform,
  type ExportSpec,
} from '@/export/types';

const RASTER_FORMATS: RasterFormat[] = ['png', 'webp', 'avif', 'jpg'];

function isRasterFormat(value: unknown): value is RasterFormat {
  return (
    typeof value === 'string' && RASTER_FORMATS.includes(value as RasterFormat)
  );
}

function isExportPlatform(value: unknown): value is ExportPlatform {
  return (
    typeof value === 'string' &&
    EXPORT_PLATFORMS.includes(value as ExportPlatform)
  );
}

function normalizePlatforms(value: unknown): ExportPlatform[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isExportPlatform))];
}

function imageSpec(format: RasterFormat, size: number): ExportSpec {
  return {
    kind: 'image',
    format,
    size: Math.min(Math.max(size, 16), 1024),
  };
}

export function parseExportSpec(value: string): ExportSpec {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (
      parsed.kind === 'image' &&
      isRasterFormat(parsed.format) &&
      Number.isInteger(Number(parsed.size))
    ) {
      return imageSpec(parsed.format, Number(parsed.size));
    }
    if (parsed.kind === 'packages') {
      const platforms = normalizePlatforms(parsed.platforms);
      if (platforms.length) return { kind: 'packages', platforms };
    }

    // Backwards compatibility for exports queued before schemaVersion 2.
    if (
      isRasterFormat(parsed.format) &&
      Number.isInteger(Number(parsed.size))
    ) {
      const platforms = normalizePlatforms(parsed.platforms);
      if (platforms.length) return { kind: 'packages', platforms };
      return imageSpec(parsed.format, Number(parsed.size));
    }
  } catch {
    // Older records used a raw format string.
  }

  if (value === 'appiconset') return { kind: 'packages', platforms: ['ios'] };
  if (value === 'iconset' || value === 'icns')
    return { kind: 'packages', platforms: ['macos'] };
  if (value === 'project_zip')
    return { kind: 'packages', platforms: [...EXPORT_PLATFORMS] };
  return imageSpec('png', 1024);
}
