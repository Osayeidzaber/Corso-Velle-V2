import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import './video.css';

/**
 * <nk-video> — click-to-load player for sections/video-feature.liquid, adapted from Dawn's
 * deferred-media element (Shopify theme license). The poster is a real control: a link to the
 * YouTube/Vimeo page (works without JS) or a button for Shopify-hosted video. Clicking swaps in
 * the <template data-ref="media"> player, so no third-party frame loads before the visitor asks.
 */
export class NkVideo extends NkElement {
  protected mount(): void {
    const play = this.ref('play');
    const template = this.ref<HTMLTemplateElement>('media');
    if (!play || !template || !template.content.childElementCount) return;
    this.on(play, 'click', (event) => {
      event.preventDefault();
      const media = template.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
      if (!media) return;
      play.replaceWith(media);
      this.setAttribute('data-loaded', '');
      if (media instanceof HTMLVideoElement) void media.play().catch(() => undefined);
      media.focus();
    });
  }
}

define('nk-video', NkVideo);
