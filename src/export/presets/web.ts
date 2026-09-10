import { strToU8 } from 'fflate';
import { encodeIco } from '@/export/ico';
import { maskablePng, prepareArtwork, sizedPng } from '@/export/render';
import type { ExportFiles } from '@/export/types';
import type { PngImage } from '@/image/png';

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

function readme() {
  return `Web icon assets\n\nAdd these tags to <head>:\n\n<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/manifest.webmanifest">\n\nThe maskable PNGs keep derived foreground artwork inside the mask-safe area and use an opaque edge-derived background. Review the result against your final brand artwork before release.\n`;
}

export async function buildWebPackage(source: PngImage): Promise<ExportFiles> {
  const artwork = prepareArtwork(source);
  const faviconSizes = [16, 32, 48] as const;
  const faviconPngs = await Promise.all(
    faviconSizes.map(async (size) => ({
      size,
      png: await sizedPng(source, size),
    }))
  );
  return {
    'web/favicon.ico': encodeIco(faviconPngs),
    'web/favicon-16x16.png': faviconPngs[0].png,
    'web/favicon-32x32.png': faviconPngs[1].png,
    'web/apple-touch-icon.png': await sizedPng(source, 180),
    'web/icon-192.png': await sizedPng(source, 192),
    'web/icon-512.png': await sizedPng(source, 512),
    'web/icon-192-maskable.png': await maskablePng(artwork, 192),
    'web/icon-512-maskable.png': await maskablePng(artwork, 512),
    'web/manifest.webmanifest': strToU8(manifestJson()),
    'web/README.txt': strToU8(readme()),
  };
}
