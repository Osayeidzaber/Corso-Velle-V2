/**
 * Shared GSAP setup. Imported only by lazily loaded components, so GSAP is fetched as its own
 * chunk and only when an animated component is on the page and motion is allowed.
 * GSAP 3.15 ("no charge" licence) includes ScrollTrigger and SplitText.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 0.9 });

// Trigger positions are measured once; anything that changes page height afterwards (tabs
// enhancing, lazy images, fonts, editor re-renders, filters) would leave them stale and the
// animations would fire late or never. Re-measure whenever the document's height changes.
let refreshTimer = 0;
let lastHeight = 0;
const scheduleRefresh = (): void => {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
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

export { gsap, ScrollTrigger, SplitText };
