import { config } from '../core/config';
import { decorativeMotionAllowed } from '../core/motion';

/**
 * One optional wheel interpolator. Touch, nested rails and all purchase dialogs stay native.
 * Strength (Theme settings > Motion > Smooth scrolling strength) is the per-frame easing toward the
 * target: lower = longer glide. 'subtle' is close to the browser's own smooth wheel.
 */
const LERP = { subtle: 0.12, balanced: 0.085, silky: 0.065 } as const;

export function installSmoothScroll(): void {
  const desktop = matchMedia('(min-width: 750px) and (hover: hover) and (pointer: fine)');
  let dispose: (() => void) | null = null;
  let generation = 0;
  const update = () => {
    const token = ++generation;
    dispose?.(); dispose = null;
    if (!desktop.matches || !decorativeMotionAllowed() || config().motionOptions.smoothScroll === false) return;
    void Promise.all([import('lenis'), import('../motion/gsap')]).then(([{ default: Lenis }, { gsap, ScrollTrigger }]) => {
      if (token !== generation) return;
      const controller = new AbortController();
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nk-header-h')) || 0;
      const lenis = new Lenis({
        autoRaf: false, smoothWheel: true, syncTouch: false,
        lerp: LERP[config().motionOptions.smoothStrength ?? 'balanced'] ?? LERP.balanced,
        wheelMultiplier: 0.95,
        anchors: { offset: -header - 8 },
        prevent: node => Boolean(node.closest('dialog, [data-lenis-prevent], .product-carousel__stage, .product-carousel__viewport, .tabs__tablist')),
      });
      const tick = (seconds: number) => lenis.raf(seconds * 1000);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.add(tick);
      const syncLock = () => {
        if (document.documentElement.hasAttribute('data-overlay-open')) lenis.stop();
        else lenis.start();
      };
      document.addEventListener('nk:overlay:opened', syncLock, { signal: controller.signal });
      document.addEventListener('nk:overlay:closed', syncLock, { signal: controller.signal });
      const resize = () => { lenis.resize(); ScrollTrigger.refresh(); };
      document.addEventListener('nk:section:replaced', resize, { signal: controller.signal });
      document.addEventListener('nk:tabs:change', resize, { signal: controller.signal });
      syncLock();
      dispose = () => {
        controller.abort();
        gsap.ticker.remove(tick);
        lenis.off('scroll', ScrollTrigger.update);
        lenis.destroy();
      };
    }).catch(error => console.error('Smooth scrolling unavailable; using native scrolling.', error));
  };
  desktop.addEventListener('change', update);
  document.addEventListener('nk:motion:changed', update);
  window.addEventListener('pagehide', () => { ++generation; dispose?.(); dispose = null; });
  window.addEventListener('pageshow', event => { if (event.persisted) update(); });
  update();
}
