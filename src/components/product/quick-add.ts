import { parseHTML } from '../../core/dom';
import { fetchText, Sequencer } from '../../services/request';
import { overlay } from '../../services/overlay';
import { namespaceProductHTML } from './product-dom';
import { t } from '../../core/config';

let sequence = 0;
let active: HTMLDialogElement | null = null;

/** Load the merchant's actual product section and reuse its picker and purchase form. */
export async function openQuickAdd(url: string, trigger: HTMLElement): Promise<void> {
  if (active) overlay.close(active);
  const dialog = document.createElement('dialog');
  dialog.className = 'drawer drawer--right quick-add';
  dialog.dataset.quickAddDialog = '';
  const prefix = `QuickAdd-${++sequence}-`;
  dialog.id = prefix;
  const header = document.createElement('div');
  header.className = 'drawer__header';
  const link = document.createElement('a');
  link.href = url;
  link.textContent = trigger.getAttribute('aria-label') ?? trigger.textContent ?? '';
  header.append(link);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'icon-button';
  close.textContent = '×';
  close.setAttribute('aria-label', trigger.dataset.closeLabel ?? 'Close');
  header.append(close);
  dialog.setAttribute('aria-labelledby', `${prefix}title`);
  link.id = `${prefix}title`;
  const body = document.createElement('div');
  body.className = 'drawer__body';
  body.setAttribute('aria-busy', 'true');
  dialog.append(header, body);
  document.body.append(dialog);
  active = dialog;
  const requests = new Sequencer();
  const onCartUpdated = (event: Event): void => {
    const detail = (event as CustomEvent<{ kind: string; sourceId: string }>).detail;
    const source = dialog.querySelector<HTMLElement>('nk-product-form')?.dataset.sourceId;
    if (detail.kind === 'add' && source && detail.sourceId === source) overlay.close(dialog);
  };
  document.addEventListener('nk:cart:updated', onCartUpdated);
  close.addEventListener('click', () => overlay.close(dialog));
  overlay.open(dialog, {
    trigger, initialFocus: close,
    onClose: () => {
      requests.cancel();
      document.removeEventListener('nk:cart:updated', onCartUpdated);
      dialog.remove();
      if (active === dialog) active = null;
    },
  });
  try {
    const result = await requests.run(async (signal) => {
      const [html] = await Promise.all([fetchText(url, { signal }), import('../../entries/product')]);
      return html;
    });
    if (result.stale || !dialog.isConnected) return;
    const section = parseHTML(result.value).querySelector('[data-product-section]');
    if (!section?.querySelector('nk-product-form')) throw new Error('Product form missing');
    section.querySelector('nk-sticky-buy')?.remove();
    section.querySelector('nk-gallery')?.remove();
    section.querySelectorAll('noscript').forEach((fallback) => fallback.remove());
    // Keep guidance inside this purchase dialog; opening a second major overlay would discard it.
    for (const modal of section.querySelectorAll('nk-modal')) {
      const details = document.createElement('details');
      details.className = 'disclosure';
      const summary = document.createElement('summary');
      summary.textContent = modal.querySelector('h2')?.textContent ?? '';
      details.append(summary);
      const content = modal.querySelector('.drawer__body');
      if (content) details.append(content);
      const id = modal.id;
      section.querySelectorAll(`[data-nk-open="${CSS.escape(id)}"]`).forEach((button) => button.remove());
      modal.replaceWith(details);
    }
    section.querySelectorAll('nk-text').forEach((text) => text.replaceWith(...text.childNodes));
    const doc = parseHTML(namespaceProductHTML(section.outerHTML, prefix));
    const picker = doc.querySelector<HTMLElement>('nk-variant-picker');
    if (picker) picker.dataset.idPrefix = prefix;
    body.replaceChildren(...[...doc.body.childNodes].map((node) => document.importNode(node, true)));
    body.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true }));
  } catch {
    const error = document.createElement('p');
    error.setAttribute('role', 'alert');
    error.textContent = t('product.selection_failed');
    body.append(error);
    link.focus();
  } finally {
    body.removeAttribute('aria-busy');
  }
}
