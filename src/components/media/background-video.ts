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
    // Inside a parallax layer the button moved and scaled with the picture, drifting off the
    // section's corner (over its buttons, past the screen edge on phones). Pin it to the section.
    // Slideshow slides hide theirs (the slideshow's own pause covers them), so they stay put.
    const parallax = !externalId && !this.closest('[data-slide]') ? toggle.closest('[data-parallax-media]') : null;
    const host = parallax?.closest<HTMLElement>('.hero') ?? null;
    if (host) {
      host.append(toggle);
      this.dispose(() => this.append(toggle));
    }
    let requested = this.hasAttribute('autoplay') && motionMode() !== 'off';
    // Wait for the first visibility observation. Assuming true briefly starts offscreen and
    // CSS-hidden mobile/desktop alternatives, which can download and decode unused video.
    let visible = false;
    video.controls = false;
    video.muted = true;
    toggle.hidden = false;
    const label = () => {
      toggle.setAttribute('aria-label', video.paused ? toggle.dataset.playLabel ?? '' : toggle.dataset.pauseLabel ?? '');
      // The button holds a play and a pause icon (snippets/icon.liquid); base.css shows one.
      toggle.toggleAttribute('data-paused', video.paused);
    };
    // Inside a hero slideshow, only the shown slide plays, and the slideshow's pause stops it too.
    const slide = this.closest<HTMLElement>('[data-slide]');
    const slides = slide?.closest<HTMLElement>('nk-hero-slides') ?? null;
    const onStage = () => !slide || (slide.hasAttribute('data-active') && !slides?.hasAttribute('data-paused'));
    const sync = () => {
      if (requested && visible && !document.hidden && onStage()) void video.play().catch(() => { requested = false; label(); });
      else video.pause();
      label();
      // Moved out of the layer, the button no longer disappears with a CSS-hidden phone/desktop
      // alternative video, so it follows whether this video is rendered at all.
      if (host) toggle.hidden = this.getClientRects().length === 0;
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
