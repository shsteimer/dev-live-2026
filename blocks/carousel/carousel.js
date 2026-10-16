import { createOptimizedPicture } from '../../scripts/aem.js';

let carouselId = 0;

function showSlide(block, index) {
  const slides = [...block.querySelectorAll('.carousel-slide')];
  const count = slides.length;
  const target = ((index % count) + count) % count;
  block.dataset.activeSlide = target;
  const track = block.querySelector('.carousel-slides');
  track.scrollTo({ left: slides[target].offsetLeft, behavior: 'smooth' });
  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', i !== target);
    slide.querySelectorAll('a').forEach((a) => { a.tabIndex = i === target ? 0 : -1; });
  });
  block.querySelectorAll('.carousel-dots button').forEach((dot, i) => {
    dot.setAttribute('aria-current', i === target);
  });
}

export default function decorate(block) {
  carouselId += 1;
  const rows = [...block.children];
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.id = `carousel-${carouselId}`;

  const track = document.createElement('ul');
  track.className = 'carousel-slides';
  rows.forEach((row, i) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-slide';
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${rows.length}`);
    [...row.children].forEach((cell) => {
      const media = cell.querySelector('picture, img');
      if (!cell.textContent.trim() && !media) return;
      const onlyPic = media && !cell.textContent.trim();
      cell.className = onlyPic ? 'carousel-slide-image' : 'carousel-slide-content';
      slide.append(cell);
    });
    track.append(slide);
  });
  track.querySelectorAll('picture > img').forEach((img, i) => {
    if (new URL(img.src).origin !== window.location.origin) return;
    const pic = createOptimizedPicture(img.src, img.alt, i === 0, [{ media: '(min-width: 900px)', width: '2000' }, { width: '900' }]);
    img.closest('picture').replaceWith(pic);
  });
  block.replaceChildren(track);

  if (rows.length < 2) return;

  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  nav.innerHTML = `
    <button type="button" class="carousel-prev" aria-label="Previous slide"></button>
    <div class="carousel-dots"></div>
    <button type="button" class="carousel-next" aria-label="Next slide"></button>`;
  const dots = nav.querySelector('.carousel-dots');
  rows.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show slide ${i + 1}`);
    dot.addEventListener('click', () => showSlide(block, i));
    dots.append(dot);
  });
  nav.querySelector('.carousel-prev').addEventListener('click', () => showSlide(block, Number(block.dataset.activeSlide) - 1));
  nav.querySelector('.carousel-next').addEventListener('click', () => showSlide(block, Number(block.dataset.activeSlide) + 1));
  block.append(nav);

  let scrollTimer;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== Number(block.dataset.activeSlide)) {
        block.dataset.activeSlide = i;
        dots.querySelectorAll('button').forEach((d, j) => d.setAttribute('aria-current', i === j));
      }
    }, 100);
  });

  block.dataset.activeSlide = 0;
  track.querySelectorAll('.carousel-slide').forEach((s, i) => s.setAttribute('aria-hidden', i !== 0));
  dots.firstElementChild.setAttribute('aria-current', true);
}
