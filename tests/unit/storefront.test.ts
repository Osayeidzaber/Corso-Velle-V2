import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigForTests } from '../../src/core/config';
import { define } from '../../src/core/define';
import { NkElement } from '../../src/core/element';
import '../../src/components/facets/facets';
import '../../src/components/predictive-search/predictive-search';
import { installCardInteractions, resetCardInteractionsForTests } from '../../src/components/product/card-interactions';
import { NkGallery } from '../../src/components/product/gallery';
import { NkProductForm } from '../../src/components/product/product-form';
import { NkStickyBuy } from '../../src/components/product/sticky-buy';
import { NkVariantPicker } from '../../src/components/product/variant-picker';
import '../../src/components/size-guide/size-guide';

define('nk-variant-picker', NkVariantPicker);
define('nk-product-form', NkProductForm);
define('nk-gallery', NkGallery);
define('nk-sticky-buy', NkStickyBuy);
installCardInteractions();

/** Ensure custom elements in happy-dom mount after their full child subtree is parsed. */
function mountHTML(markup: string): void {
  document.body.innerHTML = markup;
  for (const el of document.body.querySelectorAll<NkElement>(
    'nk-variant-picker, nk-product-form, nk-size-guide, nk-predictive-search, nk-facets, nk-gallery, nk-sticky-buy',
  )) {
    el.disconnectedCallback();
    el.connectedCallback();
  }
}

