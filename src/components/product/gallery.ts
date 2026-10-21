import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import { transitionsAllowed } from '../../core/motion';

/**
 * <nk-gallery> (master-plan/08 PR-01). A native horizontal scroll-snap track, so vertical page
 * scrolling and pinch zoom stay native. Buttons and the "3 / 7" counter are enhancements; the
 * slide nearest the start of the track is "current". When the variant changes, the gallery moves
 * to that variant's featured media (data-variant-media-id on the buy region).
 * Videos pause when their slide stops being current.
 */
export class NkGallery extends NkElement {
  #track!: HTMLElement;
  #slides: HTMLElement[] = [];
  #index = 0;

  protected mount(): void {
    const track = this.ref('track');
    if (!track) return;
    this.#track = track;
    this.#slides = this.refs('slide');
    if (this.#slides.length < 2) return;

    for (const slide of this.#slides) {
      this.observeIntersection(
        slide,
        (entry) => {
          if (entry.intersectionRatio >= 0.6) this.#setCurrent(this.#slides.indexOf(slide));
        },
        { root: this.#track, threshold: [0.6] },
      );
    }
    this.on(this, 'click', (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-gallery-step]');
      if (button) this.go(this.#index + Number(button.dataset.galleryStep));
    });
    const section = this.closest('[data-product-section]');
    if (section) {
      this.on(section, 'nk:variant:changed', () => {
        const mediaId = section.querySelector<HTMLElement>('[data-region="buy"]')?.dataset.variantMediaId;
        const target = mediaId ? this.#slides.findIndex((s) => s.dataset.mediaId === mediaId) : -1;
        if (target >= 0) this.go(target);
      });
    }
    this.#setCurrent(0);
  }

  go(index: number): void {
    const clamped = Math.max(0, Math.min(this.#slides.length - 1, index));
    const slide = this.#slides[clamped];
    if (!slide) return;
    this.#track.scrollTo({ left: slide.offsetLeft - this.#track.offsetLeft, behavior: transitionsAllowed() ? 'smooth' : 'instant' });
    this.#setCurrent(clamped);
  }

  #setCurrent(index: number): void {
    if (index < 0) return;
    this.#index = index;
    this.#slides.forEach((slide, i) => {
      slide.toggleAttribute('data-current', i === index);
      if (i !== index) slide.querySelectorAll('video').forEach((video) => video.pause());
    });
    const counter = this.ref('counter');
    if (counter) counter.textContent = t('product.media_position', { index: index + 1, count: this.#slides.length });
    const prev = this.querySelector<HTMLButtonElement>('[data-gallery-step="-1"]');
    const next = this.querySelector<HTMLButtonElement>('[data-gallery-step="1"]');
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === this.#slides.length - 1;
  }
}
