import { define } from '../../core/define';
import { captureFocus, parseHTML, restoreFocus } from '../../core/dom';
import { NkElement } from '../../core/element';
import { animate, motionStagger, motionTempo } from '../../core/motion';
import { announce } from '../../services/announce';
import { overlay } from '../../services/overlay';
import { Sequencer } from '../../services/request';
import { renderSection } from '../../services/sections';

const STORAGE_MOBILE_KEY = 'nk:grid-cols-mobile';
const STORAGE_DESKTOP_KEY = 'nk:grid-cols-desktop';

/**
 * <nk-facets data-section-id="…"> (master-plan/07 DC-02) wraps the filter form, active chips,
 * interactive layout switcher, and the result grid of a collection or search section
 * (snippets/facets.liquid).
 *
 * - Apply (drawer submit), a sort change, or a chip / Clear all link re-renders this section via
 *   Section Rendering and replaces this element's children; the URL is pushed to history and
 *   Back/Forward re-render from the URL. Only the latest request may render (Sequencer).
 * - The drawer is a draft: closing it without applying resets the form to the applied state,
 *   and "Clear all" inside the drawer only clears the draft.
 * - Layout switcher buttons ([data-grid-cols-mobile], [data-grid-cols-desktop]) update the
 *   product grid columns, persist the choice in sessionStorage, and smoothly animate the grid.
 * - On failure the previous results stay and an inline error links to the full-page URL.
 *
 * All listeners are delegated on this element, so they survive the children being replaced.
 */
export class NkFacets extends NkElement {
  #sequencer = new Sequencer();

