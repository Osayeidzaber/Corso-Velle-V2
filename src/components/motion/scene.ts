import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode } from '../../core/motion';

/** Section-owned motion. Media and copy wrappers are distinct from hover/heading targets. */
export class NkScene extends NkElement {
  #revert: (() => void) | null = null;
  #finish: (() => void) | null = null;

  protected mount(): void {
    if (motionMode() === 'off' || ['none', 'off'].includes(this.getAttribute('preset') ?? '')) return;
    const connection = this.signal;
    this.dispose(() => { this.#revert?.(); this.#revert = null; this.#finish = null; });
    this.on(this, 'focusin', () => this.#finish?.());
    let started = false;
    let timer = 0;
    let width = innerWidth;
    let height = innerHeight;
    this.dispose(() => clearTimeout(timer));
    this.on(window, 'resize', () => {
      // Phone URL-bar height changes are not layout breakpoints and must not replay entrances.
      if (innerWidth === width && (innerWidth < 750 || innerHeight === height)) return;
      width = innerWidth;
      height = innerHeight;
      clearTimeout(timer);
      if (started) timer = window.setTimeout(() => { void this.#start(connection).catch(console.error); }, 180);
    }, { passive: true });
    // Keep distant editorial sections static until close enough to need GSAP/measurements.
    this.observeIntersection(this, (entry, observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      started = true;
      void this.#start(connection).catch(console.error);
    }, { rootMargin: '400px' });
  }

  async #start(connection: AbortSignal): Promise<void> {
    const { gsap, motionMatch, motionTempo } = await import('../../motion/gsap');
    if (!this.connectionIsCurrent(connection)) return;
    this.#revert?.();
    this.#finish = null;
    this.#revert = motionMatch(this, (level) => {
      this.#finish = null;
      const copy = this.querySelector<HTMLElement>('[data-scene-copy]');
      const media = this.querySelector<HTMLElement>('[data-scene-media]');
      const wash = this.querySelector<HTMLElement>('[data-scene-wash]');
      const hero = this.getAttribute('preset') === 'hero';
      const cinematic = level === 'full' && this.getAttribute('preset') === 'cinematic';
      const amount = this.getAttribute('intensity') === 'soft' ? 0.5 : 1;
      const direction = this.getAttribute('direction') ?? 'up';
      const travel = direction === 'none' ? {} : direction === 'left' ? { x: 24 * amount } : { y: 28 * amount };

      if (hero) {
        if (level !== 'full' || !copy) return;
        gsap.to(copy, {
          y: -24, opacity: 0.3, ease: 'none',
          scrollTrigger: { trigger: this, start: 'top top', end: 'bottom 30%', scrub: 0.25, invalidateOnRefresh: true },
        });
        return;
      }

      const targets = [media, copy].filter((el): el is HTMLElement => Boolean(el));
      if (!cinematic) {
        gsap.from(targets, {
          opacity: 0, ...travel, duration: 0.55 * motionTempo(), stagger: 0.08,
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: this, start: 'top 88%', once: true,
            onLeave: (self) => { self.animation?.progress(1); },
          },
        });
        return;
      }

      // A bounded entrance completes while the scene is still comfortably in view.
      const enter = gsap.timeline({
        scrollTrigger: { trigger: this, start: 'top 90%', end: 'top 25%', scrub: 0.25, invalidateOnRefresh: true },
      });
      if (media) enter.fromTo(media,
        { scale: 1 + 0.06 * amount, clipPath: 'inset(6% 4% 6% 4%)' },
        { scale: 1, clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out', duration: 1 }, 0);
      if (copy) enter.fromTo(copy, { opacity: 0.15, ...travel }, { opacity: 1, x: 0, y: 0, duration: 0.7, ease: 'power2.out' }, 0.2);
      if (wash && this.hasAttribute('background-transition')) enter.fromTo(wash, { opacity: 0.06 }, { opacity: 0, duration: 1 }, 0);

      // Opt-in short hold only if the entire section fits below the sticky header.
      const header = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nk-header-h')) || 0;
      const canPin = () => innerWidth >= 990 && this.clientHeight > 0 && this.clientHeight < innerHeight - header() - 24;
      const hold = gsap.timeline({ scrollTrigger: {
        trigger: this,
        start: () => `top top+=${header() + 8}`,
        end: () => `+=${Math.min(240, innerHeight * 0.3)}`,
        pin: this.hasAttribute('pin') && canPin(),
        scrub: 0.25, invalidateOnRefresh: true,
      } });
      // Independent media wrapper means this never touches carousel or product hover transforms.
      if (media && this.hasAttribute('parallax')) hold.to(media, { y: -10 * amount, ease: 'none' });
      else hold.to({}, { duration: 1 });
      // Focus must never land on faded content, even on direct keyboard navigation.
      this.#finish = () => { enter.progress(1); };
    });
  }
}

define('nk-scene', NkScene);
