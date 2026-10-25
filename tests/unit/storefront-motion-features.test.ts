import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigForTests } from '../../src/core/config';
import { anchoredTranslate, clamp, panLimit, rubberBand, ZoomPan } from '../../src/components/product/zoom-pan';
import { playPriceTransition, snapshotPrice } from '../../src/components/product/price-transition';
import { sourceImage } from '../../src/services/fly-to-cart';
import { NkInfiniteScroll } from '../../src/components/facets/infinite-scroll';

/**
 * Product page + collection enhancements: lightbox zoom geometry and gestures, the variant price
 * transition, add-to-cart flyer source selection and infinite scroll appending.
 */

const baseConfig = {
  routes: {
    root: '/', cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', cartUpdate: '/cart/update',
    predictiveSearch: '/search/suggest', productRecommendations: '/recommendations/products', search: '/search',
  },
  motion: 'standard' as const,
  cart: { afterAdd: 'drawer' as const, sections: [] },
  strings: { 'collection.loaded_more': '[count] loaded' },
};

beforeEach(() => setConfigForTests(baseConfig));
afterEach(() => {
  vi.unstubAllGlobals();
  setConfigForTests(null);
});

describe('zoom geometry', () => {
  it('limits panning to the overflow of the scaled image', () => {
    expect(panLimit(800, 1, 1000)).toBe(0);
    expect(panLimit(800, 2.5, 1000)).toBe(500);
  });

  it('keeps the anchor point fixed while scaling', () => {
    // A point 100px right of centre stays under the cursor: image-space offset is preserved.
    const x = anchoredTranslate(100, 0, 1, 2);
    expect(x).toBe(-100);
    expect((100 - x) / 2).toBe(100);
  });

  it('damps movement past the edges', () => {
    expect(rubberBand(50, 100)).toBe(50);
    expect(rubberBand(200, 100)).toBeCloseTo(135);
    expect(rubberBand(-200, 100)).toBeCloseTo(-135);
    expect(clamp(9, 1, 4)).toBe(4);
  });
});

describe('ZoomPan gestures', () => {
  function setup() {
    document.body.innerHTML = '<div class="stage" style="width:1000px;height:800px"><img></div>';
    const stage = document.querySelector<HTMLElement>('.stage')!;
    const img = stage.querySelector('img')!;
    Object.defineProperty(stage, 'clientWidth', { value: 1000 });
    Object.defineProperty(stage, 'clientHeight', { value: 800 });
    Object.defineProperty(img, 'offsetWidth', { value: 800 });
    Object.defineProperty(img, 'offsetHeight', { value: 800 });
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) });
    const swipes: number[] = [];
    const zoom = new ZoomPan(stage, { motion: () => false, onSwipe: (direction) => swipes.push(direction) });
    zoom.attach(img);
    return { stage, img, zoom, swipes };
  }
  const pointer = (type: string, x: number, y: number, extra: Partial<PointerEventInit> = {}) =>
    new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0, bubbles: true, ...extra });

  it('a mouse click toggles 2.5× at the point, and back', () => {
    const { img, zoom } = setup();
    img.dispatchEvent(pointer('pointerdown', 700, 400));
    img.dispatchEvent(pointer('pointerup', 700, 400));
    expect(zoom.scale).toBe(2.5);
    expect(zoom.x).toBeLessThan(0); // the right side moved toward the centre
    img.dispatchEvent(pointer('pointerdown', 700, 400));
    img.dispatchEvent(pointer('pointerup', 700, 400));
    expect(zoom.scale).toBe(1);
    expect(img.style.transform).toBe('');
  });

  it('dragging while zoomed pans and settles inside the bounds', () => {
    const { img, zoom } = setup();
    zoom.zoomTo(2);
    img.dispatchEvent(pointer('pointerdown', 500, 400));
    img.dispatchEvent(pointer('pointermove', 900, 400));
    img.dispatchEvent(pointer('pointerup', 900, 400, {}));
    const limit = panLimit(800, 2, 1000);
    expect(zoom.x).toBeLessThanOrEqual(limit);
    expect(zoom.x).toBeGreaterThan(0);
  });

  it('a horizontal swipe at 1× asks for the next image', () => {
    const { img, swipes } = setup();
    img.dispatchEvent(pointer('pointerdown', 600, 400, { pointerType: 'touch' }));
    img.dispatchEvent(pointer('pointermove', 450, 405, { pointerType: 'touch' }));
    img.dispatchEvent(pointer('pointerup', 450, 405, { pointerType: 'touch' }));
    expect(swipes).toEqual([1]);
  });

  it('keyboard zooms and resets', () => {
    const { zoom } = setup();
    expect(zoom.key('+')).toBe(true);
    expect(zoom.scale).toBeCloseTo(1.5);
    zoom.key('0');
    expect(zoom.scale).toBe(1);
    expect(zoom.key('x')).toBe(false);
  });
});

