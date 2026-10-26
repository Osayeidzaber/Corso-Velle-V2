import { t } from '../../core/config';
import { parseHTML } from '../../core/dom';
import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode } from '../../core/motion';
import { announce } from '../../services/announce';
import { cart, CartError } from '../../services/cart';
import { fetchText } from '../../services/request';
import { applyPanelUnit, panelBaseUnit, showMeasurementRow, storedUnit, storeUnit, unitFromEvent, type MeasureUnit } from '../product/measure-units';
import type { FlexCarouselEngine } from './flex-carousel';
import { readProduct, sizeChoices, type CarouselProduct, type CarouselVariant } from './product-data';

/**
 * Product rail with one highlighted product and, in shop mode, one Add to cart button for it.
 * - "liquid" effect: the infinite WebGL rail in flex-carousel.ts (straight, with its pop-up focus and
 *   caption, which carries the purchase controls); a finite scroll-snap rail only for reduced
 *   motion or when WebGL can't start. Browse-only instances add the curved lens and link out.
 * - "native" effect: the classic continuously scrolling rail with a seamless loop.
 * The centred product is the active one in every mode. Add to cart opens the size selector for
 * that product; choosing an available size adds exactly that variant. While the selector is open,
 * a size is previewed or an add is in flight, autoplay is held so the product can't change.
 */
export class NkCarousel extends NkElement {
  #viewport!: HTMLElement;
  #track!: HTMLElement;
  #native = false;
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
  #chartCache = new Map<string, Promise<HTMLElement | null>>();

