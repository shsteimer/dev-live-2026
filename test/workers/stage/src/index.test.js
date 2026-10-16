import {
  describe, it, beforeEach, afterEach,
} from 'node:test';
import assert from 'node:assert/strict';
import worker, { normalizeRef, resolveRef, originFor } from '../../../../workers/stage/src/index.js';

const env = { ORIGIN_SITE: 'dev-live-2026', ORIGIN_OWNER: 'shsteimer', DEFAULT_REF: 'main' };
const req = (url, cookie) => new Request(url, cookie ? { headers: { cookie } } : {});

describe('normalizeRef', () => {
  it('matches AEM branch host rules', () => {
    assert.equal(normalizeRef('Feature/New_Hero'), 'feature-new-hero');
    assert.equal(normalizeRef('--x--'), 'x');
    assert.equal(normalizeRef('a'.repeat(80)).length, 63);
    assert.equal(normalizeRef(undefined), '');
  });
});

describe('resolveRef', () => {
  it('defaults to DEFAULT_REF, then main', () => {
    assert.deepEqual(resolveRef(req('https://stage.example.com/en/'), env), { ref: 'main', setCookie: null });
    assert.equal(resolveRef(req('https://stage.example.com/'), {}).ref, 'main');
  });

  it('uses ?ref and remembers it in a cookie', () => {
    const { ref, setCookie } = resolveRef(req('https://stage.example.com/en/?ref=new-hero'), env);
    assert.equal(ref, 'new-hero');
    assert.match(setCookie, /^aem-ref=new-hero; Path=\/; Secure; HttpOnly; SameSite=Lax$/);
  });

  it('reads the cookie when no param is present, and ?ref wins over it', () => {
    assert.equal(resolveRef(req('https://stage.example.com/en/', 'x=1; aem-ref=new-hero'), env).ref, 'new-hero');
    assert.equal(resolveRef(req('https://stage.example.com/en/?ref=other', 'aem-ref=new-hero'), env).ref, 'other');
  });

  it('empty or default ?ref clears the cookie', () => {
    ['?ref=', '?ref=main'].forEach((q) => {
      const { ref, setCookie } = resolveRef(req(`https://stage.example.com/${q}`, 'aem-ref=new-hero'), env);
      assert.equal(ref, 'main');
      assert.match(setCookie, /Max-Age=0/);
    });
  });
});

describe('stage worker fetch', () => {
  let calls;
  const realFetch = global.fetch;

  beforeEach(() => {
    calls = [];
    global.fetch = async (r) => {
      calls.push(r);
      return new Response('ok', { headers: { 'cache-control': 'max-age=300' } });
    };
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('proxies to the branch origin without push invalidation, uncached and noindex', async () => {
    const resp = await worker.fetch(req('https://stage.example.com/en/about?ref=new-hero'), env);
    const [r] = calls;
    assert.equal(r.url, `https://${originFor('new-hero', env)}/en/about`);
    assert.equal(r.headers.get('x-push-invalidation'), null);
    assert.equal(resp.headers.get('x-aem-ref'), 'new-hero');
    assert.equal(resp.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(resp.headers.get('cache-control'), 'private, no-store');
    assert.match(resp.headers.get('set-cookie'), /aem-ref=new-hero/);
  });
});
