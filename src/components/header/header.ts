import { NkElement } from '../../core/element';
import { animate, durations, easing } from '../../core/motion';
import { overlay } from '../../services/overlay';

/**
 * <nk-header> (master-plan/06 N-01).
 * - Publishes its rendered height as --nk-header-h (never a hardcoded offset).
 * - data-sticky="reveal": hides after deliberate downward travel, returns on upward intent,
 *   never hides while it contains focus or an overlay/menu is open.
 * - data-overlay: transparent over an eligible first section, solid once that section is passed
 *   or any overlay opens.
 */
const HIDE_AFTER = 64;
const SHOW_AFTER = 16;

export class NkHeader extends NkElement {
  #lastY = 0;
  #travel = 0;
  #frame = 0;
  #editorSelected = false;

  protected mount(): void {
    this.observeResize(this, () => {
      document.documentElement.style.setProperty('--nk-header-h', `${Math.round(this.getBoundingClientRect().height)}px`);
    });

    this.#lastY = window.scrollY;
    this.toggleAttribute('data-scrolled', this.#lastY > 24);
    this.on(window, 'scroll', () => this.#schedule(), { passive: true });
    this.on(this, 'focusin', () => this.#setHidden(false));

    if (this.hasAttribute('data-overlay')) this.#watchOverlay();

    this.on(document, 'nk:overlay:opened', () => {
      this.dataset.forcedSolid = '';
      for (const details of this.querySelectorAll<HTMLDetailsElement>('.nav__disclosure[open]')) details.open = false;
      this.#setHidden(false);
    });
    this.on(document, 'nk:overlay:closed', () => delete this.dataset.forcedSolid);
    this.dispose(() => {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0; // a stale id would block #schedule after reconnection
    });

    this.on(document, 'nk:cart:updated', (event) => {
      const count = (event as CustomEvent<{ cart: { item_count: number } }>).detail.cart.item_count;
      this.#updateCartCount(count);
    });
    this.#enhanceDisclosureNav();
    this.#watchNavFit();
  }

  /**
   * The menu is merchant-controlled, so between the 990px breakpoint and wide screens its links can
   * outgrow their column and wrap onto a second row. When they would, the header keeps the phone
   * menu button instead (data-nav-compact). The stacked "two-row" layout wraps by design.
   */
  #watchNavFit(): void {
    const header = this.querySelector<HTMLElement>('.header');
    const list = this.querySelector<HTMLElement>('.header__nav .nav');
    if (!header || !list || header.classList.contains('header--two-row')) return;
    const desktop = matchMedia('(min-width: 990px)');
    let width = 0;
    const fit = (force = false): void => {
      const next = header.clientWidth;
      if (!force && next === width) return;
      width = next;
      if (!desktop.matches) {
        delete this.dataset.navCompact;
        return;
      }
      delete this.dataset.navCompact;
      const items = list.children;
      const first = items[0] as HTMLElement | undefined;
      const last = items[items.length - 1] as HTMLElement | undefined;
      const wraps = !!first && !!last && last.offsetTop > first.offsetTop + 4;
      if (wraps) this.dataset.navCompact = '';
    };
    this.observeResize(header, () => fit());
    this.on(desktop, 'change', () => fit(true));
    void document.fonts?.ready.then(() => {
      if (this.isConnected) fit(true);
    });
  }

  /** Floating panels are centred under their item; shift them back inside the page gutters. */
  #keepInViewport(panel: HTMLElement | null): void {
    if (!panel) return;
    panel.style.removeProperty('--nk-panel-shift');
    const rect = panel.getBoundingClientRect();
    const gutter = 16;
    const right = document.documentElement.clientWidth - gutter;
    let shift = 0;
    if (rect.left < gutter) shift = gutter - rect.left;
    else if (rect.right > right) shift = right - rect.right;
    if (shift) panel.style.setProperty('--nk-panel-shift', `${Math.round(shift)}px`);
  }

  /** Floating panel style: the newly opened panel grows from where the previous one was (FLIP). */
  #morph(panel: HTMLElement | null, from: DOMRect): void {
    if (!panel) return;
    const to = panel.getBoundingClientRect();
    if (!to.width || !to.height) return;
    animate(
      panel,
      [
        {
          transformOrigin: 'top left',
          transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
        },
        { transformOrigin: 'top left', transform: 'none' },
      ],
      { duration: durations.overlayOut + 40, easing: easing.out },
    );
  }

