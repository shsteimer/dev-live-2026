import { preflight, proxyToAem } from '../../shared/aem-proxy.js';

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
  return proxyToAem(request, {
    hostname: origin.hostname,
    token: origin.token || env.ORIGIN_AUTHENTICATION,
    pushInvalidation: env.PUSH_INVALIDATION !== 'disabled',
  });
};

export default {
  fetch: handleRequest,
};
