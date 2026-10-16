export default function decorate(block) {
  const items = [];
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2 && !cells[0].querySelector('p + p')) {
      items.push(cells);
    } else {
      cells.forEach((cell) => items.push([cell]));
    }
  });
  const ul = document.createElement('ul');
  items.forEach(([value, label]) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.className = 'stats-value';
    if (label) {
      strong.textContent = value.textContent.trim();
      label.className = 'stats-label';
      li.append(strong, label);
    } else {
      const [first, ...rest] = [...value.children];
      strong.textContent = (first || value).textContent.trim();
      const div = document.createElement('div');
      div.className = 'stats-label';
      div.append(...rest);
      li.append(strong, div);
    }
    ul.append(li);
  });
  block.replaceChildren(ul);
}
