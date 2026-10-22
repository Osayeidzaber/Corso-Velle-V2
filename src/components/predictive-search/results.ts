let instance = 0;

/** A search box owns its listbox and option ids, including after section duplication. */
export function searchNamespace(): string {
  return `nk-search-${++instance}`;
}

export function scopeSearchResults(root: HTMLElement, prefix: string): string {
  const ids = new Map<string, string>();
  for (const element of root.querySelectorAll<HTMLElement>('[id]')) {
    ids.set(element.id, `${prefix}-${element.id}`);
    element.id = `${prefix}-${element.id}`;
  }
  for (const element of root.querySelectorAll('[aria-labelledby], [aria-describedby]')) {
    for (const attr of ['aria-labelledby', 'aria-describedby']) {
      const value = element.getAttribute(attr);
      if (value) element.setAttribute(attr, value.split(/\s+/).map((id) => ids.get(id) ?? id).join(' '));
    }
  }
  for (const [index, element] of [...root.querySelectorAll<HTMLElement>('[role="option"]')].entries()) {
    element.id = `${prefix}-option-${index}`;
  }
  const list = root.querySelector<HTMLElement>('[role="listbox"]');
  if (list) list.id = `${prefix}-listbox`;
  // Test fixtures or third-party rendered results may omit a listbox wrapper.
  if (!list) {
    const wrapper = document.createElement('div');
    wrapper.id = `${prefix}-listbox`;
    wrapper.setAttribute('role', 'listbox');
    wrapper.append(...root.childNodes);
    root.append(wrapper);
  }
  return `${prefix}-listbox`;
}
