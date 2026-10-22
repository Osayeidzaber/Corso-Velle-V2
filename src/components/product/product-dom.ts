import { parseHTML } from '../../core/dom';

/** Isolate a fetched product form from the same product already present elsewhere on the page. */
export function namespaceProductHTML(html: string, prefix: string): string {
  const doc = parseHTML(html);
  doc.querySelectorAll('[data-nk-open]').forEach((trigger) => trigger.remove());
  const ids = new Map<string, string>();
  for (const el of doc.querySelectorAll<HTMLElement>('[id]')) {
    ids.set(el.id, `${prefix}${el.id}`);
    el.id = `${prefix}${el.id}`;
  }
  for (const el of doc.querySelectorAll('*')) {
    for (const attr of ['for', 'form', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'data-nk-open']) {
      const value = el.getAttribute(attr);
      if (value) el.setAttribute(attr, value.split(' ').map((id) => ids.get(id) ?? id).join(' '));
    }
    if (el instanceof HTMLInputElement && el.type === 'radio') el.name = `${prefix}${el.name}`;
  }
  return doc.body.innerHTML;
}
