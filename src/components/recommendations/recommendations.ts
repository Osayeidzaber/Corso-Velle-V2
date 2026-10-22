import { define } from '../../core/define';
import { parseHTML } from '../../core/dom';
import { NkElement } from '../../core/element';
import { fetchText } from '../../services/request';

/**
 * <nk-recommendations url="…"> — loads Shopify's product recommendations for this section when it
 * nears the viewport and swaps in the rendered grid. Hides itself when there is nothing to show.
 */
export class NkRecommendations extends NkElement {
  protected mount(): void {
    const url = this.getAttribute('url');
    if (!url || this.hasAttribute('data-loaded')) return;
    this.observeIntersection(
      this,
      (entry, observer) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void this.#load(url);
      },
      { rootMargin: '0px 0px 400px 0px' },
    );
  }

  async #load(url: string): Promise<void> {
    try {
      const html = await fetchText(url, { signal: this.signal });
      const fresh = parseHTML(html).querySelector('nk-recommendations');
      if (!this.isConnected) return;
      if (!fresh || !fresh.querySelector('[data-stagger-item]')) {
        this.closest<HTMLElement>('.shopify-section')?.setAttribute('hidden', '');
        return;
      }
      this.setAttribute('data-loaded', '');
      this.replaceChildren(...[...fresh.childNodes].map((node) => document.importNode(node, true)));
      this.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true, detail: { regions: ['recommendations'] } }));
    } catch (error) {
      if ((error as Error).name !== 'AbortedError') console.error(error);
    }
  }
}

define('nk-recommendations', NkRecommendations);
