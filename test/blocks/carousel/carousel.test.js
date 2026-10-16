import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../../support/setup-dom.js';

setupDom();

const { resolveSlideIndex } = await import('../../../blocks/carousel/carousel.js');

describe('resolveSlideIndex', () => {
  it('passes through in-range indexes', () => {
    assert.equal(resolveSlideIndex(0, 3), 0);
    assert.equal(resolveSlideIndex(2, 3), 2);
  });

  it('wraps past either end', () => {
    assert.equal(resolveSlideIndex(3, 3), 0);
    assert.equal(resolveSlideIndex(-1, 3), 2);
    assert.equal(resolveSlideIndex(-4, 3), 2);
    assert.equal(resolveSlideIndex(7, 3), 1);
  });

  it('handles empty carousels and bad input', () => {
    assert.equal(resolveSlideIndex(5, 0), 0);
    assert.equal(resolveSlideIndex(NaN, 3), 0);
    assert.equal(resolveSlideIndex(1.7, 3), 1);
  });
});
