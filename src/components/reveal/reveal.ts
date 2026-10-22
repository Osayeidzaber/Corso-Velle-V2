import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';

/**
 * <nk-reveal mode="cut|fade|wipe|split|fold" by="line|word|char"> — GSAP entrance for headings
 * and editorial blocks (master-plan/05 T1), now on GSAP + ScrollTrigger + SplitText as requested.
 * Covers the supplied Split Text, Animated Content, foldtext and textpercharacter examples.
 *
 * - Content is in the HTML and visible without JS; GSAP sets the start state only once motion is
 *   allowed (reduced motion / Motion off / theme editor never hide anything).
 * - SplitText keeps an accessible label on the heading (aria: 'auto') and masks lines for the
 *   rise effect; it re-splits on resize (autoSplit) and after fonts load.
 * - Plays once on scroll; `play-on-load` (hero headings) plays immediately.
 */
export class NkReveal extends NkElement {
  #context: { revert(): void } | null = null;

  protected mount(): void {
    if (!decorativeMotionAllowed()) {
      this.setAttribute('data-done', '');
      return;
    }
    void this.#start();
  }

  protected override unmount(): void {
    this.#context?.revert();
    this.#context = null;
  }

  override onEditorSelect(): void {
    this.#context?.revert();
    this.setAttribute('data-done', '');
  }

  async #start(): Promise<void> {
    const { gsap, SplitText } = await import('../../motion/gsap');
    if (!this.isConnected) return;
    await document.fonts?.ready;
    if (!this.isConnected) return;

    const mode = this.getAttribute('mode') ?? this.getAttribute('entrance') ?? 'fade';
    const by = this.getAttribute('by') ?? (mode === 'fold' ? 'word' : 'line');
    const delay = Number(this.getAttribute('delay')) || 0;
    const customDuration = Number(this.getAttribute('duration')) || 0;
    const playOnLoad = this.hasAttribute('play-on-load');
    const target = this.querySelector<HTMLElement>('[data-reveal-target]') ?? (this.firstElementChild as HTMLElement | null) ?? this;
    const scrollTrigger = playOnLoad ? undefined : { trigger: this, start: 'top 88%', once: true };

    this.#context = gsap.context(() => {
      this.setAttribute('data-armed', '');
      const done = () => {
        gsap.set(this, { clearProps: 'transform,opacity,clipPath' });
        this.removeAttribute('data-armed');
        this.setAttribute('data-done', '');
      };

      if (mode === 'split' || mode === 'fold') {
        const type = by === 'char' ? 'words,chars' : by === 'word' ? 'words' : 'lines';
        SplitText.create(target, {
          type,
          mask: by === 'line' ? 'lines' : undefined,
          aria: 'auto',
          autoSplit: by === 'line',
          onSplit: (split) => {
            const pieces = by === 'char' ? split.chars : by === 'word' ? split.words : split.lines;
            const from =
              mode === 'fold'
                ? { rotationX: -90, opacity: 0, transformOrigin: '50% 0%', transformPerspective: 700 }
                : by === 'char'
                  ? { opacity: 0, yPercent: 40 }
                  : { yPercent: 108 };
            return gsap.from(pieces, {
              ...from,
              delay,
              duration: customDuration || (mode === 'fold' ? 0.85 : 1.05),
              stagger: by === 'char' ? 0.025 : by === 'word' ? 0.065 : 0.1,
              ease: mode === 'fold' ? 'power3.out' : 'expo.out',
              scrollTrigger,
              onComplete: done,
            });
          },
        });
        return;
      }

      const presets: Record<string, gsap.TweenVars> = {
        cut: { clipPath: 'inset(0% 0% 100% 0%)' },
        wipe: { clipPath: 'inset(0% 100% 0% 0%)' },
        fade: { opacity: 0, y: 24 },
        rise: { opacity: 0, y: 28 },
      };
      const to: gsap.TweenVars = mode === 'fade' || mode === 'rise' ? { opacity: 1, y: 0 } : { clipPath: 'inset(0% 0% 0% 0%)' };
      gsap.fromTo(this, presets[mode] ?? presets.fade!, {
        ...to,
        delay,
        duration: customDuration || (mode === 'wipe' ? 1.15 : 0.95),
        ease: 'expo.out',
        scrollTrigger,
        onComplete: done,
      });
    }, this);
  }
}

define('nk-reveal', NkReveal);
