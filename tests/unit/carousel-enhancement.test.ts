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
function mount(browseOnly = false): NkElement {
  document.body.innerHTML = `<nk-carousel data-effect="liquid" ${browseOnly ? 'data-browse-only' : ''}><div data-ref="viewport"><ul data-ref="track">
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
  it('keeps browse-only phone instances native with product links and no purchase controls', () => {
    const root = mount(true);
    expect(enhance).not.toHaveBeenCalled();
    expect(root.hasAttribute('data-ready')).toBe(true);
    expect(root.querySelectorAll('a[href^="/products/"]')).toHaveLength(2);
    expect(root.querySelector('[data-ref="sizes"], [data-ref="add"]')).toBeNull();
  });
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

// --- Size selector and the single Add to cart button ---------------------------------------
import { sizeChoices, type CarouselProduct } from '../../src/components/carousel/product-data';
import type { FlexCarouselHooks } from '../../src/components/carousel/flex-carousel';

function product(id: number, overrides: Partial<CarouselProduct> = {}): CarouselProduct {
  return {
    id, title: `Product ${id}`, url: `/products/p${id}`, available: true, sellingPlan: false,
    option: 0, optionName: 'Size', values: ['S', 'M', 'L'], options: ['Size'], preferred: id * 10 + 1,
    variants: [
      { id: id * 10 + 1, available: true, options: ['S'], min: 1 },
      { id: id * 10 + 2, available: false, options: ['M'], min: 1 },
      { id: id * 10 + 3, available: true, options: ['L'], min: 2 },
    ],
    ...overrides,
  };
}

async function mountShop(products: CarouselProduct[], charts = false): Promise<{ root: NkElement; hooks: FlexCarouselHooks; setHeld: ReturnType<typeof vi.fn> }> {
  const setHeld = vi.fn();
  enhance.mockResolvedValue({ dispose: vi.fn(), setHeld });
  document.body.innerHTML = `<nk-carousel id="c" data-effect="liquid" data-select-size-label="Select a size"><div data-ref="viewport"><ul data-ref="track">
    ${products.map((data) => `<li><article class="card${data.available ? '' : ' card--sold-out'}"><a class="card__title" href="${data.url}">${data.title}</a></article>
      <script type="application/json" data-carousel-product>${JSON.stringify(data)}</script>
      ${charts ? `<template data-carousel-measurements><div data-measurement-panel data-base-unit="in" hidden>
        <template data-measurement-size-label="S">Small (S)</template>
        <span data-measurement-active-size></span><p data-measurement-empty hidden>No assigned measurements</p>
        <div data-measurement-row="S" hidden><span data-measure-value="40">40</span><span data-measure-suffix>in</span></div>
        <div data-measurement-row="L" hidden><span data-measure-value="44">44</span><span data-measure-suffix>in</span></div>
        <div data-measurement-footer><button data-measure-unit="in">in</button><button data-measure-unit="cm">cm</button></div>
      </div><a data-size-details href="${data.url}">Full details</a></template>` : ''}</li>`).join('')}
  </ul></div>
  <div class="product-carousel__purchase" data-ref="purchase">
  <button type="button" data-ref="add" disabled><span data-add-label></span><span data-add-product></span></button>
  <div data-ref="sizes" hidden><span data-ref="sizes-label"></span><div data-size-options></div><span data-ref="sizes-context" hidden></span></div>
  <div data-ref="measurements" hidden></div>
  <p data-ref="purchase-status"></p></div></nk-carousel>`;
  const root = document.querySelector<NkElement>('nk-carousel')!;
  root.disconnectedCallback(); root.connectedCallback();
  for (const observer of [...observers]) {
    if (observer.targets.has(root)) observer.callback([{ isIntersecting: true, target: root } as unknown as IntersectionObserverEntry], observer as unknown as IntersectionObserver);
  }
  await vi.waitFor(() => expect(enhance).toHaveBeenCalled());
  const hooks = enhance.mock.calls.at(-1)![2] as FlexCarouselHooks;
  await vi.waitFor(() => expect(setHeld).toHaveBeenCalled());
  hooks.onActive(0);
  return { root, hooks, setHeld };
}

const addButton = () => document.querySelector<HTMLButtonElement>('[data-ref="add"]')!;
const sizeButtons = () => [...document.querySelectorAll<HTMLButtonElement>('.product-carousel__size')];

describe('carousel size selector measurements', () => {
  afterEach(() => vi.restoreAllMocks());
  const hover = (button: HTMLButtonElement, pointerType = 'mouse') => button.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType }));

  it('previews size details while the sizes are open, converts units, and closes with the product', async () => {
    const { root, hooks, setHeld } = await mountShop([product(1), product(2)], true);
    const region = root.querySelector<HTMLElement>('[data-ref="measurements"]')!;
    hover(sizeButtons()[0]!);
    expect(region.hidden).toBe(true);
    addButton().click();
    hover(sizeButtons()[0]!);
    expect(region.hidden).toBe(false);
    expect(region.querySelector('[data-measurement-active-size]')!.textContent).toBe('Small (S)');
    expect(region.querySelector<HTMLElement>('[data-measurement-row="S"]')!.hidden).toBe(false);
    expect(region.querySelector<HTMLElement>('[data-measurement-row="L"]')!.hidden).toBe(true);
    expect(region.querySelector('a')!.getAttribute('href')).toBe('/products/p1?variant=11');
    region.querySelector<HTMLButtonElement>('[data-measure-unit="cm"]')!.click();
    expect(region.querySelector('[data-measure-value="40"]')!.textContent).toBe('101.6');
    expect(setHeld).toHaveBeenLastCalledWith(true);
    hooks.onActive(1);
    expect(region.hidden).toBe(true);
    // Focus returns to Add to cart, which holds like any keyboard focus on the purchase controls.
    addButton().blur();
    expect(setHeld).toHaveBeenLastCalledWith(false);
  });

  it('moves keyboard focus across available sizes and previews each one', async () => {
    const { root } = await mountShop([product(1), product(2)], true);
    addButton().click();
    expect(document.activeElement).toBe(sizeButtons()[0]);
    expect(sizeButtons().map(button => button.tabIndex)).toEqual([0, -1, -1]);
    sizeButtons()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(sizeButtons()[2]);
    expect(sizeButtons().map(button => button.tabIndex)).toEqual([-1, -1, 0]);
    expect(root.querySelector('[data-measurement-active-size]')!.textContent).toBe('L');
  });

  it('keeps the chart open on the way to it and falls back to the chosen size on leaving', async () => {
    const { root } = await mountShop([product(1), product(2)], true);
    const region = root.querySelector<HTMLElement>('[data-ref="measurements"]')!;
    const active = () => region.querySelector('[data-measurement-active-size]')!.textContent;
    addButton().click();
    sizeButtons()[0]!.click();
    hover(sizeButtons()[2]!);
    expect(active()).toBe('L');
    root.querySelector('[data-ref="sizes"]')!.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    expect(region.hidden).toBe(false);
    expect(active()).toBe('L');
    root.querySelector('[data-ref="purchase"]')!.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    expect(active()).toBe('Small (S)');
    sizeButtons()[0]!.click();
    root.querySelector('[data-ref="purchase"]')!.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    expect(region.hidden).toBe(true);
  });

  it('never previews on a touch hover event', async () => {
    const { root } = await mountShop([product(1), product(2)], true);
    addButton().click();
    const region = root.querySelector<HTMLElement>('[data-ref="measurements"]')!;
    hover(sizeButtons()[2]!, 'touch');
    expect(region.querySelector('[data-measurement-active-size]')!.textContent).toBe('Small (S)');
    hover(sizeButtons()[2]!);
    expect(region.querySelector('[data-measurement-active-size]')!.textContent).toBe('L');
  });

  it('shows an honest empty state when a size has no assigned row', async () => {
    const { root } = await mountShop([product(1), product(2)], true);
    root.querySelector('[data-ref="measurements"] [data-measurement-row="S"]')!.remove();
    addButton().click();
    expect(root.querySelector<HTMLElement>('[data-measurement-empty]')!.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>('[data-measurement-footer]')!.hidden).toBe(true);
  });

  it('loads a legacy product-template chart once when the sizes open, and keeps the exact row', async () => {
    const { root } = await mountShop([product(1), product(2)], true);
    const region = root.querySelector<HTMLElement>('[data-ref="measurements"]')!;
    region.setAttribute('data-product-page-chart', '');
    const fetch = vi.fn(async (_url: string) => new Response(`<section data-product-section><div data-measurement-panel data-base-unit="cm">
      <span data-measurement-active-size></span><div data-measurement-row="S"><span data-measure-value="98">98</span></div>
      <div data-measurement-row="L"><span data-measure-value="106">106</span></div><button data-nk-open="unmounted-dialog">Full guide</button>
      </div></section>`));
    vi.stubGlobal('fetch', fetch);
    hover(sizeButtons()[0]!);
    expect(fetch).not.toHaveBeenCalled();
    addButton().click();
    await vi.waitFor(() => expect(region.querySelector('[data-measure-value="98"]')).not.toBeNull());
    expect(region.querySelector<HTMLElement>('[data-measurement-row="L"]')!.hidden).toBe(true);
    expect(region.querySelector('[data-nk-open]')).toBeNull();
    hover(sizeButtons()[2]!);
    expect(region.querySelector<HTMLElement>('[data-measurement-row="L"]')!.hidden).toBe(false);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]![0]).toBe('/products/p1');
  });

  it('ignores a late template chart after the shopper changes the active product', async () => {
    const { root, hooks } = await mountShop([product(1), product(2)], true);
    root.querySelector('[data-ref="measurements"]')!.setAttribute('data-product-page-chart', '');
    let complete!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { complete = resolve; })));
    addButton().click(); hooks.onActive(1);
    complete(new Response('<section data-product-section><div data-measurement-panel><span data-wrong-product></span></div></section>'));
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(root.querySelector('[data-wrong-product]')).toBeNull();
    expect(root.querySelector<HTMLElement>('[data-ref="measurements"]')!.hidden).toBe(true);
  });

  it('disables the button and hides sizes for a sold-out product', async () => {
    const { hooks, root } = await mountShop([product(1), product(2, { available: false })]);
    hooks.onActive(1);
    expect(addButton().disabled).toBe(true);
    expect(addButton().textContent).toContain('product.sold_out');
    expect(root.querySelector<HTMLElement>('[data-ref="sizes"]')!.hidden).toBe(true);
    expect(root.hasAttribute('data-active-sold-out')).toBe(true);
  });
});

describe('size choices', () => {
  it('keeps the preferred colour and never swaps it silently', () => {
    const choices = sizeChoices(product(3, {
      options: ['Colour', 'Size'], option: 1, values: ['S', 'M'], preferred: 31,
      variants: [
        { id: 31, available: true, options: ['Black', 'S'], min: 1 },
        { id: 32, available: false, options: ['Black', 'M'], min: 1 },
        { id: 33, available: true, options: ['Cream', 'M'], min: 1 },
      ],
    }));
    expect(choices.choices.map((choice) => choice.variant?.id ?? null)).toEqual([31, null]);
    expect(choices.context).toEqual([{ name: 'Colour', value: 'Black' }]);
  });
});
