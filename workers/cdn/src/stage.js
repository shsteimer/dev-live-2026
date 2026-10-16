export const REF_PARAM = 'ref';
export const REF_COOKIE = 'aem-ref';

export function normalizeRef(value) {
  if (typeof value !== 'string') return '';
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-/, '').slice(0, 63)
    .replace(/-$/, '');
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export function resolveRef(request, env) {
  const url = new URL(request.url);
  const fallback = normalizeRef(env.DEFAULT_REF) || 'main';
  if (url.searchParams.has(REF_PARAM)) {
    const ref = normalizeRef(url.searchParams.get(REF_PARAM));
    const setCookie = ref && ref !== fallback
      ? `${REF_COOKIE}=${ref}; Path=/; Secure; HttpOnly; SameSite=Lax`
      : `${REF_COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
    return { ref: ref || fallback, setCookie };
  }
  return { ref: normalizeRef(readCookie(request, REF_COOKIE)) || fallback, setCookie: null };
}

export const withRef = (hostname, ref) => hostname.replace(/^.+?--/, `${ref}--`);
