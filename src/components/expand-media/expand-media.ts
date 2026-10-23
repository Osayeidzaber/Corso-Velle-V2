import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode } from '../../core/motion';

/**
 * <nk-expand-media> — campaign media that opens from an inset card to full-bleed as the page
 * scrolls past (master-plan/05 T5). Clean-room rewrite of the supplied Scroll Expand example's
 * behaviour: tall track, sticky stage, clip-path inset + media zoom-out, title fades out
 * (40–88%), scrim and overlay content fade in (from 68%), scroll hint fades (0–12%).
 *
 * Uses native scrolling only (passive listener, never preventDefault). JS writes a handful of
 * CSS variables per frame and the rAF loop stops once progress settles. Reduced motion, Motion
 * off and the theme editor render the final, static state.
 */
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const tt = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return tt * tt * (3 - 2 * tt);
};

export class NkExpandMedia extends NkElement {
  #overlay: HTMLElement | null = null;

  protected mount(): void {
    this.#overlay = this.querySelector<HTMLElement>('.expand__overlay');
    // Final frame is the safe default while the optional animation chunk loads.
    this.setAttribute('data-static', '');
    this.#apply(1);
    if (!this.hasAttribute('data-motion-disabled') && motionMode() !== 'off') {
      void this.#startScrollTrigger().catch(console.error);
    }
  }

  /** GSAP ScrollTrigger drives progress with scrubbed smoothing; opens fully at 75% of the track. */
  async #startScrollTrigger(): Promise<void> {
    const connection = this.signal;
    const { gsap, motionMatch } = await import('../../motion/gsap');
    if (!this.connectionIsCurrent(connection)) return;
    const track = this.ref('track') ?? this;
    const revert = motionMatch(this, (level) => {
      // The sticky campaign is desktop-only even when merchants request full phone effects.
      if (level !== 'full' || matchMedia('(max-width: 749px)').matches) return;
      this.removeAttribute('data-static');
      const proxy = { p: 0 };
      this.#apply(0);
      gsap.to(proxy, {
        p: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.35,
          onLeave: (self) => { self.animation?.progress(1); this.#apply(1); },
        },
        onUpdate: () => this.#apply(Math.min(1, proxy.p / 0.75)),
      });
      return () => { this.setAttribute('data-static', ''); this.#apply(1); };
    });
    this.dispose(revert);
  }

  override onEditorSelect(): void {
    this.#apply(1);
  }

  #apply(p: number): void {
    const e = smoothstep(0, 1, p);
    this.style.setProperty('--e', e.toFixed(4));
    this.style.setProperty('--title', (1 - smoothstep(0.4, 0.88, p)).toFixed(3));
    this.style.setProperty('--overlay', smoothstep(0.68, 1, p).toFixed(3));
    this.style.setProperty('--hint', (1 - smoothstep(0, 0.12, p)).toFixed(3));
    // Paint the overlay throughout its fade; hiding it until 95% made the entrance pop in.
    this.toggleAttribute('data-open', p > 0.68);
    this.#overlay ??= this.querySelector<HTMLElement>('.expand__overlay');
    if (this.#overlay) this.#overlay.inert = p < 0.9;
  }

}

define('nk-expand-media', NkExpandMedia);
