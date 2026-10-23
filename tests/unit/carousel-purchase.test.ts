import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigForTests } from '../../src/core/config';
import type { NkElement } from '../../src/core/element';
import type { FlexCarouselHooks } from '../../src/components/carousel/flex-carousel';
import { sizeChoices, type CarouselProduct } from '../../src/components/carousel/product-data';
import { cart, CartError, type CartResult } from '../../src/services/cart';

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

function slide(data: CarouselProduct): string {
  return `<li class="product-carousel__slide"><article class="card${data.available ? '' : ' card--sold-out'}">
    <div class="card__meta"><a class="card__title" href="${data.url}">${data.title}</a></div></article>
    <script type="application/json" data-carousel-product>${JSON.stringify(data)}</script></li>`;
}

const engine = { dispose: vi.fn(), setHeld: vi.fn() };
let hooks: FlexCarouselHooks;

/** Mount a shop-mode carousel on a stand-in engine; `hooks.onActive` moves the highlight like autoplay or a drag. */
async function mount(products: CarouselProduct[]): Promise<NkElement> {
  document.body.innerHTML = `<nk-carousel id="c" data-effect="liquid" data-autoplay data-select-size-label="Select a size">
    <div data-ref="viewport"><ul data-ref="track">${products.map(slide).join('')}</ul></div>
    <div class="product-carousel__purchase" data-ref="purchase">
      <button type="button" data-ref="add" aria-expanded="false" disabled><span data-add-label></span><span data-add-product></span></button>
      <div data-ref="sizes" hidden><span data-ref="sizes-label"></span><div data-size-options></div><span data-ref="sizes-context" hidden></span></div>
      <div data-ref="measurements" hidden></div>
      <p data-ref="purchase-status"></p>
    </div></nk-carousel>`;
  const root = document.querySelector<NkElement>('nk-carousel')!;
  root.disconnectedCallback(); root.connectedCallback();
  for (const observer of [...observers]) {
    if (observer.targets.has(root)) observer.callback([{ isIntersecting: true, target: root } as unknown as IntersectionObserverEntry], observer as unknown as IntersectionObserver);
  }
  await vi.waitFor(() => expect(engine.setHeld).toHaveBeenCalled());
  hooks = enhance.mock.calls.at(-1)![2] as FlexCarouselHooks;
  hooks.onActive(0);
  return root;
}

const addButton = () => document.querySelector<HTMLButtonElement>('[data-ref="add"]')!;
const sizeList = () => document.querySelector<HTMLElement>('[data-ref="sizes"]')!;
const sizes = () => [...document.querySelectorAll<HTMLButtonElement>('.product-carousel__size')];
const status = () => document.querySelector('[data-ref="purchase-status"]')!.textContent;
const ok = { cart: { items: [], item_count: 1 }, sections: {}, reconciled: false } as unknown as CartResult;

beforeEach(() => {
  setConfigForTests(null); observers.length = 0;
  enhance.mockReset(); enhance.mockResolvedValue(engine);
  engine.setHeld.mockClear(); engine.dispose.mockClear();
  vi.stubGlobal('IntersectionObserver', IntersectionMock);
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: !query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); vi.unstubAllGlobals(); });

