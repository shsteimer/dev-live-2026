import { preflight, proxyToAem } from './aem-proxy.js';
import { resolveRef, withRef } from './stage.js';

const parseSites = (env) => {
  try {
    return env.SITES ? JSON.parse(env.SITES) : {};
  } catch {
    return {};
  }
};

export const resolveOrigin = (host, env) => {
  const site = parseSites(env)[host];
  if (typeof site === 'string') return { hostname: site };
  if (site && site.origin) return { hostname: site.origin, token: env[site.tokenSecret] };
  return { hostname: env.ORIGIN_HOSTNAME };
};

const handleRequest = async (request, env) => {
  const early = preflight(request);
  if (early) return early;

  const host = request.headers.get('host') || new URL(request.url).hostname;
  const origin = resolveOrigin(host, env);
  if (!/^main--/.test(origin.hostname || '')) {
    return new Response('Invalid origin hostname', { status: 500 });
  }
  const token = origin.token || env.ORIGIN_AUTHENTICATION;

  if (env.MODE !== 'stage') {
    return proxyToAem(request, {
      hostname: origin.hostname,
      token,
      pushInvalidation: env.PUSH_INVALIDATION !== 'disabled',
    });
  }

  const { ref, setCookie } = resolveRef(request, env);
  const resp = await proxyToAem(request, {
    hostname: withRef(origin.hostname, ref),
    token,
    pushInvalidation: false,
    cacheEverything: false,
  });
  resp.headers.set('x-robots-tag', 'noindex, nofollow');
  resp.headers.set('x-aem-ref', ref);
  resp.headers.set('cache-control', 'private, no-store');
  if (setCookie) resp.headers.append('set-cookie', setCookie);
  return resp;
};

export default {
  fetch: handleRequest,
};