beforeEach(() => {
  sessionStorage.clear();
  resetCardInteractionsForTests();
  setConfigForTests({
    routes: {
      root: '/',
      cart: '/cart',
      cartAdd: '/cart/add',
      cartChange: '/cart/change',
      cartUpdate: '/cart/update',
      predictiveSearch: '/search/suggest',
      productRecommendations: '/recommendations/products',
      search: '/search',
    },
    motion: 'off',
    cart: { afterAdd: 'drawer', sections: ['cart-drawer'] },
    strings: {
      'product.choose_option': 'Choose an option',
      'product.choose_named_option': 'Choose [option]',
      'product.select_size_prompt': 'Select a size',
      'product.unavailable': 'Unavailable',
      'product.sold_out': 'Sold out',
      'product.add_to_cart': 'Add to cart',
      'product.updating': 'Updating…',
      'product.adding': 'Adding…',
      'product.media_position': '[index] / [count]',
      'cart.error': 'Could not update cart',
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  setConfigForTests(null);
  document.body.replaceChildren();
});

describe('nk-variant-picker and nk-product-form', () => {
  it('blocks submission until required size is chosen and resolves variant via Section Rendering', async () => {
    mountHTML(`
      <section data-product-section data-section-id="main-product">
        <nk-variant-picker data-section-id="main-product" data-product-url="/products/coat">
          <div data-region="picker">
            <fieldset data-option-position="1" data-option-name="Size" data-size-fieldset>
              <legend>Size: <span data-selected-value>S</span></legend>
              <div data-size-values>
                <div class="option__value" data-size-pill="S">
                  <input type="radio" name="opt-1" value="S" data-option-value-id="val-s" checked>
                </div>
                <div class="option__value" data-size-pill="M">
                  <input type="radio" name="opt-1" value="M" data-option-value-id="val-m">
                </div>
                <span class="option__underline" data-size-indicator></span>
              </div>
              <div class="measurement-panel" data-measurement-panel data-base-unit="in" hidden>
                <span data-measurement-active-size>—</span>
                <button type="button" data-measure-unit="in" aria-pressed="true">in</button>
                <button type="button" data-measure-unit="cm" aria-pressed="false">cm</button>
                <div data-measurement-row="S" hidden><span data-measure-value="40">40</span><span data-measure-suffix>in</span></div>
                <div data-measurement-row="M" hidden><span data-measure-value="42">42</span><span data-measure-suffix>in</span></div>
              </div>
            </fieldset>
          </div>
        </nk-variant-picker>
        <nk-product-form>
          <form action="/cart/add" method="post">
            <div data-region="buy" data-availability="available" data-variant-title="M" data-variant-price="£185">
              <input type="hidden" name="id" value="101">
              <button type="submit"><span data-button-label>Add to bag</span></button>
            </div>
            <p data-form-error hidden></p>
          </form>
        </nk-product-form>
        <nk-sticky-buy hidden>
          <span data-sticky-variant>S</span>
          <span data-sticky-price>£185</span>
          <button type="button" data-sticky-cta><span data-sticky-label>Add to cart</span></button>
        </nk-sticky-buy>
      </section>
    `);

    const picker = document.querySelector<NkVariantPicker>('nk-variant-picker')!;
    const formEl = document.querySelector('form')!;
    const errorEl = document.querySelector<HTMLElement>('[data-form-error]')!;
    const panel = document.querySelector<HTMLElement>('[data-measurement-panel]')!;
    const stickyLabel = document.querySelector<HTMLElement>('[data-sticky-label]')!;

    // On initial mount, Size is unchecked, picker state is 'incomplete', and measurement panel is hidden
    expect(picker.state).toBe('incomplete');
    expect(panel.hidden).toBe(true);
    expect(stickyLabel.textContent).toBe('Choose Size');
    expect(document.querySelector<HTMLInputElement>('input[name="id"]')!.disabled).toBe(true);

    // Hovering a size pill previews its measurements in the dark panel
    const pillS = document.querySelector<HTMLElement>('[data-size-pill="S"]')!;
    pillS.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(panel.hidden).toBe(false);
    expect(panel.hasAttribute('data-preview')).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-measurement-active-size]')!.textContent).toBe('S');

    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('option_values=val-m');
      return new Response(
        `
        <div id="shopify-section-main-product" data-product-url="/products/coat">
          <div data-region="picker">
            <fieldset data-option-position="1" data-option-name="Size" data-size-fieldset>
              <legend>Size: <span data-selected-value>M</span></legend>
              <div data-size-values>
                <div class="option__value" data-size-pill="S">
                  <input type="radio" name="opt-1" value="S" data-option-value-id="val-s">
                </div>
                <div class="option__value" data-size-pill="M">
                  <input type="radio" name="opt-1" value="M" data-option-value-id="val-m" checked>
                </div>
                <span class="option__underline" data-size-indicator></span>
              </div>
              <div class="measurement-panel" data-measurement-panel data-base-unit="in" hidden>
                <span data-measurement-active-size>—</span>
                <button type="button" data-measure-unit="in" aria-pressed="true">in</button>
                <button type="button" data-measure-unit="cm" aria-pressed="false">cm</button>
                <div data-measurement-row="S" hidden><span data-measure-value="40">40</span><span data-measure-suffix>in</span></div>
                <div data-measurement-row="M" hidden><span data-measure-value="42">42</span><span data-measure-suffix>in</span></div>
              </div>
            </fieldset>
          </div>
          <div data-region="buy" data-availability="available" data-variant-title="M" data-variant-price="£185">
            <input type="hidden" name="id" value="102">
            <button type="submit"><span data-button-label>Add to bag</span></button>
          </div>
        </div>
        `,
        { status: 200, headers: { 'Content-Type': 'text/html' } },
      );
    });
    vi.stubGlobal('fetch', fetchSpy);

    // Submitting while incomplete shows error message and does not call fetch
    formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(errorEl.hidden).toBe(false);
    expect(errorEl.textContent).toBe('Choose Size');
    expect(fetchSpy).not.toHaveBeenCalled();

    // Selecting size M resolves the variant, marks picker available, and reveals row M in dark panel
    const radioM = document.querySelector<HTMLInputElement>('input[value="M"]')!;
    radioM.checked = true;
    radioM.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(picker.state).toBe('available');
    expect(picker.resolvedVariantId).toBe('102');
    expect(document.querySelector<HTMLInputElement>('input[name="id"]')!.disabled).toBe(false);

    const updatedPanel = document.querySelector<HTMLElement>('[data-measurement-panel]')!;
    const rowM = document.querySelector<HTMLElement>('[data-measurement-row="M"]')!;
    expect(updatedPanel.hidden).toBe(false);
    expect(rowM.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-measurement-active-size]')!.textContent).toBe('M');

    // Switching measurement unit to cm converts 42 in -> 106.7 cm
    const cmBtn = updatedPanel.querySelector<HTMLButtonElement>('[data-measure-unit="cm"]')!;
    cmBtn.click();
    expect(cmBtn.getAttribute('aria-pressed')).toBe('true');
    expect(rowM.querySelector('[data-measure-value]')?.textContent).toBe('106.7');
    expect(rowM.querySelector('[data-measure-suffix]')?.textContent).toBe('cm');
  });
});

