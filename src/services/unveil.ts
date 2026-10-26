import { decorativeMotionAllowed, fadeOnlyMotion } from '../core/motion';

/** Section photos that unveil on scroll. Scenes and parallax move their own media and are skipped. */
const MEDIA = [
  '.collage__media',
  '.category-card__media',
  '.image-with-text__media',
  '.multicolumn__media',
  '.newsletter-banner__media',
  '.newsletter-split__media',
  '.accordion-gallery__media',
  '.team-grid__media',
].join(',');

/**
 * Under Reduce Motion the movement components (nk-reveal, nk-text, scenes) stand still, so their
 * headings and photos fade in here instead, with no travel. Scene and parallax media are
 * included: a fade does not fight their (switched-off) movement.
 */
const FADE = [MEDIA, 'nk-reveal', 'nk-text', '[data-scene-media]', '[data-parallax-media]', '.media-text__media', '.collection-banner__media'].join(',');

/** Matches the longest transition in effects.css ([data-unveil]); the attribute is then removed. */
const UNVEIL_MS = 1700;

/**
 * Photos below the first screen open from a slight crop while the picture settles from a zoom
 * as they come into view (effects.css, [data-unveil]). Driven by visibility rather than CSS scroll
 * timelines, which follow the nearest scrolling box and stay frozen inside rails and clipped
 * wrappers. Under Reduce Motion (html.nk-fade) headings and photos only fade in. Content already
 * on screen at load is never hidden; once played, the attribute is removed so each section's own
 * hover transitions apply again.
 */
export function installUnveil(): void {
  if (typeof IntersectionObserver !== 'function') return;
  const seen = new WeakSet<Element>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const media = entry.target as HTMLElement;
      observer.unobserve(media);
      media.setAttribute('data-unveil', 'in');
      window.setTimeout(() => media.removeAttribute('data-unveil'), UNVEIL_MS);
    }
  }, { rootMargin: '0px 0px -10% 0px' });

  const scan = () => {
    const fade = fadeOnlyMotion();
    if (!fade && !decorativeMotionAllowed()) return;
    for (const media of document.querySelectorAll<HTMLElement>(fade ? FADE : MEDIA)) {
      if (seen.has(media)) continue;
      seen.add(media);
      // Nested matches (a photo inside a faded heading block) fade with their parent.
      if (fade && media.parentElement?.closest('[data-unveil]')) continue;
      if (!fade && (media.closest('[data-scene-media]') || media.querySelector('[data-parallax-media], [data-scene-media]'))) continue;
      if (media.getBoundingClientRect().top < innerHeight) continue;
      media.setAttribute('data-unveil', '');
      observer.observe(media);
    }
  };
  scan();
  // Sections arrive later too (editor reloads, filtered grids, lazy sections): look once per frame.
  let frame = 0;
  new MutationObserver(() => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
}
