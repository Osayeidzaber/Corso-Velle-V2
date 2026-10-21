import { define } from '../../core/define';
import { captureFocus, parseHTML, restoreFocus } from '../../core/dom';
import { NkElement } from '../../core/element';
import { announce } from '../../services/announce';
import { overlay } from '../../services/overlay';
import { Sequencer } from '../../services/request';
import { renderSection } from '../../services/sections';

/**
 * <nk-facets data-section-id="…"> (master-plan/07 DC-02) wraps the filter form, active chips and
 * the result grid of a collection or search section (snippets/facets.liquid).
 *
 * - Apply (drawer submit), a sort change, or a chip / Clear all link re-renders this section via
 *   Section Rendering and replaces this element's children; the URL is pushed to history and
 *   Back/Forward re-render from the URL. Only the latest request may render (Sequencer).
 * - The drawer is a draft: closing it without applying resets the form to the applied state,
 *   and "Clear all" inside the drawer only clears the draft.
 * - On failure the previous results stay and an inline error links to the full-page URL.
 *
 * All listeners are delegated on this element, so they survive the children being replaced.
 */
export class NkFacets extends NkElement {
  #sequencer = new Sequencer();

  protected mount(): void {
    this.setAttribute('data-enhanced', '');

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
      const reset = target.closest<HTMLElement>('[data-facets-reset]');
      if (reset) {
        event.preventDefault();
        this.#clearDraft(reset.closest('form'));
        return;
      }
      const link = target.closest<HTMLAnchorElement>('a[data-facets-link]');
      if (link) {
        event.preventDefault();
        void this.#render(link.href, true);
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
      restoreFocus(this, focusKey);
      this.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true, detail: { regions: ['facets'] } }));
      this.removeAttribute('aria-busy');

      const label = this.querySelector('[data-results-label]')?.textContent?.trim();
      if (label) announce.polite(label);
      if (this.getBoundingClientRect().top < 0) this.scrollIntoView({ block: 'start' });
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