describe('carousel shop mode', () => {
  it('names the highlighted product and is disabled for a sold-out one', async () => {
    await mount([product(1), product(2, { available: false })]);
    expect(addButton().disabled).toBe(false);
    expect(addButton().getAttribute('aria-label')).toBe('product.add_to_cart: Product 1');
    hooks.onActive(1);
    expect(addButton().disabled).toBe(true);
    expect(addButton().getAttribute('aria-label')).toContain('Product 2');
    expect(document.querySelector('nk-carousel')!.hasAttribute('data-active-sold-out')).toBe(true);
  });

  it('opens the size selector instead of adding and holds autoplay', async () => {
    const add = vi.spyOn(cart, 'add');
    await mount([product(1), product(2)]);
    expect(sizeList().hasAttribute('data-open')).toBe(false);
    addButton().click();
    expect(add).not.toHaveBeenCalled();
    expect(sizeList().hasAttribute('data-open')).toBe(true);
    expect(addButton().getAttribute('aria-expanded')).toBe('true');
    expect(engine.setHeld).toHaveBeenLastCalledWith(true);
    expect(sizes().map((button) => button.disabled)).toEqual([false, true, false]);
    expect(document.activeElement).toBe(sizes()[0]);
    addButton().click();
    expect(sizeList().hasAttribute('data-open')).toBe(false);
    // Keyboard focus on the purchase controls still holds (happy-dom treats focus as focus-visible).
    expect(engine.setHeld).toHaveBeenLastCalledWith(true);
    addButton().blur();
    expect(engine.setHeld).toHaveBeenLastCalledWith(false);
  });

  it('adds the chosen size of the highlighted product with its minimum quantity, once', async () => {
    let finish!: (result: CartResult) => void;
    const add = vi.spyOn(cart, 'add').mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await mount([product(1), product(2)]);
    hooks.onActive(1);
    addButton().click();
    sizes()[2]!.click();
    sizes()[2]!.click();
    addButton().click();
    expect(add).toHaveBeenCalledOnce();
    expect(add.mock.calls[0]![0]).toEqual([{ id: 23, quantity: 2 }]);
    expect(addButton().disabled).toBe(true);
    expect(engine.setHeld).toHaveBeenLastCalledWith(true);
    finish(ok);
    await vi.waitFor(() => expect(status()).toBe('cart.added: Product 2 (L)'));
    expect(sizeList().hasAttribute('data-open')).toBe(false);
    expect(addButton().disabled).toBe(false);
    expect(document.activeElement).toBe(addButton());
    addButton().blur();
    expect(engine.setHeld).toHaveBeenLastCalledWith(false);
  });

  it('keeps an in-flight add on its product when the highlight moves', async () => {
    let finish!: (result: CartResult) => void;
    const add = vi.spyOn(cart, 'add').mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await mount([product(1), product(2)]);
    addButton().click();
    sizes()[0]!.click();
    hooks.onActive(1);
    expect(addButton().getAttribute('aria-label')).toBe('product.adding: Product 1');
    finish(ok);
    await vi.waitFor(() => expect(status()).toBe('cart.added: Product 1 (S)'));
    expect(add.mock.calls[0]![0]).toEqual([{ id: 11, quantity: 1 }]);
    expect(addButton().getAttribute('aria-label')).toBe('product.add_to_cart: Product 2');
  });

  it('closes the selector when the shopper moves to another product', async () => {
    const add = vi.spyOn(cart, 'add');
    await mount([product(1), product(2)]);
    addButton().click();
    hooks.onActive(1);
    expect(sizeList().hasAttribute('data-open')).toBe(false);
    expect(sizes()[0]!.dataset.variantId).toBe('21');
    sizes()[0]!.click();
    expect(add).not.toHaveBeenCalled();
  });

  it('adds a default-variant product directly', async () => {
    const add = vi.spyOn(cart, 'add').mockResolvedValue(ok);
    await mount([product(4, { option: -1, values: [], options: ['Title'], preferred: 41, variants: [{ id: 41, available: true, options: ['Default Title'], min: 1 }] }), product(5)]);
    expect(sizeList().hidden).toBe(true);
    addButton().click();
    expect(add.mock.calls[0]![0]).toEqual([{ id: 41, quantity: 1 }]);
  });

  it('keeps sizes open and reports a rejected add', async () => {
    vi.spyOn(cart, 'add').mockRejectedValue(new CartError('rejected', 'Only 1 left'));
    await mount([product(1), product(2)]);
    addButton().click();
    sizes()[0]!.click();
    await vi.waitFor(() => expect(status()).toBe('Only 1 left'));
    expect(sizeList().hasAttribute('data-open')).toBe(true);
    expect(addButton().disabled).toBe(false);
  });

  it('sends subscription-only products to their product page', async () => {
    const add = vi.spyOn(cart, 'add');
    await mount([product(6, { sellingPlan: true }), product(7)]);
    const link = document.querySelector<HTMLAnchorElement>('.card__title')!;
    const visit = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', visit);
    expect(addButton().getAttribute('aria-label')).toContain('product.choose_options');
    addButton().click();
    expect(visit).toHaveBeenCalledOnce();
    expect(add).not.toHaveBeenCalled();
  });

  it('closes on Escape and returns focus to Add to cart', async () => {
    await mount([product(1), product(2)]);
    addButton().click();
    sizes()[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(sizeList().hasAttribute('data-open')).toBe(false);
    expect(document.activeElement).toBe(addButton());
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

  it('offers a single choice for a default-variant product', () => {
    const { choices } = sizeChoices(product(4, { option: -1, values: [], options: ['Title'], preferred: 41, variants: [{ id: 41, available: true, options: ['Default Title'], min: 1 }] }));
    expect(choices).toEqual([{ value: '', variant: { id: 41, available: true, options: ['Default Title'], min: 1 } }]);
  });
});
