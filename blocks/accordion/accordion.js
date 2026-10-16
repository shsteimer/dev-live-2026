export default function decorate(block) {
  const items = [...block.children].map((row) => {
    const [label, body] = row.children;
    const details = document.createElement('details');
    details.className = 'accordion-item';
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...(label ? label.childNodes : []));
    details.append(summary);
    if (body) {
      body.className = 'accordion-item-body';
      details.append(body);
    }
    return details;
  });
  block.replaceChildren(...items);
}
