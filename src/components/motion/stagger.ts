import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode } from '../../core/motion';

/**
 * <nk-stagger> — children marked [data-stagger-item] rise in sequence as each row scrolls into
 * view (GSAP ScrollTrigger.batch). Cards stay visible before/during enhancement; a missed
 * entrance cannot strand merchandise at zero opacity in a hidden tab or replaced grid.
 */
export class NkStagger extends NkElement {
  #revert: (() => void) | null = null;

  protected mount(): void {
    if (motionMode() === 'off') {
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
    this.#revert = null;
  }

  async #start(): Promise<void> {
    const connection = this.signal;
    const { gsap, ScrollTrigger, motionTempo, motionStagger } = await import('../../motion/gsap');
    if (!this.connectionIsCurrent(connection)) return;
    const items = [...this.querySelectorAll<HTMLElement>('[data-stagger-item]')];
    if (!items.length) {
      this.setAttribute('data-ready', '');
      return;
    }
    const context = gsap.context((self) => {
      // Product content must never wait for a scroll trigger to become visible. Inactive tabs
      // and replaced grids can be measured while hidden, so pre-hiding the entire list can
      // strand cards at opacity zero after a missed one-shot entrance.
      this.setAttribute('data-ready', '');
      const finish = (elements: Element[]) => {
        gsap.killTweensOf(elements);
        gsap.set(elements, { clearProps: 'transform,opacity' });
      };
      this.on(this, 'nk:stagger:finish', () => finish(items));
      // Keyboard focus always exposes a card immediately, including before its scroll entrance.
      this.on(this, 'focusin', (event) => {
        const item = (event.target as Element).closest('[data-stagger-item]');
        if (item) finish([item]);
      });
      ScrollTrigger.batch(items, {
        start: 'top 92%',
        once: true,
        interval: 0.05,
        onLeave: finish,
        onEnter: (batch) => {
          self.add(() => {
            const elements = batch as HTMLElement[];
            gsap.fromTo(elements, { y: 12 }, {
              y: 0,
              duration: 0.45 * motionTempo(),
              ease: 'expo.out',
              stagger: { each: Math.min(0.05, motionStagger()), amount: Math.min(0.18, Math.max(0, elements.length - 1) * motionStagger()) },
              overwrite: true,
              clearProps: 'transform,opacity',
            });
            // Images belong to the card hover system; reveal only the card wrapper.
          });
        },
      });
    }, this);
    this.#revert = () => context.revert();
  }
}

define('nk-stagger', NkStagger);
