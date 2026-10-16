import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import setupDom from '../support/setup-dom.js';

setupDom();

const { decorateButtons } = await import('../../scripts/scripts.js');

function decorate(html) {
  const main = document.createElement('main');
  main.innerHTML = html;
  decorateButtons(main);
  return main;
}

describe('decorateButtons', () => {
  it('maps strong to primary, em to secondary, both to accent', () => {
    const main = decorate(`
      <p><strong><a href="/a">A</a></strong></p>
      <p><em><a href="/b">B</a></em></p>
      <p><strong><em><a href="/c">C</a></em></strong></p>`);
    const [a, b, c] = main.querySelectorAll('a');
    assert.deepEqual([...a.classList], ['button', 'primary']);
    assert.deepEqual([...b.classList], ['button', 'secondary']);
    assert.deepEqual([...c.classList], ['button', 'accent']);
    main.querySelectorAll('p').forEach((p) => assert.equal(p.className, 'button-wrapper'));
    assert.equal(main.querySelector('strong, em'), null);
  });

  it('leaves unformatted, inline, image, and URL-text links alone', () => {
    const main = decorate(`
      <p><a href="/plain">Plain</a></p>
      <p>Read <strong><a href="/inline">inline</a></strong> here</p>
      <p><strong><a href="/img"><img src="x.png" alt=""></a></strong></p>
      <p><strong><a href="https://example.com/">https://example.com/</a></strong></p>`);
    main.querySelectorAll('a').forEach((a) => assert.equal(a.classList.contains('button'), false, a.href));
  });
});
