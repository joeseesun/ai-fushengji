// Page through complete blocks, without scroll traps or shrinking the text.
export function pageFrame(html, label, extra = '') {
  return `<div class="page-frame ${extra}" data-page-label="${label}"><div class="page-content">${html}</div><nav class="page-controls" aria-label="${label}翻页"><button type="button" data-page-turn="-1" aria-label="上一页${label}">← 上页</button><span aria-live="polite"></span><button type="button" data-page-turn="1" aria-label="下一页${label}">下页 →</button></nav></div>`;
}
export function layoutPages(root = document) {
  root.querySelectorAll('.page-frame').forEach(frame => {
    if (!frame.getClientRects().length) return;
    const content = frame.querySelector(':scope > .page-content');
    const controls = frame.querySelector(':scope > .page-controls');
    const items = [...content.children];
    const focusedItem = items.find(item => item.contains(document.activeElement));
    items.forEach(item => { item.hidden = false; });
    controls.hidden = true;
    const previous = Number(frame.dataset.page ?? 0);
    const group = () => {
      const style = getComputedStyle(content);
      const available = content.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const gap = parseFloat(getComputedStyle(content).rowGap) || 0;
      let groups = [[]], used = 0;
      for (const item of items) {
        const height = item.getBoundingClientRect().height;
        if (used && used + gap + height > available + 1) { groups.push([]); used = 0; }
        groups.at(-1).push(item); used += height + (used ? gap : 0);
      }
      return groups;
    };
    let groups = group();
    if (groups.length > 1) { controls.hidden = false; groups = group(); }
    const show = number => {
      const current = Math.min(Math.max(0, number), groups.length - 1);
      frame.dataset.page = current;
      items.forEach(item => { item.hidden = !groups[current].includes(item); });
      controls.querySelector('span').textContent = `${frame.dataset.pageLabel} ${current + 1} / ${groups.length}`;
      const [prev, next] = controls.querySelectorAll('button');
      prev.disabled = current === 0; next.disabled = current === groups.length - 1;
      next.textContent = frame.classList.contains('event-pages') && current === 0 ? '继续阅读 →' : '下页 →';
    };
    controls.querySelectorAll('button').forEach(button => { button.onclick = () => show(Number(frame.dataset.page) + Number(button.dataset.pageTurn)); });
    show(focusedItem ? groups.findIndex(group => group.includes(focusedItem)) : previous);
  });
}
