import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { define } from '../../src/core/define';
import { setConfigForTests, config } from '../../src/core/config';
import { NkVariantPicker } from '../../src/components/product/variant-picker';
import { NkProductForm } from '../../src/components/product/product-form';
import { namespaceProductHTML } from '../../src/components/product/product-dom';
import { replaceRegions } from '../../src/services/sections';
import '../../src/components/size-guide/size-guide';
import { installCardInteractions } from '../../src/components/product/card-interactions';
import { cart } from '../../src/services/cart';

define('nk-variant-picker', NkVariantPicker);
define('nk-product-form', NkProductForm);
installCardInteractions();

const pickerMarkup = (selected = 'S') => `<nk-variant-picker data-region="picker" data-section-id="main" data-product-url="/products/shirt" data-preselected>
  <fieldset data-option-position="1" data-option-name="Size" data-size-fieldset>
    ${['S', 'M', 'L'].map(s => `<div data-size-pill="${s}"><input type="radio" name="size" value="${s}" data-option-value-id="${s}" ${s === selected ? 'checked' : ''}></div>`).join('')}
  </fieldset></nk-variant-picker>`;
const buyMarkup = (state = 'available', id = '101') => `<div data-region="buy" data-availability="${state}"><input name="id" value="${id}" type="hidden"><button type="submit"><span data-button-label>Add</span></button><div class="shopify-payment-button"></div></div>`;
const sectionMarkup = (selected = 'S', state = 'available', id = '101') => `<section data-product-section>
  <div data-region="price">${id}</div>${pickerMarkup(selected)}<nk-product-form><form>
  <div data-region="quantity"><input type="number" name="quantity" value="2" min="2" max="8" step="2"></div>${buyMarkup(state,id)}
  </form><p data-form-error hidden></p></nk-product-form></section>`;
function mount(html: string) {
  document.body.innerHTML = html;
  for (const el of document.querySelectorAll<NkVariantPicker | NkProductForm>('nk-variant-picker,nk-product-form')) { el.disconnectedCallback(); el.connectedCallback(); }
}
function choose(value: string) {
  const input = document.querySelector<HTMLInputElement>(`input[type="radio"][value="${value}"]`)!;
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}
const response = (html: string) => new Response(html, { headers: { 'Content-Type': 'text/html' } });
beforeEach(() => {
  sessionStorage.clear();
  setConfigForTests({ ...config(), motion: 'off', strings: { 'product.add_to_cart': 'Add to cart', 'product.sold_out': 'Sold out', 'product.selection_failed': 'Selection failed', 'product.unavailable': 'Unavailable' } });
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); setConfigForTests(null); });

