import { config, t } from '../../core/config';
import { define } from '../../core/define';
import { parseHTML } from '../../core/dom';
import { NkElement } from '../../core/element';
import { announce } from '../../services/announce';
import { fetchText, Sequencer } from '../../services/request';
import { scopeSearchResults, searchNamespace } from '../predictive-search/results';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 200;

/**
 * <nk-search-pill> — header search that expands from an icon button into an inline search field
 * with live predictive search results in a floating panel below the pill.
 *
 * Without JS the field is simply always open and submits to /search.
 */
export class NkSearchPill extends NkElement {
  #sequencer = new Sequencer();
  #timer = 0;
  #results: HTMLElement | null = null;
  #active = -1;
  #namespace = searchNamespace();

  protected mount(): void {
    const toggle = this.ref<HTMLButtonElement>('toggle');
    const closeBtn = this.ref<HTMLButtonElement>('close');
    const form = this.querySelector<HTMLFormElement>('form');
    const input = this.querySelector<HTMLInputElement>('input[type="search"]');
    if (!toggle || !input || !form) return;

    this.setAttribute('data-enhanced', '');
    this.#set(false, toggle);

    if (this.hasAttribute('data-predictive')) {
      const dropdown = document.createElement('div');
      dropdown.className = 'search-pill__results';
      dropdown.hidden = true;
      this.append(dropdown);
      this.#results = dropdown;
      this.dispose(() => { dropdown.remove(); this.#results = null; });

      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-expanded', 'false');
    }

    this.on(toggle, 'click', () => {
      this.#set(true, toggle);
      input.focus();
    });

    if (closeBtn) {
      this.on(closeBtn, 'click', () => {
        input.value = '';
        this.#hideResults(input);
        this.#set(false, toggle);
        toggle.focus();
      });
    }

    this.on(form, 'submit', (event) => {
      if (!input.value.trim()) {
        event.preventDefault();
        input.focus();
      }
    });

    this.on(input, 'input', () => {
      if (!this.#results) return;
      window.clearTimeout(this.#timer);
      this.#sequencer.cancel();
      this.#hideResults(input);
      const query = input.value.trim();
      if (query.length < MIN_CHARS) {
        this.#sequencer.cancel();
        this.#hideResults(input);
        return;
      }
      this.#timer = window.setTimeout(() => void this.#search(query, input), DEBOUNCE_MS);
    });

    this.on(input, 'keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (input.value) {
          input.value = '';
          this.#hideResults(input);
        } else {
          this.#hideResults(input);
          this.#set(false, toggle);
          toggle.focus();
        }
        return;
      }
      if (!this.#results || this.#results.hidden) return;
      const options = [...this.#results.querySelectorAll<HTMLElement>('[role="option"]')];
      if (!options.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = this.#active + step;
        this.#setActive(options, next < -1 ? options.length - 1 : next >= options.length ? -1 : next, input);
      } else if (event.key === 'Enter' && this.#active >= 0) {
        const link = options[this.#active]?.querySelector<HTMLAnchorElement>('a');
        if (link) {
          event.preventDefault();
          link.click();
        }
      }
    });

    this.on(document, 'click', (event) => {
      if (!this.hasAttribute('data-open')) return;
      if (this.contains(event.target as Node)) return;
      this.#hideResults(input);
      if (!input.value.trim()) this.#set(false, toggle);
    });

    this.on(this, 'focusout', (event) => {
      const next = event.relatedTarget as Node | null;
      if (next && this.contains(next)) return;
      this.#hideResults(input);
      if (!input.value.trim()) this.#set(false, toggle);
    });

    this.dispose(() => {
      window.clearTimeout(this.#timer);
      this.#sequencer.cancel();
    });
  }

  async #search(query: string, input: HTMLInputElement): Promise<void> {
    if (!this.#results || query.length < MIN_CHARS) return;
    const url = new URL(config().routes.predictiveSearch, location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('section_id', 'predictive-search');
    url.searchParams.set('resources[type]', 'query,product,collection');
    url.searchParams.set('resources[limit]', '4');
    url.searchParams.set('resources[options][unavailable_products]', 'last');
    url.searchParams.set('resources[options][fields]', 'title,product_type,variants.title,vendor,tag');

    this.setAttribute('data-loading', '');
    try {
      const outcome = await this.#sequencer.run((signal) => fetchText(url.toString(), { signal, timeoutMs: 8000 }));
      if (outcome.stale) return;
      this.removeAttribute('data-loading');
      const fresh = parseHTML(outcome.value).querySelector<HTMLElement>('[data-predictive-results]');
      if (!fresh) {
        this.#hideResults(input);
        return;
      }
      const listboxId = scopeSearchResults(fresh, this.#namespace);
      this.#results.replaceChildren(...[...fresh.childNodes].map((node) => document.importNode(node, true)));
      this.#results.hidden = false;
      this.#active = -1;
      const count = Number(fresh.dataset.resultsCount ?? 0);
      input.setAttribute('aria-controls', listboxId);
      input.setAttribute('aria-expanded', String(count > 0));
      announce.polite(count > 0 ? (fresh.dataset.resultsLabel ?? '') : (this.#results.textContent?.trim() ?? ''));
    } catch (error) {
      console.error(error);
      this.removeAttribute('data-loading');
      this.#hideResults(input);
      const message = document.createElement('p');
      message.className = 'message message--error';
      message.setAttribute('role', 'alert');
      message.textContent = t('search.predictive_error');
      const link = document.createElement('a');
      const fallback = new URL(config().routes.search, location.origin);
      fallback.searchParams.set('q', query);
      fallback.searchParams.set('options[prefix]', 'last');
      link.href = fallback.toString();
      link.textContent = t('search.submit');
      this.#results.replaceChildren(message, link);
      this.#results.hidden = false;
    }
  }

  #setActive(options: HTMLElement[], index: number, input: HTMLInputElement): void {
    this.#active = index;
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    const current = options[index];
    if (current) {
      input.setAttribute('aria-activedescendant', current.id);
      current.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  #hideResults(input: HTMLInputElement): void {
    window.clearTimeout(this.#timer);
    this.#sequencer.cancel();
    this.removeAttribute('data-loading');
    this.#active = -1;
    input.removeAttribute('aria-activedescendant');
    input.setAttribute('aria-expanded', 'false');
    if (this.#results) this.#results.hidden = true;
  }

  #set(open: boolean, toggle: HTMLButtonElement): void {
    this.toggleAttribute('data-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.hidden = open;
  }
}

define('nk-search-pill', NkSearchPill);

