import { describe, expect, test } from 'vitest';
import { deLocalizeHref, localizeHref } from '@/lib/locale';

describe('locale URL mapping', () => {
  test('maps a localized application URL to its file-based route', () => {
    expect(deLocalizeHref('/zh/dashboard/credits?tab=orders')).toBe(
      '/dashboard/credits?tab=orders'
    );
  });

  test('keeps base-locale routes unprefixed and localizes Chinese routes', () => {
    expect(localizeHref('/pricing', { locale: 'en' })).toBe('/pricing');
    expect(localizeHref('/pricing', { locale: 'zh' })).toBe('/zh/pricing');
    expect(localizeHref('/', { locale: 'zh' })).toBe('/zh/');
  });

  test('maps Chinese home URLs with or without a trailing slash', () => {
    expect(deLocalizeHref('/zh')).toBe('/');
    expect(deLocalizeHref('/zh/')).toBe('/');
  });
});
