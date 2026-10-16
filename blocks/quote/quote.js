export default function decorate(block) {
  const [quoteRow, attributionRow] = block.children;
  const blockquote = document.createElement('blockquote');
  if (quoteRow) {
    const text = quoteRow.querySelector(':scope > div') || quoteRow;
    text.className = 'quote-text';
    blockquote.append(text);
  }
  if (attributionRow && attributionRow.textContent.trim()) {
    const cite = attributionRow.querySelector(':scope > div') || attributionRow;
    cite.className = 'quote-attribution';
    blockquote.append(cite);
  }
  block.replaceChildren(blockquote);
}