  #updateCartCount(count: number): void {
    const bubble = this.querySelector<HTMLElement>('[data-cart-count]');
    if (bubble) {
      bubble.textContent = String(count);
      bubble.hidden = count === 0;
    }
    const link = this.querySelector<HTMLElement>('[data-cart-count-label]');
    const template = link?.dataset.cartCountLabel;
    if (link && template) link.setAttribute('aria-label', template.replace('[count]', String(count)));
  }

  /**
   * Desktop menu panels are native <details> (work without JS). Enhancements: one open at a time,
   * Escape closes and returns focus to the summary, clicking outside closes.
   */
  #enhanceDisclosureNav(): void {
    const panels = [...this.querySelectorAll<HTMLDetailsElement>('.nav__disclosure')];
    if (!panels.length) return;
    const floating = this.querySelector('.header--panel-floating') !== null;
    for (const details of panels) {
      this.on(details, 'toggle', () => {
        if (!details.open) return;
        const previous = panels.find((other) => other !== details && other.open);
        const fromRect = previous?.querySelector('.nav__panel')?.getBoundingClientRect();
        for (const other of panels) if (other !== details) other.open = false;
        this.#setHidden(false);
        const panel = details.querySelector<HTMLElement>('.nav__panel');
        if (floating) this.#keepInViewport(panel);
        if (floating && fromRect) this.#morph(panel, fromRect);
      });
    }
    // Hover intent opens panels for a mouse (click/keyboard always work). Touch and pen pointers on
    // hybrid devices are ignored here: their tap already toggles the native <details>, and a
    // following pointerleave would otherwise close the panel they just opened.
    if (this.dataset.navTrigger !== 'click' && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      for (const details of panels) {
        const item = details.closest('.nav__item') ?? details;
        const summary = details.querySelector('summary');
        let timer = 0;
        let openedByHover = false;
        this.on(item, 'pointerenter', (event) => {
          if (event.pointerType !== 'mouse') return;
          window.clearTimeout(timer);
          if (details.open) return;
          timer = window.setTimeout(() => {
            openedByHover = true;
            details.open = true;
          }, 150);
        });
        this.on(item, 'pointerleave', (event) => {
          if (event.pointerType !== 'mouse') return;
          window.clearTimeout(timer);
          timer = window.setTimeout(() => (details.open = false), 250);
        });
        // Clicking the chevron of a panel that hover has just opened would natively close it again;
        // treat that click as "keep it open" instead.
        if (summary) {
          this.on(summary, 'click', (event) => {
            window.clearTimeout(timer);
            if (openedByHover && details.open && (event as MouseEvent).detail > 0) event.preventDefault();
            openedByHover = false;
          });
        }
        this.on(details, 'toggle', () => {
          if (!details.open) openedByHover = false;
        });
        this.dispose(() => window.clearTimeout(timer));
      }
    }
    this.on(this, 'keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = panels.find((details) => details.open);
      if (!open) return;
      open.open = false;
      open.querySelector('summary')?.focus();
    });
    this.on(document, 'click', (event) => {
      if (!this.contains(event.target as Node)) for (const details of panels) details.open = false;
    });
    this.on(this, 'focusout', (event) => {
      if (event.relatedTarget && !this.contains(event.relatedTarget as Node)) {
        for (const details of panels) details.open = false;
      }
    });
  }

  override onEditorSelect(): void {
    this.#editorSelected = true;
    this.#setHidden(false);
  }

  override onEditorDeselect(): void { this.#editorSelected = false; }

  #schedule(): void {
    if (this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#update();
    });
  }

  #update(): void {
    const y = Math.max(0, window.scrollY);
    this.toggleAttribute('data-scrolled', y > 24);
    if (this.dataset.sticky !== 'reveal') return;

    const delta = y - this.#lastY;
    this.#lastY = y;
    // Accumulate travel in one direction; a direction change resets it (hysteresis).
    this.#travel = Math.sign(delta) === Math.sign(this.#travel) ? this.#travel + delta : delta;

    const height = this.offsetHeight;
    const locked =
      this.#editorSelected ||
      this.matches(':focus-within') ||
      overlay.current !== null ||
      this.querySelector('details[open], nk-search-pill[data-open]') !== null;

    if (y <= height * 2 || locked) {
      this.#setHidden(false);
    } else if (this.#travel > HIDE_AFTER) {
      this.#setHidden(true);
    } else if (this.#travel < -SHOW_AFTER) {
      this.#setHidden(false);
    }
  }

  #setHidden(hidden: boolean): void {
    if (hidden) this.dataset.hidden = '';
    else delete this.dataset.hidden;
  }

  #watchOverlay(): void {
    const first = document.querySelector('main > .shopify-section');
    if (!first?.querySelector('[data-overlay-eligible]')) {
      this.removeAttribute('data-overlay');
      return;
    }
    this.observeIntersection(
      first,
      (entry) => {
        if (entry.isIntersecting) this.dataset.surface = 'overlay';
        else this.dataset.surface = 'solid';
      },
      { rootMargin: `-${this.offsetHeight}px 0px 0px 0px` },
    );
  }
}
