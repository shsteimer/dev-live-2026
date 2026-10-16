let tabsId = 0;

export default function decorate(block) {
  tabsId += 1;
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const rows = [...block.children].filter((row) => row.children.length >= 2);
  const tabs = [];
  rows.forEach((row, i) => {
    const [label, panel] = row.children;
    const id = `tabs-${tabsId}-${i}`;
    panel.className = 'tabs-panel';
    panel.id = `${id}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', id);
    panel.hidden = i !== 0;

    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'tabs-tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-selected', i === 0);
    button.tabIndex = i === 0 ? 0 : -1;
    button.textContent = label.textContent.trim();
    tabs.push({ button, panel });
    tablist.append(button);
  });

  const select = (index) => {
    tabs.forEach(({ button, panel }, i) => {
      button.setAttribute('aria-selected', i === index);
      button.tabIndex = i === index ? 0 : -1;
      panel.hidden = i !== index;
    });
    tabs[index].button.focus();
  };

  tabs.forEach(({ button }, i) => {
    button.addEventListener('click', () => select(i));
    button.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') select((i + 1) % tabs.length);
      if (e.key === 'ArrowLeft') select((i - 1 + tabs.length) % tabs.length);
    });
  });

  block.replaceChildren(tablist, ...tabs.map(({ panel }) => panel));
}
