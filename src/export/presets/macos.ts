import { strToU8 } from 'fflate';
import { sizedPng } from '@/export/render';
import type { ExportFiles } from '@/export/types';
import type { PngImage } from '@/image/png';

const APPICON_ASSETS = [
  ['icon_16x16.png', '16x16', '1x', 16],
  ['icon_16x16@2x.png', '16x16', '2x', 32],
  ['icon_32x32.png', '32x32', '1x', 32],
  ['icon_32x32@2x.png', '32x32', '2x', 64],
  ['icon_128x128.png', '128x128', '1x', 128],
  ['icon_128x128@2x.png', '128x128', '2x', 256],
  ['icon_256x256.png', '256x256', '1x', 256],
  ['icon_256x256@2x.png', '256x256', '2x', 512],
  ['icon_512x512.png', '512x512', '1x', 512],
  ['icon_512x512@2x.png', '512x512', '2x', 1024],
] as const;

const ICNS_TYPES: Record<number, string> = {
  16: 'icp4',
  32: 'icp5',
  64: 'icp6',
  128: 'ic07',
  256: 'ic08',
  512: 'ic09',
  1024: 'ic10',
};

function contentsJson() {
  return JSON.stringify(
    {
      images: APPICON_ASSETS.map(([filename, size, scale]) => ({
        filename,
        idiom: 'mac',
        scale,
        size,
      })),
      info: { author: 'sunburst-ai', version: 1 },
    },
    null,
    2
  );
}

function buildIcns(chunks: Array<{ type: string; png: Uint8Array }>) {
  const bodyLength = chunks.reduce(
    (total, chunk) => total + 8 + chunk.png.byteLength,
    0
  );
  const bytes = new Uint8Array(8 + bodyLength);
  const view = new DataView(bytes.buffer);
  bytes.set(strToU8('icns'), 0);
  view.setUint32(4, bytes.byteLength);
  let offset = 8;
  for (const chunk of chunks) {
    bytes.set(strToU8(chunk.type), offset);
    view.setUint32(offset + 4, chunk.png.byteLength + 8);
    bytes.set(chunk.png, offset + 8);
    offset += chunk.png.byteLength + 8;
  }
  return bytes;
}

export async function buildMacosPackage(
  source: PngImage
): Promise<ExportFiles> {
  const files: ExportFiles = {};
  for (const [filename, , , pixels] of APPICON_ASSETS) {
    files[`macos/AppIcon.appiconset/${filename}`] = await sizedPng(
      source,
      pixels
    );
  }
  files['macos/AppIcon.appiconset/Contents.json'] = strToU8(contentsJson());
  files['macos/AppIcon.icns'] = buildIcns(
    await Promise.all(
      Object.entries(ICNS_TYPES).map(async ([size, type]) => ({
        type,
        png: await sizedPng(source, Number(size)),
      }))
    )
  );
  return files;
}
