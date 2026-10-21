import './search-pill.css';

import { define } from '../../core/define';
import { NkElement } from '../../core/element';

/**
 * <nk-search-pill> — header search that expands from an icon pill into a field (clean-room
 * rewrite of the supplied gooeyinput example). Fixes the example's accessibility issues: a real
 * <form role="search"> with a labelled input (never an input inside a button). The "goo" SVG
 * filter applies only to the background blobs, never to text or the input.
 *
 * Without JS the field is simply always open. Escape or blurring an empty field collapses it.
 */
export class NkSearchPill extends NkElement {
  protected mount(): void {
    const toggle = this.ref<HTMLButtonElement>('toggle');
    const input = this.querySelector<HTMLInputElement>('input[type="search"]');
    if (!toggle || !input) return;

    this.setAttribute('data-enhanced', '');
    this.#set(false, toggle);

    this.on(toggle, 'click', () => {
      this.#set(true, toggle);
      input.focus();
    });
    this.on(input, 'keydown', (event) => {
      if (event.key !== 'Escape') return;
      input.value = '';
      this.#set(false, toggle);
      toggle.focus();
    });
    this.on(this, 'focusout', (event) => {
      const next = event.relatedTarget as Node | null;
      if (next && this.contains(next)) return;
      if (!input.value) this.#set(false, toggle);
    });
  }

  #set(open: boolean, toggle: HTMLButtonElement): void {
    this.toggleAttribute('data-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.hidden = open;
  }
}

define('nk-search-pill', NkSearchPill);
