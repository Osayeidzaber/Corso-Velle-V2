import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';

/**
 * <nk-parallax strength="12"> — the media inside drifts slower than the page (GSAP ScrollTrigger
 * scrub). Strength is the % of the element height the media travels. The media is scaled up
 * slightly so no edges show. Off under reduced motion / Motion off / editor.
 */
export class NkParallax extends NkElement {
  #revert: (() => void) | null = null;

  protected mount(): void {
    if (!decorativeMotionAllowed()) return;
    void this.#start();
  }

  protected override unmount(): void {
    this.#revert?.();
  }

  async #start(): Promise<void> {
    const { gsap } = await import('../../motion/gsap');
    if (!this.isConnected) return;
    const media = this.querySelector<HTMLElement>('[data-parallax-media]') ?? (this.firstElementChild as HTMLElement | null);
    if (!media) return;
    const strength = Number(this.getAttribute('strength') ?? 12);
    const context = gsap.context(() => {
      gsap.set(media, { scale: 1 + strength / 100 });
      gsap.fromTo(
        media,
        { yPercent: -strength / 2 },
        {
          yPercent: strength / 2,
          ease: 'none',
          scrollTrigger: { trigger: this, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    }, this);
    this.#revert = () => context.revert();
  }
}

define('nk-parallax', NkParallax);
