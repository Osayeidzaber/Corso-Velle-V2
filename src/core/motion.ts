import { config } from './config';

/**
 * Motion policy (master-plan/12 §4). Reduced-motion preference and editor selection always win
 * over the merchant setting; purchase-path UI only ever uses the "instant" and "overlay" tokens.
 */
export const durations = {
  instant: 120,
  small: 200,
  overlayIn: 280,
  overlayOut: 200,
  reveal: 380,
  stagger: 40,
} as const;

export const easing = {
  out: 'cubic-bezier(.2,.7,.2,1)',
  in: 'cubic-bezier(.4,0,1,1)',
} as const;

const reducedQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function prefersReducedMotion(): boolean {
  return reducedQuery?.matches ?? false;
}

/** True when decorative motion (reveals, stagger, tickers) may run. */
export function decorativeMotionAllowed(): boolean {
  return config().motion === 'standard' && !prefersReducedMotion() && !window.Shopify?.designMode;
}

/** True when functional transitions (drawer slide) may use travel; otherwise use a short fade. */
export function transitionsAllowed(): boolean {
  return config().motion !== 'off' && !prefersReducedMotion();
}

let installed = false;
/** Apply changes made in OS accessibility settings without reloading the storefront. */
export function installMotionPolicy(): void {
  if (installed) return;
  installed = true;
  reducedQuery?.addEventListener('change', () => {
    document.documentElement.classList.toggle('nk-anim', decorativeMotionAllowed());
    document.dispatchEvent(new CustomEvent('nk:motion:changed'));
    for (const element of document.querySelectorAll<HTMLElement>(
      'nk-reveal, nk-text, nk-stagger, nk-parallax, nk-marquee, nk-carousel, nk-expand-media, nk-elastic-line',
    )) {
      const component = element as HTMLElement & { disconnectedCallback?: () => void; connectedCallback?: () => void };
      component.disconnectedCallback?.();
      component.connectedCallback?.();
    }
  });
}

/**
 * Web Animations wrapper returning a handle that can always be finished. Resolves immediately
 * (and applies the end state) when motion is not allowed.
 */
export function animate(
  element: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  { decorative = false } = {},
): Animation | null {
  const allowed = decorative ? decorativeMotionAllowed() : transitionsAllowed();
  if (!allowed || typeof element.animate !== 'function') return null;
  return element.animate(keyframes, { fill: 'none', ...options });
}

declare global {
  interface Window {
    Shopify?: { designMode?: boolean; routes?: { root?: string } };
  }
}
