import { afterEach, describe, expect, it, vi } from 'vitest';
import { NkCartRecommendations, resetCartRecommendationsForTests } from '../../src/components/cart/cart-recommendations';

const rec = (id: number) => `<li class="cart-rec" data-product-id="${id}"><button data-quick-add="${id}0">M</button></li>`;
const results = (...ids: number[]) =>
  `<div class="cart-recs__results">${ids.length ? `<ul class="cart-recs__list">${ids.map(rec).join('')}</ul>` : ''}</div>`;
const response = (html: string) => new Response(html, { headers: { 'Content-Type': 'text/html' } });

// happy-dom never reports intersections; the drawer is open in these tests.
class VisibleObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    queueMicrotask(() => this.callback([{ isIntersecting: true, target } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver));
  }
  disconnect(): void {}
  unobserve(): void {}
}

function mount(cartProducts = '1'): NkCartRecommendations {
  vi.stubGlobal('IntersectionObserver', VisibleObserver);
  // Inserted with its children, as the cart renderer does after every cart change.
  const template = document.createElement('template');
  template.innerHTML = `<nk-cart-recommendations url="/recommendations/products?section_id=cart-recommendations&product_id=1" intent="complementary" cart-products="${cartProducts}" data-empty>
    <p>Complete the look</p><div data-cart-recs-slot></div></nk-cart-recommendations>`;
  document.body.replaceChildren(document.importNode(template.content, true));
  return document.querySelector<NkCartRecommendations>('nk-cart-recommendations')!;
}

afterEach(() => {
  document.body.replaceChildren();
  resetCartRecommendationsForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('cart drawer recommendations', () => {
  it('falls back to related products when no complementary products are set up', async () => {
    const fetch = vi.fn(async (url: string) => response(url.includes('intent=complementary') ? results() : results(7, 8)));
    vi.stubGlobal('fetch', fetch);
    const element = mount();
    await vi.waitFor(() => expect(element.querySelectorAll('.cart-rec')).toHaveLength(2));
    expect(fetch.mock.calls.map(([url]) => new URL(url, location.href).searchParams.get('intent'))).toEqual(['complementary', 'related']);
    expect(element.hasAttribute('data-empty')).toBe(false);
  });

  it('stays empty and quiet when there is nothing to suggest', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(results())));
    const element = mount();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(element.hasAttribute('data-empty')).toBe(true);
    expect(element.querySelector('[data-cart-recs-slot]')!.children).toHaveLength(0);
  });

  it('shows the previous answer at once after a re-render, without products now in the cart', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(results(7, 8))));
    const first = mount();
    await vi.waitFor(() => expect(first.querySelectorAll('.cart-rec')).toHaveLength(2));
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const rerendered = mount('1,7');
    await Promise.resolve();
    expect([...rerendered.querySelectorAll<HTMLElement>('.cart-rec')].map((item) => item.dataset.productId)).toEqual(['8']);
    finish(response(results(8, 9)));
    await vi.waitFor(() => expect(rerendered.querySelectorAll('.cart-rec')).toHaveLength(2));
  });
});
