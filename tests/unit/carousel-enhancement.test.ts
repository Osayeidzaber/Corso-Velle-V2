import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config, setConfigForTests } from '../../src/core/config';
import type { NkElement } from '../../src/core/element';
import type { FlexCarouselEngine } from '../../src/components/carousel/flex-carousel';

const enhance = vi.hoisted(() => vi.fn());
vi.mock('../../src/components/carousel/flex-carousel', () => ({ createFlexCarousel: enhance }));
import '../../src/components/carousel/carousel';

const observers: IntersectionMock[] = [];
class IntersectionMock {
  targets = new Set<Element>();
  constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
  observe(target: Element): void { this.targets.add(target); }
  disconnect(): void { this.targets.clear(); }
}
function mount(): NkElement {
  document.body.innerHTML = `<nk-carousel data-effect="liquid"><div data-ref="viewport"><ul data-ref="track">
    <li><a href="/products/a">A</a></li><li><a href="/products/b">B</a></li>
  </ul></div><button data-carousel-step="1">Next</button><button data-carousel-pause hidden>Pause</button></nk-carousel>`;
  const root = document.querySelector<NkElement>('nk-carousel')!;
  // happy-dom upgrades elements during parsing; reconnect once their children exist.
  root.disconnectedCallback(); root.connectedCallback();
  for (const observer of [...observers]) {
    const entry: IntersectionObserverEntry = {
      isIntersecting: true, target: root, time: performance.now(), intersectionRatio: 1,
      rootBounds: null, boundingClientRect: root.getBoundingClientRect(), intersectionRect: root.getBoundingClientRect(),
    };
    if (observer.targets.has(root)) observer.callback([entry], observer as unknown as IntersectionObserver);
  }
  return root;
}
beforeEach(() => {
  observers.length = 0; enhance.mockReset(); setConfigForTests(null);
  vi.stubGlobal('IntersectionObserver', IntersectionMock);
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: !query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); setConfigForTests(null); });

describe('optional liquid carousel', () => {
  it('restores the product rail when the graphics renderer is unavailable', async () => {
    enhance.mockResolvedValue(null);
    const root = mount();
    await vi.waitFor(() => expect(root.hasAttribute('data-ready')).toBe(true));
    expect(root.querySelectorAll('[data-carousel-original]')).toHaveLength(2);
    expect(root.querySelector<HTMLButtonElement>('[data-carousel-pause]')!.hidden).toBe(true);
    expect(root.hasAttribute('data-effect-ready')).toBe(false);
  });

  it('disposes a renderer that finishes loading after its section was removed', async () => {
    let finish!: (engine: FlexCarouselEngine) => void;
    enhance.mockImplementation(() => new Promise<FlexCarouselEngine>((resolve) => { finish = resolve; }));
    const root = mount();
    await vi.waitFor(() => expect(enhance).toHaveBeenCalledOnce());
    const signal = enhance.mock.calls[0]![1] as AbortSignal;
    root.remove();
    expect(signal.aborted).toBe(true);
    const dispose = vi.fn(); finish({ dispose, setHeld: vi.fn() });
    await vi.waitFor(() => expect(dispose).toHaveBeenCalledOnce());
    expect(root.hasAttribute('data-ready')).toBe(false);
  });

  it('releases an installed graphics renderer when Shopify removes the section', async () => {
    const dispose = vi.fn(); enhance.mockResolvedValue({ dispose, setHeld: vi.fn() });
    const root = mount();
    await vi.waitFor(() => expect(enhance).toHaveBeenCalledOnce());
    // Allow the asynchronous result to register its cleanup before removing the section.
    await Promise.resolve();
    root.remove();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('keeps native browsing without loading graphics when decorative motion is disabled', () => {
    setConfigForTests({ ...config(), motion: 'minimal' });
    const root = mount();
    expect(root.hasAttribute('data-ready')).toBe(true);
    expect(root.querySelectorAll('[data-carousel-clone]')).toHaveLength(0);
    expect(enhance).not.toHaveBeenCalled();
  });
});
