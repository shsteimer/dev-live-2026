import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../support/setup-dom.js';

setupDom();

const { getLanguage, getLanguageRoot } = await import('../../scripts/i18n.js');

describe('getLanguage', () => {
  it('reads the language root from the first path segment', () => {
    assert.equal(getLanguage('/en/'), 'en');
    assert.equal(getLanguage('/de/brands/ridgeline'), 'de');
    assert.equal(getLanguage('/pt-br/about'), 'pt-br');
  });

  it('falls back to the default for non-language paths', () => {
    assert.equal(getLanguage('/'), 'en');
    assert.equal(getLanguage(''), 'en');
    assert.equal(getLanguage('/docs/library/blocks/tabs'), 'en');
    assert.equal(getLanguage('/news/x'), 'en');
    assert.equal(getLanguage('/EN/about'), 'en');
  });

  it('builds the language root', () => {
    assert.equal(getLanguageRoot('/de/about'), '/de');
    assert.equal(getLanguageRoot('/docs/x'), '/en');
  });
});
