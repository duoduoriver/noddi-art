import { describe, expect, test } from 'vitest';
import {
  canonicalRedirectStatus,
  getCanonicalOriginRedirect,
} from '@/lib/canonical-origin';

describe('canonical origin redirects', () => {
  test('sends HTTP apex traffic to HTTPS', () => {
    const request = new Request('http://sunburstai.online/generate?ref=gsc');
    expect(getCanonicalOriginRedirect(request)).toBe(
      'https://sunburstai.online/generate?ref=gsc'
    );
  });

  test('sends www traffic to the apex host', () => {
    const request = new Request('https://www.sunburstai.online/pricing');
    expect(getCanonicalOriginRedirect(request)).toBe(
      'https://sunburstai.online/pricing'
    );
  });

  test('collapses HTTP www into a single HTTPS apex hop', () => {
    const request = new Request('http://www.sunburstai.online/');
    expect(getCanonicalOriginRedirect(request)).toBe(
      'https://sunburstai.online/'
    );
  });

  test('leaves the canonical HTTPS apex unchanged', () => {
    const request = new Request('https://sunburstai.online/generate');
    expect(getCanonicalOriginRedirect(request)).toBeNull();
  });

  test('ignores preview and local hosts', () => {
    expect(
      getCanonicalOriginRedirect(new Request('http://localhost:3001/'))
    ).toBeNull();
    expect(
      getCanonicalOriginRedirect(
        new Request('https://duoduohe-tanstack.workers.dev/')
      )
    ).toBeNull();
  });

  test('preserves non-GET methods with 308', () => {
    expect(canonicalRedirectStatus('GET')).toBe(301);
    expect(canonicalRedirectStatus('HEAD')).toBe(301);
    expect(canonicalRedirectStatus('POST')).toBe(308);
  });
});
