import { describe, expect, test } from 'vitest';
import { cropQuadrants } from '@/image/concept-sheet';
import type { PngImage } from '@/image/png';

function rgba(
  r: number,
  g: number,
  b: number,
  a = 255
): [number, number, number, number] {
  return [r, g, b, a];
}

function sheet(fill: [number, number, number, number]): PngImage {
  const data = new Uint8ClampedArray(1024 * 1024 * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    data.set(fill, offset);
  }
  return { data, width: 1024, height: 1024 };
}

function fillRect(
  image: PngImage,
  left: number,
  top: number,
  width: number,
  height: number,
  color: [number, number, number, number]
) {
  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      image.data.set(color, (y * image.width + x) * 4);
    }
  }
}

function pixel(image: PngImage, x: number, y: number) {
  const offset = (y * image.width + x) * 4;
  return [
    image.data[offset],
    image.data[offset + 1],
    image.data[offset + 2],
    image.data[offset + 3],
  ];
}

function contentCenter(image: PngImage, background: [number, number, number]) {
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const offset = (y * image.width + x) * 4;
      const dr = image.data[offset] - background[0];
      const dg = image.data[offset + 1] - background[1];
      const db = image.data[offset + 2] - background[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) <= 28) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2,
  };
}

describe('concept sheet crop', () => {
  test('keeps a perfect 2x2 split on the midlines', async () => {
    const image = sheet(rgba(255, 255, 255));
    fillRect(image, 0, 0, 512, 512, rgba(255, 0, 0));
    fillRect(image, 512, 0, 512, 512, rgba(0, 255, 0));
    fillRect(image, 0, 512, 512, 512, rgba(0, 0, 255));
    fillRect(image, 512, 512, 512, 512, rgba(255, 255, 0));
    const quadrants = await cropQuadrants(image);
    expect(pixel(quadrants.A, 10, 10)).toEqual(rgba(255, 0, 0));
    expect(pixel(quadrants.B, 10, 10)).toEqual(rgba(0, 255, 0));
    expect(pixel(quadrants.C, 10, 10)).toEqual(rgba(0, 0, 255));
    expect(pixel(quadrants.D, 10, 10)).toEqual(rgba(255, 255, 0));
  });

  test('recenters an inset glyph so the optical center sits in the middle', async () => {
    const image = sheet(rgba(240, 240, 240));
    fillRect(image, 40, 80, 160, 160, rgba(20, 20, 220));
    fillRect(image, 600, 40, 160, 160, rgba(20, 20, 220));
    fillRect(image, 40, 600, 160, 160, rgba(20, 20, 220));
    fillRect(image, 700, 700, 160, 160, rgba(20, 20, 220));
    const quadrants = await cropQuadrants(image);
    for (const cell of Object.values(quadrants)) {
      const center = contentCenter(cell, [240, 240, 240]);
      expect(center.x).toBeGreaterThan(240);
      expect(center.x).toBeLessThan(272);
      expect(center.y).toBeGreaterThan(240);
      expect(center.y).toBeLessThan(272);
    }
  });
});
