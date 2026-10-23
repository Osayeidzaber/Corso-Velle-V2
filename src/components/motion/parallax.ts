import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode } from '../../core/motion';

/**
 * <nk-parallax strength="12"> — the media inside drifts slower than the page (GSAP ScrollTrigger
 * scrub). Strength is the % of the element height the media travels. The media is scaled up
 * slightly so no edges show.
 *
 * Runs only at the "full" motion level: never on phones set to Simplified, with scroll-linked
 * effects off, under reduced motion, Motion off or in the editor. motionMatch re-evaluates on
 * breakpoint/preference changes and reverts every inline style it set, so a resize from desktop
 * to phone leaves the media exactly as authored.
 */
export class NkParallax extends NkElement {
  #revert: (() => void) | null = null;

  protected mount(): void {
    if (motionMode() === 'off') return;
    void this.#start().catch(console.error);
  }

  protected override unmount(): void {
    this.#revert?.();
    this.#revert = null;
  }

  async #start(): Promise<void> {
    const connection = this.signal;
    const { gsap, motionMatch } = await import('../../motion/gsap');
    if (!this.connectionIsCurrent(connection)) return;
    const media = this.querySelector<HTMLElement>('[data-parallax-media]') ?? (this.firstElementChild as HTMLElement | null);
    if (!media) return;
    const strength = Math.max(0, Math.min(30, Number(this.getAttribute('strength') ?? 12)));
    if (!strength) return;
    this.#revert = motionMatch(this, (level) => {
      if (level !== 'full') return;
      gsap.set(media, { scale: 1 + strength / 100, willChange: 'transform' });
      gsap.fromTo(
        media,
        { yPercent: -strength / 2 },
        {
          yPercent: strength / 2,
          ease: 'none',
          // A short lag smooths wheel steps into continuous drift without feeling detached.
          scrollTrigger: { trigger: this, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        },
      );
    });
  }
}

define('nk-parallax', NkParallax);
