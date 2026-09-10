import type { RasterFormat } from '@/image/png';

export const EXPORT_PLATFORMS = ['android', 'ios', 'web', 'macos'] as const;

export type ExportPlatform = (typeof EXPORT_PLATFORMS)[number];

export type ImageExportSpec = {
  kind: 'image';
  format: RasterFormat;
  size: number;
};

export type PackageExportSpec = {
  kind: 'packages';
  platforms: ExportPlatform[];
};

export type ExportSpec = ImageExportSpec | PackageExportSpec;
export type ExportFiles = Record<string, Uint8Array>;
