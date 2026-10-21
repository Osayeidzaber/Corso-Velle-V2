import { captureFocus, parseHTML, restoreFocus } from '../core/dom';
import { cart, cartSectionIds, type CartResult } from './cart';
import { renderSections } from './sections';

/**
 * Applies cart section HTML after every mutation. Each cart region in Liquid renders
 * `<div data-cart-section="{{ section.id }}">…</div>`; only its children are swapped so the
 * surrounding dialog/shell (and its focus management) stays intact.
 */
function apply(sections: Record<string, string | null> | null | undefined): string[] {
  if (!sections || typeof sections !== 'object') return cartSectionIds();
  const missing: string[] = [];
  for (const id of cartSectionIds()) {
    if (!(id in sections)) continue;
    const html = sections[id];
    const target = document.querySelector<HTMLElement>(`[data-cart-section="${CSS.escape(id)}"]`);
    const next = html ? parseHTML(html).querySelector(`[data-cart-section="${CSS.escape(id)}"]`) : null;
    if (!target || !next) {
      missing.push(id);
      continue;
    }
    const focusKey = captureFocus(target);
    target.replaceChildren(...[...next.childNodes].map((node) => document.importNode(node, true)));
    restoreFocus(target, focusKey);
  }
  return missing;
}

export function installCartRenderer(): void {
  document.addEventListener('nk:cart:updated', async (event) => {
    const { sections } = (event as CustomEvent<CartResult>).detail;
    const missing = apply(sections);
    if (!missing.length) return;
    // The mutation succeeded; only HTML is missing. Fetch it with a safe GET — never re-mutate.
    try {
      apply(await renderSections(location.pathname, missing));
    } catch {
      document.dispatchEvent(new CustomEvent('nk:cart:render-failed', { detail: { missing } }));
    }
  });

  // Supported hook for apps that change the cart themselves.
  document.addEventListener('nk:cart:refresh', () => void cart.refresh('app').catch(() => {}));

  // Returning via back/forward cache may show a stale cart.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void cart.refresh('pageshow').catch(() => {});
  });
}