  protected mount(): void {
    this.#active = -1; this.#engine = null; this.#held = false; this.#native = false;
    this.#open = null; this.#adding = null; this.#preview = null; this.#purchaseHover = false; this.#purchaseFocus = false;
    this.#chartCache.clear();
    this.#slides = [...(this.ref('track')?.children ?? [])] as HTMLElement[];
    this.#products = this.#slides.map(readProduct);
    const browseOnly = this.hasAttribute('data-browse-only');
    // Motion preference changes already restart every carousel (core/motion); only the browse
    // layout additionally switches between the lens and the native rail at the tablet breakpoint.
    if (browseOnly) {
      this.on(matchMedia('(max-width: 989px)'), 'change', () => {
        if (this.isConnected) { this.disconnectedCallback(); this.connectedCallback(); }
      });
    } else {
      this.#bindPurchase();
    }
    const simpleBrowse = browseOnly && (motionMode() !== 'full' || matchMedia('(max-width: 989px)').matches);
    if (this.dataset.effect === 'liquid' && motionMode() !== 'off' && !simpleBrowse) {
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
    this.#native = true;
    this.#snap = this.dataset.effect === 'liquid' || this.dataset.effect === 'snap';
    this.toggleAttribute('data-snap', this.#snap);
    this.#autoplay = this.hasAttribute('data-autoplay');
    // The swipe rail is finite and snaps; the classic rail loops continuously.
    this.#loop = !this.#snap && this.#autoplay && motionMode() !== 'off' && this.#slides.length > 1;
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
    if (pause) pause.hidden = this.#snap ? !this.#autoplay || motionMode() === 'off' : !this.#loop || !this.#autoplay;
    this.#updatePause();
    this.#trackActive();
    this.dispose(() => {
      cancelAnimationFrame(this.#frame); cancelAnimationFrame(this.#scrollFrame);
      window.clearTimeout(this.#resumeTimer); window.clearInterval(this.#stepTimer);
      this.#frame = 0; this.#scrollFrame = 0; this.#stepTimer = 0; this.#last = 0; this.#native = false;
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
      copy.querySelectorAll('script, template').forEach((data) => data.remove());
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
    // The native rail's timers only exist while it is mounted; the WebGL engine runs its own loop.
    if (!this.#native) return;
    const running = this.#autoplay && this.#visible && !document.hidden && !this.#hovered && !this.#focused
      && !this.#paused && !this.#holding && !this.#held && motionMode() !== 'off';
    if (this.#snap) {
      // The swipe rail advances one product at a time instead of drifting.
      if (!running || !this.hasAttribute('data-autoplay')) { window.clearInterval(this.#stepTimer); this.#stepTimer = 0; return; }
      if (!this.#stepTimer) this.#stepTimer = window.setInterval(() => this.#advance(1, 'smooth'), Math.max(1000, Math.min(8000, Number(this.dataset.interval) * 1000 || (this.hasAttribute('data-browse-only') ? 1500 : 3000))));
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

  /** The product whose size selector is open; captured when Add to cart was pressed. */
  #open: CarouselProduct | null = null;
  /** The product an add request was sent for, until Shopify answers. */
  #adding: CarouselProduct | null = null;
  /** Size whose measurements are being previewed (pointer or keyboard focus). */
  #preview: string | null = null;
  #purchaseHover = false;
  #purchaseFocus = false;
  #measureUnit: MeasureUnit | null = null;

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
    if (this.hasAttribute('data-browse-only')) return;
    // A size selector belongs to one product: moving on closes it. An add already sent still
    // completes for the product it was sent for.
    this.#closeSizes(false);
    this.#renderPurchase();
  }

  /** Autoplay may not move the highlight while the shopper is busy with the purchase controls. */
  #updateHold(): void {
    const held = Boolean(this.#open || this.#adding || this.#preview) || this.#purchaseHover || this.#purchaseFocus;
    if (this.#held === held) return;
    this.#held = held;
    this.#engine?.setHeld(held);
    this.#sync();
  }

  #renderPurchase(): void {
    const measurements = this.ref('measurements');
    if (measurements) {
      measurements.hidden = true;
      measurements.replaceChildren();
      const template = this.#slides[this.#active]?.querySelector<HTMLTemplateElement>('template[data-carousel-measurements]');
      measurements.toggleAttribute('data-product-page-chart', Boolean(template?.hasAttribute('data-product-page-chart')));
      if (template) measurements.append(template.content.cloneNode(true));
    }
    this.#preview = null;
    const status = this.ref('purchase-status');
    if (status && !this.#adding) status.textContent = '';
    const list = this.ref('sizes');
    const product = this.#products[this.#active];
    if (list) {
      // Sizes are rendered for the highlighted product up front (so the layout is stable) and
      // only become visible and focusable once Add to cart opens them.
      const choices = product && product.available && !product.sellingPlan && product.option >= 0 ? sizeChoices(product) : null;
      list.hidden = !choices;
      list.removeAttribute('data-open');
      const legend = this.ref('sizes-label');
      if (legend) legend.textContent = product?.optionName ?? '';
      const soldOut = this.dataset.soldOutLabel ?? t('product.sold_out');
      const addLabel = t('product.add_to_cart');
      list.querySelector('[data-size-options]')?.replaceChildren(...(choices?.choices ?? []).map(({ value, variant }, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'product-carousel__size';
        button.style.setProperty('--i', String(index));
        button.textContent = value;
        button.dataset.sizeValue = value;
        if (variant) {
          button.dataset.variantId = String(variant.id);
          button.setAttribute('aria-label', `${addLabel}: ${product!.title} (${value})`);
        } else {
          button.disabled = true;
          const hint = document.createElement('span');
          hint.className = 'visually-hidden';
          hint.textContent = `, ${soldOut}`;
          button.append(hint);
        }
        return button;
      }));
      const firstAvailable = this.#sizeButtons().find((size) => !size.disabled);
      this.#sizeButtons().forEach((size) => { size.tabIndex = size === firstAvailable ? 0 : -1; });
      const context = this.ref('sizes-context');
      if (context) {
        context.textContent = choices?.context.map(({ name, value }) => `${name}: ${value}`).join(' · ') ?? '';
        context.hidden = !context.textContent;
      }
    }
    this.#updateHold();
    this.#updateButton();
  }

  #sizeButtons(): HTMLButtonElement[] {
    return [...(this.ref('sizes')?.querySelectorAll<HTMLButtonElement>('.product-carousel__size') ?? [])];
  }

  #openSizes(product: CarouselProduct): void {
    const list = this.ref('sizes');
    if (!list || list.hidden) return;
    this.#open = product;
    list.setAttribute('data-open', '');
    this.#updateHold();
    this.#updateButton();
    this.#sizeButtons().find((size) => size.tabIndex === 0 && !size.disabled)?.focus({ preventScroll: true });
    void this.#loadProductChart();
  }

  #closeSizes(restoreFocus: boolean): void {
    if (!this.#open) return;
    const list = this.ref('sizes');
    const hadFocus = Boolean(list?.contains(document.activeElement));
    this.#open = null;
    list?.removeAttribute('data-open');
    this.#showMeasurements(null);
    this.#updateHold();
    this.#updateButton();
    if (restoreFocus || hadFocus) this.ref<HTMLButtonElement>('add')?.focus({ preventScroll: true });
  }

  /** Legacy charts authored in a product template cannot be read by a collection's Liquid scope.
   * Fetch the existing product panel once, when the size selector opens; never load a second
   * product controller.
   */
  async #loadProductChart(): Promise<void> {
    const region = this.ref('measurements');
    const product = this.#products[this.#active];
    if (!region?.hasAttribute('data-product-page-chart') || !product) return;
    const signal = this.signal;
    let pending = this.#chartCache.get(product.url);
    if (!pending) {
      pending = fetchText(product.url, { signal, timeoutMs: 8000 }).then((html) => {
        const panel = parseHTML(html).querySelector<HTMLElement>('[data-product-section] [data-measurement-panel]');
        // A modal opener from another page has no matching dialog in this carousel.
        panel?.querySelectorAll('[data-nk-open]').forEach((button) => button.remove());
        return panel;
      }).catch(() => null);
      this.#chartCache.set(product.url, pending);
    }
    const panel = await pending;
    if (!panel || !this.connectionIsCurrent(signal) || this.#products[this.#active] !== product) return;
    region.querySelector('[data-measurement-panel]')?.replaceWith(document.importNode(panel, true));
    region.removeAttribute('data-product-page-chart');
    this.#showMeasurements(this.#preview);
  }

  #showMeasurements(size: string | null): void {
    this.#preview = size;
    const region = this.ref('measurements');
    const panel = region?.querySelector<HTMLElement>('[data-measurement-panel]');
    if (region && panel) {
      region.hidden = !size;
      panel.hidden = !size;
      if (size) {
        showMeasurementRow(panel, size);
        applyPanelUnit(panel, this.#measureUnit ?? storedUnit() ?? panelBaseUnit(panel));
        const product = this.#products[this.#active];
        const link = region.querySelector<HTMLAnchorElement>('[data-size-details]');
        if (link && product) {
          const variant = sizeChoices(product).choices.find((choice) => choice.value === size)?.variant;
          const url = new URL(product.url, window.location.origin);
          if (variant) url.searchParams.set('variant', String(variant.id));
          link.href = url.pathname + url.search + url.hash;
        }
      }
    }
    this.#updateHold();
  }

  #updateButton(): void {
    const button = this.ref<HTMLButtonElement>('add');
    if (!button) return;
    const index = this.#active;
    const product = this.#products[index];
    const shown = this.#adding ?? product;
    const title = shown?.title ?? this.#slides[index]?.querySelector('.card__title')?.textContent?.trim() ?? '';
    const soldOut = product ? !product.available : Boolean(this.#slides[index]?.querySelector('.card--sold-out'));
    const external = !product || product.sellingPlan;
    const hasSizes = Boolean(product && !soldOut && !external && product.option >= 0);
    const open = Boolean(this.#open && this.#open === product);
    const label = this.#adding ? t('product.adding')
      : soldOut ? t('product.sold_out')
      : external ? t('product.choose_options')
      : open ? this.dataset.selectSizeLabel ?? t('product.select_size_prompt')
      : t('product.add_to_cart');
    // One request at a time: the button stays busy until Shopify confirms or rejects the add.
    button.disabled = soldOut || Boolean(this.#adding);
    button.toggleAttribute('aria-busy', Boolean(this.#adding));
    if (hasSizes) button.setAttribute('aria-expanded', String(open)); else button.removeAttribute('aria-expanded');
    button.setAttribute('aria-label', `${label}: ${title}`);
    const labelNode = button.querySelector('[data-add-label]');
    if (labelNode) labelNode.textContent = label;
    const productNode = button.querySelector('[data-add-product]');
    if (productNode) productNode.textContent = title;
    this.ref('sizes')?.setAttribute('aria-busy', String(Boolean(this.#adding)));
    this.toggleAttribute('data-active-sold-out', soldOut);
    this.toggleAttribute('data-sizes-open', open);
  }

  /** Add one variant of `product`; both are fixed before the request starts. */
  async #add(product: CarouselProduct, variant: CarouselVariant, size: string): Promise<void> {
    if (this.#adding) return;
    const signal = this.signal;
    const button = this.ref<HTMLButtonElement>('add');
    const status = this.ref('purchase-status');
    this.#adding = product;
    if (status) status.textContent = t('product.adding');
    this.#updateHold();
    this.#updateButton();
    let added = false;
    try {
      await cart.add([{ id: variant.id, quantity: Math.max(1, variant.min || 1) }], `carousel-${this.id || 'products'}`);
      added = true;
    } catch (error) {
      if (!this.connectionIsCurrent(signal)) return;
      const message = error instanceof CartError ? error.message : t('cart.error');
      if (status) status.textContent = message;
      announce.assertive(message);
    }
    if (!this.connectionIsCurrent(signal)) return;
    this.#adding = null;
    if (added) {
      if (status) status.textContent = `${t('cart.added')}: ${product.title}${size ? ` (${size})` : ''}`;
      button?.setAttribute('data-added', '');
      this.later(() => button?.removeAttribute('data-added'), 1800);
    }
    // A failed add keeps the sizes open for another try; a successful one closes them.
    if (added && this.#open === product) this.#closeSizes(false);
    this.#updateHold();
    this.#updateButton();
  }

  #bindPurchase(): void {
    const purchase = this.ref('purchase') ?? this.querySelector<HTMLElement>('.product-carousel__purchase');
    if (purchase) {
      // Native rails sit apart from their purchase panel: hovering or focusing it holds autoplay.
      this.on(purchase, 'pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        this.#purchaseHover = true; this.#updateHold();
      });
      this.on(purchase, 'pointerleave', () => { this.#purchaseHover = false; this.#updateHold(); });
      // Keyboard focus only (as in the WebGL engine): a mouse click leaves focus on the button,
      // which must not stop autoplay for good once the shopper has moved on.
      this.on(purchase, 'focusin', (event) => {
        this.#purchaseFocus = (event.target as Element).matches(':focus-visible'); this.#updateHold();
      });
      this.on(purchase, 'focusout', (event) => {
        const next = event.relatedTarget as Element | null;
        this.#purchaseFocus = Boolean(next && purchase.contains(next) && next.matches(':focus-visible')); this.#updateHold();
      });
      this.on(purchase, 'keydown', (event) => {
        if (event.key !== 'Escape' || !this.#open) return;
        event.preventDefault(); event.stopPropagation();
        this.#closeSizes(true);
      });
    }
    const sizes = this.ref('sizes');
    if (sizes) {
      const preview = (event: Event) => {
        if (event instanceof PointerEvent && event.pointerType === 'touch') return;
        const size = (event.target as Element).closest<HTMLElement>('.product-carousel__size');
        if (size && this.#open) this.#showMeasurements(size.dataset.sizeValue ?? null);
      };
      this.on(sizes, 'pointerover', preview);
      this.on(sizes, 'focusin', preview);
      this.on(sizes, 'pointerleave', () => this.#showMeasurements(null));
      this.on(sizes, 'focusout', (event) => {
        if (!sizes.contains(event.relatedTarget as Node | null)) this.#showMeasurements(null);
      });
      this.on(sizes, 'click', (event) => {
        const size = (event.target as Element).closest<HTMLButtonElement>('.product-carousel__size');
        const product = this.#open;
        if (!size || size.disabled || !product || this.#adding || product !== this.#products[this.#active]) return;
        const variant = product.variants.find((candidate) => String(candidate.id) === size.dataset.variantId);
        if (variant) void this.#add(product, variant, size.dataset.sizeValue ?? '');
      });
      this.on(sizes, 'keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const buttons = this.#sizeButtons().filter((size) => !size.disabled);
        const current = buttons.indexOf(event.target as HTMLButtonElement);
        if (current < 0) return;
        event.preventDefault();
        const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
          : (current + (backward ? buttons.length - 1 : 1)) % buttons.length;
        const next = buttons[index]!;
        buttons.forEach((size) => { size.tabIndex = size === next ? 0 : -1; });
        next.focus({ preventScroll: true });
      });
    }
    const measurements = this.ref('measurements');
    if (measurements) this.on(measurements, 'click', (event) => {
      const unit = (event.target as Element).closest<HTMLElement>('[data-measure-unit]')?.dataset.measureUnit;
      if (unit !== 'in' && unit !== 'cm') return;
      this.#measureUnit = unit;
      storeUnit(unit);
      const panel = measurements.querySelector<HTMLElement>('[data-measurement-panel]');
      if (panel) applyPanelUnit(panel, unit);
      this.emit('nk:unit:changed', { unit, source: this });
    });
    this.on(document, 'nk:unit:changed', (event) => {
      const unit = unitFromEvent(event, this);
      if (!unit) return;
      this.#measureUnit = unit;
      const panel = measurements?.querySelector<HTMLElement>('[data-measurement-panel]');
      if (panel) applyPanelUnit(panel, unit);
    });
    const button = this.ref<HTMLButtonElement>('add');
    if (!button) return;
    this.on(button, 'click', () => {
      const slide = this.#slides[this.#active];
      const product = this.#products[this.#active];
      if (!slide || button.disabled || this.#adding) return;
      // Subscriptions-only and unreadable products are chosen on their own page.
      if (!product || product.sellingPlan) {
        slide.querySelector<HTMLAnchorElement>('.card__title')?.click();
        return;
      }
      if (!product.available) return;
      // A product without a size option has exactly one thing to add.
      if (product.option < 0) {
        const only = sizeChoices(product).choices[0]?.variant;
        if (only) void this.#add(product, only, '');
        return;
      }
      if (this.#open === product) this.#closeSizes(true);
      else this.#openSizes(product);
    });
  }
}

define('nk-carousel', NkCarousel);