  protected mount(): void {
    this.setAttribute('data-enhanced', '');
    const measureViewport = () => this.style.setProperty('--nk-viewport-width', `${document.documentElement.clientWidth}px`);
    measureViewport();
    this.observeResize(document.documentElement, measureViewport);
    this.#restoreGridLayout();

    this.on(this, 'submit', (event) => {
      const form = (event.target as Element).closest<HTMLFormElement>('form[data-facets-form]');
      if (!form) return;
      event.preventDefault();
      const url = this.#urlFrom(form);
      this.#closeDrawer();
      void this.#render(url, true);
    });

    this.on(this, 'change', (event) => {
      const select = (event.target as Element).closest<HTMLSelectElement>('select[data-facets-sort]');
      if (select?.form) void this.#render(this.#urlFrom(select.form), true);
    });

    this.on(this, 'click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element;

      const sortOption = target.closest<HTMLButtonElement>('[data-facets-sort-value]');
      if (sortOption) {
        const select = this.querySelector<HTMLSelectElement>('[data-facets-sort]');
        const menu = sortOption.closest<HTMLDetailsElement>('[data-sort-menu]');
        if (menu) menu.open = false;
        menu?.querySelector('summary')?.focus();
        if (select && select.value !== sortOption.dataset.facetsSortValue) {
          select.value = sortOption.dataset.facetsSortValue ?? '';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }

      const mobileBtn = target.closest<HTMLButtonElement>('[data-grid-cols-mobile]');
      if (mobileBtn) {
        event.preventDefault();
        const cols = mobileBtn.dataset.gridColsMobile;
        if (cols) this.#setGridLayout('mobile', cols, true);
        return;
      }

      const desktopBtn = target.closest<HTMLButtonElement>('[data-grid-cols-desktop]');
      if (desktopBtn) {
        event.preventDefault();
        const cols = desktopBtn.dataset.gridColsDesktop;
        if (cols) this.#setGridLayout('desktop', cols, true);
        return;
      }

      const reset = target.closest<HTMLElement>('[data-facets-reset]');
      if (reset) {
        event.preventDefault();
        this.#clearDraft(reset.closest('form'));
        return;
      }
      const link = target.closest<HTMLAnchorElement>('a[data-facets-link]');
      if (link) {
        event.preventDefault();
        this.#closeDrawer();
        void this.#render(link.href, true);
      }
    });

    this.on(document, 'pointerdown', (event) => {
      for (const menu of this.querySelectorAll<HTMLDetailsElement>('[data-sort-menu][open]')) {
        if (!menu.contains(event.target as Node)) menu.open = false;
      }
    });
    this.on(this, 'keydown', (event) => {
      const menu = (event.target as Element).closest<HTMLDetailsElement>('[data-sort-menu]');
      if (!menu?.open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        menu.open = false;
        menu.querySelector('summary')?.focus();
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const options = [...menu.querySelectorAll<HTMLButtonElement>('[data-facets-sort-value]')];
        const current = options.indexOf(document.activeElement as HTMLButtonElement);
        const index = event.key === 'Home' ? 0 : event.key === 'End' || (current === -1 && event.key === 'ArrowUp') ? options.length - 1
          : (current + (event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
        options[index]?.focus();
      }
    });

    // `close` doesn't bubble; listen in the capture phase for the drawer's dialog.
    this.on(
      this,
      'close',
      (event) => {
        if (!(event.target instanceof HTMLDialogElement)) return;
        event.target.closest('form')?.reset();
      },
      { capture: true },
    );

    this.on(window, 'popstate', () => {
      const form = this.querySelector<HTMLFormElement>('form[data-facets-form]');
      if (form && new URL(form.action).pathname === location.pathname) void this.#render(location.href, false);
    });
    this.dispose(() => this.#sequencer.cancel());
  }

  #restoreGridLayout(): void {
    if (this.hasAttribute('data-layout-locked')) return;
    try {
      const savedMobile = sessionStorage.getItem(STORAGE_MOBILE_KEY);
      if (savedMobile) this.#setGridLayout('mobile', savedMobile, false);
      const savedDesktop = sessionStorage.getItem(STORAGE_DESKTOP_KEY);
      if (savedDesktop) this.#setGridLayout('desktop', savedDesktop, false);
    } catch {
      // sessionStorage may be unavailable in restricted contexts
    }
  }

  #setGridLayout(mode: 'mobile' | 'desktop', cols: string, animated: boolean): void {
    if (!(mode === 'mobile' ? ['1', '2'] : ['2', '3', '4']).includes(cols)) return;
    const grid = this.querySelector<HTMLElement>('.product-grid');
    if (mode === 'mobile') {
      grid?.style.setProperty('--nk-cols-mobile', cols);
      for (const btn of this.querySelectorAll<HTMLButtonElement>('[data-grid-cols-mobile]')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.gridColsMobile === cols));
      }
      try {
        sessionStorage.setItem(STORAGE_MOBILE_KEY, cols);
      } catch {
        // ignore
      }
    } else {
      grid?.style.setProperty('--nk-cols-desktop', cols);
      for (const btn of this.querySelectorAll<HTMLButtonElement>('[data-grid-cols-desktop]')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.gridColsDesktop === cols));
      }
      try {
        sessionStorage.setItem(STORAGE_DESKTOP_KEY, cols);
      } catch {
        // ignore
      }
    }

    if (animated && grid) {
      this.#animateGridItems(grid);
    }
  }

  #animateGridItems(container: HTMLElement): void {
    // Layout changes are direct interactions: finish pending scroll reveals first. The shared
    // stagger component alone owns entrances after a filter/sort response replaces the grid.
    container.closest('nk-stagger')?.dispatchEvent(new Event('nk:stagger:finish'));
    const items = [...container.querySelectorAll<HTMLElement>(':scope > li, [data-stagger-item]')].filter((item) => {
      const bounds = item.getBoundingClientRect();
      return bounds.bottom > 0 && bounds.top < window.innerHeight;
    }).slice(0, 16);
    items.forEach((item, index) => {
      item.getAnimations?.().forEach((animation) => animation.cancel());
      animate(
        item,
        [
          { opacity: 0.65, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'none' },
        ],
        {
          duration: 280 * motionTempo(),
          delay: Math.min(180, index * motionStagger() * 1000),
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'backwards',
        },
        { decorative: true },
      );
    });
  }

  /** Form state as a URL; empty values (blank price fields) are dropped and page resets. */
  #urlFrom(form: HTMLFormElement): string {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === 'string' && value.trim() !== '') params.append(key, value.trim());
    }
    const url = new URL(form.action, location.origin);
    url.search = params.toString();
    return url.toString();
  }

  #clearDraft(form: HTMLFormElement | null): void {
    const drawer = this.querySelector<HTMLElement>('.facets__drawer');
    if (!form || !drawer) return;
    for (const input of drawer.querySelectorAll<HTMLInputElement>('input')) {
      if (input.type === 'checkbox') input.checked = false;
      else if (input.type === 'number') input.value = '';
    }
  }

  #closeDrawer(): void {
    const dialog = this.querySelector<HTMLDialogElement>('.facets__drawer');
    if (dialog && overlay.isOpen(dialog)) overlay.close(dialog);
  }

  async #render(url: string, push: boolean): Promise<void> {
    const sectionId = this.dataset.sectionId;
    if (!sectionId) {
      location.assign(url);
      return;
    }
    this.setAttribute('aria-busy', 'true');
    this.#setError(null);
    try {
      const outcome = await this.#sequencer.run((signal) => renderSection(url, sectionId, { signal }));
      if (outcome.stale) return;
      const fresh = parseHTML(outcome.value).querySelector('nk-facets');
      if (!fresh) throw new Error('Section response had no <nk-facets>');

      if (push) history.pushState(history.state, '', url);
      const focusKey = captureFocus(this);
      this.replaceChildren(...[...fresh.childNodes].map((node) => document.importNode(node, true)));
      this.#restoreGridLayout();
      restoreFocus(this, focusKey);
      this.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true, detail: { regions: ['facets'] } }));
      this.removeAttribute('aria-busy');

      const label = this.querySelector('[data-results-label]')?.textContent?.trim();
      if (label) announce.polite(label);
      // History restoration belongs to the browser; only an explicit filter/sort should move it.
      if (push && this.getBoundingClientRect().top < 0) this.scrollIntoView({ block: 'start' });
    } catch (error) {
      console.error(error);
      this.removeAttribute('aria-busy');
      this.#setError(url);
    }
  }

  #setError(url: string | null): void {
    const region = this.querySelector<HTMLElement>('[data-facets-error]');
    if (!region) return;
    region.hidden = url === null;
    const link = region.querySelector<HTMLAnchorElement>('a');
    if (link && url) link.href = url;
  }
}

define('nk-facets', NkFacets);
