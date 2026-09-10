import { strToU8 } from 'fflate';
import {
  androidAdaptiveLayers,
  prepareArtwork,
  sizedPng,
} from '@/export/render';
import type { ExportFiles } from '@/export/types';
import { encodePng } from '@/image/png';
import type { PngImage } from '@/image/png';

const DENSITIES = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
] as const;

function adaptiveIconXml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`;
}

function readme() {
  return `Android launcher assets

Copy the contents of res/ into app/src/main/res/.

The package includes legacy launcher PNGs plus API 26+ adaptive icon layers.
The adaptive foreground/background/monochrome layers are automatically derived
from the flattened source artwork. Review them in Android Studio before release.

Manifest example:
android:icon="@mipmap/ic_launcher"
android:roundIcon="@mipmap/ic_launcher_round"
`;
}

export async function buildAndroidPackage(
  source: PngImage
): Promise<ExportFiles> {
  const artwork = prepareArtwork(source);
  const files: ExportFiles = {
    'android/play_store_512.png': await sizedPng(source, 512),
    'android/README.txt': strToU8(readme()),
    'android/res/mipmap-anydpi-v26/ic_launcher.xml': strToU8(adaptiveIconXml()),
    'android/res/mipmap-anydpi-v26/ic_launcher_round.xml': strToU8(
      adaptiveIconXml()
    ),
  };
  for (const [density, legacySize, adaptiveSize] of DENSITIES) {
    files[`android/res/mipmap-${density}/ic_launcher.png`] = await sizedPng(
      source,
      legacySize
    );
    files[`android/res/mipmap-${density}/ic_launcher_round.png`] =
      await sizedPng(source, legacySize);
    const layers = await androidAdaptiveLayers(artwork, adaptiveSize);
    files[`android/res/mipmap-${density}/ic_launcher_foreground.png`] =
      await encodePng(layers.foreground);
    files[`android/res/mipmap-${density}/ic_launcher_background.png`] =
      await encodePng(layers.background);
    files[`android/res/mipmap-${density}/ic_launcher_monochrome.png`] =
      await encodePng(layers.monochrome);
  }
  return files;
}
