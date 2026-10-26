import { define } from '../../core/define';
import { parseHTML } from '../../core/dom';
import { NkElement } from '../../core/element';
import { fetchText } from '../../services/request';

/**
 * <nk-cart-recommendations url intent cart-products> — "Complete the look" in the cart drawer.
 *
 * Fetches sections/cart-recommendations.liquid through Shopify's recommendations route for the
 * newest cart line, once the drawer shows it. "complementary" needs products set up in Search &
 * Discovery, so an empty answer falls back to "related". The drawer re-renders after every cart
 * change, which recreates this element: the last answer for the same product is shown at once
 * (minus anything now in the cart) while a fresh one loads, so the row never flashes empty.
 */
const cache = new Map<string, string>();

export class NkCartRecommendations extends NkElement {
  protected mount(): void {
    const url = this.getAttribute('url');
    if (!url) return;
    const cached = cache.get(url);
    // A microtask lets the children finish attaching, and still runs before the next paint.
    const connection = this.signal;
    if (cached) queueMicrotask(() => this.connectionIsCurrent(connection) && this.#render(cached));
    this.observeIntersection(this, (entry, observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void this.#load(url);
    });
  }

  async #load(url: string): Promise<void> {
    const connection = this.signal;
    try {
      let html = await fetchText(this.#withIntent(url, this.getAttribute('intent') ?? 'complementary'), { signal: connection });
      if (!this.connectionIsCurrent(connection)) return;
      if (!this.#hasItems(html) && this.getAttribute('intent') !== 'related') {
        html = await fetchText(this.#withIntent(url, 'related'), { signal: connection });
      }
      if (!this.connectionIsCurrent(connection)) return;
      cache.set(url, html);
      this.#render(html);
    } catch (error) {
      if (this.connectionIsCurrent(connection) && !['AbortError', 'AbortedError'].includes((error as Error).name)) console.error(error);
    }
  }

  #withIntent(url: string, intent: string): string {
    return `${url}${url.includes('?') ? '&' : '?'}intent=${encodeURIComponent(intent)}`;
  }

  #hasItems(html: string): boolean {
    return parseHTML(html).querySelector('.cart-rec') !== null;
  }

  #render(html: string): void {
    const slot = this.querySelector('[data-cart-recs-slot]');
    const list = parseHTML(html).querySelector('.cart-recs__list');
    if (!slot) return;
    const inCart = new Set((this.getAttribute('cart-products') ?? '').split(',').filter(Boolean));
    for (const item of list?.querySelectorAll<HTMLElement>('.cart-rec') ?? []) {
      if (inCart.has(item.dataset.productId ?? '')) item.remove();
    }
    const empty = !list?.querySelector('.cart-rec');
    // Not `hidden`: an undisplayed element never intersects, so it would never load.
    this.toggleAttribute('data-empty', empty);
    slot.replaceChildren(...(empty || !list ? [] : [document.importNode(list, true)]));
  }
}

define('nk-cart-recommendations', NkCartRecommendations);

/** Reset state in unit tests. */
export function resetCartRecommendationsForTests(): void {
  cache.clear();
}
