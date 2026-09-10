import { buildAndroidPackage } from '@/export/presets/android';
import { buildIosPackage } from '@/export/presets/ios';
import { buildMacosPackage } from '@/export/presets/macos';
import { buildWebPackage } from '@/export/presets/web';
import type { ExportFiles, ExportPlatform } from '@/export/types';
import type { PngImage } from '@/image/png';

export const PLATFORM_BUILDERS: Record<
  ExportPlatform,
  (source: PngImage) => Promise<ExportFiles>
> = {
  android: buildAndroidPackage,
  ios: buildIosPackage,
  web: buildWebPackage,
  macos: buildMacosPackage,
};
