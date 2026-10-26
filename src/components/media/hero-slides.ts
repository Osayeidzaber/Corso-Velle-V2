import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode } from '../../core/motion';

/**
 * Hero media slideshow (sections/hero.liquid, Slide blocks). Slides stack in the media layer;
 * [data-active] marks the one shown. Controls live outside the parallax layer, in the hero.
 * Auto-advance follows the decorative-motion policy and pauses offscreen, in hidden tabs,
 * while hovered or focused, and when the visitor presses pause. Videos only play on the active
 * slide (background-video listens for nk:slides:change).
 */
export class NkHeroSlides extends NkElement {
  #slides: HTMLElement[] = [];
  #index = 0;
  #timer: number | undefined;
  #paused = false;
  #held = false;
  #visible = true;

  protected mount(): void {
    this.#slides = [...this.querySelectorAll<HTMLElement>(':scope > [data-slide]')];
    if (this.#slides.length < 2) return;
    const controls = this.closest('.hero')?.querySelector<HTMLElement>('[data-slides-controls]') ?? null;
    const dots = [...(controls?.querySelectorAll<HTMLButtonElement>('[data-slides-dot]') ?? [])];
    const pause = controls?.querySelector<HTMLButtonElement>('[data-slides-pause]') ?? null;
    const interval = Math.max(3, Number(this.dataset.interval) || 6) * 1000;
    const autoplay = this.hasAttribute('data-autoplay') && motionMode() !== 'off';
    this.#paused = !autoplay;
    this.toggleAttribute('data-ready', true);
    if (pause) pause.hidden = !autoplay;

    const labelPause = () => {
      if (!pause) return;
      pause.setAttribute('aria-label', (this.#paused ? pause.dataset.playLabel : pause.dataset.pauseLabel) ?? '');
      pause.setAttribute('aria-pressed', String(this.#paused));
      pause.firstElementChild!.textContent = this.#paused ? '▶' : '❚❚';
    };
    const schedule = () => {
      window.clearTimeout(this.#timer);
      this.style.setProperty('--slide-interval', `${interval}ms`);
      this.closest<HTMLElement>('.hero')?.style.setProperty('--hero-slide-interval', `${interval}ms`);
      this.toggleAttribute('data-running', !this.#paused && !this.#held && this.#visible && !document.hidden);
      if (this.hasAttribute('data-running')) this.#timer = window.setTimeout(() => this.#go(this.#index + 1, dots), interval);
    };
    this.#schedule = schedule;

    controls?.querySelector('[data-slides-prev]')?.addEventListener('click', () => this.#go(this.#index - 1, dots), { signal: this.signal });
    controls?.querySelector('[data-slides-next]')?.addEventListener('click', () => this.#go(this.#index + 1, dots), { signal: this.signal });
    dots.forEach((dot, i) => this.on(dot, 'click', () => this.#go(i, dots)));
    if (pause) this.on(pause, 'click', () => { this.#paused = !this.#paused; labelPause(); schedule(); this.#announce(); });
    const hero = this.closest<HTMLElement>('.hero');
    if (hero) {
      // Hold while the pointer is on the controls or keyboard focus is inside the hero. Not on
      // hover of the whole hero: it fills the screen, so it would never advance.
      if (controls) {
        this.on(controls, 'pointerenter', () => { this.#held = true; schedule(); });
        this.on(controls, 'pointerleave', () => { this.#held = false; schedule(); });
      }
      this.on(hero, 'focusin', (event) => {
        if (!(event.target as HTMLElement).matches(':focus-visible')) return;
        this.#held = true;
        schedule();
      });
      this.on(hero, 'focusout', (event) => {
        if (!hero.contains((event as FocusEvent).relatedTarget as Node | null)) { this.#held = false; schedule(); }
      });
      this.on(hero, 'keydown', (event) => {
        const key = (event as KeyboardEvent).key;
        if (!controls?.contains(event.target as Node)) return;
        if (key === 'ArrowRight') this.#go(this.#index + 1, dots);
        if (key === 'ArrowLeft') this.#go(this.#index - 1, dots);
      });
    }
    if (hero && controls) {
      // Measured at page top: how far the hero extends past the first screen.
      const lift = () => {
        const overflow = hero.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
        hero.style.setProperty('--hero-controls-lift', `${Math.max(0, Math.min(overflow, hero.offsetHeight / 2))}px`);
      };
      lift();
      this.observeResize(hero, lift);
      this.dispose(() => hero.style.removeProperty('--hero-controls-lift'));
    }
    this.on(document, 'visibilitychange', schedule);
    this.observeIntersection(this, (entry) => { this.#visible = entry.isIntersecting; schedule(); });
    this.dispose(() => {
      window.clearTimeout(this.#timer);
      this.removeAttribute('data-ready');
      this.removeAttribute('data-running');
    });
    labelPause();
    this.#show(0, dots);
    schedule();
  }

  #schedule: () => void = () => {};

  #go(index: number, dots: HTMLButtonElement[]): void {
    this.#show((index + this.#slides.length) % this.#slides.length, dots);
    this.#schedule();
  }

  #show(index: number, dots: HTMLButtonElement[]): void {
    this.#index = index;
    this.#slides.forEach((slide, i) => {
      slide.toggleAttribute('data-active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    dots.forEach((dot, i) => (i === index ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current')));
    this.#announce();
  }

  #announce(): void {
    this.toggleAttribute('data-paused', this.#paused);
    this.dispatchEvent(new CustomEvent('nk:slides:change', { detail: { index: this.#index } }));
  }

  override onEditorSelect(blockId?: string): void {
    const index = this.#slides.findIndex((slide) => slide.dataset.blockId === blockId);
    if (index < 0) return;
    const dots = [...(this.closest('.hero')?.querySelectorAll<HTMLButtonElement>('[data-slides-dot]') ?? [])];
    this.#paused = true;
    this.#go(index, dots);
  }
}

define('nk-hero-slides', NkHeroSlides);
