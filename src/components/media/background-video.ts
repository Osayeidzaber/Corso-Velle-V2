import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode } from '../../core/motion';

/** Muted decorative video; authored playback intent is independent per instance. */
export class NkBackgroundVideo extends NkElement {
  protected mount(): void {
    const video = this.querySelector('video');
    const externalId = this.getAttribute('toggle-id');
    const toggle = externalId
      ? this.closest('[data-background-video-owner]')?.querySelector<HTMLButtonElement>(`[id="${CSS.escape(externalId)}"]`)
      : this.ref<HTMLButtonElement>('toggle');
    if (!video || !toggle) return;
    let requested = this.hasAttribute('autoplay') && motionMode() !== 'off';
    let visible = true;
    video.controls = false;
    video.muted = true;
    toggle.hidden = false;
    const label = () => {
      toggle.setAttribute('aria-label', video.paused ? toggle.dataset.playLabel ?? '' : toggle.dataset.pauseLabel ?? '');
      toggle.textContent = video.paused ? '▶' : '❚❚';
    };
    // Inside a hero slideshow, only the shown slide plays, and the slideshow's pause stops it too.
    const slide = this.closest<HTMLElement>('[data-slide]');
    const slides = slide?.closest<HTMLElement>('nk-hero-slides') ?? null;
    const onStage = () => !slide || (slide.hasAttribute('data-active') && !slides?.hasAttribute('data-paused'));
    const sync = () => {
      if (requested && visible && !document.hidden && onStage()) void video.play().catch(() => { requested = false; label(); });
      else video.pause();
      label();
    };
    if (slides) this.on(slides, 'nk:slides:change', sync);
    this.on(toggle, 'click', () => { requested = !requested; sync(); });
    this.on(video, 'play', label);
    this.on(video, 'pause', label);
    this.on(document, 'visibilitychange', sync);
    this.on(document, 'nk:motion:changed', () => { if (motionMode() === 'off') { requested = false; sync(); } });
    this.observeIntersection(this, (entry) => { visible = entry.isIntersecting; sync(); });
    this.dispose(() => { video.pause(); video.controls = true; toggle.hidden = true; });
    sync();
  }
}
define('nk-background-video', NkBackgroundVideo);
