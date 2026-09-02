const AUTH_COOKIE_MARKERS = [
  'better-auth.session_token',
  'better-auth.session_data',
  '__Secure-better-auth.session_token',
  '__Secure-better-auth.session_data',
  '__Host-better-auth.session_token',
  '__Host-better-auth.session_data',
];

export function hasAuthCookieString(cookie?: string | null): boolean {
  if (!cookie) return false;

  return AUTH_COOKIE_MARKERS.some((marker) => cookie.includes(marker));
}

/**
 * Best-effort browser check only. Better Auth session cookies are normally
 * HttpOnly, so SSR/root-loader cookie detection and explicit auth events are
 * the reliable paths.
 */
export function hasReadableAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;

  return hasAuthCookieString(document.cookie);
}
