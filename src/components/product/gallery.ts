import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import { animate, transitionsAllowed } from '../../core/motion';
import { overlay } from '../../services/overlay';

/**
 * <nk-gallery> (master-plan/08 PR-01).
 *
 * Supports:
 * - Native horizontal scroll-snap track on mobile and stacked/editorial grid on desktop
 * - Interactive thumbnail navigation strip ([data-gallery-thumb])
 * - Keyboard ArrowLeft / ArrowRight navigation
 * - Automatic scroll/highlight when a variant with featured media is selected
 * - High-resolution lightbox zoom modal (<dialog closedby="any">) with 2x pan zoom & light-dismiss
 */
export class NkGallery extends NkElement {
  #track!: HTMLElement;
  #slides: HTMLElement[] = [];
  #thumbs: HTMLButtonElement[] = [];
  #index = 0;
  #zoomed = false;
  #animation: Animation | null = null;

  protected mount(): void {
    const track = this.ref('track');
    if (!track) return;
    this.#track = track;
    this.#slides = this.refs('slide');
    this.#thumbs = [...this.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]')];

    if (this.#slides.length > 1) {
      for (const slide of this.#slides) {
        this.observeIntersection(
          slide,
          (entry) => {
            if (entry.intersectionRatio >= 0.6) this.#setCurrent(this.#slides.indexOf(slide));
          },
          // Viewport root also handles vertical grid/stack layouts; clipping ancestors still
          // restrict horizontal slides on phones without a breakpoint-specific observer reset.
          { root: null, threshold: [0.6] },
        );
      }
    }

    this.on(this, 'click', (event) => {
      const target = event.target as Element;

      const thumb = target.closest<HTMLButtonElement>('[data-gallery-thumb]');
      if (thumb) {
        event.preventDefault();
        const idx = Number(thumb.dataset.galleryThumb);
        if (!Number.isNaN(idx)) this.go(idx, true);
        return;
      }

      const stepBtn = target.closest<HTMLButtonElement>('[data-gallery-step]');
      if (stepBtn) {
        event.preventDefault();
        this.go(this.#index + Number(stepBtn.dataset.galleryStep));
        return;
      }

      const zoomBtn = target.closest<HTMLButtonElement>('[data-gallery-zoom]');
      if (zoomBtn) {
        event.preventDefault();
        const idx = Number(zoomBtn.dataset.galleryZoom);
        this.openLightbox(Number.isNaN(idx) ? this.#index : idx);
        return;
      }

      const slideImg = target.closest<HTMLElement>('.gallery__slide[data-zoom-src] > img');
      if (slideImg) {
        const slide = slideImg.closest<HTMLElement>('.gallery__slide');
        const idx = slide ? this.#slides.indexOf(slide) : this.#index;
        this.openLightbox(idx >= 0 ? idx : this.#index);
      }
    });

    this.#setupLightbox();
    this.observeIntersection(this, (entry) => {
      if (!entry.isIntersecting) this.querySelectorAll('video').forEach((video) => video.pause());
    });
    this.on(this.#track, 'keydown', (event) => {
      if ((event.target as Element).closest('button, input, video, iframe, model-viewer')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        this.go(this.#index + (event.key === 'ArrowRight' ? 1 : -1), true);
      }
    });
    this.dispose(() => {
      this.#animation?.cancel();
      const dialog = this.ref<HTMLDialogElement>('lightbox');
      if (dialog && overlay.isOpen(dialog)) overlay.close(dialog);
      this.querySelectorAll('video').forEach((video) => video.pause());
    });

    const section = this.closest('[data-product-section]');
    if (section) {
      this.on(section, 'nk:variant:changed', (event) => {
        const state = (event as CustomEvent<{ state: string }>).detail?.state;
        if (state !== 'available' && state !== 'sold-out') return;
        const mediaId = section.querySelector<HTMLElement>('[data-region="buy"]')?.dataset.variantMediaId;
        const target = mediaId ? this.#slides.findIndex((s) => s.dataset.mediaId === mediaId) : -1;
        if (target >= 0 && target !== this.#index) this.go(target, true);
      });
    }

    const initialMediaId = this.dataset.initialMediaId;
    const initialIdx = initialMediaId ? this.#slides.findIndex((s) => s.dataset.mediaId === initialMediaId) : 0;
    this.go(initialIdx >= 0 ? initialIdx : 0);
  }

  go(index: number, scrollDesktop = false): void {
    const clamped = Math.max(0, Math.min(this.#slides.length - 1, index));
    const slide = this.#slides[clamped];
    if (!slide) return;
    const behavior: ScrollBehavior = transitionsAllowed() ? 'smooth' : 'instant';

    if (this.#track.scrollWidth > this.#track.clientWidth + 4) {
      this.#track.scrollTo({
        left: slide.offsetLeft - this.#track.offsetLeft,
        behavior,
      });
    } else if (scrollDesktop && typeof slide.scrollIntoView === 'function') {
      slide.scrollIntoView({ behavior, block: 'nearest' });
    }

    this.#animation?.cancel();
    this.#animation = animate(
      slide,
      [{ opacity: 0.72 }, { opacity: 1 }],
      { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );

    this.#setCurrent(clamped);
  }

  openLightbox(index: number): void {
    const dialog = this.ref<HTMLDialogElement>('lightbox');
    if (!dialog || !this.#slides[index]?.dataset.zoomSrc) return;
    this.#setCurrent(index);
    this.#renderLightboxSlide(this.#index);
    overlay.open(dialog, {
      trigger: this.#slides[index]?.querySelector<HTMLElement>('[data-gallery-zoom]') ?? document.activeElement as HTMLElement,
      onClose: () => {
        this.#setZoom(false);
        if (this.isConnected) this.go(this.#index);
      },
    });
  }

  closeLightbox(): void {
    const dialog = this.ref<HTMLDialogElement>('lightbox');
    if (!dialog) return;
    this.#setZoom(false);
    overlay.close(dialog);
  }

  #setupLightbox(): void {
    const dialog = this.ref<HTMLDialogElement>('lightbox');
    if (!dialog) return;

    this.on(dialog, 'click', (event) => {
      const target = event.target as Element;
      // Light-dismiss when clicking backdrop (dialog itself) or stage background
      if (target === dialog || target === this.ref('lightbox-stage') || target.hasAttribute('data-lightbox-close') || target.closest('[data-lightbox-close]')) {
        event.preventDefault();
        this.closeLightbox();
        return;
      }

      const step = target.closest<HTMLButtonElement>('[data-lightbox-step]');
      if (step) {
        event.preventDefault();
        const nextIdx = this.#nextImage(Number(step.dataset.lightboxStep));
        this.#setCurrent(nextIdx);
        this.#renderLightboxSlide(nextIdx);
        return;
      }

      const img = target.closest<HTMLElement>('[data-ref="lightbox-img"]');
      if (img) {
        this.#setZoom(!this.#zoomed, event as MouseEvent);
      }
    });

    const stage = this.ref<HTMLElement>('lightbox-stage');
    if (stage) {
      this.on(stage, 'pointermove', (event) => {
        if (!this.#zoomed) return;
        const e = event as PointerEvent;
        const rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const xPct = ((e.clientX - rect.left) / rect.width - 0.5) * -80;
        const yPct = ((e.clientY - rect.top) / rect.height - 0.5) * -80;
        stage.style.setProperty('--zoom-x', `${xPct.toFixed(1)}%`);
        stage.style.setProperty('--zoom-y', `${yPct.toFixed(1)}%`);
      });
    }

    this.on(dialog, 'keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (key === 'ArrowLeft' && this.#slides.length > 1) {
        event.preventDefault();
        const nextIdx = this.#nextImage(-1);
        this.#setCurrent(nextIdx);
        this.#renderLightboxSlide(nextIdx);
      } else if (key === 'ArrowRight' && this.#slides.length > 1) {
        event.preventDefault();
        const nextIdx = this.#nextImage(1);
        this.#setCurrent(nextIdx);
        this.#renderLightboxSlide(nextIdx);
      }
    });
  }

  #nextImage(step: number): number {
    let index = this.#index;
    for (let count = 0; count < this.#slides.length; count++) {
      index = (index + step + this.#slides.length) % this.#slides.length;
      if (this.#slides[index]?.dataset.zoomSrc) return index;
    }
    return this.#index;
  }

  #setZoom(zoomed: boolean, event?: MouseEvent): void {
    this.#zoomed = zoomed;
    const stage = this.ref<HTMLElement>('lightbox-stage');
    if (!stage) return;
    stage.toggleAttribute('data-zoomed', zoomed);
    if (!zoomed) {
      stage.style.setProperty('--zoom-x', '0%');
      stage.style.setProperty('--zoom-y', '0%');
    } else if (event) {
      const rect = stage.getBoundingClientRect();
      if (rect.width && rect.height) {
        const xPct = ((event.clientX - rect.left) / rect.width - 0.5) * -80;
        const yPct = ((event.clientY - rect.top) / rect.height - 0.5) * -80;
        stage.style.setProperty('--zoom-x', `${xPct.toFixed(1)}%`);
        stage.style.setProperty('--zoom-y', `${yPct.toFixed(1)}%`);
      }
    }
  }

  #renderLightboxSlide(index: number): void {
    const slide = this.#slides[index];
    const stage = this.ref<HTMLElement>('lightbox-stage');
    if (!slide || !stage) return;

    let img = this.ref<HTMLImageElement>('lightbox-img');
    if (!img) {
      img = document.createElement('img');
      img.className = 'gallery-lightbox__img';
      img.dataset.ref = 'lightbox-img';
      stage.append(img);
    }

    const counter = this.ref<HTMLElement>('lightbox-counter');
    this.#setZoom(false);
    const zoomSrc = slide.dataset.zoomSrc || slide.querySelector('img')?.src || '';
    const zoomAlt = slide.dataset.zoomAlt || slide.querySelector('img')?.alt || '';
    img.src = zoomSrc;
    img.alt = zoomAlt;
    if (counter) {
      counter.textContent = t('product.media_position', { index: index + 1, count: this.#slides.length });
    }

    // Preload adjacent image for instant next-slide transition
    const nextSlide = this.#slides[(index + 1) % this.#slides.length];
    if (nextSlide?.dataset.zoomSrc) {
      const preload = new Image();
      preload.src = nextSlide.dataset.zoomSrc;
    }
  }

  #setCurrent(index: number): void {
    if (index < 0 || index >= this.#slides.length) return;
    this.#index = index;
    this.#slides.forEach((slide, i) => {
      slide.toggleAttribute('data-current', i === index);
      if (i !== index) slide.querySelectorAll('video').forEach((video) => video.pause());
    });
    this.#thumbs.forEach((thumb, i) => {
      const active = i === index;
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-current', String(active));
    });
    const counter = this.ref('counter');
    if (counter) counter.textContent = t('product.media_position', { index: index + 1, count: this.#slides.length });
    const prev = this.querySelector<HTMLButtonElement>('[data-gallery-step="-1"]');
    const next = this.querySelector<HTMLButtonElement>('[data-gallery-step="1"]');
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === this.#slides.length - 1;
  }
}
