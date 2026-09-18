const CANONICAL_HOST = 'sunburstai.online';
const WWW_HOST = `www.${CANONICAL_HOST}`;

/**
 * Return a canonical absolute URL when the request used HTTP or www.
 * Preview/dev hosts are left unchanged.
 */
export function getCanonicalOriginRedirect(request: Request): string | null {
  const url = new URL(request.url);
  const host = url.hostname.replace(/\.$/, '').toLowerCase();

  if (host !== CANONICAL_HOST && host !== WWW_HOST) {
    return null;
  }

  let changed = false;

  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    changed = true;
  }

  if (host === WWW_HOST) {
    url.hostname = CANONICAL_HOST;
    changed = true;
  }

  return changed ? url.toString() : null;
}

export function canonicalRedirectStatus(method: string): 301 | 308 {
  const verb = method.toUpperCase();
  return verb === 'GET' || verb === 'HEAD' ? 301 : 308;
}
