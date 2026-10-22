import { t } from '../../core/config';
import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';
import { announce } from '../../services/announce';
import { cart, CartError } from '../../services/cart';
import type { FlexCarouselEngine } from './flex-carousel';
import { readProduct, sizeChoices, type CarouselProduct, type CarouselVariant } from './product-data';

/**
 * Product rail with one highlighted product, a size selector for it and one Add to cart button.
 * - "liquid" effect: the infinite WebGL strip (FlexCarousel); a finite scroll-snap rail only for
 *   reduced motion or when WebGL can't start.
 * - "native" effect: the classic continuously scrolling rail with a seamless loop.
 * The centred product is the active one in every mode. Add to cart stays disabled until a size is
 * chosen, and choosing one holds autoplay so the product can't change before it is added.
 */
export class NkCarousel extends NkElement {
  #viewport!: HTMLElement;
  #track!: HTMLElement;
  #slides: HTMLElement[] = [];
  #products: Array<CarouselProduct | null> = [];
  #engine: FlexCarouselEngine | null = null;
  #active = -1;
  #start = 0;
  #period = 0;
  #frame = 0;
  #scrollFrame = 0;
  #last = 0;
  #fraction = 0;
  #visible = false;
  #hovered = false;
  #focused = false;
  #paused = false;
  #holding = false;
  #held = false;
  #resumeTimer = 0;
  #stepTimer = 0;
  #loop = false;
  #snap = false;
  #autoplay = true;

  protected mount(): void {
    this.#active = -1; this.#engine = null; this.#held = false;
    this.#slides = [...(this.ref('track')?.children ?? [])] as HTMLElement[];
    this.#products = this.#slides.map(readProduct);
    this.#bindPurchase();
    if (this.dataset.effect === 'liquid' && decorativeMotionAllowed()) {
      this.#mountFlex();
      return;
    }
    this.#mountNative();
  }

  protected override unmount(): void {
    this.#slides.forEach((slide) => { slide.removeAttribute('data-active'); slide.removeAttribute('aria-current'); });
  }

