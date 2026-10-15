/*
 * Based on https://github.com/adobe/aem-cloudflare-prod-worker (Apache-2.0).
 * Adds host-based origin routing so one worker can front multiple (repoless) sites.
 */

const getExtension = (path) => {
  const basename = path.split('/').pop();
  const pos = basename.lastIndexOf('.');
  return (basename === '' || pos < 1) ? '' : basename.slice(pos + 1);
};

const isMediaRequest = (url) => /\/media_[0-9a-f]{40,}[/a-zA-Z0-9_-]*\.[0-9a-z]+$/.test(url.pathname);
const isRUMRequest = (url) => /\/\.(rum|optel)\/.*/.test(url.pathname);

const parseSites = (env) => {
  try {
    return env.SITES ? JSON.parse(env.SITES) : {};
  } catch {
    return {};
  }
};

export const resolveOrigin = (host, env) => {
  const sites = parseSites(env);
  const site = sites[host];
  if (typeof site === 'string') return { hostname: site };
  if (site && site.origin) return { hostname: site.origin, token: env[site.tokenSecret] };
  return { hostname: env.ORIGIN_HOSTNAME };
};

const handleRequest = async (request, env) => {
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

  const extension = getExtension(url.pathname);
  const savedSearch = url.search;

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

  const host = request.headers.get('host') || url.hostname;
  const origin = resolveOrigin(host, env);
  url.protocol = 'https:';
  url.hostname = origin.hostname;
  if (!url.origin.match(/^https:\/\/main--.*--.*\.(?:aem|hlx)\.live/)) {
    return new Response('Invalid origin hostname', { status: 500 });
  }

  const req = new Request(url, request);
  req.headers.set('x-forwarded-host', host);
  req.headers.set('x-byo-cdn-type', 'cloudflare');
  if (env.PUSH_INVALIDATION !== 'disabled') {
    req.headers.set('x-push-invalidation', 'enabled');
  }
  const token = origin.token || env.ORIGIN_AUTHENTICATION;
  if (token) {
    req.headers.set('authorization', `token ${token}`);
  }

  let resp = await fetch(req, {
    method: req.method,
    cf: { cacheEverything: true },
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
};

export default {
  fetch: handleRequest,
};
