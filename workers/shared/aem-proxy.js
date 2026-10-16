/*
 * Based on https://github.com/adobe/aem-cloudflare-prod-worker (Apache-2.0).
 */

const getExtension = (path) => {
  const basename = path.split('/').pop();
  const pos = basename.lastIndexOf('.');
  return (basename === '' || pos < 1) ? '' : basename.slice(pos + 1);
};

const isMediaRequest = (url) => /\/media_[0-9a-f]{40,}[/a-zA-Z0-9_-]*\.[0-9a-z]+$/.test(url.pathname);
const isRUMRequest = (url) => /\/\.(rum|optel)\/.*/.test(url.pathname);

export const ORIGIN_PATTERN = /^[a-z0-9-]+--[a-z0-9-]+--[a-z0-9-]+\.(?:aem|hlx)\.live$/;

export function preflight(request) {
  const url = new URL(request.url);
  if (url.port) {
    const redirectTo = new URL(request.url);
    redirectTo.port = '';
    return new Response(`Moved permanently to ${redirectTo.href}`, {
      status: 301,
      headers: { location: redirectTo.href },
    });
  }
  if (url.pathname.startsWith('/drafts/')) {
    return new Response('Not Found', { status: 404 });
  }
  if (isRUMRequest(url) && !['GET', 'POST', 'OPTIONS'].includes(request.method)) {
    return new Response('Method Not Allowed', { status: 405 });
  }
  return null;
}

export function sanitizeSearch(url) {
  const extension = getExtension(url.pathname);
  const { searchParams } = url;
  if (isMediaRequest(url)) {
    [...searchParams.keys()].forEach((key) => {
      if (!['format', 'height', 'optimize', 'width'].includes(key)) searchParams.delete(key);
    });
  } else if (extension === 'json') {
    [...searchParams.keys()].forEach((key) => {
      if (!['limit', 'offset', 'sheet'].includes(key)) searchParams.delete(key);
    });
  } else {
    url.search = '';
  }
  searchParams.sort();
}

export async function proxyToAem(request, {
  hostname, token, pushInvalidation = true, cacheEverything = true,
}) {
  const url = new URL(request.url);
  const savedSearch = url.search;
  sanitizeSearch(url);

  if (!ORIGIN_PATTERN.test(hostname || '')) {
    return new Response('Invalid origin hostname', { status: 500 });
  }
  const host = request.headers.get('host') || url.hostname;
  url.protocol = 'https:';
  url.hostname = hostname;

  const req = new Request(url, request);
  req.headers.set('x-forwarded-host', host);
  req.headers.set('x-byo-cdn-type', 'cloudflare');
  if (pushInvalidation) req.headers.set('x-push-invalidation', 'enabled');
  if (token) req.headers.set('authorization', `token ${token}`);

  let resp = await fetch(req, {
    method: req.method,
    cf: { cacheEverything },
  });
  resp = new Response(resp.body, resp);
  if (resp.status === 301 && savedSearch) {
    const location = resp.headers.get('location');
    if (location && !location.match(/\?.*$/)) {
      resp.headers.set('location', `${location}${savedSearch}`);
    }
  }
  if (resp.status === 304) {
    resp.headers.delete('Content-Security-Policy');
  }
  resp.headers.delete('age');
  resp.headers.delete('x-robots-tag');
  return resp;
}
