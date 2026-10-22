import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigForTests } from '../../src/core/config';
import type { NkElement } from '../../src/core/element';
import '../../src/components/carousel/carousel';
import { sizeChoices, type CarouselProduct } from '../../src/components/carousel/size-sheet';
import { cart, type CartResult } from '../../src/services/cart';
import { overlay } from '../../src/services/overlay';


class IntersectionMock {
  constructor(readonly callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    queueMicrotask(() => this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver));
  }
  disconnect(): void {}
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
    <div class="card__meta"><a class="card__title" href="${data.url}">${data.title}</a><span class="price">$10</span></div></article>
    <script type="application/json" data-carousel-product>${JSON.stringify(data)}</script></li>`;
}

async function mount(products: CarouselProduct[], attributes = ''): Promise<NkElement> {
  document.body.innerHTML = `<nk-carousel id="c" data-effect="liquid" data-intro="none" ${attributes}><div data-ref="viewport"><ul data-ref="track">
    ${products.map(slide).join('')}</ul></div>
    <button type="button" data-ref="add" data-index="0"><span data-add-label></span><span data-add-product></span></button>
    <dialog data-ref="sheet" data-one-size-label="One size"><div data-sheet-media></div><a data-sheet-title></a><div data-sheet-price></div>
      <p data-sheet-context hidden></p><button type="button" data-sheet-close>Close</button><span data-sheet-legend></span>
      <div data-sheet-options></div><p data-sheet-status></p><div data-sheet-done hidden></div></dialog></nk-carousel>`;
  const root = document.querySelector<NkElement>('nk-carousel')!;
  root.disconnectedCallback(); root.connectedCallback();
  await vi.waitFor(() => expect(root.querySelectorAll('.product-carousel__item').length).toBeGreaterThan(0));
  return root;
}

/** Steer the strip like a customer: clicking a neighbouring card centres it. */
async function select(index: number): Promise<void> {
  const slide = document.querySelectorAll('.product-carousel__slide')[index]!;
  if (slide.hasAttribute('data-active')) return;
  document.querySelector<HTMLElement>(`.product-carousel__item[data-index="${index}"]`)!.click();
  await vi.waitFor(() => expect(slide.hasAttribute('data-active')).toBe(true), { timeout: 3000 });
}

const addButton = () => document.querySelector<HTMLButtonElement>('[data-ref="add"]')!;
const sizes = () => [...document.querySelectorAll<HTMLButtonElement>('.carousel-sheet__size')];

beforeEach(() => {
  setConfigForTests(null);
  vi.stubGlobal('IntersectionObserver', IntersectionMock);
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: !query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => { overlay.closeAll(); document.body.replaceChildren(); vi.unstubAllGlobals(); });

describe('carousel purchase button', () => {
  it('follows the highlighted product and disables itself for sold-out products', async () => {
    await mount([product(1), product(2, { available: false })]);
    await select(0);
    expect(addButton().disabled).toBe(false);
    expect(addButton().getAttribute('aria-label')).toContain('Product 1');
    expect(document.querySelectorAll('.product-carousel__slide')[0]!.hasAttribute('data-active')).toBe(true);
    await select(1);
    expect(addButton().disabled).toBe(true);
    expect(addButton().getAttribute('aria-label')).toContain('Product 2');
    expect(document.querySelector('nk-carousel')!.hasAttribute('data-active-sold-out')).toBe(true);
    expect(document.querySelectorAll('.product-carousel__slide')[0]!.hasAttribute('data-active')).toBe(false);
  });

  it('opens the size sheet instead of adding, holds autoplay, and marks unavailable sizes', async () => {
    const add = vi.spyOn(cart, 'add');
    await mount([product(1), product(2)]);
    await select(0);
    addButton().click();
    expect(add).not.toHaveBeenCalled();
    expect(document.querySelector<HTMLDialogElement>('[data-ref="sheet"]')!.open).toBe(true);
    expect(document.querySelector('nk-carousel')!.hasAttribute('data-sheet-open')).toBe(true);
    expect(sizes().map((button) => button.disabled)).toEqual([false, true, false]);
    overlay.closeAll();
    expect(document.querySelector('nk-carousel')!.hasAttribute('data-sheet-open')).toBe(false);
  });

  it('adds the variant of the product captured when the sheet opened, even if the carousel moves', async () => {
    const add = vi.spyOn(cart, 'add').mockResolvedValue({ cart: { items: [] }, sections: {}, reconciled: false } as unknown as CartResult);
    await mount([product(1), product(2)]);
    await select(0);
    addButton().click();
    await select(1);
    expect(addButton().getAttribute('aria-label')).toContain('Product 1');
    sizes()[2]!.click();
    await vi.waitFor(() => expect(add).toHaveBeenCalledOnce());
    expect(add.mock.calls[0]![0]).toEqual([{ id: 13, quantity: 2 }]);
    await vi.waitFor(() => expect(document.querySelector('[data-sheet-done]')!.hasAttribute('hidden')).toBe(false));
  });
});

describe('carousel autoplay', () => {
  it('glides on by itself, loops past the last product, and holds while the size sheet is open', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
    try {
      const root = await mount([product(1), product(2), product(3)], 'data-autoplay');
      const activeIndex = () => [...root.querySelectorAll('.product-carousel__slide')].findIndex((slide) => slide.hasAttribute('data-active'));
      const visited = [activeIndex()];
      for (let elapsed = 0; elapsed < 18000; elapsed += 250) {
        await vi.advanceTimersByTimeAsync(250);
        if (activeIndex() !== visited.at(-1)) visited.push(activeIndex());
      }
      // Infinite: after the last product the strip carries on to the first again.
      expect(visited.slice(0, 4)).toEqual([0, 1, 2, 0]);
      expect(root.hasAttribute('data-autoplaying')).toBe(true);
      addButton().click();
      const held = activeIndex();
      await vi.advanceTimersByTimeAsync(12000);
      expect(activeIndex()).toBe(held);
      overlay.closeAll();
      (document.activeElement as HTMLElement | null)?.blur();
      await vi.advanceTimersByTimeAsync(9000);
      expect(activeIndex()).not.toBe(held);
    } finally {
      vi.useRealTimers();
    }
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