describe('variant price transition', () => {
  const region = (current: string, compare = '') => `<div data-region="price"><div class="product__price"><span class="price"><span class="price__current">${current}</span>${compare ? `<s class="price__compare">${compare}</s>` : ''}</span></div></div>`;

  it('rolls the old price out over the new one only when the amount changed', () => {
    document.body.innerHTML = region('Tk 1,200.00');
    const before = snapshotPrice(document.body);
    const animations: string[] = [];
    Element.prototype.animate = vi.fn(function (this: Element) {
      animations.push(this.className);
      const handle = new EventTarget() as Animation;
      return handle;
    }) as unknown as Element['animate'];
    document.body.innerHTML = region('Tk 900.00', 'Tk 1,200.00');
    playPriceTransition(document.body, before);
    expect(document.querySelector('.price-ghost')?.textContent).toContain('1,200.00');
    expect(animations).toEqual(expect.arrayContaining(['price-ghost', 'price__current', 'price__compare']));

    animations.length = 0;
    const same = snapshotPrice(document.body);
    playPriceTransition(document.body, same);
    expect(animations).toEqual([]);
  });
});

describe('add-to-cart flyer source', () => {
  it('uses the card photo for quick add and the current gallery slide for the product form', () => {
    document.body.innerHTML = `
      <article data-product-card><img data-card-primary-img src="card.jpg"><button data-quick-add="1">M</button></article>
      <section data-product-section>
        <ul><li class="gallery__slide"><img src="a.jpg"></li><li class="gallery__slide" data-current><img src="b.jpg"></li></ul>
        <form action="/cart/add"><button type="submit">Add</button></form>
      </section>`;
    for (const img of document.querySelectorAll('img')) img.getBoundingClientRect = () => ({ width: 100, height: 100 }) as DOMRect;
    expect(sourceImage(document.querySelector('[data-quick-add]')!)?.getAttribute('src')).toBe('card.jpg');
    expect(sourceImage(document.querySelector('form button')!)?.getAttribute('src')).toBe('b.jpg');
  });
});

describe('<nk-infinite-scroll>', () => {
  const card = (url: string) => `<li><article data-product-card data-product-url="${url}"></article></li>`;
  const page = (urls: string[], next?: string) => `
    <div data-facets-results><ul class="product-grid">${urls.map(card).join('')}</ul>
      <nk-infinite-scroll data-section-id="main" data-mode="button">
        <p data-infinite-count data-total="5" data-template="Showing [shown] of 5"></p>
        ${next ? `<a href="${next}" data-infinite-next hidden>Load more</a>` : ''}
        <p data-infinite-status></p><div data-infinite-fallback>1 2 3</div>
      </nk-infinite-scroll></div>`;

  it('appends the next page once, skips duplicates, follows the server next link and ends cleanly', async () => {
    if (!customElements.get('nk-infinite-scroll')) customElements.define('nk-infinite-scroll', NkInfiniteScroll);
    sessionStorage.clear();
    const requests: string[] = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      const html = url.includes('page=2') ? page(['/p/b', '/p/c', '/p/d'], '/collections/all?page=3') : page(['/p/e']);
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    });
    document.body.innerHTML = page(['/p/a', '/p/b'], '/collections/all?page=2');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const element = document.querySelector('nk-infinite-scroll')!;
    expect(element.querySelector<HTMLElement>('[data-infinite-fallback]')!.hidden).toBe(true);

    const click = () => element.querySelector<HTMLAnchorElement>('[data-infinite-next]')!.click();
    click();
    await vi.waitFor(() => expect(document.querySelectorAll('.product-grid > li')).toHaveLength(4));
    expect([...document.querySelectorAll<HTMLElement>('[data-product-url]')].map((el) => el.dataset.productUrl)).toEqual(['/p/a', '/p/b', '/p/c', '/p/d']);
    expect(element.querySelector('[data-infinite-count]')!.textContent).toBe('Showing 4 of 5');
    expect(requests[0]).toContain('section_id=main');

    click();
    await vi.waitFor(() => expect(document.querySelectorAll('.product-grid > li')).toHaveLength(5));
    expect(element.querySelector('[data-infinite-next]')).toBeNull();
    expect(requests).toHaveLength(2);
  });
});
