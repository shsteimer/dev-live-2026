export default function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const noHeader = block.classList.contains('no-header');
  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    const header = i === 0 && !noHeader;
    [...row.children].forEach((cell) => {
      const td = document.createElement(header ? 'th' : 'td');
      if (header) td.scope = 'col';
      td.append(...cell.childNodes);
      tr.append(td);
    });
    (header ? thead : tbody).append(tr);
  });
  if (thead.children.length) table.append(thead);
  table.append(tbody);
  const wrapper = document.createElement('div');
  wrapper.className = 'table-scroll';
  wrapper.append(table);
  block.replaceChildren(wrapper);
}
