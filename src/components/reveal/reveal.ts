import './reveal.css';

import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';
import { splitText, type SplitBy } from './split';

/**
 * <nk-reveal mode="cut|fade|wipe|split|fold" by="line|word|char"> — in-view entrance for campaign
 * headings and editorial blocks (master-plan/05 T1). Clean-room rewrite of the behaviour of the
 * supplied Split Text, Animated Content, foldtext and textpercharacter examples:
 *
 * - Content is visible in the HTML. JS "arms" the hidden start state only when motion is allowed,
 *   the element is below the fold, and the page is not in the theme editor.
 * - Plays once when 15% visible, then the observer disconnects.
 * - split/fold keep the original text for assistive tech (visually hidden copy; pieces aria-hidden).
 * - Editor selection or a reduced-motion preference jumps straight to the end state.
 */
export class NkReveal extends NkElement {
  #restore: (() => void) | null = null;

  protected mount(): void {
    if (!decorativeMotionAllowed()) return;
    const rect = this.getBoundingClientRect();
    const playOnLoad = this.hasAttribute('play-on-load');
    // Content already in the first viewport is not hidden — unless the section explicitly opts in
    // (hero headings), in which case it plays right away instead of waiting for scroll.
    if (rect.top < window.innerHeight * 0.9 && !playOnLoad) return;

    const mode = this.getAttribute('mode') ?? 'fade';
    if (mode === 'split' || mode === 'fold') {
      const target = this.querySelector<HTMLElement>('[data-reveal-target]') ?? this.firstElementChild;
      if (target instanceof HTMLElement) {
        const by = (this.getAttribute('by') as SplitBy | null) ?? (mode === 'fold' ? 'word' : 'line');
        this.#restore = splitText(target, by);
        if (by === 'line') {
          // Line breaks depend on width; re-split after fonts load and on resize.
          let width = this.offsetWidth;
          this.observeResize(this, () => {
            if (this.hasAttribute('data-play') || Math.abs(this.offsetWidth - width) < 2) return;
            width = this.offsetWidth;
            this.#restore?.();
            this.#restore = splitText(target, by);
          });
          void document.fonts?.ready.then(() => {
            if (this.hasAttribute('data-play') || !this.isConnected) return;
            this.#restore?.();
            this.#restore = splitText(target, by);
          });
        }
      }
    }

    this.setAttribute('data-armed', '');
    if (playOnLoad && rect.top < window.innerHeight) {
      // Two frames so the armed state paints before the transition starts.
      requestAnimationFrame(() => requestAnimationFrame(() => this.#play()));
      return;
    }
    this.observeIntersection(
      this,
      (entry, observer) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        this.#play();
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
  }

  protected override unmount(): void {
    this.#restore?.();
    this.#restore = null;
  }

  override onEditorSelect(): void {
    this.#finish();
  }

  #play(): void {
    this.setAttribute('data-play', '');
    const pieces = this.querySelectorAll('.nk-piece').length;
    const total = 600 + Math.min(pieces, 12) * 40;
    this.later(() => this.#finish(), total);
  }

  #finish(): void {
    this.removeAttribute('data-armed');
    this.setAttribute('data-done', '');
  }
}

define('nk-reveal', NkReveal);
