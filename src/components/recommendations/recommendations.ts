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
    const connection = this.signal;
    try {
      const html = await fetchText(url, { signal: connection });
      const fresh = parseHTML(html).querySelector('nk-recommendations');
      if (!this.connectionIsCurrent(connection)) return;
      if (!fresh || (!fresh.querySelector('[data-stagger-item]') && !this.hasAttribute('show-empty'))) {
        this.setAttribute('data-loaded', '');
        this.closest<HTMLElement>('.shopify-section')?.setAttribute('hidden', '');
        return;
      }
      this.setAttribute('data-loaded', '');
      this.replaceChildren(...[...fresh.childNodes].map((node) => document.importNode(node, true)));
      this.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true, detail: { regions: ['recommendations'] } }));
    } catch (error) {
      if (this.connectionIsCurrent(connection) && !['AbortError', 'AbortedError'].includes((error as Error).name)) console.error(error);
    }
  }
}

define('nk-recommendations', NkRecommendations);
