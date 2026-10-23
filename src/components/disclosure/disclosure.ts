import { NkElement } from '../../core/element';
import { animate, durations, easing, transitionsAllowed } from '../../core/motion';

/**
 * <nk-disclosure> wraps a native <details>. The behaviour (keyboard, semantics, no-JS) is the
 * browser's; this element adds smooth height/opacity transitions when allowed and opens itself
 * when selected in the theme editor.
 */
export class NkDisclosure extends NkElement {
  #details: HTMLDetailsElement | null = null;
  #openedByEditor = false;
  #animating: Animation | null = null;

  protected mount(): void {
    this.#details = this.querySelector(':scope > details');
    const summary = this.#details?.querySelector(':scope > summary');
    const content = this.#details?.querySelector<HTMLElement>('.disclosure__content');
    if (!this.#details || !summary || !content) return;

    this.on(summary, 'click', (event) => {
      if (!this.#details || this.hasAttribute('no-animation') || !transitionsAllowed() || typeof content.animate !== 'function') return;
      event.preventDefault();
      this.#animating?.cancel();

      if (this.#details.open) {
        const startHeight = content.offsetHeight;
        content.style.overflow = 'hidden';
        const anim = animate(
          content,
          [
            { height: `${startHeight}px`, opacity: 1 },
            { height: '0px', opacity: 0 },
          ],
          { duration: durations.small, easing: easing.out },
        );
        if (!anim) {
          this.#details.open = false;
          content.style.overflow = '';
          return;
        }
        this.#animating = anim;
        anim.onfinish = () => {
          if (this.#details) this.#details.open = false;
          content.style.overflow = '';
          this.#animating = null;
        };
      } else {
        this.#details.open = true;
        const targetHeight = content.offsetHeight;
        content.style.overflow = 'hidden';
        const anim = animate(
          content,
          [
            { height: '0px', opacity: 0 },
            { height: `${targetHeight}px`, opacity: 1 },
          ],
          { duration: durations.overlayIn, easing: easing.out },
        );
        if (!anim) {
          content.style.overflow = '';
          return;
        }
        this.#animating = anim;
        anim.onfinish = () => {
          content.style.overflow = '';
          this.#animating = null;
        };
      }
    });

    this.dispose(() => {
      this.#animating?.cancel(); this.#animating = null;
      content.style.overflow = '';
    });
  }

  override onEditorSelect(): void {
    this.#animating?.cancel(); this.#animating = null;
    const content = this.#details?.querySelector<HTMLElement>('.disclosure__content');
    if (content) content.style.overflow = '';
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
