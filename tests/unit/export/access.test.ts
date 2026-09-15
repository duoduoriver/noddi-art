import { describe, expect, test } from 'vitest';
import { isFreeExportAllowed } from '@/export/access';

describe('free export access', () => {
  test('allows PNG and WebP images up to 512px', () => {
    expect(
      isFreeExportAllowed({ kind: 'image', rasterFormat: 'png', size: 512 })
    ).toBe(true);
    expect(
      isFreeExportAllowed({ kind: 'image', rasterFormat: 'webp', size: 256 })
    ).toBe(true);
  });

  test('keeps paid-only image outputs and HD sizes locked', () => {
    expect(
      isFreeExportAllowed({ kind: 'image', rasterFormat: 'jpg', size: 512 })
    ).toBe(false);
    expect(
      isFreeExportAllowed({ kind: 'image', rasterFormat: 'avif', size: 512 })
    ).toBe(false);
    expect(
      isFreeExportAllowed({ kind: 'image', rasterFormat: 'png', size: 1024 })
    ).toBe(false);
  });

  test('allows Android/Web packages but not iOS/macOS packages', () => {
    expect(
      isFreeExportAllowed({ kind: 'packages', platforms: ['android'] })
    ).toBe(true);
    expect(
      isFreeExportAllowed({ kind: 'packages', platforms: ['android', 'web'] })
    ).toBe(true);
    expect(isFreeExportAllowed({ kind: 'packages', platforms: ['ios'] })).toBe(
      false
    );
    expect(
      isFreeExportAllowed({ kind: 'packages', platforms: ['web', 'macos'] })
    ).toBe(false);
  });
});