describe('nk-size-guide', () => {
  it('switches between cm and in and highlights the active size row', () => {
    mountHTML(`
      <section data-product-section>
        <nk-variant-picker data-preselected>
          <fieldset data-option-position="1" data-option-name="Size">
            <input type="radio" name="size" value="M" checked>
          </fieldset>
        </nk-variant-picker>
        <nk-size-guide unit="cm">
          <button type="button" data-ref="unit" value="cm" aria-pressed="true">cm</button>
          <button type="button" data-ref="unit" value="in" aria-pressed="false">in</button>
          <table>
            <tbody>
              <tr data-size-row="S"><td>S</td><td data-value="96">96</td></tr>
              <tr data-size-row="M"><td>M</td><td data-value="102">102</td></tr>
            </tbody>
          </table>
        </nk-size-guide>
      </section>
    `);

    const inBtn = document.querySelector<HTMLButtonElement>('button[value="in"]')!;
    const rowM = document.querySelector<HTMLElement>('[data-size-row="M"]')!;
    const cellM = rowM.querySelector<HTMLElement>('[data-value]')!;

    expect(rowM.hasAttribute('data-current')).toBe(true);
    inBtn.click();
    expect(inBtn.getAttribute('aria-pressed')).toBe('true');
    expect(cellM.textContent).toBe('40.2');
  });
});

describe('nk-gallery', () => {
  it('switches slides via thumbnails, syncs on variant change, and opens/closes lightbox zoom', () => {
    mountHTML(`
      <section data-product-section>
        <nk-gallery>
          <div data-ref="thumbs">
            <button type="button" class="gallery__thumb is-active" data-gallery-thumb="0" data-media-id="m1">1</button>
            <button type="button" class="gallery__thumb" data-gallery-thumb="1" data-media-id="m2">2</button>
          </div>
          <ul data-ref="track">
            <li class="gallery__slide" data-ref="slide" data-media-id="m1" data-zoom-src="/img1-lg.jpg" data-zoom-alt="Front">
              <img src="/img1.jpg" alt="Front">
              <button type="button" data-gallery-zoom="0">Zoom</button>
            </li>
            <li class="gallery__slide" data-ref="slide" data-media-id="m2" data-zoom-src="/img2-lg.jpg" data-zoom-alt="Back">
              <img src="/img2.jpg" alt="Back">
              <button type="button" data-gallery-zoom="1">Zoom</button>
            </li>
          </ul>
          <span data-ref="counter">1 / 2</span>
          <dialog data-ref="lightbox" closedby="any">
            <span data-ref="lightbox-counter">1 / 2</span>
            <button type="button" data-lightbox-step="1">Next</button>
            <button type="button" data-lightbox-close>Close</button>
            <div data-ref="lightbox-stage">
              <img data-ref="lightbox-img" src="" alt="">
            </div>
          </dialog>
        </nk-gallery>
        <div data-region="buy" data-variant-media-id="m2"></div>
      </section>
    `);

    const thumb1 = document.querySelector<HTMLButtonElement>('[data-gallery-thumb="1"]')!;
    const counter = document.querySelector<HTMLElement>('[data-ref="counter"]')!;
    const zoomBtn = document.querySelector<HTMLButtonElement>('[data-gallery-zoom="0"]')!;
    const dialog = document.querySelector<HTMLDialogElement>('[data-ref="lightbox"]')!;
    const lightboxImg = document.querySelector<HTMLImageElement>('[data-ref="lightbox-img"]')!;

    thumb1.click();
    expect(thumb1.classList.contains('is-active')).toBe(true);
    expect(counter.textContent).toBe('2 / 2');

    zoomBtn.click();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(lightboxImg.src).toContain('/img1-lg.jpg');

    // Light-dismiss backdrop click closes the dialog
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.hasAttribute('open')).toBe(false);
  });
});

