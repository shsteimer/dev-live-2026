export default function decorate(block) {
  const pic = block.querySelector('picture') || block.querySelector('img');
  if (!pic) return;
  const p = pic.closest('p');
  block.prepend(pic);
  if (p && !p.textContent.trim() && !p.children.length) p.remove();
  const img = pic.tagName === 'IMG' ? pic : pic.querySelector('img');
  if (img) {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  }
}
