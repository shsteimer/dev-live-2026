import {
  describe, it, beforeEach, afterEach,
} from 'node:test';
import assert from 'node:assert/strict';
import worker, { resolveOrigin } from '../../../../workers/cdn/src/index.js';

const ORIGIN = 'main--dev-live-2026--shsteimer.aem.live';

describe('resolveOrigin', () => {
  const env = {
    ORIGIN_HOSTNAME: ORIGIN,
    SITES: JSON.stringify({
      'a.example.com': 'main--site-a--shsteimer.aem.live',
      'b.example.com': { origin: 'main--site-b--shsteimer.aem.live', tokenSecret: 'SITE_B_TOKEN' },
    }),
    SITE_B_TOKEN: 'secret-b',
  };

  it('maps hosts listed in SITES', () => {
    assert.deepEqual(resolveOrigin('a.example.com', env), { hostname: 'main--site-a--shsteimer.aem.live' });
  });

  it('reads per-site tokens from the named secret', () => {
    assert.deepEqual(resolveOrigin('b.example.com', env), { hostname: 'main--site-b--shsteimer.aem.live', token: 'secret-b' });
  });

  it('falls back to ORIGIN_HOSTNAME for unknown hosts and bad SITES', () => {
    assert.deepEqual(resolveOrigin('other.example.com', env), { hostname: ORIGIN });
    assert.deepEqual(resolveOrigin('a.example.com', { ...env, SITES: '{not json' }), { hostname: ORIGIN });
    assert.deepEqual(resolveOrigin('a.example.com', { ORIGIN_HOSTNAME: ORIGIN }), { hostname: ORIGIN });
  });
});

describe('cdn worker fetch', () => {
  let calls;
  const realFetch = global.fetch;
  const env = { ORIGIN_HOSTNAME: ORIGIN };
  const run = (url, init) => worker.fetch(new Request(url, init), env);

  beforeEach(() => {
    calls = [];
    global.fetch = async (req) => {
      calls.push(req);
      return new Response('ok', { status: 200, headers: { age: '10', 'x-robots-tag': 'noindex' } });
    };
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('proxies to the origin with BYO CDN headers and strips page query params', async () => {
    const resp = await run('https://devlive.example.com/about?utm_source=x', { headers: { host: 'devlive.example.com' } });
    const [req] = calls;
    assert.equal(req.url, `https://${ORIGIN}/about`);
    assert.equal(req.headers.get('x-forwarded-host'), 'devlive.example.com');
    assert.equal(req.headers.get('x-byo-cdn-type'), 'cloudflare');
    assert.equal(req.headers.get('x-push-invalidation'), 'enabled');
    assert.equal(resp.headers.get('age'), null);
    assert.equal(resp.headers.get('x-robots-tag'), null);
  });

  it('keeps only allowed params on json and media, sorted', async () => {
    await run('https://devlive.example.com/query-index.json?sheet=a&foo=1&limit=5');
    await run('https://devlive.example.com/media_0123456789abcdef0123456789abcdef01234567.jpg?width=750&x=1&format=webply');
    assert.equal(new URL(calls[0].url).search, '?limit=5&sheet=a');
    assert.equal(new URL(calls[1].url).search, '?format=webply&width=750');
  });

  it('blocks drafts and non-default ports without hitting origin', async () => {
    assert.equal((await run('https://devlive.example.com/drafts/x')).status, 404);
    const moved = await run('https://devlive.example.com:8443/about');
    assert.equal(moved.status, 301);
    assert.equal(moved.headers.get('location'), 'https://devlive.example.com/about');
    assert.equal(calls.length, 0);
  });

  it('rejects non-aem.live origins', async () => {
    const resp = await worker.fetch(new Request('https://devlive.example.com/'), { ORIGIN_HOSTNAME: 'evil.example.com' });
    assert.equal(resp.status, 500);
    assert.equal(calls.length, 0);
  });
});
