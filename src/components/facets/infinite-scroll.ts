import { t } from '../../core/config';
import { define } from '../../core/define';
import { parseHTML } from '../../core/dom';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';
import { announce } from '../../services/announce';
import { renderSection } from '../../services/sections';

/**
 * <nk-infinite-scroll data-mode="infinite|button" data-auto-pages data-section-id>
 * (snippets/infinite-pagination). Appends the next page's grid items to the current grid.
 *
 * - One Section Rendering request per page; the next URL always comes from the server's own
 *   pagination, so filters and sort carry over and nothing is guessed.
 * - Infinite mode loads automatically as the end of the grid nears, up to data-auto-pages pages,
 *   then shows a "Load more" button so the footer stays reachable.
 * - Loaded pages are remembered for this tab: returning with Back re-appends them and restores the
 *   scroll position, so shoppers don't lose their place after opening a product.
 * - Filters/sort re-render the whole section (nk-facets), which resets this element naturally.
 */

interface Memory {
  urls: string[];
  scroll: number;
}

const MEMORY_PREFIX = 'nk:infinite:';

export class NkInfiniteScroll extends NkElement {
  #loading = false;
  #autoLoaded = 0;

  protected mount(): void {
    this.#loading = false;
    this.#autoLoaded = 0;
    const signal = this.signal;
    // Children may still be parsing when a parser-created element upgrades.
    if (this.querySelector('[data-infinite-status]')) this.#setup();
    else queueMicrotask(() => this.connectionIsCurrent(signal) && this.#setup());
  }

  #setup(): void {
    const next = this.#next();
    const fallback = this.querySelector<HTMLElement>('[data-infinite-fallback]');
    if (fallback) fallback.hidden = true;
    if (!next) return;
    next.hidden = false;
    this.toggleAttribute('data-auto', this.dataset.mode === 'infinite');

    this.on(next, 'click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.#load();
    });

    if (this.dataset.mode === 'infinite') {
      this.observeIntersection(next, (entry) => {
        if (entry.isIntersecting && this.#autoLoaded < this.#autoPages()) void this.#load(true);
      }, { rootMargin: '0px 0px 800px 0px' });
    }

    // Remember the scroll position for Back navigation once pages have been appended.
    this.on(window, 'pagehide', () => this.#saveScroll());
    this.on(document, 'click', (event) => {
      if ((event.target as Element).closest('main a[href]')) this.#saveScroll();
    }, { capture: true });

    void this.#restore();
  }

  #next(): HTMLAnchorElement | null {
    return this.querySelector<HTMLAnchorElement>('[data-infinite-next]');
  }

