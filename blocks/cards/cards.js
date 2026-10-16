import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture, img') && !div.textContent.trim()) {
        div.className = 'cards-card-image';
        const p = div.querySelector(':scope > p');
        if (p) p.replaceWith(...p.children);
      } else {
        div.className = 'cards-card-body';
      }
    });
    [...li.children].forEach((div) => {
      if (!div.children.length && !div.textContent.trim()) div.remove();
    });
    const links = li.querySelectorAll('a[href]');
    if (links.length === 1) li.classList.add('cards-card-linked');
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    if (new URL(img.src).origin !== window.location.origin) return;
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