  #mountFlex(): void {
    const signal = this.signal;
    // Keep native scrolling and arrow controls usable while the strip module loads.
    const waiting = new AbortController();
    this.dispose(() => waiting.abort());
    this.addEventListener('click', (event) => {
      const button = (event.target as Element).closest<HTMLElement>('[data-carousel-step]');
      const viewport = this.ref('viewport');
      if (button && viewport) viewport.scrollBy({ left: viewport.clientWidth * Number(button.dataset.carouselStep), behavior: 'smooth' });
    }, { signal: waiting.signal });
    this.#setActive(0);
    this.observeIntersection(this, (entry, observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const fallback = () => {
        if (!this.connectionIsCurrent(signal)) return;
        waiting.abort(); this.#mountNative();
      };
      void import('./flex-carousel').then(async ({ createFlexCarousel }) => {
        if (!this.connectionIsCurrent(signal)) return;
        const engine = await createFlexCarousel(this, signal, {
          onActive: (index) => this.#setActive(index),
          onSelect: (index) => this.#slides[index]?.querySelector<HTMLAnchorElement>('.card__title')?.click(),
          onFailure: fallback,
        });
        if (!engine) { fallback(); return; }
        waiting.abort();
        if (!this.connectionIsCurrent(signal)) { engine.dispose(); return; }
        this.#engine = engine;
        engine.setHeld(this.#held);
        this.dispose(() => { engine.dispose(); this.#engine = null; });
      }).catch(fallback);
    }, { rootMargin: '400px' });
  }

  #mountNative(): void {
    const viewport = this.ref('viewport');
    const track = this.ref('track');
    if (!viewport || !track) return;
    this.#hovered = false; this.#focused = false; this.#holding = false; this.#visible = false;
    this.#viewport = viewport;
    this.#track = track;
    this.#snap = this.dataset.effect === 'liquid';
    this.toggleAttribute('data-snap', this.#snap);
    this.#autoplay = this.dataset.effect !== 'liquid' || this.hasAttribute('data-autoplay');
    // The swipe rail is finite and snaps; the classic rail loops continuously.
    this.#loop = !this.#snap && decorativeMotionAllowed() && this.#slides.length > 1;
    this.#build();
    this.setAttribute('data-ready', '');
    let width = viewport.clientWidth;
    this.observeResize(viewport, () => {
      if (width === viewport.clientWidth) return;
      width = viewport.clientWidth;
      this.#build();
    });
    this.observeIntersection(this, (entry) => { this.#visible = entry.isIntersecting; this.#sync(); });
    this.on(document, 'visibilitychange', () => this.#sync());
    this.on(viewport, 'scroll', () => {
      this.#normalize();
      if (!this.#scrollFrame) this.#scrollFrame = requestAnimationFrame(() => { this.#scrollFrame = 0; this.#trackActive(); });
    }, { passive: true });
    this.on(viewport, 'pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      this.#hovered = true; this.#sync();
    });
    this.on(viewport, 'pointerleave', () => { this.#hovered = false; this.#sync(); });
    this.on(viewport, 'pointerdown', (event) => {
      // Clone controls can be clicked but must never take focus away from the accessible originals.
      if (event.pointerType === 'mouse' && (event.target as Element).closest('[data-carousel-clone]')) event.preventDefault();
      this.#hold();
    });
    this.on(viewport, 'wheel', () => this.#hold(), { passive: true });
    this.on(viewport, 'touchmove', () => this.#hold(), { passive: true });
    this.on(viewport, 'focusin', (event) => {
      this.#focused = true; this.#sync();
      const card = (event.target as Element).closest<HTMLElement>('[data-carousel-original]');
      if (card && !this.#snap) viewport.scrollLeft = card.offsetLeft - track.offsetLeft;
    });
    this.on(viewport, 'focusout', (event) => {
      this.#focused = viewport.contains(event.relatedTarget as Node | null); this.#sync();
    });
    this.on(this, 'click', (event) => {
      const target = event.target as Element;
      const duplicate = target.closest<HTMLElement>('[data-carousel-clone]');
      const action = target.closest<HTMLElement>('a, button');
      if (duplicate && action) {
        const index = [...duplicate.querySelectorAll('a, button')].indexOf(action);
        const original = this.#slides[Number(duplicate.dataset.carouselIndex)]?.querySelectorAll<HTMLElement>('a, button')[index];
        if (original) {
          event.preventDefault(); event.stopPropagation();
          original.focus({ preventScroll: true }); original.click();
        }
        return;
      }
      const control = (event.target as Element).closest<HTMLElement>('[data-carousel-step], [data-carousel-pause]');
      if (!control) return;
      if (control.hasAttribute('data-carousel-pause')) {
        this.#paused = !this.#paused;
        this.#updatePause(); this.#sync();
      } else {
        this.#hold();
        this.#advance(Number(control.dataset.carouselStep), this.#snap ? 'smooth' : 'instant');
      }
    });
    const pause = this.querySelector<HTMLElement>('[data-carousel-pause]');
    this.querySelectorAll<HTMLButtonElement>('[data-carousel-step]').forEach((button) => button.disabled = this.#slides.length < 2);
    if (pause) pause.hidden = this.#snap ? !this.#autoplay || !decorativeMotionAllowed() : !this.#loop || !this.#autoplay;
    this.#updatePause();
    this.#trackActive();
    this.dispose(() => {
      cancelAnimationFrame(this.#frame); cancelAnimationFrame(this.#scrollFrame);
      window.clearTimeout(this.#resumeTimer); window.clearInterval(this.#stepTimer);
      this.#frame = 0; this.#scrollFrame = 0; this.#stepTimer = 0; this.#last = 0;
      this.removeAttribute('data-snap');
      track.querySelectorAll('[data-carousel-clone]').forEach((clone) => clone.remove());
      this.#slides.forEach((slide) => slide.removeAttribute('data-carousel-original'));
    });
  }

  #build(): void {
    this.#track.querySelectorAll('[data-carousel-clone]').forEach((clone) => clone.remove());
    this.#slides.forEach((slide) => slide.setAttribute('data-carousel-original', ''));
    this.#period = 0;
    if (!this.#loop || !this.#slides.length) return;
    const unit = this.#track.scrollWidth;
    if (!unit) return;
    const copies = Math.min(6, Math.max(1, Math.ceil(this.#viewport.clientWidth / unit)));
    const clone = (slide: HTMLElement, index: number): HTMLElement => {
      const copy = slide.cloneNode(true) as HTMLElement;
      copy.removeAttribute('data-carousel-original');
      copy.removeAttribute('aria-current');
      copy.setAttribute('data-carousel-clone', ''); copy.setAttribute('aria-hidden', 'true');
      copy.dataset.carouselIndex = String(index);
      copy.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      copy.querySelectorAll('script').forEach((script) => script.remove());
      copy.querySelectorAll<HTMLElement>('a, button, input, select, textarea, [tabindex]').forEach((element) => element.tabIndex = -1);
      // The still poster is sufficient in duplicate cards; avoid downloading duplicate videos.
      copy.querySelectorAll('video').forEach((video) => video.remove());
      copy.querySelectorAll('[data-video-playing]').forEach((element) => element.removeAttribute('data-video-playing'));
      return copy;
    };
    for (let i = 0; i < copies; i++) {
      this.#track.prepend(...this.#slides.map(clone));
      this.#track.append(...this.#slides.map(clone));
    }
    const original = this.#slides[0]!;
    const after = this.#slides.at(-1)!.nextElementSibling as HTMLElement;
    this.#start = original.offsetLeft - this.#track.offsetLeft;
    this.#period = after.offsetLeft - original.offsetLeft;
    this.#viewport.scrollLeft = this.#start;
  }

  #normalize(): void {
    if (!this.#loop || !this.#period || this.#focused) return;
    const current = this.#viewport.scrollLeft;
    if (current < this.#start || current >= this.#start + this.#period) {
      this.#viewport.scrollLeft = this.#start + ((current - this.#start) % this.#period + this.#period) % this.#period;
    }
  }

  /** Native rails: the card nearest the viewport centre is the highlighted product. */
  #trackActive(): void {
    const viewport = this.#viewport;
    if (!viewport?.isConnected) return;
    const centre = viewport.scrollLeft + viewport.clientWidth / 2 + this.#track.offsetLeft;
    let best: HTMLElement | null = null; let distance = Infinity;
    for (const slide of this.#track.children as HTMLCollectionOf<HTMLElement>) {
      const d = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - centre);
      if (d < distance) { distance = d; best = slide; }
    }
    if (!best) return;
    const index = best.hasAttribute('data-carousel-clone') ? Number(best.dataset.carouselIndex) : this.#slides.indexOf(best);
    if (index >= 0) this.#setActive(index);
  }

  #advance(delta: number, behavior: ScrollBehavior): void {
    const viewport = this.#viewport;
    if (this.#snap) {
      const next = this.#slides[(Math.max(0, this.#active) + delta + this.#slides.length) % this.#slides.length];
      if (next) viewport.scrollTo({ left: next.offsetLeft - this.#track.offsetLeft - (viewport.clientWidth - next.offsetWidth) / 2, behavior });
      return;
    }
    const step = this.#slides[1] ? this.#slides[1].offsetLeft - this.#slides[0]!.offsetLeft : viewport.clientWidth;
    viewport.scrollBy({ left: step * delta, behavior });
    this.#normalize();
  }

  #hold(): void {
    this.#holding = true; this.#sync(); window.clearTimeout(this.#resumeTimer);
    this.#resumeTimer = window.setTimeout(() => { this.#holding = false; this.#sync(); }, 1800);
  }

  #sync(): void {
    if (!this.#viewport) return;
    const running = this.#autoplay && this.#visible && !document.hidden && !this.#hovered && !this.#focused
      && !this.#paused && !this.#holding && !this.#held && decorativeMotionAllowed();
    if (this.#snap) {
      // The swipe rail advances one product at a time instead of drifting.
      if (!running || !this.hasAttribute('data-autoplay')) { window.clearInterval(this.#stepTimer); this.#stepTimer = 0; return; }
      if (!this.#stepTimer) this.#stepTimer = window.setInterval(() => this.#advance(1, 'smooth'), 5000);
      return;
    }
    if (!running || !this.#loop) { cancelAnimationFrame(this.#frame); this.#frame = 0; this.#last = 0; return; }
    if (this.#frame) return;
    const tick = (now: number) => {
      const elapsed = this.#last ? Math.min(50, now - this.#last) : 0;
      this.#last = now;
      this.#fraction += elapsed * Math.max(10, Math.min(100, Number(this.getAttribute('speed')) || 35)) / 1000;
      const pixels = Math.floor(this.#fraction); this.#fraction -= pixels;
      if (pixels) { this.#viewport.scrollLeft += pixels; this.#normalize(); }
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  #updatePause(): void {
    const control = this.querySelector<HTMLElement>('[data-carousel-pause]');
    control?.setAttribute('aria-pressed', String(this.#paused));
    const label = control?.querySelector('[data-carousel-pause-label]');
    if (label) label.textContent = this.#paused ? control?.dataset.playLabel ?? 'Play' : control?.dataset.pauseLabel ?? 'Pause';
  }

  // --- Highlighted product, its size selector and the purchase button --------------------------

  #selection: { product: CarouselProduct; variant: CarouselVariant; label: string } | null = null;

  #setActive(index: number): void {
    if (index === this.#active || !this.#slides[index]) return;
    this.#active = index;
    this.#slides.forEach((slide, i) => {
      slide.toggleAttribute('data-active', i === index);
      if (i === index) slide.setAttribute('aria-current', 'true'); else slide.removeAttribute('aria-current');
    });
    this.#track?.querySelectorAll<HTMLElement>('[data-carousel-clone]').forEach((clone) => {
      clone.toggleAttribute('data-active', Number(clone.dataset.carouselIndex) === index);
    });
    // A choice belongs to one product: moving on clears it (and releases the autoplay hold).
    this.#select(null);
    this.#renderSizes();
  }

  #holdAutoplay(held: boolean): void {
    if (this.#held === held) return;
    this.#held = held;
    this.#engine?.setHeld(held);
    this.#sync();
  }

  #renderSizes(): void {
    const list = this.ref('sizes');
    const product = this.#products[this.#active];
    const status = this.ref('purchase-status');
    if (status) status.textContent = '';
    if (!list) { this.#updateButton(); return; }
    const choices = product && product.available && !product.sellingPlan && product.option >= 0 ? sizeChoices(product) : null;
    list.hidden = !choices;
    const legend = this.ref('sizes-label');
    if (legend) legend.textContent = product?.optionName ?? '';
    const soldOut = this.dataset.soldOutLabel ?? t('product.sold_out');
    list.querySelector('[data-size-options]')?.replaceChildren(...(choices?.choices ?? []).map(({ value, variant }, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'product-carousel__size';
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'false');
      button.style.setProperty('--i', String(index));
      button.textContent = value;
      if (variant) button.dataset.variantId = String(variant.id);
      else {
        button.disabled = true;
        const hint = document.createElement('span');
        hint.className = 'visually-hidden';
        hint.textContent = `, ${soldOut}`;
        button.append(hint);
      }
      return button;
    }));
    const context = this.ref('sizes-context');
    if (context) {
      context.textContent = choices?.context.map(({ name, value }) => `${name}: ${value}`).join(' · ') ?? '';
      context.hidden = !context.textContent;
    }
    // A product without a size option has exactly one thing to add.
    if (product && product.available && !product.sellingPlan && product.option < 0) {
      const only = sizeChoices(product).choices[0]?.variant;
      if (only) this.#selection = { product, variant: only, label: '' };
    }
    this.#updateButton();
  }

  #select(button: HTMLButtonElement | null): void {
    const product = this.#products[this.#active];
    const variant = product?.variants.find((candidate) => String(candidate.id) === button?.dataset.variantId);
    this.ref('sizes')?.querySelectorAll<HTMLButtonElement>('.product-carousel__size').forEach((size) => {
      size.setAttribute('aria-checked', String(size === button && Boolean(variant)));
    });
    this.#selection = product && variant && button ? { product, variant, label: button.firstChild?.textContent ?? '' } : null;
    this.#holdAutoplay(Boolean(this.#selection));
    this.#updateButton();
  }

  #updateButton(): void {
    const button = this.ref<HTMLButtonElement>('add');
    if (!button) return;
    const index = this.#active;
    const product = this.#products[index];
    const title = product?.title ?? this.#slides[index]?.querySelector('.card__title')?.textContent?.trim() ?? '';
    const soldOut = product ? !product.available : Boolean(this.#slides[index]?.querySelector('.card--sold-out'));
    const external = !product || product.sellingPlan;
    const chosen = this.#selection?.product === product ? this.#selection : null;
    const label = soldOut ? t('product.sold_out')
      : external ? t('product.choose_options')
      : chosen ? t('product.add_to_cart')
      : this.dataset.selectSizeLabel ?? t('product.select_size_prompt');
    button.dataset.index = String(index);
    // No size chosen yet: the button explains what to do and cannot add anything.
    button.disabled = soldOut || (!external && !chosen) || button.hasAttribute('aria-busy');
    button.setAttribute('aria-label', `${label}: ${title}${chosen?.label ? ` (${chosen.label})` : ''}`);
    const labelNode = button.querySelector('[data-add-label]');
    if (labelNode) labelNode.textContent = label;
    const productNode = button.querySelector('[data-add-product]');
    if (productNode) productNode.textContent = chosen?.label ? `${title} · ${chosen.label}` : title;
    this.toggleAttribute('data-active-sold-out', soldOut);
    this.toggleAttribute('data-size-chosen', Boolean(chosen));
  }

  #bindPurchase(): void {
    const button = this.ref<HTMLButtonElement>('add');
    const sizes = this.ref('sizes');
    if (sizes) {
      this.on(sizes, 'click', (event) => {
        const size = (event.target as Element).closest<HTMLButtonElement>('.product-carousel__size');
        if (size && !size.disabled) this.#select(size.getAttribute('aria-checked') === 'true' ? null : size);
      });
    }
    if (!button) return;
    this.on(button, 'click', async () => {
      const slide = this.#slides[Number(button.dataset.index)];
      const product = this.#products[Number(button.dataset.index)];
      if (!slide || button.disabled) return;
      // Subscriptions-only and unreadable products are chosen on their own page.
      if (!product || product.sellingPlan) {
        slide.querySelector<HTMLAnchorElement>('.card__title')?.click();
        return;
      }
      // The variant is the one chosen for this product, captured before any request starts.
      const selection = this.#selection;
      if (!selection || selection.product !== product) return;
      const status = this.ref('purchase-status');
      button.setAttribute('aria-busy', 'true'); button.disabled = true;
      if (status) status.textContent = t('product.adding');
      try {
        await cart.add([{ id: selection.variant.id, quantity: Math.max(1, selection.variant.min || 1) }], `carousel-${this.id || 'products'}`);
        if (status) status.textContent = t('cart.added');
        button.setAttribute('data-added', '');
        this.later(() => button.removeAttribute('data-added'), 1800);
        if (this.#selection === selection && product.option >= 0) this.#select(null);
      } catch (error) {
        const message = error instanceof CartError ? error.message : t('cart.error');
        if (status) status.textContent = message;
        announce.assertive(message);
      } finally {
        button.removeAttribute('aria-busy');
        this.#updateButton();
      }
    });
  }
}

define('nk-carousel', NkCarousel);