describe('product purchase regressions', () => {
  it('shows an honest missing-measurement state and restores the selected size after hover', () => {
    mount(sectionMarkup('M').replace('</fieldset>', `<div data-measurement-panel data-base-unit="cm" hidden>
      <span data-measurement-active-size></span><div class="measurement-panel__actions">Units</div>
      <p data-measurement-empty hidden>Measurements have not been provided.</p>
      <div data-measurement-row="M" hidden><span data-measure-value="104">104</span></div>
    </div></fieldset>`));
    const picker = document.querySelector<NkVariantPicker>('nk-variant-picker')!;
    document.querySelector('[data-size-pill="L"]')!.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(document.querySelector('[data-measurement-active-size]')!.textContent).toBe('L');
    expect(document.querySelector<HTMLElement>('[data-measurement-empty]')!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>('[data-measurement-row="M"]')!.hidden).toBe(true);
    expect(picker.state).toBe('available');
    picker.dispatchEvent(new Event('pointerleave'));
    expect(document.querySelector('[data-measurement-active-size]')!.textContent).toBe('M');
    expect(document.querySelector<HTMLElement>('[data-measurement-row="M"]')!.hidden).toBe(false);
  });
  it('ignores an old playback failure after the pointer leaves and re-enters the same card', async () => {
    setConfigForTests({ ...config(), motion: 'standard' });
    document.body.innerHTML = '<article class="card"><video data-card-video></video></article>';
    const card = document.querySelector<HTMLElement>('.card')!;
    let rejectOld!: (error: Error) => void;
    let startNew!: () => void;
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementationOnce(() => new Promise<void>((_, reject) => { rejectOld = reject; }))
      .mockImplementationOnce(() => new Promise<void>(resolve => { startNew = resolve; }));
    card.dispatchEvent(new Event('pointerover', { bubbles: true }));
    card.dispatchEvent(new Event('pointerout', { bubbles: true }));
    card.dispatchEvent(new Event('pointerover', { bubbles: true }));
    rejectOld(new Error('interrupted earlier playback'));
    await Promise.resolve(); await Promise.resolve();
    expect(card.hasAttribute('data-video-intent')).toBe(true);
    startNew();
    await Promise.resolve();
    expect(card.hasAttribute('data-video-playing')).toBe(true);
  });
  it('requires a fresh size choice even on a variant link, while hover only previews exact rows', () => {
    const html = sectionMarkup('M').replace('data-preselected', 'data-preselected data-explicit-size-choice')
      .replace('</fieldset>', `<div data-measurement-panel data-base-unit="cm" hidden>
        <span data-measurement-active-size></span>
        <div data-measurement-row="M" hidden><span data-measure-value="104">104</span></div>
        <div data-measurement-row="L" hidden><span data-measure-value="110">110</span></div>
      </div></fieldset>`);
    mount(html);
    const picker = document.querySelector<NkVariantPicker>('nk-variant-picker')!;
    expect(picker.state).toBe('incomplete');
    expect(document.querySelector('input:checked')).toBeNull();
    expect(document.querySelector('[data-button-label]')!.textContent).toBe('Add to cart');
    for (const size of ['M', 'L']) {
      document.querySelector(`[data-size-pill="${size}"]`)!.dispatchEvent(new Event('pointerover', { bubbles: true }));
      expect(document.querySelector('[data-measurement-active-size]')!.textContent).toBe(size);
      expect(document.querySelector<HTMLElement>(`[data-measurement-row="${size}"]`)!.hidden).toBe(false);
      expect(picker.state).toBe('incomplete');
      expect(document.querySelector<HTMLInputElement>('input[name="id"]')!.disabled).toBe(true);
    }
  });
  it('reveals card video only after playback starts and cancels a late hover response', async () => {
    setConfigForTests({ ...config(), motion: 'standard' });
    document.body.innerHTML = '<article class="card"><video data-card-video></video></article>';
    const card = document.querySelector<HTMLElement>('.card')!;
    let ready!: () => void;
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => new Promise<void>(done => { ready = done; }));
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    card.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(card.hasAttribute('data-video-playing')).toBe(false);
    card.dispatchEvent(new Event('pointerout', { bubbles: true }));
    ready();
    await Promise.resolve();
    expect(card.hasAttribute('data-video-playing')).toBe(false);
    expect(pause).toHaveBeenCalled();
    card.dispatchEvent(new Event('pointerover', { bubbles: true }));
    ready();
    await Promise.resolve();
    expect(card.hasAttribute('data-video-playing')).toBe(true);
  });
  it('quick-adds the exact size and minimum quantity once under repeated clicks', async () => {
    document.body.innerHTML = '<article class="card"><div class="card__meta"><button data-quick-add="123" data-quick-add-quantity="3">M</button></div></article>';
    let resolve!: (value: any) => void;
    const add = vi.spyOn(cart, 'add').mockImplementation(() => new Promise(done => { resolve = done; }));
    const button = document.querySelector<HTMLButtonElement>('button')!;
    button.click(); button.click();
    expect(add).toHaveBeenCalledExactlyOnceWith([{ id: 123, quantity: 3 }], 'quick-add');
    expect(button.disabled).toBe(true);
    resolve({});
    await vi.waitFor(() => expect(button.textContent).toBe('✓'));
  });
  it('requires an explicit Shoe size choice under the default Size policy', () => {
    mount(sectionMarkup().replace('data-preselected', '').replace('data-option-name="Size"', 'data-option-name="Shoe size"'));
    expect(document.querySelector<NkVariantPicker>('nk-variant-picker')!.state).toBe('incomplete');
    expect(document.querySelector<HTMLInputElement>('input[name="id"]')!.disabled).toBe(true);
  });
  it.each([['sold-out', '102'], ['unavailable', '']])('blocks %s variants, including accelerated checkout', async (state, id) => {
    mount(sectionMarkup());
    vi.stubGlobal('fetch', vi.fn(async () => response(sectionMarkup('M', state, id))));
    choose('M');
    await vi.waitFor(() => expect(document.querySelector<NkVariantPicker>('nk-variant-picker')!.state).toBe(state));
    expect(document.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(document.querySelector<HTMLElement>('.shopify-payment-button')!.hidden).toBe(true);
  });
  it('disables both checkout paths during resolution and after a network failure', async () => {
    mount(sectionMarkup());
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    choose('M');
    expect(document.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    await vi.waitFor(() => expect(document.querySelector<NkVariantPicker>('nk-variant-picker')!.state).toBe('failed'));
    expect(document.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(document.querySelector<HTMLElement>('.shopify-payment-button')!.hidden).toBe(true);
  });
  it('updates quantity rules with the resolved variant and preserves app markup', async () => {
    mount(sectionMarkup().replace('</section>', '<div data-app><input value="merchant state"></div></section>'));
    const app = document.querySelector('[data-app]');
    vi.stubGlobal('fetch', vi.fn(async () => response(sectionMarkup('M', 'available', '102').replace('min="2" max="8" step="2"', 'min="3" max="9" step="3"'))));
    choose('M');
    await vi.waitFor(() => expect(document.querySelector<HTMLInputElement>('input[name="quantity"]')!.step).toBe('3'));
    expect(document.querySelector('[data-app]')).toBe(app);
  });
  it('rejects stale variant fragments even when the old request ignores abort', async () => {
    mount(sectionMarkup());
    let finishOld!: (response: Response) => void;
    let calls = 0;
    vi.stubGlobal('fetch', vi.fn(() => ++calls === 1 ? new Promise<Response>(resolve => { finishOld = resolve; }) : Promise.resolve(response(sectionMarkup('L', 'available', '103')))));
    choose('M'); choose('L');
    await vi.waitFor(() => expect(document.querySelector<NkVariantPicker>('nk-variant-picker')!.resolvedVariantId).toBe('103'));
    finishOld(response(sectionMarkup('M', 'available', '102')));
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(document.querySelector<NkVariantPicker>('nk-variant-picker')!.resolvedVariantId).toBe('103');
  });
  it('does not leave partially updated availability attributes when a fragment is missing', () => {
    mount(sectionMarkup());
    const before = document.querySelector('[data-region="buy"]')!.outerHTML;
    expect(() => replaceRegions(document.querySelector('section')!, buyMarkup('sold-out') + pickerMarkup(), ['buy', 'price'])).toThrow();
    expect(document.querySelector('[data-region="buy"]')!.outerHTML).toBe(before);
  });
  it('namespaces quick-add labels, form associations, and radio groups independently', () => {
    const html = namespaceProductHTML('<form id="Product"><input id="Size" type="radio" name="size" form="Product"><label for="Size">M</label></form>', 'Quick-');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelector('input')!.name).toBe('Quick-size');
    expect(doc.querySelector('label')!.htmlFor).toBe('Quick-Size');
    expect(doc.querySelector('input')!.getAttribute('form')).toBe('Quick-Product');
  });
  it('preserves non-numeric measurement ranges instead of inventing converted values', () => {
    document.body.innerHTML = '<nk-size-guide unit="in"><button data-ref="unit" value="cm">cm</button><table><tbody><tr><td data-value="38-40">38-40</td><td data-value="40">40</td></tr></tbody></table></nk-size-guide>';
    const guide = document.querySelector<any>('nk-size-guide'); guide.disconnectedCallback(); guide.connectedCallback();
    document.querySelector<HTMLButtonElement>('button')!.click();
    expect(document.querySelectorAll('td')[0]!.textContent).toBe('38-40 (in)');
    expect(document.querySelectorAll('td')[1]!.textContent).toBe('101.6');
  });
});
