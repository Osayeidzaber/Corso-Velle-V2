import { NkElement } from '../../core/element';

/**
 * <nk-disclosure> wraps a native <details>. The behaviour (keyboard, semantics, no-JS) is the
 * browser's; this element only opens itself when selected in the theme editor and restores the
 * merchant's default state afterwards. Rewrite of the motion-primitives Disclosure example
 * (master-plan/05 §4.9) — content stays in the DOM instead of being unmounted.
 */
export class NkDisclosure extends NkElement {
  #details: HTMLDetailsElement | null = null;
  #openedByEditor = false;

  protected mount(): void {
    this.#details = this.querySelector(':scope > details');
  }

  override onEditorSelect(): void {
    if (this.#details && !this.#details.open) {
      this.#details.open = true;
      this.#openedByEditor = true;
    }
  }

  override onEditorDeselect(): void {
    if (this.#details && this.#openedByEditor) this.#details.open = false;
    this.#openedByEditor = false;
  }
}
