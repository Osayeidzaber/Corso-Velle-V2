import { captureFocus, parseHTML, restoreFocus } from '../core/dom';
import { cart, cartSectionIds, type CartResult } from './cart';
import { renderSections } from './sections';
import { Sequencer } from './request';
import { config, t } from '../core/config';
import { announce } from './announce';

/**
 * Applies cart section HTML after every mutation. Each cart region in Liquid renders
 * `<div data-cart-section="{{ section.id }}">…</div>`; only its children are swapped so the
 * surrounding dialog/shell (and its focus management) stays intact.
 */
function apply(sections: Record<string, string | null> | null | undefined, expected = cartSectionIds()): string[] {
  if (!sections || typeof sections !== 'object') return expected;
  const missing: string[] = [];
  for (const id of expected) {
    if (!(id in sections)) {
      missing.push(id);
      continue;
    }
    const html = sections[id];
    const target = document.querySelector<HTMLElement>(`[data-cart-section="${CSS.escape(id)}"]`);
    const next = html ? parseHTML(html).querySelector(`[data-cart-section="${CSS.escape(id)}"]`) : null;
    if (!target || !next) {
      missing.push(id);
      continue;
    }
    const focusKey = captureFocus(target);
    const note = document.activeElement instanceof HTMLTextAreaElement && target.contains(document.activeElement)
      ? { value: document.activeElement.value, start: document.activeElement.selectionStart, end: document.activeElement.selectionEnd }
      : null;
    const activeLine = document.activeElement?.closest('[data-line-key]');
    const lineIndex = activeLine ? [...target.querySelectorAll('[data-line-key]')].indexOf(activeLine) : -1;
    // The free shipping bar grows from where it was rather than from zero (snippets/free-shipping-bar).
    const shippingFrom = target.querySelector<HTMLElement>('.shipping-bar')?.style.getPropertyValue('--shipping-progress');
    target.replaceChildren(...[...next.childNodes].map((node) => document.importNode(node, true)));
    if (shippingFrom) target.querySelector<HTMLElement>('.shipping-bar')?.style.setProperty('--shipping-from', shippingFrom);
    if (note) {
      const field = target.querySelector<HTMLTextAreaElement>('[data-cart-note]');
      if (field) { field.value = note.value; field.setSelectionRange(note.start, note.end); }
    }
    restoreFocus(target, focusKey);
    if (focusKey && !target.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)) {
      const lines = target.querySelectorAll('[data-line-key]');
      const line = lines[Math.min(Math.max(lineIndex, 0), lines.length - 1)];
      const fallback = line?.querySelector<HTMLElement>('.cart-line__title') ?? target.querySelector<HTMLElement>('.cart-empty a');
      fallback?.focus({ preventScroll: true });
    }
    target.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true, detail: { regions: [id] } }));
  }
  return missing;
}

let installed = false;
let revision = 0;
const recovery = new Sequencer();
let notificationTimer = 0;

export function installCartRenderer(): void {
  if (installed) return;
  installed = true;
  document.querySelector('[data-cart-notification-close]')?.addEventListener('click', () => {
    const notification = document.querySelector<HTMLElement>('[data-cart-notification]');
    if (notification) notification.hidden = true;
  });
  document.addEventListener('nk:cart:updated', async (event) => {
    const currentRevision = ++revision;
    recovery.cancel();
    const { sections, cart: state, kind } = (event as CustomEvent<CartResult & { kind: string }>).detail;
    for (const count of document.querySelectorAll<HTMLElement>('[data-cart-count]')) {
      count.textContent = String(state.item_count);
      count.hidden = state.item_count === 0;
    }
    // One announcement per add, whichever confirmation the merchant chose ('page' navigates away).
    if (kind === 'add' && config().cart.afterAdd !== 'page') announce.polite(t('cart.added'));
    if (kind === 'add' && config().cart.afterAdd === 'notification') {
      const notification = document.querySelector<HTMLElement>('[data-cart-notification]');
      if (notification) {
        notification.hidden = false;
        window.clearTimeout(notificationTimer);
        notificationTimer = window.setTimeout(() => {
          if (!notification.matches(':focus-within, :hover')) notification.hidden = true;
        }, 7000);
      }
    }
    const missing = apply(sections);
    markStale(missing);
    if (!missing.length) return;
    // The mutation succeeded; only HTML is missing. Fetch it with a safe GET — never re-mutate.
    try {
      const outcome = await recovery.run((signal) => renderSections(location.pathname, missing, { signal }));
      if (outcome.stale || revision !== currentRevision) return;
      const remaining = apply(outcome.value, missing);
      markStale(remaining);
      if (remaining.length) renderFailed(remaining);
    } catch {
      if (revision === currentRevision) renderFailed(missing);
    }
  });

  document.addEventListener('nk:cart:pending', (event) => {
    const pending = (event as CustomEvent<{ pending: boolean }>).detail.pending;
    for (const items of document.querySelectorAll('nk-cart-items')) {
      items.toggleAttribute('data-pending', pending);
    }
    updateCheckout(pending);
  });

  // Supported hook for apps that change the cart themselves.
  document.addEventListener('nk:cart:refresh', () => void cart.refresh('app').catch(() => {}));

  // Returning via back/forward cache may show a stale cart.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) void cart.refresh('pageshow').catch(() => {});
  });
}

function updateCheckout(pending = cart.pending): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('nk-cart-items button[name="checkout"]')) {
    button.disabled = pending || Boolean(button.closest('[data-cart-stale]'));
    button.setAttribute('aria-busy', String(pending));
  }
  for (const accelerated of document.querySelectorAll<HTMLElement>('nk-cart-items .cart-summary__accelerated')) {
    accelerated.inert = pending || Boolean(accelerated.closest('[data-cart-stale]'));
  }
}

function markStale(missing: string[]): void {
  for (const region of document.querySelectorAll<HTMLElement>('[data-cart-section]')) {
    const stale = missing.includes(region.dataset.cartSection ?? '');
    region.toggleAttribute('data-cart-stale', stale);
    const fallback = region.closest('nk-cart-items')?.querySelector<HTMLElement>('[data-cart-render-error]');
    if (fallback) fallback.hidden = !stale;
  }
  updateCheckout();
}

function renderFailed(missing: string[]): void {
  document.dispatchEvent(new CustomEvent('nk:cart:render-failed', { detail: { missing } }));
}