  #grid(): HTMLElement | null {
    return this.closest('[data-facets-results]')?.querySelector<HTMLElement>('.product-grid') ?? null;
  }

  #autoPages(): number {
    return Math.max(1, Number(this.dataset.autoPages) || 3);
  }

  async #load(auto = false, url = this.#next()?.href): Promise<boolean> {
    const grid = this.#grid();
    const sectionId = this.dataset.sectionId;
    if (this.#loading || !url || !grid || !sectionId) return false;
    const signal = this.signal;
    this.#loading = true;
    if (auto) this.#autoLoaded += 1;
    this.#busy(true);
    this.#status(t('collection.loading_more'));
    try {
      const html = await renderSection(url, sectionId, { signal });
      if (!this.connectionIsCurrent(signal)) return false;
      const doc = parseHTML(html);
      if (!doc.querySelector('.product-grid') || !doc.querySelector('nk-infinite-scroll')) throw new Error('Missing pagination section');
      const items = [...doc.querySelectorAll<HTMLElement>('.product-grid > li')];
      const known = new Set([...grid.querySelectorAll<HTMLElement>('[data-product-url]')].map((card) => card.dataset.productUrl));
      const fresh = items
        // A product can shift pages if the catalogue changed between requests; never show it twice.
        .filter((item) => !known.has(item.querySelector<HTMLElement>('[data-product-url]')?.dataset.productUrl))
        .map((item) => document.importNode(item, true));
      grid.append(...fresh);
      this.#reveal(fresh);
      this.#updateFrom(doc);
      this.#remember(url);
      this.#status(t('collection.loaded_more', { count: fresh.length }));
      grid.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true, detail: { regions: ['results'] } }));
      // The observer only fires on changes: if the end of the grid is still near (short pages,
      // tall screens), keep going while automatic loading is allowed.
      if (auto) {
        const frame = requestAnimationFrame(() => { if (this.connectionIsCurrent(signal)) this.#continue(); });
        this.dispose(() => cancelAnimationFrame(frame));
      }
      return true;
    } catch {
      if (!this.connectionIsCurrent(signal)) return false;
      this.#status(t('collection.load_failed'), true);
      const fallback = this.querySelector<HTMLElement>('[data-infinite-fallback]');
      if (fallback) fallback.hidden = false;
      const next = this.#next();
      if (next) next.hidden = false;
      return false;
    } finally {
      if (this.connectionIsCurrent(signal)) {
        this.#loading = false;
        this.#busy(false);
      }
    }
  }

  #continue(): void {
    const next = this.#next();
    if (!next || !this.hasAttribute('data-auto')) return;
    if (next.getBoundingClientRect().top < window.innerHeight + 800) void this.#load(true);
  }

  /** Take the next link, count and progress from the page just loaded. */
  #updateFrom(doc: Document): void {
    const incoming = doc.querySelector('nk-infinite-scroll');
    const nextUrl = incoming?.querySelector<HTMLAnchorElement>('[data-infinite-next]')?.getAttribute('href');
    const next = this.#next();
    if (next) {
      if (nextUrl) next.setAttribute('href', nextUrl);
      else {
        next.remove();
        this.querySelector('[data-infinite-loader]')?.remove();
      }
    }
    const count = this.querySelector<HTMLElement>('[data-infinite-count]');
    const grid = this.#grid();
    if (count && grid) {
      const total = Number(count.dataset.total) || 0;
      const shown = Math.min(total || Infinity, grid.querySelectorAll(':scope > li').length);
      if (count.dataset.template) count.textContent = count.dataset.template.replace('[shown]', String(shown));
      this.querySelector<HTMLElement>('.infinite__progress > span')?.style.setProperty('--infinite-progress', String(total ? shown / total : 1));
    }
    // In infinite mode the button only shows once automatic loading has stopped.
    const stillAuto = this.dataset.mode === 'infinite' && this.#autoLoaded < this.#autoPages();
    this.toggleAttribute('data-auto', stillAuto);
  }

  #reveal(items: HTMLElement[]): void {
    if (!decorativeMotionAllowed()) return;
    items.forEach((item, index) => {
      const animation = item.animate(
        [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, delay: Math.min(index, 8) * 55, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' },
      );
      this.dispose(() => animation.cancel());
    });
  }

  #busy(busy: boolean): void {
    this.toggleAttribute('aria-busy', busy);
    const loader = this.querySelector<HTMLElement>('[data-infinite-loader]');
    if (loader) loader.hidden = !busy;
  }

  #status(message: string, error = false): void {
    const region = this.querySelector<HTMLElement>('[data-infinite-status]');
    if (region) region.textContent = message;
    if (error) announce.assertive(message);
  }

  /* ------------------------------------------------------------------- back navigation */

  #key(): string {
    return MEMORY_PREFIX + location.pathname + location.search;
  }

  #read(): Memory | null {
    try {
      const raw = sessionStorage.getItem(this.#key());
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<Memory>;
      if (!Array.isArray(value.urls) || !Number.isFinite(value.scroll) || Number(value.scroll) < 0) return null;
      const urls = value.urls.filter((url): url is string => {
        if (typeof url !== 'string') return false;
        const target = new URL(url, location.origin);
        return target.origin === location.origin && target.pathname === location.pathname;
      });
      return { urls: urls.slice(0, 100), scroll: Number(value.scroll) };
    } catch {
      return null;
    }
  }

  #write(memory: Memory): void {
    try {
      sessionStorage.setItem(this.#key(), JSON.stringify(memory));
    } catch {
      /* storage unavailable: back navigation simply starts at page one */
    }
  }

  #remember(url: string): void {
    const memory = this.#read() ?? { urls: [], scroll: 0 };
    if (!memory.urls.includes(url)) memory.urls.push(url);
    this.#write(memory);
  }

  #saveScroll(): void {
    const memory = this.#read();
    if (memory?.urls.length) this.#write({ ...memory, scroll: window.scrollY });
  }

  async #restore(): Promise<void> {
    const signal = this.signal;
    const navigation = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
    const memory = this.#read();
    if (!memory?.urls.length) return;
    if (navigation?.type !== 'back_forward') {
      // A fresh visit starts at page one.
      try { sessionStorage.removeItem(this.#key()); } catch { /* ignore */ }
      return;
    }
    for (const url of memory.urls) {
      if (!this.connectionIsCurrent(signal)) return;
      if (!(await this.#load(false, url))) break;
    }
    if (this.connectionIsCurrent(signal) && memory.scroll) window.scrollTo({ top: memory.scroll, behavior: 'instant' });
  }
}

define('nk-infinite-scroll', NkInfiniteScroll);
