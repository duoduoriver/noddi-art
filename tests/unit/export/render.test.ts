import { describe, expect, test } from 'vitest';
import { extractForeground, prepareArtwork } from '@/export/render';
import {
  decodePng,
  encodePng,
  encodeRaster,
  resizePng,
  type PngImage,
} from '@/image/png';

function opaquePixelGrid(): PngImage {
  const data = new Uint8ClampedArray(3 * 3 * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    data[offset + 3] = 255;
  }
  const center = (1 * 3 + 1) * 4;
  data[center] = 255;
  data[center + 1] = 255;
  data[center + 2] = 255;
  return { data, width: 3, height: 3 };
}

describe('export artwork preparation', () => {
  test('uses bundled WASM to encode, decode, resize, and export JPEG/WebP', async () => {
    const source: PngImage = {
      data: new Uint8ClampedArray([
        255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255,
      ]),
      width: 2,
      height: 2,
    };
    const png = await encodePng(source);
    const decoded = await decodePng(png);
    expect(decoded).toMatchObject({ width: 2, height: 2 });
    const resized = await resizePng(decoded, 1, 1);
    expect(resized).toMatchObject({ width: 1, height: 1 });
    await expect(encodeRaster(resized, 'jpg')).resolves.toMatchObject({
      contentType: 'image/jpeg',
      extension: 'jpg',
    });
    await expect(encodeRaster(resized, 'webp')).resolves.toMatchObject({
      contentType: 'image/webp',
      extension: 'webp',
    });
  });
  test('removes a flat opaque edge background while retaining contrasting artwork', () => {
    const foreground = extractForeground(opaquePixelGrid());
    expect(foreground.data[3]).toBe(0);
    expect(foreground.data[(1 * 3 + 1) * 4 + 3]).toBe(255);
  });

  test('keeps explicit source transparency and derives an opaque fallback background', () => {
    const source: PngImage = {
      width: 2,
      height: 2,
      data: new Uint8ClampedArray([
        255, 0, 0, 128, 255, 0, 0, 128, 255, 0, 0, 128, 255, 0, 0, 128,
      ]),
    };
    const prepared = prepareArtwork(source);
    expect(prepared.foreground.data).toEqual(source.data);
    expect(prepared.background).toEqual({ r: 255, g: 255, b: 255, a: 255 });
  });
});
