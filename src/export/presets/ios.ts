import { strToU8 } from 'fflate';
import { sizedPng } from '@/export/render';
import type { ExportFiles } from '@/export/types';
import type { PngImage } from '@/image/png';

function contentsJson() {
  return JSON.stringify(
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
}

export async function buildIosPackage(source: PngImage): Promise<ExportFiles> {
  return {
    'ios/AppIcon.appiconset/AppIcon-1024.png': await sizedPng(source, 1024),
    'ios/AppIcon.appiconset/Contents.json': strToU8(contentsJson()),
  };
}
