import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';

/**
 * <nk-stagger> — children marked [data-stagger-item] rise in sequence as each row scrolls into
 * view (GSAP ScrollTrigger.batch). Items already in view on load animate immediately. With motion
 * on, CSS hides items before first paint (html.nk-anim) until this sets data-ready; they are
 * visible without JS, under reduced motion, and after a 3s CSS failsafe.
 */
export class NkStagger extends NkElement {
  #revert: (() => void) | null = null;

  protected mount(): void {
    if (!decorativeMotionAllowed()) {
      this.setAttribute('data-ready', '');
      return;
    }
    void this.#start().catch((error: unknown) => {
      console.error(error);
      this.setAttribute('data-ready', '');
    });
  }

  protected override unmount(): void {
    this.#revert?.();
  }

  async #start(): Promise<void> {
    const { gsap, ScrollTrigger } = await import('../../motion/gsap');
    if (!this.isConnected) return;
    const items = [...this.querySelectorAll<HTMLElement>('[data-stagger-item]')];
    if (!items.length) {
      this.setAttribute('data-ready', '');
      return;
    }
    const context = gsap.context(() => {
      gsap.set(items, { opacity: 0, y: 48 });
      this.setAttribute('data-ready', '');
      ScrollTrigger.batch(items, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 1.1,
            ease: 'expo.out',
            stagger: 0.09,
            overwrite: true,
            clearProps: 'transform,opacity',
          }),
      });
    }, this);
    this.#revert = () => context.revert();
  }
}

define('nk-stagger', NkStagger);
