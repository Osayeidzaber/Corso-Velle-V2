import { config } from '../../core/config';
import { define } from '../../core/define';
import { parseHTML } from '../../core/dom';
import { NkElement } from '../../core/element';
import { announce } from '../../services/announce';
import { fetchText, Sequencer } from '../../services/request';

/**
 * <nk-predictive-search> (master-plan/06 N-05). Wraps the search dialog's form; without JS (or
 * if this chunk fails) the form simply submits to the search page.
 *
 * - Debounced 200ms, minimum 2 characters; below that the merchant's suggestions show.
 * - Results come from sections/predictive-search.liquid via routes.predictive_search_url and a
 *   Sequencer, so a slow "lin" response can never replace the newer "linen" results.
 * - Combobox pattern: focus stays in the input; ↑/↓ move aria-activedescendant through the
 *   [role="option"] rows, Enter opens the active row (or submits), Escape clears, then closes.
 */
const MIN_CHARS = 2;
const DEBOUNCE_MS = 200;

type State = 'empty' | 'loading' | 'results' | 'error';

export class NkPredictiveSearch extends NkElement {
  #sequencer = new Sequencer();
  #input: HTMLInputElement | null = null;
  #results: HTMLElement | null = null;
  #timer = 0;
  #active = -1;

  protected mount(): void {
    const input = this.querySelector<HTMLInputElement>('input[type="search"]');
    const results = this.ref('results');
    if (!input || !results) return;
    this.#input = input;
    this.#results = results;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', 'PredictiveSearchListbox');
    input.setAttribute('aria-expanded', 'false');
    this.#setState(input.value.trim().length >= MIN_CHARS ? 'loading' : 'empty');
    if (input.value.trim().length >= MIN_CHARS) void this.#search(input.value.trim());

    this.on(input, 'input', () => this.#schedule());
    this.on(input, 'keydown', (event) => this.#onKeydown(event));
    this.on(this, 'click', (event) => {
      const target = event.target as Element;
      if (target.closest('[data-ref="clear"]')) {
        this.#clear();
        input.focus();
      } else if (target.closest('[data-ref="retry"]')) {
        void this.#search(input.value.trim());
      }
    });
    this.on(this, 'submit', (event) => {
      // An empty search page is never useful; keep the dialog open instead.
      if (!input.value.trim()) event.preventDefault();
    });
    this.dispose(() => {
      window.clearTimeout(this.#timer);
      this.#sequencer.cancel();
    });
  }

  #schedule(): void {
    window.clearTimeout(this.#timer);
    const query = this.#input?.value.trim() ?? '';
    const clear = this.ref('clear');
    if (clear) clear.hidden = query.length === 0;
    if (query.length < MIN_CHARS) {
      this.#sequencer.cancel();
      this.#setState('empty');
      return;
    }
    this.#timer = window.setTimeout(() => void this.#search(query), DEBOUNCE_MS);
  }

  async #search(query: string): Promise<void> {
    if (query.length < MIN_CHARS || !this.#results) return;
    const url = new URL(config().routes.predictiveSearch, location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('section_id', 'predictive-search');
    url.searchParams.set('resources[type]', this.dataset.resources ?? 'query,product,collection');
    url.searchParams.set('resources[limit]', this.dataset.limit ?? '6');
    url.searchParams.set('resources[options][unavailable_products]', 'last');
    url.searchParams.set('resources[options][fields]', 'title,product_type,variants.title,vendor,tag');

    this.#setState('loading');
    try {
      const outcome = await this.#sequencer.run((signal) => fetchText(url.toString(), { signal, timeoutMs: 8000 }));
      if (outcome.stale) return;
      const fresh = parseHTML(outcome.value).querySelector<HTMLElement>('[data-predictive-results]');
      if (!fresh) throw new Error('Predictive search response had no results region');
      this.#results.replaceChildren(...[...fresh.childNodes].map((node) => document.importNode(node, true)));
      this.#setActive(-1);
      this.#setState('results');
      const count = Number(fresh.dataset.resultsCount ?? 0);
      this.#input?.setAttribute('aria-expanded', String(count > 0));
      announce.polite(count > 0 ? (fresh.dataset.resultsLabel ?? '') : (this.#results.textContent?.trim() ?? ''));
    } catch (error) {
      console.error(error);
      this.#setState('error');
    }
  }

  #onKeydown(event: KeyboardEvent): void {
    const options = this.#options();
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (this.dataset.state !== 'results' || !options.length) return;
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        // -1 is "back in the input" so ↑ from the first row returns to typing.
        const next = this.#active + step;
        this.#setActive(next < -1 ? options.length - 1 : next >= options.length ? -1 : next);
        break;
      }
      case 'Enter': {
        const link = options[this.#active]?.querySelector<HTMLAnchorElement>('a');
        if (!link) return; // no active row: the form submits to the search page
        event.preventDefault();
        link.click();
        break;
      }
      case 'Escape':
        // First Escape clears the field; a second one lets the dialog close.
        if (!this.#input?.value) return;
        event.preventDefault();
        event.stopPropagation();
        this.#clear();
        break;
    }
  }

  #options(): HTMLElement[] {
    return [...(this.#results?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
  }

  #setActive(index: number): void {
    const options = this.#options();
    this.#active = index;
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    const current = options[index];
    if (current) {
      this.#input?.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
    } else {
      this.#input?.removeAttribute('aria-activedescendant');
    }
  }

  #clear(): void {
    if (!this.#input) return;
    this.#input.value = '';
    this.#schedule();
  }

  #setState(state: State): void {
    this.dataset.state = state;
    if (this.#results) this.#results.setAttribute('aria-busy', String(state === 'loading'));
    const suggestions = this.ref('suggestions');
    const error = this.ref('error');
    if (suggestions) suggestions.hidden = state !== 'empty';
    if (error) error.hidden = state !== 'error';
    if (this.#results) this.#results.hidden = state === 'empty' || state === 'error';
    if (state === 'empty' || state === 'error') {
      this.#setActive(-1);
      this.#input?.setAttribute('aria-expanded', 'false');
    }
  }
}

define('nk-predictive-search', NkPredictiveSearch);
