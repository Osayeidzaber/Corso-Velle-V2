import { config } from './config';

/**
 * Motion policy. Reduced-motion preference and editor selection always win
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

/** Phone layout breakpoint shared with the CSS (< 750px). Viewport width, not device sniffing. */
export const PHONE_QUERY = '(max-width: 749px)';

const TEMPO = { relaxed: 1.25, balanced: 1, brisk: 0.78 } as const;
const STAGGER = { none: 0, short: 0.045, medium: 0.075, long: 0.12 } as const;

/** Multiplier for entrance durations (Theme settings → Motion → Animation tempo). */
export function motionTempo(): number {
  return TEMPO[config().motionOptions.tempo] ?? 1;
}

/** Seconds between staggered items (Theme settings → Motion → Stagger between items). */
export function motionStagger(): number {
  return STAGGER[config().motionOptions.stagger] ?? STAGGER.medium;
}

/**
 * How much motion this viewport gets right now:
 * - 'off'    no decorative motion (reduced motion, Motion off, editor, or phones set to Off);
 * - 'simple' entrances only, no scrub/parallax/pin (phones on Simplified, or scroll effects off);
 * - 'full'   everything, including scroll-linked scenes.
 * Data Saver also downgrades to 'simple'. Components re-evaluate through gsap.matchMedia, so the
 * mode follows rotations and resizes across the phone breakpoint.
 */
export function motionMode(isPhone = typeof matchMedia === 'function' && matchMedia(PHONE_QUERY).matches): 'off' | 'simple' | 'full' {
  if (!decorativeMotionAllowed()) return 'off';
  const { mobile, scrollEffects } = config().motionOptions;
  if (isPhone && mobile === 'off') return 'off';
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (!scrollEffects || saveData || (isPhone && mobile === 'simple')) return 'simple';
  return 'full';
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
  const update = () => {
    document.documentElement.classList.toggle('nk-anim', motionMode() !== 'off');
    document.dispatchEvent(new CustomEvent('nk:motion:changed'));
    for (const element of document.querySelectorAll<HTMLElement>(
      'nk-scene, nk-reveal, nk-text, nk-stagger, nk-parallax, nk-marquee, nk-carousel, nk-expand-media, nk-elastic-line',
    )) {
      const component = element as HTMLElement & { disconnectedCallback?: () => void; connectedCallback?: () => void };
      component.disconnectedCallback?.();
      component.connectedCallback?.();
    }
  };
  reducedQuery?.addEventListener('change', update);
  // Existing one-shot typography/grids must also restore visible state across phone policy changes.
  if (typeof matchMedia === 'function') matchMedia(PHONE_QUERY).addEventListener('change', update);
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
