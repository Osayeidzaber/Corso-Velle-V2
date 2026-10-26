import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ allowed: true, desktop: true, enabled: true, instances: [] as any[], ticks: new Set<unknown>() }));
vi.mock('../../src/core/config', () => ({ config: () => ({ motionOptions: { smoothScroll: state.enabled } }) }));
vi.mock('../../src/core/motion', () => ({ decorativeMotionAllowed: () => state.allowed }));
vi.mock('lenis', () => ({ default: class {
  stop = vi.fn(); start = vi.fn(); destroy = vi.fn(); raf = vi.fn(); resize = vi.fn(); on = vi.fn(); off = vi.fn();
  constructor(readonly options: any) { state.instances.push(this); }
} }));
vi.mock('../../src/motion/gsap', () => ({
  gsap: { ticker: { add: (fn: unknown) => state.ticks.add(fn), remove: (fn: unknown) => state.ticks.delete(fn), lagSmoothing: vi.fn() } },
  ScrollTrigger: { update: vi.fn(), refresh: vi.fn() },
}));
import { installSmoothScroll } from '../../src/services/smooth-scroll';
afterEach(() => { window.dispatchEvent(new Event('pagehide')); vi.unstubAllGlobals(); document.documentElement.removeAttribute('data-overlay-open'); });
it('shares one ticker, keeps touch/rails native, locks dialogs and tears down for reduced motion', async () => {
  vi.stubGlobal('matchMedia', () => ({ get matches() { return state.desktop; }, addEventListener() {} }));
  installSmoothScroll();
  await vi.waitFor(() => expect(state.instances).toHaveLength(1));
  const first = state.instances[0];
  expect(state.ticks.size).toBe(1);
  expect(first.options.autoRaf).toBe(false);
  expect(first.options.syncTouch).toBe(false);
  const rail = document.createElement('div'); rail.setAttribute('data-lenis-prevent', '');
  expect(first.options.prevent(rail)).toBe(true);
  document.documentElement.setAttribute('data-overlay-open', '');
  document.dispatchEvent(new Event('nk:overlay:opened'));
  expect(first.stop).toHaveBeenCalledTimes(1);
  document.documentElement.removeAttribute('data-overlay-open');
  document.dispatchEvent(new Event('nk:overlay:closed'));
  expect(first.start).toHaveBeenCalledTimes(2);
  state.allowed = false;
  document.dispatchEvent(new Event('nk:motion:changed'));
  expect(first.destroy).toHaveBeenCalledTimes(1);
  expect(state.ticks.size).toBe(0);
  state.allowed = true;
  document.dispatchEvent(new Event('nk:motion:changed'));
  await vi.waitFor(() => expect(state.instances).toHaveLength(2));
  expect(state.ticks.size).toBe(1);
  state.enabled = false;
  document.dispatchEvent(new Event('nk:motion:changed'));
  expect(state.ticks.size).toBe(0);
} );
