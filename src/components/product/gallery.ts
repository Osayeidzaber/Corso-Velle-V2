import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import { animate, transitionsAllowed } from '../../core/motion';
import { overlay } from '../../services/overlay';
import { ZoomPan } from './zoom-pan';

/**
 * <nk-gallery>.
 *
 * Supports:
 * - Native horizontal scroll-snap track on mobile and stacked/editorial grid on desktop
 * - Interactive thumbnail navigation strip ([data-gallery-thumb])
 * - Keyboard ArrowLeft / ArrowRight navigation
 * - Automatic scroll/highlight when a variant with featured media is selected
 * - High-resolution lightbox (<dialog closedby="any">) with pinch / wheel / double-tap zoom and
 *   inertial drag panning (zoom-pan.ts), swipe between images, light-dismiss
 * - Media progress bar ([data-ref="progress"]): follows the slider's scroll, or the page scroll
 *   through stacked photos on desktop (sticky beside them)
 */
export class NkGallery extends NkElement {
  #track!: HTMLElement;
  #slides: HTMLElement[] = [];
  #thumbs: HTMLButtonElement[] = [];
  #index = 0;
  #zoom: ZoomPan | null = null;
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
    this.#setupProgress();
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
        this.#zoom?.reset();
        if (this.isConnected) this.go(this.#index);
      },
    });
  }

  closeLightbox(): void {
    const dialog = this.ref<HTMLDialogElement>('lightbox');
    if (!dialog) return;
    this.#zoom?.reset();
    overlay.close(dialog);
  }

  #setupLightbox(): void {
    const dialog = this.ref<HTMLDialogElement>('lightbox');
    const stage = this.ref<HTMLElement>('lightbox-stage');
    if (!dialog || !stage) return;

    const step = (direction: number) => {
      if (this.#slides.length < 2) return;
      const nextIdx = this.#nextImage(direction);
      this.#setCurrent(nextIdx);
      this.#renderLightboxSlide(nextIdx);
    };
    const zoom = new ZoomPan(stage, { onSwipe: step, motion: transitionsAllowed });
    this.#zoom = zoom;
    this.dispose(() => {
      zoom.destroy();
      this.#zoom = null;
    });

    // Pointer capture retargets the click after a pan/pinch to the stage; only a press that
    // started on the backdrop itself may light-dismiss.
    let pressedBackdrop = false;
    this.on(dialog, 'pointerdown', (event) => {
      pressedBackdrop = event.target === dialog || event.target === stage;
    });

    this.on(dialog, 'click', (event) => {
      const target = event.target as Element;
      if (target.closest('[data-lightbox-close]') || ((target === dialog || target === stage) && pressedBackdrop && !zoom.zoomed)) {
        event.preventDefault();
        this.closeLightbox();
        return;
      }

      const stepButton = target.closest<HTMLButtonElement>('[data-lightbox-step]');
      if (stepButton) {
        event.preventDefault();
        step(Number(stepButton.dataset.lightboxStep));
      }
    });

    this.on(dialog, 'keydown', (event) => {
      const key = (event as KeyboardEvent).key;
      if (zoom.key(key)) {
        event.preventDefault();
      } else if (key === 'ArrowLeft' || key === 'ArrowRight') {
        event.preventDefault();
        step(key === 'ArrowRight' ? 1 : -1);
      }
    });
  }

  #setupProgress(): void {
    const progress = this.ref('progress');
    if (!progress) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const track = this.#track;
      const horizontal = track.scrollWidth > track.clientWidth + 4;
      let value: number;
      if (horizontal) {
        value = Math.abs(track.scrollLeft) / Math.max(1, track.scrollWidth - track.clientWidth);
      } else {
        // Stacked photos: how far the page has scrolled through the photo column.
        const rect = track.getBoundingClientRect();
        const span = rect.height - window.innerHeight;
        value = span > 0 ? -rect.top / span : rect.top < 0 ? 1 : 0;
      }
      progress.dataset.axis = horizontal ? 'x' : 'y';
      progress.style.setProperty('--progress', Math.min(1, Math.max(0, value)).toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    this.on(this.#track, 'scroll', schedule, { passive: true });
    this.on(window, 'scroll', schedule, { passive: true });
    this.on(window, 'resize', schedule);
    this.dispose(() => cancelAnimationFrame(frame));
    update();
  }

  #nextImage(step: number): number {
    let index = this.#index;
    for (let count = 0; count < this.#slides.length; count++) {
      index = (index + step + this.#slides.length) % this.#slides.length;
      if (this.#slides[index]?.dataset.zoomSrc) return index;
    }
    return this.#index;
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
    const zoomSrc = slide.dataset.zoomSrc || slide.querySelector('img')?.src || '';
    const zoomAlt = slide.dataset.zoomAlt || slide.querySelector('img')?.alt || '';
    img.src = zoomSrc;
    img.alt = zoomAlt;
    // Re-measure for the new image (its displayed size may differ) and start at 1×.
    this.#zoom?.attach(img);
    img.addEventListener('load', () => this.#zoom?.reset(), { once: true });
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

  /** Keep the active thumbnail visible inside its (vertical or horizontal) rail, never the page. */
  #revealThumb(thumb: HTMLElement | undefined): void {
    const rail = thumb?.parentElement;
    if (!thumb || !rail) return;
    const behavior: ScrollBehavior = transitionsAllowed() ? 'smooth' : 'instant';
    if (rail.scrollHeight > rail.clientHeight + 2) {
      const top = thumb.offsetTop - rail.offsetTop;
      if (top < rail.scrollTop || top + thumb.offsetHeight > rail.scrollTop + rail.clientHeight) {
        rail.scrollTo({ top: top - (rail.clientHeight - thumb.offsetHeight) / 2, behavior });
      }
    } else if (rail.scrollWidth > rail.clientWidth + 2) {
      const left = thumb.offsetLeft - rail.offsetLeft;
      if (left < rail.scrollLeft || left + thumb.offsetWidth > rail.scrollLeft + rail.clientWidth) {
        rail.scrollTo({ left: left - (rail.clientWidth - thumb.offsetWidth) / 2, behavior });
      }
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
    this.#revealThumb(this.#thumbs[index]);
    const progressIndex = this.ref('progress-index');
    if (progressIndex) progressIndex.textContent = String(index + 1).padStart(2, '0');
    const counter = this.ref('counter');
    if (counter) counter.textContent = t('product.media_position', { index: index + 1, count: this.#slides.length });
    const prev = this.querySelector<HTMLButtonElement>('[data-gallery-step="-1"]');
    const next = this.querySelector<HTMLButtonElement>('[data-gallery-step="1"]');
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === this.#slides.length - 1;
  }
}