describe('nk-predictive-search', () => {
  it('fetches predictive search suggestions and renders them into [data-ref="results"]', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('/search/suggest');
      expect(url).toContain('section_id=predictive-search');
      return new Response(
        '<div id="shopify-section-predictive-search"><div data-predictive-results data-results-count="1"><div id="opt-1" role="option"><a href="/products/coat">Wool Coat</a></div></div></div>',
        { status: 200, headers: { 'Content-Type': 'text/html' } },
      );
    });

    mountHTML(`
      <nk-predictive-search>
        <form action="/search">
          <input type="search" name="q">
          <button type="button" data-ref="clear" hidden>Clear</button>
        </form>
        <div data-ref="results"></div>
      </nk-predictive-search>
    `);

    const input = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'coat';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 250));
    const item = document.querySelector<HTMLAnchorElement>('[role="option"] a');
    expect(item?.textContent).toBe('Wool Coat');
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('nk-facets', () => {
  it('fetches filtered section HTML on sort change and swaps nk-facets contents', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('section_id=sec-collection');
      expect(url).toContain('sort_by=price-ascending');
      return new Response(
        `
        <div id="shopify-section-sec-collection">
          <nk-facets data-section-id="sec-collection">
            <form data-facets-form action="/collections/all">
              <select name="sort_by" data-facets-sort>
                <option value="manual">Featured</option>
                <option value="price-ascending" selected>Price: low to high</option>
              </select>
            </form>
            <div data-results-label>1 product</div>
            <div data-grid>Filtered grid</div>
          </nk-facets>
        </div>
        `,
        { status: 200, headers: { 'Content-Type': 'text/html' } },
      );
    });

    mountHTML(`
      <nk-facets data-section-id="sec-collection">
        <form data-facets-form action="/collections/all">
          <select name="sort_by" data-facets-sort>
            <option value="manual" selected>Featured</option>
            <option value="price-ascending">Price: low to high</option>
          </select>
        </form>
        <div data-results-label>10 products</div>
        <div data-grid>Initial grid</div>
      </nk-facets>
    `);

    const select = document.querySelector<HTMLSelectElement>('select[data-facets-sort]')!;
    select.value = 'price-ascending';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(document.querySelector('[data-grid]')?.textContent).toBe('Filtered grid');
    expect(document.querySelector('[data-results-label]')?.textContent).toBe('1 product');
  });

  it('switches product grid columns and updates aria-pressed when clicking layout buttons', () => {
    mountHTML(`
      <nk-facets data-section-id="sec-collection">
        <div class="facets__layout-switch" role="group">
          <button type="button" data-grid-cols-desktop="2" aria-pressed="false">2</button>
          <button type="button" data-grid-cols-desktop="3" aria-pressed="false">3</button>
          <button type="button" data-grid-cols-desktop="4" aria-pressed="true">4</button>
        </div>
        <ul class="product-grid" style="--nk-cols-mobile: 2; --nk-cols-desktop: 4;">
          <li data-stagger-item><div class="card">Item 1</div></li>
        </ul>
      </nk-facets>
    `);

    const btn2 = document.querySelector<HTMLButtonElement>('[data-grid-cols-desktop="2"]')!;
    const btn4 = document.querySelector<HTMLButtonElement>('[data-grid-cols-desktop="4"]')!;
    const grid = document.querySelector<HTMLElement>('.product-grid')!;

    btn2.click();
    expect(grid.style.getPropertyValue('--nk-cols-desktop')).toBe('2');
    expect(btn2.getAttribute('aria-pressed')).toBe('true');
    expect(btn4.getAttribute('aria-pressed')).toBe('false');
  });
});
