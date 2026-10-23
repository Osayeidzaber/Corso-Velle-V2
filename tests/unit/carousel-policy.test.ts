import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const policy = vi.hoisted(() => ({ mode: 'full', visible: [] as IntersectionObserverCallback[] }));
vi.mock('../../src/core/motion', () => ({ motionMode: () => policy.mode }));
import '../../src/components/carousel/carousel';
beforeEach(() => {
  vi.useFakeTimers(); policy.mode = 'full'; policy.visible = [];
  vi.stubGlobal('IntersectionObserver', class { constructor(cb: IntersectionObserverCallback) { policy.visible.push(cb); } observe() {} disconnect() {} });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.unstubAllGlobals(); });
function mount(effect: string, autoplay: boolean, interval = 3) {
  const root = document.createElement('nk-carousel');
  root.dataset.effect = effect; root.dataset.interval = String(interval);
  if (autoplay) root.setAttribute('data-autoplay', '');
  root.innerHTML = '<div data-ref="viewport"><ul data-ref="track"><li>A</li><li>B</li></ul></div><button data-carousel-pause hidden>Pause</button>';
  const viewport = root.querySelector<HTMLElement>('[data-ref="viewport"]')!;
  const scroll = vi.fn(); viewport.scrollTo = scroll; viewport.scrollBy = vi.fn();
  document.body.append(root);
  policy.visible.at(-1)!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
  return { root, scroll };
}
it('uses each snap instance interval and clears timers on removal', () => {
  const first = mount('snap', true, 1.5); const second = mount('snap', true, 4);
  vi.advanceTimersByTime(1500);
  expect(first.scroll).toHaveBeenCalledTimes(1); expect(second.scroll).not.toHaveBeenCalled();
  first.root.remove(); vi.advanceTimersByTime(2500);
  expect(first.scroll).toHaveBeenCalledTimes(1); expect(second.scroll).toHaveBeenCalledTimes(1);
});
it('does not autoplay or clone the classic rail when autoplay is disabled', () => {
  const instance = mount('native', false);
  vi.advanceTimersByTime(10000);
  expect(instance.root.querySelector<HTMLButtonElement>('button')?.hidden).toBe(true);
  expect(instance.root.querySelector('[data-carousel-clone]')).toBeNull();
  expect(instance.scroll).not.toHaveBeenCalled();
});
it('phone motion off prevents snap autoplay', () => {
  policy.mode = 'off'; const instance = mount('snap', true, 1.5);
  vi.advanceTimersByTime(5000);
  expect(instance.scroll).not.toHaveBeenCalled();
  expect(instance.root.querySelector<HTMLButtonElement>('button')?.hidden).toBe(true);
});
