import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { transitionsAllowed } from '../../core/motion';
import './accordion-gallery.css';

/** Liquid-first adaptation of the React Bits expanding gallery interaction. */
export class NkAccordionGallery extends NkElement {
  #panels: HTMLElement[] = [];
  #index = 0;
  #hoverTimer: number | undefined;

  #cancelHover(): void {
    window.clearTimeout(this.#hoverTimer);
    this.#hoverTimer = undefined;
  }

  protected mount(): void {
    this.#panels = this.refs('panel');
    if (!this.#panels.length) return;
    // Editor settings arrive as data attributes on the element (sections/accordion-gallery.liquid).
    const start = Number(this.dataset.startPanel ?? 1) - 1;
    this.#index = start >= 0 && start < this.#panels.length ? start : 0;
    const hoverOpens = this.dataset.hover !== 'false';
    const hoverDelay = Number(this.dataset.hoverDelay ?? 160);
    const clickThrough = this.hasAttribute('data-click-through');
    this.setAttribute('data-enhanced', '');
    // Expanding a panel is functional motion (like an accordion), so it eases even in the editor
    // and on "Minimal"; only Motion off or reduced-motion makes it snap.
    const motion = () => this.toggleAttribute('data-motion', transitionsAllowed());
    this.#select(this.#index);
    // Commit the first layout before transitions switch on, or every panel grows in from zero width.
    void this.offsetWidth;
    motion();
    this.on(document, 'nk:motion:changed', motion);
    // Images keep the open panel's width so they don't rescale while panels resize.
    const sizeImages = () => {
      const width = this.getBoundingClientRect().width;
      const gaps = Math.max(0, this.#panels.length - 1) * (parseFloat(getComputedStyle(this).columnGap) || 0);
      const grow = parseFloat(getComputedStyle(this).getPropertyValue('--gallery-grow')) || 4;
      this.style.setProperty('--gallery-image-width', `${Math.max(1, width - gaps) * grow / (this.#panels.length + grow - 1)}px`);
    };
    sizeImages();
    this.observeResize(this, sizeImages);
    this.#panels.forEach((panel, index) => {
      const button = panel.querySelector<HTMLButtonElement>('[data-gallery-toggle]');
      if (!button) return;
      // A click on the open panel's picture goes to the product; any other click opens that panel.
      this.on(button, 'click', () => {
        const link = panel.querySelector<HTMLAnchorElement>('.accordion-gallery__link');
        if (clickThrough && index === this.#index && link && !window.Shopify?.designMode) { window.location.assign(link.href); return; }
        this.#cancelHover();
        this.#select(index);
      });
      this.on(panel, 'pointerenter', (event) => {
        if (!hoverOpens || event.pointerType !== 'mouse') return;
        if (this.contains(document.activeElement) && !panel.contains(document.activeElement)) return;
        this.#cancelHover();
        this.#hoverTimer = window.setTimeout(() => this.#select(index), hoverDelay);
      });
      this.on(panel, 'pointerleave', () => this.#cancelHover());
      this.on(panel, 'focusin', (event) => {
        if ((event.target as HTMLElement).matches(':focus-visible')) this.#select(index);
      });
      this.on(button, 'keydown', (event) => {
        const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % this.#panels.length
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index - 1 + this.#panels.length) % this.#panels.length
          : event.key === 'Home' ? 0 : event.key === 'End' ? this.#panels.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        this.#select(next);
        this.#panels[next]?.querySelector<HTMLButtonElement>('[data-gallery-toggle]')?.focus();
      });
    });
    this.dispose(() => {
      this.#cancelHover();
      this.style.removeProperty('--gallery-image-width');
      this.removeAttribute('data-enhanced');
      this.removeAttribute('data-motion');
      this.#panels.forEach((panel) => {
        panel.removeAttribute('data-active');
        const details = panel.querySelector<HTMLElement>('[data-gallery-details]');
        if (details) { details.hidden = false; details.inert = false; details.removeAttribute('aria-hidden'); }
      });
    });
  }

  #select(index: number): void {
    this.#cancelHover();
    this.#index = index;
    this.#panels.forEach((panel, i) => {
      const active = i === this.#index;
      panel.toggleAttribute('data-active', active);
      panel.querySelector('[data-gallery-toggle]')?.setAttribute('aria-expanded', String(active));
      const details = panel.querySelector<HTMLElement>('[data-gallery-details]');
      if (details) {
        details.hidden = false;
        details.inert = !active;
        details.setAttribute('aria-hidden', String(!active));
      }
    });
  }

  override onEditorSelect(blockId?: string): void {
    const index = this.#panels.findIndex((panel) => panel.dataset.blockId === blockId);
    if (index >= 0) this.#select(index);
  }
}

define('nk-accordion-gallery', NkAccordionGallery);
