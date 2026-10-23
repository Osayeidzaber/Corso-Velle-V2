/**
 * Shared GSAP setup. Imported only by lazily loaded components, so GSAP is fetched as its own
 * chunk and only when an animated component is on the page and motion is allowed.
 * GSAP 3.15 ("no charge" licence) includes ScrollTrigger and SplitText.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { motionMode, PHONE_QUERY } from '../core/motion';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 0.9 });
// Phones show/hide the URL bar while scrolling, which resizes the viewport; re-measuring every
// trigger then makes scenes jump mid-scroll. Real resizes and orientation changes still refresh.
ScrollTrigger.config({ ignoreMobileResize: true });

export type MotionLevel = 'simple' | 'full';

/**
 * Runs `setup` with the motion level for the current viewport and re-runs it whenever that changes
 * (crossing the phone breakpoint, toggling reduced motion). Everything GSAP creates inside `setup`
 * is reverted automatically before a re-run and when the returned function is called, so scenes
 * never pile up duplicate ScrollTriggers. `setup` is not called while motion is off.
 */
export function motionMatch(scope: Element, setup: (level: MotionLevel) => void | (() => void)): () => void {
  const media = gsap.matchMedia(scope);
  media.add({ all: '(min-width: 0px)', phone: PHONE_QUERY, reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
    const { phone } = context.conditions as { phone: boolean; reduce: boolean };
    const mode = motionMode(phone);
    if (mode === 'off') return;
    return setup(mode);
  });
  return () => media.revert();
}

// Trigger positions are measured once; anything that changes page height afterwards (tabs
// enhancing, lazy images, fonts, editor re-renders, filters) would leave them stale and the
// animations would fire late or never. Re-measure whenever the document's height changes.
let refreshTimer = 0;
let lastHeight = 0;
const scheduleRefresh = (): void => {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    ScrollTrigger.refresh();
    // Pin spacers change the document height during refresh; do not refresh for our own writes.
    lastHeight = document.documentElement.scrollHeight;
  }, 120);
};
new ResizeObserver(() => {
  const height = document.documentElement.scrollHeight;
  if (Math.abs(height - lastHeight) < 2) return;
  lastHeight = height;
  scheduleRefresh();
}).observe(document.body);
document.addEventListener('shopify:section:load', scheduleRefresh);
document.addEventListener('shopify:section:reorder', scheduleRefresh);
document.addEventListener('shopify:section:unload', scheduleRefresh);
document.addEventListener('nk:section:replaced', scheduleRefresh);
document.addEventListener('nk:tabs:change', scheduleRefresh);
document.fonts?.ready.then(scheduleRefresh);
window.addEventListener('load', scheduleRefresh, { once: true });
window.addEventListener('pageshow', (event) => {
  if (event.persisted) scheduleRefresh();
});
// Individual lazy images can alter trigger positions without changing total page height.
document.addEventListener('load', (event) => {
  if (event.target instanceof HTMLImageElement && event.target.closest('main')) scheduleRefresh();
}, true);

export { gsap, ScrollTrigger, SplitText };
export { motionTempo, motionStagger } from '../core/motion';
